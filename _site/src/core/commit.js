import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { generateKeyPairSync, createSign } from "crypto";

class TreeNode {
  constructor(name) {
    this.name = name;
    this.children = new Map();
    this.hash = null;
    this.type = "tree";
  }
}

export async function createCommit({ message }) {
  try {
    // Ensure we're in a dgit repository
    await fs.access(".dgit");

    // Read the index
    let index = { files: {} };
    try {
      const indexPath = path.join(".dgit", "index");
      const indexContent = await fs.readFile(indexPath, "utf8");
      index = JSON.parse(indexContent);
    } catch (error) {
      // If index doesn't exist, treat as empty
    }

    // Check if there are files to commit
    if (!index.files || Object.keys(index.files).length === 0) {
      console.error("Nothing to commit (no files staged)");
      process.exit(1);
    }

    // Build tree structure
    const root = new TreeNode("");
    for (const [filepath, fileInfo] of Object.entries(index.files)) {
      const parts = filepath.split("/");
      let current = root;

      // Create tree structure
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current.children.has(part)) {
          current.children.set(part, new TreeNode(part));
        }
        current = current.children.get(part);
      }

      // Add file to tree
      const fileName = parts[parts.length - 1];
      current.children.set(fileName, {
        name: fileName,
        hash: fileInfo.hash,
        type: "blob",
      });
    }

    // Hash the tree structure
    async function hashTree(node) {
      if (node.type === "blob") {
        return node.hash;
      }

      const entries = Array.from(node.children.entries()).sort(([a], [b]) =>
        a.localeCompare(b)
      );

      let treeContent = "";
      for (const [name, child] of entries) {
        const childHash = await hashTree(child);
        // Add mode and type to the tree entry
        const mode = child.type === "blob" ? "100644" : "040000";
        treeContent += `${child.type} ${mode} ${childHash} ${name}\n`;
      }

      const hash = crypto
        .createHash("sha1")
        .update("tree " + treeContent.length + "\0")
        .update(treeContent)
        .digest("hex");

      // Store tree object
      const treePath = path.join(".dgit", "objects", hash.slice(0, 2));
      await fs.mkdir(treePath, { recursive: true });
      await fs.writeFile(path.join(treePath, hash.slice(2)), treeContent);

      return hash;
    }

    // Generate or load commit signing keys
    const keysPath = path.join(".dgit", "keys");
    let privateKey, publicKey;

    try {
      privateKey = await fs.readFile(
        path.join(keysPath, "private.pem"),
        "utf8"
      );
      publicKey = await fs.readFile(path.join(keysPath, "public.pem"), "utf8");
    } catch {
      // Generate new key pair if none exists
      await fs.mkdir(keysPath, { recursive: true });
      const keys = generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });
      privateKey = keys.privateKey;
      publicKey = keys.publicKey;

      await fs.writeFile(path.join(keysPath, "private.pem"), privateKey);
      await fs.writeFile(path.join(keysPath, "public.pem"), publicKey);
    }

    // Get parent commit hash
    let parentHash = null;
    try {
      const headContent = await fs.readFile(path.join(".dgit", "HEAD"), "utf8");
      const ref = headContent.trim().split(" ")[1];
      parentHash = await fs.readFile(path.join(".dgit", ref), "utf8");
    } catch {
      // No parent commit
    }

    // Create tree
    const treeHash = await hashTree(root);

    // Create commit object
    const commitData = {
      tree: treeHash,
      parent: parentHash,
      author: process.env.USER || "unknown",
      timestamp: new Date().toISOString(),
      message: message,
    };

    const commitContent = JSON.stringify(commitData, null, 2);

    // Sign the commit
    const signer = createSign("SHA256");
    signer.update(commitContent);
    const signature = signer.sign(privateKey, "hex");

    // Create final commit object with signature
    const finalCommit = {
      ...commitData,
      signature,
    };

    // Hash and store the commit
    const commitStr = JSON.stringify(finalCommit, null, 2);
    const commitHash = crypto
      .createHash("sha1")
      .update("commit " + commitStr.length + "\0")
      .update(commitStr)
      .digest("hex");

    // Store commit object
    const commitPath = path.join(".dgit", "objects", commitHash.slice(0, 2));
    await fs.mkdir(commitPath, { recursive: true });
    await fs.writeFile(path.join(commitPath, commitHash.slice(2)), commitStr);

    // Update HEAD and branch reference
    const headContent = await fs.readFile(path.join(".dgit", "HEAD"), "utf8");
    const ref = headContent.trim().split(" ")[1];
    await fs.mkdir(path.dirname(path.join(".dgit", ref)), { recursive: true });
    await fs.writeFile(path.join(".dgit", ref), commitHash);

    console.log(`Created commit ${commitHash}`);
    console.log(`Author: ${commitData.author}`);
    console.log(`Date: ${commitData.timestamp}`);
    console.log(`\n${message}`);
  } catch (error) {
    console.error("Error creating commit:", error.message);
    process.exit(1);
  }
}
