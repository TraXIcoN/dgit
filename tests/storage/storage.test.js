import { getStorage } from "../../src/storage/storage.js";
import { dir as tmpDir } from "tmp-promise";
import path from "path";
import { jest } from "@jest/globals";
import fs from "fs/promises";

describe("Storage", () => {
  let tempDir;
  let storage;

  beforeEach(async () => {
    // Reset the singleton instance
    global.storageInstance = null;

    tempDir = await tmpDir({ unsafeCleanup: true });
    process.chdir(tempDir.path);

    storage = getStorage();
    await storage.init();

    // Initialize repository structure
    await storage.saveRef("HEAD", "ref: refs/heads/main");
    await storage.saveRef("refs/heads/main", ""); // Initialize empty branch
  });

  afterEach(async () => {
    await storage.clear();
    await storage.close();
    await tempDir.cleanup();
  });

  test("should save and retrieve commits", async () => {
    const commitHash = "abc123";
    const commitData = {
      message: "Test commit",
      author: "Test User <test@example.com>",
      timestamp: new Date().toISOString(),
      tree: {},
      parent: null,
    };

    await storage.saveCommit(commitHash, commitData);
    const retrieved = await storage.getCommit(commitHash);

    expect(retrieved).toEqual(commitData);
  });

  test("should maintain commit history", async () => {
    // Create initial commit
    const commit1 = {
      hash: "abc123",
      data: {
        message: "First commit",
        author: "Test User",
        timestamp: new Date().toISOString(),
        tree: {},
        parent: null,
      },
    };

    // Create second commit pointing to first
    const commit2 = {
      hash: "def456",
      data: {
        message: "Second commit",
        author: "Test User",
        timestamp: new Date().toISOString(),
        tree: {},
        parent: commit1.hash,
      },
    };

    // Save commits
    await storage.saveCommit(commit1.hash, commit1.data);
    await storage.saveCommit(commit2.hash, commit2.data);

    // Set up HEAD and branch
    await fs.mkdir(path.join(storage.refsDir, "heads"), { recursive: true });
    await fs.writeFile(path.join(storage.root, "HEAD"), "ref: refs/heads/main");
    await fs.writeFile(
      path.join(storage.refsDir, "heads", "main"),
      commit2.hash
    );

    const history = await storage.getCommitHistory();
    expect(history).toContain(commit1.hash);
    expect(history).toContain(commit2.hash);
    expect(history.indexOf(commit2.hash)).toBeLessThan(
      history.indexOf(commit1.hash)
    );
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
    const missingCommit = await storage.getCommit("nonexistent");
    const emptyIndex = await storage.getIndex();
    const emptyHistory = await storage.getCommitHistory();

    expect(missingCommit).toBeNull();
    expect(emptyIndex).toEqual({ files: {} });
    expect(emptyHistory).toEqual([]);
  });
});
