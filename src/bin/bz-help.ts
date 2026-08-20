#!/usr/bin/env node

import { help } from '../cli/help.js';
import { processIo } from '../cli/runtime.js';

processIo.stdout(help);
process.exitCode = 0;
