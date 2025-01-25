import { Level } from "level";
import path from "path";

class Storage {
  constructor(repoPath = ".dgit") {
    this.dbPath = path.join(repoPath, "db");
    this.db = null;
  }

  async init() {
    try {
      // Initialize the database
      this.db = new Level(this.dbPath, {
        valueEncoding: "json",
      });

      // Wait for database to open
      await this.db.open();

      // Initialize database with metadata
      await this.db.put("metadata", {
        version: "1.0",
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      throw new Error(`Failed to initialize storage: ${error.message}`);
    }
  }

  // Commit History Methods
  async saveCommit(commitHash, commitData) {
    const db = await this.ensureDB();
    try {
      await db.put(`commit:${commitHash}`, commitData);

      // Update commit history
      const history = (await this.getCommitHistory()) || [];
      history.unshift(commitHash);
      await db.put("commit:history", history);

      // Update branch pointer
      const branch = await this.getCurrentBranch();
      await db.put(`branch:${branch}`, commitHash);
    } catch (error) {
      throw new Error(`Failed to save commit: ${error.message}`);
    }
  }

  async getCommit(commitHash) {
    const db = await this.ensureDB();
    try {
      return await db.get(`commit:${commitHash}`);
    } catch (error) {
      if (error.code === "LEVEL_NOT_FOUND") {
        return null;
      }
      throw error;
    }
  }

  async getCommitHistory() {
    const db = await this.ensureDB();
    try {
      return await db.get("commit:history");
    } catch (error) {
      if (error.code === "LEVEL_NOT_FOUND") {
        return [];
      }
      throw error;
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
}

// Create singleton instance
let storageInstance = null;

export function getStorage(repoPath) {
  if (!storageInstance) {
    storageInstance = new Storage(repoPath);
  }
  return storageInstance;
}
