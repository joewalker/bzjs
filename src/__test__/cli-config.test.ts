import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  loadBugzillaDotEnv,
  loadDotEnv,
  parseDotEnv,
  resolveBugzillaConfiguration,
  userConfigFilePath,
} from '../cli/config.js';

let temporaryDirectory: string;

beforeEach(async () => {
  await mkdir('cache/tmp', { recursive: true });
  temporaryDirectory = await mkdtemp('cache/tmp/cli-config-');
});

afterEach(async () => {
  await rm(temporaryDirectory, { force: true, recursive: true });
});

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

  it('supports exports, escaped double quotes, and inline comments', () => {
    expect(
      parseDotEnv(`
export DOUBLE="line\\nquote\\" slash\\\\ tab\\t return\\r"
SINGLE=' spaced # value '
PLAIN=value # explanation
EMPTY=
SHORT=x
=missing-key
1INVALID=value
NO_EQUALS
`),
    ).toEqual({
      DOUBLE: 'line\nquote" slash\\ tab\t return\r',
      EMPTY: '',
      PLAIN: 'value',
      SHORT: 'x',
      SINGLE: ' spaced # value ',
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

  it('accepts the hyphenated environment key and omits empty values', () => {
    expect(
      resolveBugzillaConfiguration(
        { 'BUGZILLA-API-KEY': 'hyphen-key', BUGZILLA_ORIGIN: '' },
        { BUGZILLA_API_KEY: 'file-key', BUGZILLA_ORIGIN: '' },
      ),
    ).toEqual({ apiKey: 'hyphen-key' });
    expect(resolveBugzillaConfiguration({}, {})).toEqual({});
  });

  it('falls back through both dotenv API key spellings', () => {
    expect(
      resolveBugzillaConfiguration({}, { BUGZILLA_API_KEY: 'underscore' }),
    ).toEqual({ apiKey: 'underscore' });
    expect(
      resolveBugzillaConfiguration({}, { 'BUGZILLA-API-KEY': 'hyphen' }),
    ).toEqual({ apiKey: 'hyphen' });
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

  it('uses an absolute Windows XDG path before APPDATA', () => {
    expect(
      userConfigFilePath(
        {
          APPDATA: 'C:\\Users\\example\\AppData\\Roaming',
          XDG_CONFIG_HOME: 'D:\\Config',
        },
        'C:\\Users\\example',
        'win32',
      ),
    ).toBe('D:\\Config\\bzjs\\config.env');
  });

  it('ignores empty and relative XDG paths', () => {
    expect(
      userConfigFilePath(
        { XDG_CONFIG_HOME: 'relative' },
        '/home/example',
        'linux',
      ),
    ).toBe('/home/example/.config/bzjs/config.env');
    expect(
      userConfigFilePath(
        { APPDATA: '', XDG_CONFIG_HOME: '' },
        'C:\\Users\\example',
        'win32',
      ),
    ).toBe('C:\\Users\\example\\.config\\bzjs\\config.env');
  });
});

describe('loadDotEnv', () => {
  it('loads and parses a configuration file', async () => {
    await writeFile(join(temporaryDirectory, 'custom.env'), 'KEY=value\n');

    await expect(loadDotEnv(temporaryDirectory, 'custom.env')).resolves.toEqual(
      { KEY: 'value' },
    );
  });

  it('ignores a missing discovered file but rejects a missing explicit file', async () => {
    await expect(loadDotEnv(temporaryDirectory)).resolves.toEqual({});
    await expect(
      loadDotEnv(temporaryDirectory, 'missing.env', true),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });
});

describe('loadBugzillaDotEnv', () => {
  it('loads only an explicitly selected file', async () => {
    await writeFile(join(temporaryDirectory, 'selected.env'), 'SELECTED=yes\n');

    await expect(
      loadBugzillaDotEnv(temporaryDirectory, {}, 'selected.env'),
    ).resolves.toEqual({ SELECTED: 'yes' });
  });

  it('merges user and local files with local values taking precedence', async () => {
    const configHome = resolve(temporaryDirectory, 'config');
    const userDirectory = join(configHome, 'bzjs');
    await mkdir(userDirectory, { recursive: true });
    await writeFile(
      join(userDirectory, 'config.env'),
      'SHARED=user\nUSER_ONLY=yes\n',
    );
    await writeFile(
      join(temporaryDirectory, '.env'),
      'SHARED=local\nLOCAL_ONLY=yes\n',
    );

    await expect(
      loadBugzillaDotEnv(temporaryDirectory, {
        XDG_CONFIG_HOME: configHome,
      }),
    ).resolves.toEqual({
      LOCAL_ONLY: 'yes',
      SHARED: 'local',
      USER_ONLY: 'yes',
    });
  });
});
