import fs from "fs/promises";
import { dir as tmpDir } from "tmp-promise";
import { addFiles } from "../../src/core/add.js";
import { getStorage } from "../../src/storage/storage.js";
import { jest } from "@jest/globals";

describe("dgit add command", () => {
  let tempDir;
  let originalCwd;
  let storage;

  beforeAll(() => {
    originalCwd = process.cwd();
  });

  beforeEach(async () => {
    // Create temporary directory and change to it
    tempDir = await tmpDir({ unsafeCleanup: true });
    process.chdir(tempDir.path);

    // Initialize storage
    storage = getStorage();
    await storage.init();
  });

  afterEach(async () => {
    // Close storage and reset instance
    if (storage) {
      await storage.close();
    }
    global.storageInstance = null;

    // Change back to original directory
    process.chdir(originalCwd);

    // Cleanup temporary directory
    if (tempDir) {
      await tempDir.cleanup();
    }
  });

  afterAll(() => {
    // Ensure we're back in the original directory
    process.chdir(originalCwd);
  });

  test("should add a single text file", async () => {
    // Create a test file
    const content = "test content";
    await fs.writeFile("test.txt", content);

    // Add the file
    await addFiles(["test.txt"]);

    // Get the index from storage
    const index = await storage.getIndex();

    // Verify file was added to index
    expect(index.files["test.txt"]).toBeDefined();
    expect(index.files["test.txt"].type).toBe("text");
  });

  test("should handle binary files", async () => {
    // Create a binary file
    const content = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    await fs.writeFile("test.bin", content);

    await addFiles(["test.bin"]);
    const index = await storage.getIndex();

    expect(index.files["test.bin"].type).toBe("binary");
  });

  test("should respect .gitignore", async () => {
    // Create .gitignore
    await fs.writeFile(".gitignore", "ignored.txt\n");

    // Create test files
    await fs.writeFile("normal.txt", "normal content");
    await fs.writeFile("ignored.txt", "ignored content");

    await addFiles(["*.txt"]);
    const index = await storage.getIndex();

    expect(index.files["normal.txt"]).toBeDefined();
    expect(index.files["ignored.txt"]).toBeUndefined();
  });

  test("should handle multiple files", async () => {
    // Create multiple test files
    await fs.writeFile("file1.txt", "content 1");
    await fs.writeFile("file2.txt", "content 2");

    await addFiles(["file1.txt", "file2.txt"]);
    const index = await storage.getIndex();

    expect(index.files["file1.txt"]).toBeDefined();
    expect(index.files["file2.txt"]).toBeDefined();
  });

  test("should handle non-existent files", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    await addFiles(["nonexistent.txt"]);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error: File nonexistent.txt not found")
    );

    consoleErrorSpy.mockRestore();
  });

  test("should handle directories", async () => {
    // Create a directory with files
    await fs.mkdir("testdir", { recursive: true });
    await fs.writeFile("testdir/file1.txt", "content 1");
    await fs.writeFile("testdir/file2.txt", "content 2");

    await addFiles(["testdir/*.txt"]);
    const index = await storage.getIndex();

    expect(index.files["testdir/file1.txt"]).toBeDefined();
    expect(index.files["testdir/file2.txt"]).toBeDefined();
  });

  test("should update existing files", async () => {
    // Add file initially
    await fs.writeFile("test.txt", "initial content");
    await addFiles(["test.txt"]);

    // Update file and add again
    await fs.writeFile("test.txt", "updated content");
    await addFiles(["test.txt"]);

    const index = await storage.getIndex();
    const hash = crypto
      .createHash("sha1")
      .update("blob " + "updated content".length + "\0")
      .update("updated content")
      .digest("hex");

    expect(index.files["test.txt"].hash).toBe(hash);
  });
});
