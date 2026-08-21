#!/usr/bin/env node

import { help } from '../cli/help.js';
import { processIo } from '../cli/runtime.js';
import { runSearchCommand } from '../cli/search.js';
import { runShowCommand } from '../cli/show.js';

const dispatcherHelp = `Usage:
  bzjs search [SUMMARY] [options]
  bzjs show BUG_ID_OR_URL [options]
  bzjs help

The standalone bz-help, bz-search, and bz-show commands are also installed.
`;

const [command, ...args] = process.argv.slice(2);
if (command == null || command === '--help' || command === '-h') {
  processIo.stdout(dispatcherHelp);
  process.exitCode = 0;
} else if (command === 'search') {
  process.exitCode = await runSearchCommand(args);
} else if (command === 'show') {
  process.exitCode = await runShowCommand(args);
} else if (command === 'help') {
  processIo.stdout(help);
  process.exitCode = 0;
} else {
  processIo.stderr(`bzjs: unknown command ${command}\n\n${dispatcherHelp}`);
  process.exitCode = 1;
}
