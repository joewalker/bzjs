import { describe, expect, it } from 'vitest';

import { componentTeamsCommandHelp } from '../cli/component-teams.js';
import { credentialsHelp } from '../cli/config.js';
import { help } from '../cli/help.js';
import { searchCommandHelp } from '../cli/search.js';
import { showCommandHelp } from '../cli/show.js';

describe('combined CLI help', () => {
  it('contains every complete command reference and one credentials section', () => {
    expect(help).toBe(
      `${showCommandHelp}\n${searchCommandHelp}\n${componentTeamsCommandHelp}\n${credentialsHelp}`,
    );
    expect(help.match(/Credentials are read/gu)).toHaveLength(1);
  });

  it('explains how to create and configure an API key', () => {
    expect(credentialsHelp).toContain(
      'https://bugzilla.mozilla.org/userprefs.cgi?tab=apikey',
    );
    expect(credentialsHelp).toContain('BUGZILLA_API_KEY=your-api-key');
  });

  it('documents component-team filtering', () => {
    expect(componentTeamsCommandHelp).toContain('--team MATCHER');
  });
});
