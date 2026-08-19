import { describe, expect, it } from 'vitest';

import {
  parseDotEnv,
  resolveBugzillaConfiguration,
  userConfigFilePath,
} from '../cli/config.js';

describe('parseDotEnv', () => {
  it('parses both supported API key spellings without expansion', () => {
    expect(
      parseDotEnv(`
# A comment
BUGZILLA-API-KEY="hyphen-key"
BUGZILLA_ORIGIN=https://bz.example.com
LITERAL='$NOT_EXPANDED'
`),
    ).toEqual({
      'BUGZILLA-API-KEY': 'hyphen-key',
      BUGZILLA_ORIGIN: 'https://bz.example.com',
      LITERAL: '$NOT_EXPANDED',
    });
  });
});

describe('resolveBugzillaConfiguration', () => {
  it('prefers process environment values to dotenv values', () => {
    const result = resolveBugzillaConfiguration(
      { BUGZILLA_API_KEY: 'environment-key' },
      {
        'BUGZILLA-API-KEY': 'dotenv-key',
        BUGZILLA_ORIGIN: 'https://bz.example.com',
      },
    );

    expect(result).toEqual({
      apiKey: 'environment-key',
      origin: 'https://bz.example.com',
    });
  });
});

describe('userConfigFilePath', () => {
  it('uses XDG_CONFIG_HOME when it is absolute', () => {
    expect(
      userConfigFilePath(
        { XDG_CONFIG_HOME: '/custom/config' },
        '/home/example',
        'linux',
      ),
    ).toBe('/custom/config/bzjs/config.env');
  });

  it('falls back to the standard .config directory', () => {
    expect(userConfigFilePath({}, '/home/example', 'linux')).toBe(
      '/home/example/.config/bzjs/config.env',
    );
  });

  it('uses APPDATA on Windows', () => {
    expect(
      userConfigFilePath(
        { APPDATA: 'C:\\Users\\example\\AppData\\Roaming' },
        'C:\\Users\\example',
        'win32',
      ),
    ).toBe('C:\\Users\\example\\AppData\\Roaming\\bzjs\\config.env');
  });
});
