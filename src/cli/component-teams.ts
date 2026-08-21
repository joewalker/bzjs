import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import type { ComponentTeamReply } from '../bugzilla-types.js';
import { Bugzilla, withBugzillaOrigin } from '../bugzilla.js';
import {
  credentialsHelp,
  loadBugzillaDotEnv,
  resolveBugzillaConfiguration,
  userConfigFilePath,
} from './config.js';
import { formatCliError, type CliErrorContext } from './errors.js';
import { escapeMarkdownInline } from './markdown.js';
import { processIo, type CliIo } from './runtime.js';
import type { OutputFormat } from './search.js';

export type ComponentTeamMap = Readonly<Record<string, string>>;

export interface ParsedComponentTeamsArguments {
  readonly envFile?: string;
  readonly format: OutputFormat;
  readonly help: boolean;
  readonly origin?: string;
  readonly teamMatcher?: string;
}

const componentTeamsOptions = {
  'env-file': { type: 'string' },
  format: { type: 'string' },
  help: { type: 'boolean', short: 'h' },
  origin: { type: 'string' },
  team: { type: 'string' },
} as const;

/**
 * Compare strings by code unit so output does not depend on the host locale.
 */
function compareStrings(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  return left > right ? 1 : 0;
}

/**
 * Parse bz-component-teams command-line arguments.
 */
export function parseComponentTeamsArguments(
  args: ReadonlyArray<string>,
): ParsedComponentTeamsArguments {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: [...args],
    options: componentTeamsOptions,
    strict: true,
  });
  if (positionals.length > 0) {
    throw new Error('positional arguments are not supported');
  }

  const format = values.format ?? 'markdown';
  if (format !== 'markdown' && format !== 'json') {
    throw new Error('format must be one of: markdown, json');
  }

  return {
    ...(values['env-file'] == null ? {} : { envFile: values['env-file'] }),
    format,
    help: values.help ?? false,
    ...(values.origin == null ? {} : { origin: values.origin }),
    ...(values.team == null ? {} : { teamMatcher: values.team }),
  };
}

/**
 * Flatten Bugzilla team responses into a stable Product::Component map.
 */
export function flattenComponentTeamResponses(
  responses: ReadonlyArray<ComponentTeamReply>,
): ComponentTeamMap {
  const assignments = new Map<string, string>();

  for (const response of responses) {
    for (const [team, products] of Object.entries(response)) {
      for (const [product, components] of Object.entries(products)) {
        for (const component of components) {
          const key = `${product}::${component}`;
          const existingTeam = assignments.get(key);
          if (existingTeam != null && existingTeam !== team) {
            const teams = [existingTeam, team].sort(compareStrings);
            throw new Error(
              `${key} is assigned to multiple teams: ${teams.join(', ')}`,
            );
          }
          assignments.set(key, team);
        }
      }
    }
  }

  return Object.fromEntries(
    [...assignments.entries()].sort(([left], [right]) => {
      return compareStrings(left, right);
    }),
  );
}

/**
 * Render a component-team map as team headings with flat mapping keys.
 */
export function renderComponentTeamsMarkdown(map: ComponentTeamMap): string {
  const teams = new Map<string, Array<string>>();
  for (const [key, team] of Object.entries(map)) {
    const keys = teams.get(team) ?? [];
    keys.push(key);
    teams.set(team, keys);
  }

  const lines: Array<string> = [];
  for (const team of [...teams.keys()].sort(compareStrings)) {
    if (lines.length > 0) {
      lines.push('');
    }
    lines.push(`# ${escapeMarkdownInline(team)}`, '');
    const keys = teams.get(team) as Array<string>;
    for (const key of keys.sort(compareStrings)) {
      lines.push(`* ${escapeMarkdownInline(key)}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export const componentTeamsCommandHelp = `Usage:
  bz-component-teams [options]
  bzjs component-teams [options]

Options:
  --format FORMAT            markdown or json; defaults to markdown
  --team MATCHER             Include teams containing MATCHER, case-insensitive
  --origin URL               Bugzilla origin
  --env-file PATH            Override discovered configuration files
  -h, --help                 Show this help

JSON output is a sorted object mapping "Product::Component" keys to team names.
`;

export const componentTeamsHelp = `${componentTeamsCommandHelp}\n${credentialsHelp}`;

/**
 * Run bz-component-teams and return a process exit code.
 */
export async function runComponentTeamsCommand(
  args: ReadonlyArray<string>,
  io: CliIo = processIo,
  environment: NodeJS.ProcessEnv = process.env,
  workingDirectory = process.cwd(),
): Promise<number> {
  let errorContext: CliErrorContext | undefined;
  try {
    const parsed = parseComponentTeamsArguments(args);
    if (parsed.help) {
      io.stdout(componentTeamsHelp);
      return 0;
    }

    const dotEnv = await loadBugzillaDotEnv(
      workingDirectory,
      environment,
      parsed.envFile,
    );
    const environmentOptions = resolveBugzillaConfiguration(
      environment,
      dotEnv,
    );
    const connectionOptions =
      parsed.origin == null
        ? environmentOptions
        : withBugzillaOrigin(environmentOptions, parsed.origin);
    const bugzilla = new Bugzilla(connectionOptions);
    errorContext = {
      apiKeyConfigured: connectionOptions.apiKey != null,
      localConfigFile: resolve(workingDirectory, parsed.envFile ?? '.env'),
      origin: bugzilla.origin,
      userConfigFile: userConfigFilePath(environment),
    };

    const teamMatcher = parsed.teamMatcher?.toLowerCase();
    const teams = [...(await bugzilla.getTeams())]
      .sort(compareStrings)
      .filter(team => {
        return teamMatcher == null || team.toLowerCase().includes(teamMatcher);
      });
    const responses = await Promise.all(
      teams.map(async team => bugzilla.getComponentsForTeam(team)),
    );
    const map = flattenComponentTeamResponses(responses);
    if (parsed.format === 'json') {
      io.stdout(`${JSON.stringify(map, null, 2)}\n`);
    } else {
      io.stdout(renderComponentTeamsMarkdown(map));
    }
    return 0;
  } catch (error) {
    io.stderr(formatCliError('bz-component-teams', error, errorContext));
    return 1;
  }
}
