import { describe, expect, it } from 'vitest';

import { credentialsHelp } from '../cli/config.js';
import { help } from '../cli/help.js';
import { searchCommandHelp } from '../cli/search.js';
import { showCommandHelp } from '../cli/show.js';

describe('combined CLI help', () => {
  it('contains both complete command references and one credentials section', () => {
    expect(help).toBe(
      `${showCommandHelp}\n${searchCommandHelp}\n${credentialsHelp}`,
    );
    expect(help.match(/Credentials are read/gu)).toHaveLength(1);
  });

  it('explains how to create and configure an API key', () => {
    expect(credentialsHelp).toContain(
      'https://bugzilla.mozilla.org/userprefs.cgi?tab=apikey',
    );
    expect(credentialsHelp).toContain('BUGZILLA_API_KEY=your-api-key');
  });
});
