import { componentTeamsCommandHelp } from './component-teams.js';
import { credentialsHelp } from './config.js';
import { searchCommandHelp } from './search.js';
import { showCommandHelp } from './show.js';

/**
 * Complete command reference intended for people and LLM consumers.
 */
export const help = `${showCommandHelp}\n${searchCommandHelp}\n${componentTeamsCommandHelp}\n${credentialsHelp}`;
