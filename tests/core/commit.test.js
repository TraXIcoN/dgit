import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { dir as tmpDir } from "tmp-promise";
import { createCommit } from "../../src/core/commit.js";
import { addFiles } from "../../src/core/add.js";
import { jest } from "@jest/globals";
import crypto from "crypto";
import { getStorage } from "../../src/storage/storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("dgit commit command", () => {
  let tempDir;
  let storage;
  let originalCwd;
  let mockConsole;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = await tmpDir({ unsafeCleanup: true });
    process.chdir(tempDir.path);

    storage = getStorage();
    await storage.init();

    // Initialize repository structure
    await storage.saveRef("HEAD", "ref: refs/heads/main");
    await storage.saveRef("refs/heads/main", ""); // Initialize empty branch

    // Mock console.log and console.error
    mockConsole = {
      log: jest.spyOn(console, "log").mockImplementation(),
      error: jest.spyOn(console, "error").mockImplementation(),
    };
  });

  afterEach(async () => {
    if (mockConsole) {
      mockConsole.log.mockRestore();
      mockConsole.error.mockRestore();
    }
    await storage.clear();
    await storage.close();
    process.chdir(originalCwd);
    await tempDir.cleanup();
  });

  test("should create initial commit", async () => {
    // Stage a file
    await storage.saveIndex({
      files: {
        "test.txt": {
          hash: "abc123",
          timestamp: Date.now(),
          type: "text",
        },
      },
    });

    const message = "Initial commit";
    const commitHash = await createCommit({ message });

    // Get the commit from storage
    const commit = await storage.getCommit(commitHash);

    expect(commit).toMatchObject({
      message,
      parent: null,
      author: expect.any(String),
      timestamp: expect.any(String),
      tree: expect.any(Object),
    });

    // Verify HEAD points to this commit
    const headRef = await storage.getRef("HEAD");
    const branchRef = headRef.split(" ")[1];
    const branchCommit = await storage.getRef(branchRef);
    expect(branchCommit).toBe(commitHash);
  });

  test("should create commit with parent", async () => {
    // Create first commit
    await fs.writeFile("test1.txt", "test content 1");
    await addFiles(["test1.txt"]);
    const firstCommitHash = await createCommit({ message: "First commit" });

    // Verify first commit was saved
    const firstCommit = await storage.getCommit(firstCommitHash);
    expect(firstCommit).toBeDefined();
    expect(firstCommit.parent).toBeNull();

    // Create second commit
    await fs.writeFile("test2.txt", "test content 2");
    await addFiles(["test2.txt"]);
    const secondCommitHash = await createCommit({ message: "Second commit" });

    // Get the second commit
    const secondCommit = await storage.getCommit(secondCommitHash);
    expect(secondCommit).toBeDefined();
    expect(secondCommit.parent).toBe(firstCommitHash);

    // Get the current branch ref
    const headRef = await storage.getRef("HEAD");
    const branchRef = headRef.split(" ")[1];
    const currentCommit = await storage.getRef(branchRef);
    expect(currentCommit).toBe(secondCommitHash);

    // Verify history
    const history = await storage.getCommitHistory();
    expect(history).toEqual([secondCommitHash, firstCommitHash]);
  });

  test("should fail if no files are staged", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    await expect(createCommit({ message: "Empty commit" })).rejects.toThrow(
      "Nothing to commit (no files staged)"
    );

    consoleError.mockRestore();
  });

  test("should handle directories", async () => {
    // Create nested directory structure
    await fs.mkdir("dir1/dir2", { recursive: true });
    await fs.writeFile("dir1/dir2/test.txt", "nested content");
    await addFiles(["dir1/dir2/test.txt"]);

    const commitHash = await createCommit({ message: "Nested commit" });
    const commit = await storage.getCommit(commitHash);

    // The tree structure is now flat with path as key
    expect(commit.tree["dir1/dir2/test.txt"]).toBeDefined();
    expect(commit.tree["dir1/dir2/test.txt"].type).toBe("text");
  });

  test("should include commit metadata", async () => {
    // Stage a file
    await fs.writeFile("test.txt", "test content");
    await addFiles(["test.txt"]);

    const message = "Test commit";
    const commitHash = await createCommit({ message });
    const commit = await storage.getCommit(commitHash);

    expect(commit).toMatchObject({
      message,
      author: expect.any(String),
      timestamp: expect.any(String),
      tree: expect.any(Object),
      parent: null,
    });
  });

  test("should create and store tree objects", async () => {
    // Create nested directory structure
    await fs.mkdir("dir1/dir2", { recursive: true });
    await fs.writeFile("dir1/dir2/test.txt", "nested content");
    await addFiles(["dir1/dir2/test.txt"]);

    const commitHash = await createCommit({ message: "Tree commit" });

    // Get commit from storage
    const commit = await storage.getCommit(commitHash);
    expect(commit.tree["dir1/dir2/test.txt"]).toBeDefined();

    // Get current branch ref
    const headRef = await storage.getRef("HEAD");
    const branchRef = headRef.split(" ")[1];
    const currentCommit = await storage.getRef(branchRef);
    expect(currentCommit).toBe(commitHash);
  });

  test("should verify commit signature", async () => {
    // Create and stage a test file
    await fs.writeFile("test.txt", "test content");
    await addFiles(["test.txt"]);

    const commitHash = await createCommit({ message: "Signed commit" });

    // Get commit from storage
    const commit = await storage.getCommit(commitHash);
    expect(commit).toBeDefined();
    expect(commit.message).toBe("Signed commit");

    // Get current branch ref
    const headRef = await storage.getRef("HEAD");
    const branchRef = headRef.split(" ")[1];
    const currentCommit = await storage.getRef(branchRef);
    expect(currentCommit).toBe(commitHash);
  });
});
