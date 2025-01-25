import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { dir as tmpDir } from "tmp-promise";
import { addFiles } from "../../src/core/add.js";
import crypto from "crypto";
import { jest } from "@jest/globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("dgit add command", () => {
  let tempDir;
  let originalCwd;

  beforeEach(async () => {
    // Save current working directory
    originalCwd = process.cwd();
    // Create temporary directory
    tempDir = await tmpDir({ unsafeCleanup: true });
    // Change to temporary directory
    process.chdir(tempDir.path);
    // Initialize .dgit directory
    await fs.mkdir(".dgit");
    await fs.mkdir(path.join(".dgit", "objects"));
  });

  afterEach(async () => {
    // Restore original working directory
    process.chdir(originalCwd);
    // Cleanup temporary directory
    await tempDir.cleanup();
  });

  test("should add a single text file", async () => {
    // Create a test file
    const content = "test content";
    await fs.writeFile("test.txt", content);

    // Add the file
    await addFiles(["test.txt"]);

    // Read the index file
    const indexContent = await fs.readFile(path.join(".dgit", "index"), "utf8");
    const index = JSON.parse(indexContent);

    // Verify file was added to index
    expect(index.files["test.txt"]).toBeDefined();
    expect(index.files["test.txt"].type).toBe("text");

    // Verify file content was stored correctly
    const hash = index.files["test.txt"].hash;
    const objectPath = path.join(
      ".dgit",
      "objects",
      hash.slice(0, 2),
      hash.slice(2)
    );
    const storedContent = await fs.readFile(objectPath);
    expect(storedContent.toString()).toBe(content);
  });

  test("should handle binary files", async () => {
    // Create a binary file
    const content = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    await fs.writeFile("test.bin", content);

    await addFiles(["test.bin"]);

    const indexContent = await fs.readFile(path.join(".dgit", "index"), "utf8");
    const index = JSON.parse(indexContent);

    expect(index.files["test.bin"].type).toBe("binary");
  });

  test("should respect .gitignore", async () => {
    // Create .gitignore
    await fs.writeFile(".gitignore", "ignored.txt\n");

    // Create test files
    await fs.writeFile("normal.txt", "normal content");
    await fs.writeFile("ignored.txt", "ignored content");

    await addFiles(["*.txt"]);

    const indexContent = await fs.readFile(path.join(".dgit", "index"), "utf8");
    const index = JSON.parse(indexContent);

    expect(index.files["normal.txt"]).toBeDefined();
    expect(index.files["ignored.txt"]).toBeUndefined();
  });

  test("should handle multiple files", async () => {
    // Create multiple test files
    await fs.writeFile("file1.txt", "content 1");
    await fs.writeFile("file2.txt", "content 2");

    await addFiles(["file1.txt", "file2.txt"]);

    const indexContent = await fs.readFile(path.join(".dgit", "index"), "utf8");
    const index = JSON.parse(indexContent);

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

    // Add the directory contents using glob pattern
    await addFiles(["testdir/*.txt"]);

    const indexContent = await fs.readFile(path.join(".dgit", "index"), "utf8");
    const index = JSON.parse(indexContent);

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

    const indexContent = await fs.readFile(path.join(".dgit", "index"), "utf8");
    const index = JSON.parse(indexContent);

    const hash = crypto
      .createHash("sha1")
      .update("blob " + "updated content".length + "\0")
      .update("updated content")
      .digest("hex");

    expect(index.files["test.txt"].hash).toBe(hash);
  });
});
