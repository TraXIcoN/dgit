import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { dir as tmpDir } from "tmp-promise";
import { createCommit } from "../../src/core/commit.js";
import { addFiles } from "../../src/core/add.js";
import { jest } from "@jest/globals";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("dgit commit command", () => {
  let tempDir;
  let originalCwd;
  let mockConsole;

  beforeEach(async () => {
    // Save current working directory
    originalCwd = process.cwd();
    // Create temporary directory
    tempDir = await tmpDir({ unsafeCleanup: true });
    // Change to temporary directory
    process.chdir(tempDir.path);

    // Initialize .dgit directory with basic structure
    await fs.mkdir(".dgit");
    await fs.mkdir(path.join(".dgit", "objects"));
    await fs.mkdir(path.join(".dgit", "refs", "heads"), { recursive: true });
    await fs.writeFile(path.join(".dgit", "HEAD"), "ref: refs/heads/main\n");

    // Mock console.log and console.error
    mockConsole = {
      log: jest.spyOn(console, "log").mockImplementation(),
      error: jest.spyOn(console, "error").mockImplementation(),
    };
  });

  afterEach(async () => {
    // Restore original working directory
    process.chdir(originalCwd);
    // Cleanup temporary directory
    await tempDir.cleanup();
    // Restore console
    mockConsole.log.mockRestore();
    mockConsole.error.mockRestore();
  });

  test("should create initial commit", async () => {
    // Create and stage a test file
    await fs.writeFile("test.txt", "test content");
    await addFiles(["test.txt"]);

    const message = "Initial commit";
    await createCommit({ message });

    // Verify HEAD points to the new commit
    const headContent = await fs.readFile(path.join(".dgit", "HEAD"), "utf8");
    const ref = headContent.trim().split(" ")[1];
    const commitHash = await fs.readFile(path.join(".dgit", ref), "utf8");

    // Read the commit object
    const commitDir = path.join(".dgit", "objects", commitHash.slice(0, 2));
    const commitContent = await fs.readFile(
      path.join(commitDir, commitHash.slice(2)),
      "utf8"
    );
    const commit = JSON.parse(commitContent);

    // Verify commit structure
    expect(commit).toMatchObject({
      message,
      parent: null,
      tree: expect.any(String),
      author: expect.any(String),
      timestamp: expect.any(String),
      signature: expect.any(String),
    });
  });

  test("should create commit with parent", async () => {
    // Create first commit
    await fs.writeFile("test1.txt", "test content 1");
    await addFiles(["test1.txt"]);
    await createCommit({ message: "First commit" });

    // Create second commit
    await fs.writeFile("test2.txt", "test content 2");
    await addFiles(["test2.txt"]);
    await createCommit({ message: "Second commit" });

    // Get the second commit hash
    const headContent = await fs.readFile(path.join(".dgit", "HEAD"), "utf8");
    const ref = headContent.trim().split(" ")[1];
    const commitHash = await fs.readFile(path.join(".dgit", ref), "utf8");

    // Read the commit object
    const commitDir = path.join(".dgit", "objects", commitHash.slice(0, 2));
    const commitContent = await fs.readFile(
      path.join(commitDir, commitHash.slice(2)),
      "utf8"
    );
    const commit = JSON.parse(commitContent);

    // Verify commit has parent
    expect(commit.parent).toBeTruthy();
  });

  test("should fail if no files are staged", async () => {
    const exitSpy = jest.spyOn(process, "exit").mockImplementation();

    await createCommit({ message: "Empty commit" });

    expect(mockConsole.error).toHaveBeenCalledWith(
      "Nothing to commit (no files staged)"
    );
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });

  test("should create and store tree objects", async () => {
    // Create nested directory structure
    await fs.mkdir("dir1/dir2", { recursive: true });
    await fs.writeFile("dir1/dir2/test.txt", "nested content");
    await addFiles(["dir1/dir2/test.txt"]);

    await createCommit({ message: "Nested commit" });

    // Get commit hash
    const headContent = await fs.readFile(path.join(".dgit", "HEAD"), "utf8");
    const ref = headContent.trim().split(" ")[1];
    const commitHash = await fs.readFile(path.join(".dgit", ref), "utf8");

    // Read commit object
    const commitDir = path.join(".dgit", "objects", commitHash.slice(0, 2));
    const commitContent = await fs.readFile(
      path.join(commitDir, commitHash.slice(2)),
      "utf8"
    );
    const commit = JSON.parse(commitContent);

    // Read root tree object
    const rootTreeDir = path.join(".dgit", "objects", commit.tree.slice(0, 2));
    const rootTreeContent = await fs.readFile(
      path.join(rootTreeDir, commit.tree.slice(2)),
      "utf8"
    );

    // Get dir1 tree hash
    const dir1Hash = rootTreeContent.split(" ")[2];

    // Read dir1 tree object
    const dir1TreeDir = path.join(".dgit", "objects", dir1Hash.slice(0, 2));
    const dir1TreeContent = await fs.readFile(
      path.join(dir1TreeDir, dir1Hash.slice(2)),
      "utf8"
    );

    // Get dir2 tree hash
    const dir2Hash = dir1TreeContent.split(" ")[2];

    // Read dir2 tree object
    const dir2TreeDir = path.join(".dgit", "objects", dir2Hash.slice(0, 2));
    const dir2TreeContent = await fs.readFile(
      path.join(dir2TreeDir, dir2Hash.slice(2)),
      "utf8"
    );

    // Verify complete tree structure
    expect(rootTreeContent).toContain("tree"); // dir1
    expect(dir1TreeContent).toContain("tree"); // dir2
    expect(dir2TreeContent).toContain("blob"); // test.txt
  });

  test("should verify commit signature", async () => {
    // Create and stage a test file
    await fs.writeFile("test.txt", "test content");
    await addFiles(["test.txt"]);

    await createCommit({ message: "Signed commit" });

    // Get commit hash
    const headContent = await fs.readFile(path.join(".dgit", "HEAD"), "utf8");
    const ref = headContent.trim().split(" ")[1];
    const commitHash = await fs.readFile(path.join(".dgit", ref), "utf8");

    // Read commit object
    const commitDir = path.join(".dgit", "objects", commitHash.slice(0, 2));
    const commitContent = await fs.readFile(
      path.join(commitDir, commitHash.slice(2)),
      "utf8"
    );
    const commit = JSON.parse(commitContent);

    // Read public key
    const publicKey = await fs.readFile(
      path.join(".dgit", "keys", "public.pem"),
      "utf8"
    );

    // Create commit data without signature for verification
    const { signature, ...commitData } = commit;
    const verifier = crypto.createVerify("SHA256");
    verifier.update(JSON.stringify(commitData, null, 2));

    // Verify signature
    const isValid = verifier.verify(publicKey, signature, "hex");
    expect(isValid).toBe(true);
  });
});
