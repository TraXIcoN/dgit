#!/usr/bin/env node

import { program } from "commander";
import { initRepo } from "../core/init.js";
import { addFiles } from "../core/add.js";
import { createCommit } from "../core/commit.js";
import { connect } from "../network/connect.js";
import { listen } from "../network/listen.js";
import { discover } from "../network/discover.js";
import { listPeers, getCommitsFromPeer } from "../network/peers.js";
import { getStorage } from "../storage/storage.js";

program
  .name("dgit")
  .description("Decentralized Git Implementation")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize a new dgit repository")
  .action(initRepo);

program
  .command("add <files...>")
  .description("Add files to the staging area")
  .action(addFiles);

program
  .command("commit")
  .description("Create a new commit")
  .requiredOption("-m, --message <message>", "Commit message")
  .action(async (options) => {
    console.log("CLI: Starting commit command..."); // Debug
    try {
      await createCommit({ message: options.message });
    } catch (error) {
      console.error("CLI: Error in commit command:", error);
      process.exit(1);
    }
  });

program
  .command("connect <peer>")
  .description("Connect to a peer")
  .action(async (peer) => {
    try {
      await connect(peer);
      console.log("Successfully connected to peer");
    } catch (error) {
      console.error("Connection failed:", error.message);
      process.exit(1);
    }
  });

program
  .command("discover")
  .description("Start peer discovery")
  .action(async () => {
    try {
      await discover();
      console.log("Discovery started. Press Ctrl+C to stop.");
      // Keep the process running
      process.stdin.resume();
    } catch (error) {
      console.error("Discovery failed:", error.message);
      process.exit(1);
    }
  });

program
  .command("listen")
  .description("Start listening for connections")
  .option("-p, --port <number>", "Port to listen on", "0")
  .option("--public", "Show public IP address")
  .action(async (options) => {
    try {
      const address = await listen(options);
      console.log("Listening on:", address);
      // Keep the process running
      process.stdin.resume();
    } catch (error) {
      console.error("Failed to start listener:", error.message);
      process.exit(1);
    }
  });

program
  .command("peers")
  .description("List all connected peers and their commits")
  .action(async () => {
    try {
      const peers = await listPeers();
      if (peers.length === 0) {
        console.log("No peers connected");
      } else {
        console.log("Connected peers:");
        for (const peer of peers) {
          console.log(`\nPeer: ${peer.id}`);
          console.log("Addresses:", peer.addresses.join(", "));

          // Try to get commits from this peer
          try {
            const commits = await getCommitsFromPeer(peer.id);
            console.log("\nCommits:");
            commits.forEach((commit) => {
              console.log(`- ${commit.hash.slice(0, 7)} ${commit.message}`);
            });
          } catch (err) {
            console.log("Could not fetch commits:", err.message);
          }
        }
      }
    } catch (error) {
      console.error("Failed to list peers:", error.message);
      process.exit(1);
    }
  });

program
  .command("history")
  .description("Show dgit commit history")
  .action(async () => {
    try {
      const storage = getStorage();
      await storage.init();

      const history = await storage.getCommitHistory();

      if (history.length === 0) {
        console.log("No dgit commits found");
        return;
      }

      console.log("\ndgit Commit History:");
      for (const commitHash of history) {
        // Get the full commit data
        const commitData = await storage.getCommit(commitHash);
        if (!commitData) {
          console.log(`Warning: Could not find data for commit ${commitHash}`);
          continue;
        }

        console.log(`\nCommit: ${commitHash.substring(0, 7)}`);
        console.log("Author:", commitData.author);
        console.log("Date:", new Date(commitData.timestamp).toLocaleString());
        console.log("\n    " + commitData.message);

        // Show files in this commit
        if (commitData.tree) {
          console.log("\nFiles:");
          Object.keys(commitData.tree).forEach((file) => {
            console.log(`    ${file}`);
          });
        }
        console.log("----------------------------------------");
      }
    } catch (error) {
      console.error("Failed to get history:", error);
      process.exit(1);
    }
  });

program.parse(process.argv);
