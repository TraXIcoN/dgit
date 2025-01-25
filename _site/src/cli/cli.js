#!/usr/bin/env node

import { program } from "commander";
import { initRepo } from "../core/init.js";
import { addFiles } from "../core/add.js";
import { createCommit } from "../core/commit.js";

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
  .requiredOption("-m, --message <message>", "commit message")
  .action(createCommit);

program.parse();
