import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { isAbsolute, join, resolve, win32 } from 'node:path';

import type { BugzillaConstructorOptions } from '../bugzilla-types.js';

type Environment = Readonly<Record<string, string | undefined>>;

export const credentialsHelp = `\
Access to public bugs does not require an API key. \
Access to restricted bugs does. \
Credentials are read from the process environment, \
./.env file in the current directory, \
or the per-user configuration at $XDG_CONFIG_HOME/bzjs/config.env \
(normally ~/.config/bzjs/config.env).

To access all bugs visible to your account, \
sign in and create or manage an API key here:
  https://bugzilla.mozilla.org/userprefs.cgi?tab=apikey

Install the key by adding this line to the per-user configuration file:
  BUGZILLA_API_KEY=your-api-key
`;

/** Return the per-user configuration path for the current platform. */
export function userConfigFilePath(
  environment: Environment,
  homeDirectory = homedir(),
  platform: NodeJS.Platform = process.platform,
): string {
  const pathFunctions = platform === 'win32' ? win32 : { isAbsolute, join };
  const xdgConfigHome = environment['XDG_CONFIG_HOME'];
  if (
    xdgConfigHome != null &&
    xdgConfigHome.length > 0 &&
    pathFunctions.isAbsolute(xdgConfigHome)
  ) {
    return pathFunctions.join(xdgConfigHome, 'bzjs', 'config.env');
  }

  const appData = environment['APPDATA'];
  if (platform === 'win32' && appData != null && appData.length > 0) {
    return win32.join(appData, 'bzjs', 'config.env');
  }

  return pathFunctions.join(homeDirectory, '.config', 'bzjs', 'config.env');
}

/**
 * Parse the small, non-executing subset of dotenv syntax used by the CLI.
 */
export function parseDotEnv(source: string): Readonly<Record<string, string>> {
  const output: Record<string, string> = {};

  for (const originalLine of source.split(/\r?\n/u)) {
    let line = originalLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }

    if (line.startsWith('export ')) {
      line = line.slice('export '.length).trimStart();
    }

    const equals = line.indexOf('=');
    if (equals <= 0) {
      continue;
    }

    const key = line.slice(0, equals).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_-]*$/u.test(key)) {
      continue;
    }

    output[key] = parseDotEnvValue(line.slice(equals + 1));
  }

  return output;
}

/**
 * Parse a dotenv value without shell expansion or code execution.
 */
function parseDotEnvValue(source: string): string {
  const value = source.trim();
  if (value.length < 2) {
    return value;
  }

  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.at(-1) === quote) {
    const unquoted = value.slice(1, -1);
    if (quote === "'") {
      return unquoted;
    }

    return unquoted.replace(/\\([\\"nrt])/gu, (_match, escaped: string) => {
      const replacements: Readonly<Record<string, string>> = {
        '"': '"',
        '\\': '\\',
        n: '\n',
        r: '\r',
        t: '\t',
      };
      return replacements[escaped as keyof typeof replacements];
    });
  }

  return value.replace(/\s+#.*$/u, '').trimEnd();
}

/**
 * Resolve connection settings, preferring the process environment over the
 * dotenv file. Both API key spellings are accepted for compatibility.
 */
export function resolveBugzillaConfiguration(
  environment: Environment,
  dotEnv: Environment = {},
): BugzillaConstructorOptions {
  const apiKey =
    environment['BUGZILLA_API_KEY'] ??
    environment['BUGZILLA-API-KEY'] ??
    dotEnv['BUGZILLA_API_KEY'] ??
    dotEnv['BUGZILLA-API-KEY'];
  const origin = environment['BUGZILLA_ORIGIN'] ?? dotEnv['BUGZILLA_ORIGIN'];

  return {
    ...(apiKey == null || apiKey.length === 0 ? {} : { apiKey }),
    ...(origin == null || origin.length === 0 ? {} : { origin }),
  };
}

/**
 * Load a dotenv file, ignoring a missing default file.
 */
export async function loadDotEnv(
  workingDirectory: string,
  fileName = '.env',
  explicit = false,
): Promise<Readonly<Record<string, string>>> {
  const path = resolve(workingDirectory, fileName);
  try {
    return parseDotEnv(await readFile(path, 'utf8'));
  } catch (error) {
    if (
      !explicit &&
      error instanceof Error &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return {};
    }
    throw error;
  }
}

/**
 * Load CLI configuration. An explicit file replaces automatic discovery;
 * otherwise a working-directory file overrides the per-user file.
 */
export async function loadBugzillaDotEnv(
  workingDirectory: string,
  environment: Environment,
  explicitFile?: string,
): Promise<Readonly<Record<string, string>>> {
  if (explicitFile != null) {
    return loadDotEnv(workingDirectory, explicitFile, true);
  }

  const userFile = userConfigFilePath(environment);
  const [userConfiguration, localConfiguration] = await Promise.all([
    loadDotEnv(workingDirectory, userFile),
    loadDotEnv(workingDirectory),
  ]);
  return { ...userConfiguration, ...localConfiguration };
}
