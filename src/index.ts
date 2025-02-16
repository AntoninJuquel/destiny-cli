#!/usr/bin/env node

import { Command } from "commander";
import loginCommand from "./commands/login.js";
import logoutCommand from "./commands/logout.js";
const program = new Command();

program
  .name("destiny-cli")
  .description("CLI tool for managing Destiny 2 inventory")
  .version("1.0.0");

program.addCommand(loginCommand);
program.addCommand(logoutCommand);

program.parse(process.argv);
