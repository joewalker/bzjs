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

  it('formats ordinary errors and thrown primitive values without auth help', () => {
    expect(formatCliError('bz-show', new Error('broken'))).toBe(
      'bz-show: broken\n',
    );
    expect(formatCliError('bz-search', 'broken')).toBe('bz-search: broken\n');
  });

  it('does not add auth help for other Bugzilla statuses', () => {
    const output = formatCliError(
      'bz-show',
      new BugzillaApiError(404, 'Not found'),
      {
        apiKeyConfigured: false,
        localConfigFile: '/work/project/.env',
        origin: 'https://bugzilla.mozilla.org/',
        userConfigFile: '/home/example/.config/bzjs/config.env',
      },
    );

    expect(output).toBe('bz-show: Not found\n');
  });
});
