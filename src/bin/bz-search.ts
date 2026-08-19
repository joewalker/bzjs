#!/usr/bin/env node

import { runSearchCommand } from '../cli/search.js';

process.exitCode = await runSearchCommand(process.argv.slice(2));
