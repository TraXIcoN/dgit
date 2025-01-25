import { Level } from "level";
import path from "path";
import fs from "fs/promises";

export class Storage {
  constructor() {
    this.root = path.join(process.cwd(), ".dgit");
    this.refsDir = path.join(this.root, "refs");
    console.log("Storage initialized at:", this.root);
  }

  async init() {
    try {
      await fs.mkdir(this.root, { recursive: true });
      await fs.mkdir(this.refsDir, { recursive: true });
      await fs.mkdir(path.join(this.refsDir, "heads"), { recursive: true });

      // Only create a new database instance if one doesn't exist
      if (!this.db) {
        this.db = new Level(path.join(this.root, "db"), {
          valueEncoding: "json",
        });
        // Wait for the database to be ready
        await this.db.open();
      }
      console.log("Storage initialized with database");
    } catch (error) {
      console.error("Failed to initialize storage:", error);
      throw new Error(`Failed to initialize storage: ${error.message}`);
    }
  }

  async ensureDB() {
    if (!this.db || this.db.closed) {
      await this.init();
    }
    return this.db;
  }

  async saveCommit(hash, commitData) {
    const db = await this.ensureDB();
    try {
      // Store commit data
      await db.put(`commit:${hash}`, commitData);
      console.log("Debug - Saved commit data:", commitData);

      // Update branch reference
      const headRef = await this.getRef("HEAD");
      if (headRef && headRef.startsWith("ref: ")) {
        const branchRef = headRef.split(" ")[1];
        await this.updateRef(branchRef, hash);
        console.log("Updated branch reference to:", hash);
      }
    } catch (error) {
      throw new Error(`Failed to save commit: ${error.message}`);
    }
  }

  async getCommit(hash) {
    const db = await this.ensureDB();
    try {
      const commit = await db.get(`commit:${hash}`);
      console.log("Retrieved commit:", hash, commit);
      return commit;
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
      const headContent = await this.getRef("HEAD");
      console.log("HEAD content:", headContent);

      if (!headContent) {
        console.log("No HEAD found");
        return [];
      }

      let currentRef;
      if (headContent.startsWith("ref: ")) {
        const branchRef = headContent.split(" ")[1];
        currentRef = await this.getRef(branchRef);
        console.log("Branch reference:", currentRef);
      } else {
        currentRef = headContent;
      }

      if (!currentRef) {
        console.log("No commit reference found");
        return [];
      }

      const history = [];
      let currentHash = currentRef;

      while (currentHash) {
        console.log("Processing commit:", currentHash);
        const commit = await this.getCommit(currentHash);

        if (!commit) {
          console.log("Could not find commit:", currentHash);
          break;
        }

        history.push(currentHash);
        currentHash = commit.parent;
        console.log("Next commit in chain:", currentHash);
      }

      console.log("Final history:", history);
      return history;
    } catch (error) {
      console.error("Error getting commit history:", error);
      return [];
    }
  }

  async saveRef(ref, value) {
    const db = await this.ensureDB();
    try {
      console.log(`Saving ref ${ref} with value:`, value);
      await db.put(`ref:${ref}`, value);
    } catch (error) {
      throw new Error(`Failed to save ref: ${error.message}`);
    }
  }

  async getRef(ref) {
    const db = await this.ensureDB();
    try {
      const value = await db.get(`ref:${ref}`);
      console.log(`Got ref ${ref}:`, value);
      return value;
    } catch (error) {
      if (error.code === "LEVEL_NOT_FOUND") {
        console.log(`Ref ${ref} not found`);
        return null;
      }
      throw error;
    }
  }

  async updateRef(ref, hash) {
    try {
      console.log(`Updating ref ${ref} to ${hash}`);
      if (ref === "HEAD") {
        const headContent = await this.getRef("HEAD");
        if (headContent && headContent.startsWith("ref: ")) {
          const branchRef = headContent.split(" ")[1];
          await this.saveRef(branchRef, hash);
        } else {
          await this.saveRef("HEAD", hash);
        }
      } else {
        await this.saveRef(ref, hash);
      }
    } catch (error) {
      throw new Error(`Failed to update ref: ${error.message}`);
    }
  }

  async saveIndex(indexData) {
    const db = await this.ensureDB();
    try {
      await db.put("index", indexData);
    } catch (error) {
      throw new Error(`Failed to save index: ${error.message}`);
    }
  }

  async getIndex() {
    const db = await this.ensureDB();
    try {
      return await db.get("index");
    } catch (error) {
      if (error.code === "LEVEL_NOT_FOUND") {
        return { files: {} };
      }
      throw error;
    }
  }

  async clear() {
    if (this.db) {
      try {
        // Clear all data but keep the database open
        await this.db.clear();
      } catch (error) {
        console.error("Error clearing database:", error);
        throw error;
      }
    }
  }

  async close() {
    if (this.db) {
      try {
        await this.db.close();
        this.db = null; // Clear the reference
      } catch (error) {
        console.error("Error closing database:", error);
        throw error;
      }
    }
  }

  async isOpen() {
    return this.db && !this.db.closed;
  }
}

let storageInstance = null;

export function getStorage() {
  if (!storageInstance) {
    storageInstance = new Storage();
  }
  return storageInstance;
}
