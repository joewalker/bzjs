import { describe, expect, it } from 'vitest';

import { formatCliError } from '../cli/errors.js';
import { BugzillaApiError } from '../index.js';

describe('formatCliError', () => {
  it('explains how to configure a missing API key after a 401', () => {
    const output = formatCliError(
      'bz-show',
      new BugzillaApiError(401, 'Bugzilla API error 401: Access denied.'),
      {
        apiKeyConfigured: false,
        localConfigFile: '/work/project/.env',
        origin: 'https://bugzilla.mozilla.org',
        userConfigFile: '/home/example/.config/bzjs/config.env',
      },
    );

    expect(output).toContain('No Bugzilla API key was found');
    expect(output).toContain(
      'https://bugzilla.mozilla.org/userprefs.cgi?tab=apikey',
    );
    expect(output).toContain('/home/example/.config/bzjs/config.env');
    expect(output).toContain('BUGZILLA_API_KEY=your-api-key');
  });

  it('reports when a configured key was rejected', () => {
    const output = formatCliError(
      'bz-show',
      new BugzillaApiError(403, 'Bugzilla API error 403: Access denied.'),
      {
        apiKeyConfigured: true,
        localConfigFile: '/work/project/.env',
        origin: 'https://bugzilla.mozilla.org',
        userConfigFile: '/home/example/.config/bzjs/config.env',
      },
    );

    expect(output).toContain('An API key was configured');
    expect(output).toContain('account may not have permission');
  });
});
