import { getStorage } from "../storage/storage.js";
import crypto from "crypto";
import os from "os";

export async function createCommit({ message }) {
  try {
    console.log("Starting commit process..."); // Debug 1

    const storage = getStorage();
    console.log("Got storage instance..."); // Debug 2

    await storage.init();
    console.log("Storage initialized..."); // Debug 3

    // Get staged files from storage
    console.log("Attempting to read index..."); // Debug 4
    const index = await storage.getIndex();
    console.log("Debug - Current index:", JSON.stringify(index, null, 2)); // Debug 5

    // Check if there are files to commit
    if (!index.files || Object.keys(index.files).length === 0) {
      console.error("Nothing to commit (no files staged)");
      process.exit(1);
    }

    console.log("Found files to commit..."); // Debug 6

    // Get author information
    const author = {
      name:
        process.env.DGIT_USER_NAME ||
        process.env.GIT_AUTHOR_NAME ||
        os.userInfo().username,
      email:
        process.env.DGIT_USER_EMAIL ||
        process.env.GIT_AUTHOR_EMAIL ||
        `${os.userInfo().username}@${os.hostname()}`,
    };

    // Create commit object with detailed author info
    const commitData = {
      tree: index.files,
      parent: null,
      author: `${author.name} <${author.email}>`,
      timestamp: new Date().toISOString(), // ISO string format for better date handling
      message: message,
    };

    console.log("Created commit data..."); // Debug 7

    // Get parent commit hash
    try {
      const history = await storage.getCommitHistory();
      if (history.length > 0) {
        commitData.parent = history[0].hash;
        console.log("Found parent commit:", commitData.parent); // Debug 8
      }
    } catch (error) {
      console.log("No previous commits found");
    }

    // Hash the commit
    const commitStr = JSON.stringify(commitData);
    console.log("Commit data to hash:", commitStr); // Debug 9

    const commitHash = crypto
      .createHash("sha1")
      .update("commit " + commitStr.length + "\0")
      .update(commitStr)
      .digest("hex");

    console.log("Generated commit hash:", commitHash); // Debug 10

    // Save commit to storage
    console.log("Saving commit to storage..."); // Debug 11
    await storage.saveCommit(commitHash, commitData);
    console.log("Commit saved to storage."); // Debug 12

    // Update HEAD and branch
    console.log("Updating refs..."); // Debug 13
    await storage.updateRef("HEAD", commitHash);
    console.log("Refs updated."); // Debug 14

    // Pretty print the commit information
    console.log("\n----------------------------------------");
    console.log(`Commit: ${commitHash}`);
    console.log(`Author: ${commitData.author}`);
    console.log(`Date: ${new Date(commitData.timestamp).toLocaleString()}`);
    console.log("\n    " + message);

    // Show what files were committed
    console.log("\nFiles:");
    Object.keys(index.files).forEach((file) => {
      console.log(`    ${file}`);
    });
    console.log("----------------------------------------");

    // Clear the index after commit
    console.log("Clearing index..."); // Debug 15
    await storage.saveIndex({ files: {} });
    console.log("Index cleared."); // Debug 16
  } catch (error) {
    console.error("Error creating commit:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}
