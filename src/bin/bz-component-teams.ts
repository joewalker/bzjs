#!/usr/bin/env node

import { runComponentTeamsCommand } from '../cli/component-teams.js';

process.exitCode = await runComponentTeamsCommand(process.argv.slice(2));
