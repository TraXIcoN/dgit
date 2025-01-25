import { getStorage } from "../../src/storage/storage.js";
import { dir as tmpDir } from "tmp-promise";
import path from "path";
import { jest } from "@jest/globals";

describe("Storage", () => {
  let tempDir;
  let storage;

  beforeEach(async () => {
    // Reset the singleton instance
    global.storageInstance = null;

    tempDir = await tmpDir({ unsafeCleanup: true });
    storage = getStorage(tempDir.path);
    await storage.init();
  });

  afterEach(async () => {
    await storage.clear(); // Clear the database
    await storage.close();
    await tempDir.cleanup();
  });

  test("should save and retrieve commits", async () => {
    const commitHash = "abc123";
    const commitData = {
      message: "Test commit",
      timestamp: new Date().toISOString(),
    };

    await storage.saveCommit(commitHash, commitData);
    const retrieved = await storage.getCommit(commitHash);

    expect(retrieved).toEqual(commitData);
  });

  test("should maintain commit history", async () => {
    const commits = [
      { hash: "abc123", data: { message: "First commit" } },
      { hash: "def456", data: { message: "Second commit" } },
    ];

    for (const commit of commits) {
      await storage.saveCommit(commit.hash, commit.data);
    }

    const history = await storage.getCommitHistory();
    expect(history).toEqual(["def456", "abc123"]);
  });

  test("should handle branch operations", async () => {
    const commitHash = "abc123";
    await storage.saveCommit(commitHash, { message: "Test commit" });

    const branch = await storage.getCurrentBranch();
    const branchCommit = await storage.getBranchCommit(branch);

    expect(branch).toBe("main");
    expect(branchCommit).toBe(commitHash);
  });

  test("should save and retrieve objects", async () => {
    const hash = "abc123";
    const content = { type: "blob", data: "test content" };

    await storage.saveObject(hash, content);
    const retrieved = await storage.getObject(hash);

    expect(retrieved).toEqual(content);
  });

  test("should handle index operations", async () => {
    const indexData = {
      files: {
        "test.txt": {
          hash: "abc123",
          timestamp: Date.now(),
        },
      },
    };

    await storage.saveIndex(indexData);
    const retrieved = await storage.getIndex();

    expect(retrieved).toEqual(indexData);
  });

  test("should handle missing data gracefully", async () => {
    // Clear any existing data first
    await storage.clear();

    const missingCommit = await storage.getCommit("nonexistent");
    const missingObject = await storage.getObject("nonexistent");
    const emptyHistory = await storage.getCommitHistory();

    expect(missingCommit).toBeNull();
    expect(missingObject).toBeNull();
    expect(emptyHistory).toEqual([]);
  });
});
