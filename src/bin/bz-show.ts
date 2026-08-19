#!/usr/bin/env node

import { runShowCommand } from '../cli/show.js';

process.exitCode = await runShowCommand(process.argv.slice(2));
