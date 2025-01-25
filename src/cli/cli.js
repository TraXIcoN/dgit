#!/usr/bin/env node

import { program } from "commander";
import { initRepo } from "../core/init.js";

program
  .name("dgit")
  .description("Decentralized Git Implementation")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize a new dgit repository")
  .action(initRepo);

program.parse();
