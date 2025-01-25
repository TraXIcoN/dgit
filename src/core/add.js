import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { glob } from "glob";
import ignore from "ignore";

async function readGitignore() {
  try {
    const gitignore = await fs.readFile(".gitignore", "utf8");
    return ignore().add(gitignore);
  } catch {
    return ignore(); // Return empty ignore rules if no .gitignore exists
  }
}

async function isDirectory(filePath) {
  const stats = await fs.stat(filePath);
  return stats.isDirectory();
}

async function isBinaryFile(content) {
  // Check for null bytes or non-printable characters
  const sampleSize = Math.min(content.length, 512);
  const sample = content.slice(0, sampleSize);
  return sample.includes("\0") || /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(sample);
}

async function processFile(filePath, stagedFiles, ig) {
  try {
    // Check if file is ignored
    if (ig.ignores(filePath)) {
      console.log(`Skipping ignored file: ${filePath}`);
      return;
    }

    // Read file content
    const content = await fs.readFile(filePath);
    const isBinary = await isBinaryFile(content.toString());

    // Create SHA-1 hash of content
    const hash = crypto
      .createHash("sha1")
      .update("blob " + content.length + "\0")
      .update(content)
      .digest("hex");

    // Create object directory if it doesn't exist
    const objectsDir = path.join(".dgit", "objects");
    const hashDir = path.join(objectsDir, hash.slice(0, 2));
    const hashFile = path.join(hashDir, hash.slice(2));

    await fs.mkdir(hashDir, { recursive: true });

    // Store the file content in objects
    await fs.writeFile(hashFile, content);

    // Update staging area
    stagedFiles[filePath] = {
      hash,
      size: content.length,
      timestamp: Date.now(),
      type: isBinary ? "binary" : "text",
      mode: (await fs.stat(filePath)).mode,
    };

    console.log(`Added ${filePath}${isBinary ? " (binary file)" : ""}`);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error(`Error: File ${filePath} not found`);
    } else {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }
}

export async function addFiles(files) {
  try {
    // Ensure we're in a dgit repository
    await fs.access(".dgit");

    // Read .gitignore
    const ig = await readGitignore();

    // Create index file if it doesn't exist
    const indexPath = path.join(".dgit", "index");
    let stagedFiles = {};

    try {
      const indexContent = await fs.readFile(indexPath, "utf8");
      stagedFiles = JSON.parse(indexContent);
    } catch (error) {
      // If index doesn't exist, we'll create it later
    }

    for (const pattern of files) {
      // Handle directories and glob patterns
      const matches = await glob(pattern, {
        dot: true,
        ignore: ["node_modules/**", ".dgit/**"],
      });

      if (matches.length === 0) {
        // If no matches, try to process the pattern as a direct file path
        await processFile(pattern, stagedFiles, ig);
        continue;
      }

      for (const file of matches) {
        if (await isDirectory(file)) {
          console.log(`Skipping directory: ${file}`);
          continue;
        }
        await processFile(file, stagedFiles, ig);
      }
    }

    // Write updated index with status information
    const indexData = {
      version: 1,
      files: stagedFiles,
      lastUpdate: Date.now(),
    };

    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));

    // Print status summary
    const addedFiles = Object.keys(stagedFiles).length;
    console.log(`\nStatus: ${addedFiles} file(s) staged for commit`);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error("Error: not a dgit repository");
    } else {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}
