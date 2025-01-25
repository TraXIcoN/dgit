import { Level } from "level";
import path from "path";
import fs from "fs/promises";

export class Storage {
  constructor() {
    this.root = path.join(process.cwd(), ".dgit");
    this.objectsDir = path.join(this.root, "objects");
    this.refsDir = path.join(this.root, "refs");
    this.dbPath = path.join(this.root, "db");
    console.log("Storage initialized at:", this.root); // Debug log
  }

  async init() {
    try {
      await fs.mkdir(this.root, { recursive: true });
      await fs.mkdir(this.objectsDir, { recursive: true });
      await fs.mkdir(this.refsDir, { recursive: true });

      // Initialize the database
      if (!this.db) {
        this.db = new Level(this.dbPath);
        await this.db.open();
      }

      console.log("Storage initialized with database");
    } catch (error) {
      console.error("Failed to initialize storage:", error);
      throw error;
    }
  }

  // Commit History Methods
  async saveCommit(hash, commitData) {
    const db = await this.ensureDB();
    try {
      // Store commit data as a JSON string
      await db.put(`commit:${hash}`, JSON.stringify(commitData));
      console.log("Debug - Saved commit data:", commitData);
    } catch (error) {
      throw new Error(`Failed to save commit: ${error.message}`);
    }
  }

  async getCommit(hash) {
    const db = await this.ensureDB();
    try {
      // Get and parse the commit data
      const commitStr = await db.get(`commit:${hash}`);
      return JSON.parse(commitStr);
    } catch (error) {
      if (error.code === "LEVEL_NOT_FOUND") {
        console.log("Debug - Commit not found:", hash);
        return null;
      }
      throw error;
    }
  }

  async getCommitHistory() {
    try {
      // Get the current branch name from HEAD
      const headPath = path.join(this.root, "HEAD");
      console.log("Looking for HEAD at:", headPath);

      if (!(await fileExists(headPath))) {
        console.log("HEAD file not found");
        return [];
      }

      const headContent = await fs.readFile(headPath, "utf8");
      console.log("HEAD content:", headContent);

      // Get branch ref from HEAD
      const branchRef = headContent.trim().split(" ")[1]; // Format: "ref: refs/heads/main"
      if (!branchRef) {
        console.log("No branch reference found in HEAD");
        return [];
      }

      // Get latest commit from branch
      const branchPath = path.join(this.root, branchRef);
      console.log("Looking for branch at:", branchPath);

      if (!(await fileExists(branchPath))) {
        console.log("Branch file not found");
        return [];
      }

      const latestCommitHash = (await fs.readFile(branchPath, "utf8")).trim();
      console.log("Latest commit hash:", latestCommitHash);

      // Build history by following parent links
      const history = [];
      let currentHash = latestCommitHash;

      while (currentHash) {
        console.log("Processing commit:", currentHash);
        const commit = await this.getCommit(currentHash);

        if (!commit) {
          console.log("Could not find commit data for:", currentHash);
          break;
        }

        history.push(currentHash);
        console.log("Added to history. Parent is:", commit.parent);

        // Move to parent commit
        currentHash = commit.parent;
      }

      console.log("Final history length:", history.length);
      return history;
    } catch (error) {
      console.error("Error getting commit history:", error);
      return [];
    }
  }

  // Branch Methods
  async getCurrentBranch() {
    const db = await this.ensureDB();
    try {
      const head = await db.get("HEAD");
      return head.ref;
    } catch (error) {
      // Default to main if HEAD not found
      return "main";
    }
  }

  async getBranchCommit(branch) {
    const db = await this.ensureDB();
    try {
      return await db.get(`branch:${branch}`);
    } catch (error) {
      if (error.code === "LEVEL_NOT_FOUND") {
        return null;
      }
      throw error;
    }
  }

  // Object Storage Methods
  async saveObject(hash, content) {
    const db = await this.ensureDB();
    try {
      await db.put(`object:${hash}`, content);
    } catch (error) {
      throw new Error(`Failed to save object: ${error.message}`);
    }
  }

  async getObject(hash) {
    const db = await this.ensureDB();
    try {
      return await db.get(`object:${hash}`);
    } catch (error) {
      if (error.code === "LEVEL_NOT_FOUND") {
        return null;
      }
      throw error;
    }
  }

  // Index Methods
  async saveIndex(indexData) {
    const db = await this.ensureDB();
    try {
      await db.put("index", JSON.stringify(indexData)); // Convert to string before storing
    } catch (error) {
      throw new Error(`Failed to save index: ${error.message}`);
    }
  }

  async getIndex() {
    const db = await this.ensureDB();
    try {
      const indexData = await db.get("index");
      return JSON.parse(indexData); // Parse the stored string
    } catch (error) {
      if (error.code === "LEVEL_NOT_FOUND") {
        return { files: {} };
      }
      throw error;
    }
  }

  // Utility Methods
  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  async clear() {
    const db = await this.ensureDB();
    await db.clear();
  }

  // Helper method to ensure DB is initialized
  async ensureDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  async updateRef(ref, hash) {
    try {
      if (ref === "HEAD") {
        // If this is the first commit, initialize main branch
        const headPath = path.join(this.root, "HEAD");
        const mainBranchPath = path.join(this.refsDir, "heads", "main");

        // Ensure refs/heads directory exists
        await fs.mkdir(path.join(this.refsDir, "heads"), { recursive: true });

        // Update HEAD to point to main branch if it doesn't exist
        if (!(await fileExists(headPath))) {
          await fs.writeFile(headPath, "ref: refs/heads/main");
        }

        // Update main branch with new commit hash
        await fs.writeFile(mainBranchPath, hash);

        console.log("Debug - Updated refs:", {
          head: await fs.readFile(headPath, "utf8"),
          main: await fs.readFile(mainBranchPath, "utf8"),
        });
      }
    } catch (error) {
      console.error("Error updating ref:", error);
      throw error;
    }
  }
}

// Helper function to check if file exists
async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

// Create singleton instance
let storageInstance = null;

export function getStorage(repoPath) {
  if (!storageInstance) {
    storageInstance = new Storage(repoPath);
  }
  return storageInstance;
}
