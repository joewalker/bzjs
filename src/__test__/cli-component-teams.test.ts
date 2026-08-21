import { mkdir, mkdtemp, rm } from 'node:fs/promises';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  componentTeamsHelp,
  flattenComponentTeamResponses,
  parseComponentTeamsArguments,
  renderComponentTeamsMarkdown,
  runComponentTeamsCommand,
} from '../cli/component-teams.js';
import type { CliIo } from '../cli/runtime.js';
import { Bugzilla, BugzillaApiError } from '../index.js';

let temporaryDirectory: string;

beforeEach(async () => {
  await mkdir('cache/tmp', { recursive: true });
  temporaryDirectory = await mkdtemp('cache/tmp/cli-component-teams-');
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(temporaryDirectory, { force: true, recursive: true });
});

/** Create mock CLI streams for command tests. */
function mockIo(): {
  readonly io: CliIo;
  readonly stderr: ReturnType<typeof vi.fn>;
  readonly stdout: ReturnType<typeof vi.fn>;
} {
  const stdout = vi.fn();
  const stderr = vi.fn();
  return { io: { stderr, stdout }, stderr, stdout };
}

describe('parseComponentTeamsArguments', () => {
  it('uses Markdown defaults and parses shared connection options', () => {
    expect(parseComponentTeamsArguments([])).toEqual({
      format: 'markdown',
      help: false,
    });
    expect(
      parseComponentTeamsArguments([
        '--format',
        'json',
        '--origin',
        'https://bz.example.com',
        '--team',
        'lay',
        '--env-file',
        'custom.env',
        '--help',
      ]),
    ).toEqual({
      envFile: 'custom.env',
      format: 'json',
      help: true,
      origin: 'https://bz.example.com',
      teamMatcher: 'lay',
    });
  });

  it('rejects invalid formats and positional arguments', () => {
    expect(() => parseComponentTeamsArguments(['--format', 'xml'])).toThrow(
      'format must be one of: markdown, json',
    );
    expect(() => parseComponentTeamsArguments(['Layout'])).toThrow(
      'positional arguments are not supported',
    );
  });
});

describe('flattenComponentTeamResponses', () => {
  it('flattens and sorts team endpoint responses deterministically', () => {
    expect(
      flattenComponentTeamResponses([
        { Layout: { Core: ['Layout: Tables', 'Layout'] } },
        { Accessibility: { Core: ['Disability Access APIs'] } },
      ]),
    ).toEqual({
      'Core::Disability Access APIs': 'Accessibility',
      'Core::Layout': 'Layout',
      'Core::Layout: Tables': 'Layout',
    });
  });

  it('fails when one component is assigned to multiple teams', () => {
    expect(() =>
      flattenComponentTeamResponses([
        { Layout: { Core: ['Layout'] } },
        { Performance: { Core: ['Layout'] } },
      ]),
    ).toThrow(
      'Core::Layout is assigned to multiple teams: Layout, Performance',
    );
  });
});

describe('renderComponentTeamsMarkdown', () => {
  it('sorts teams, products, and components', () => {
    const markdown = renderComponentTeamsMarkdown({
      'Core::Layout: Tables': 'Layout',
      'Firefox::General': 'General',
      'Core::Layout': 'Layout',
      'Core::CSS Parsing and Computation': 'Layout',
    });

    expect(markdown).toBe(`# General

* Firefox::General

# Layout

* Core::CSS Parsing and Computation
* Core::Layout
* Core::Layout: Tables
`);
  });
});

describe('runComponentTeamsCommand', () => {
  it('prints help without loading configuration', async () => {
    const { io, stdout } = mockIo();

    await expect(runComponentTeamsCommand(['--help'], io)).resolves.toBe(0);
    expect(stdout).toHaveBeenCalledWith(componentTeamsHelp);
  });

  it('fetches matching teams and prints the exact flat JSON schema', async () => {
    vi.spyOn(Bugzilla.prototype, 'getTeams').mockResolvedValue([
      'Layout',
      'Accessibility',
      'Layout',
    ]);
    const getComponents = vi
      .spyOn(Bugzilla.prototype, 'getComponentsForTeam')
      .mockImplementation(async team => {
        return team === 'Layout'
          ? { Layout: { Core: ['Layout: Tables', 'Layout'] } }
          : { Accessibility: { Core: ['Disability Access APIs'] } };
      });
    const { io, stderr, stdout } = mockIo();

    const result = await runComponentTeamsCommand(
      [
        '--format',
        'json',
        '--origin',
        'https://bz.example.com',
        '--team',
        'lAy',
      ],
      io,
      {
        BUGZILLA_API_KEY: 'key',
        BUGZILLA_ORIGIN: 'https://bz.example.com',
        XDG_CONFIG_HOME: temporaryDirectory,
      },
      temporaryDirectory,
    );
    expect(stderr).not.toHaveBeenCalled();
    expect(result).toBe(0);
    expect(getComponents.mock.calls.map(([team]) => team)).toEqual([
      'Layout',
      'Layout',
    ]);
    expect(stdout).toHaveBeenCalledWith(`{
  "Core::Layout": "Layout",
  "Core::Layout: Tables": "Layout"
}\n`);
  });

  it('prints an empty JSON map without fetching components when no team matches', async () => {
    vi.spyOn(Bugzilla.prototype, 'getTeams').mockResolvedValue(['Layout']);
    const getComponents = vi.spyOn(Bugzilla.prototype, 'getComponentsForTeam');
    const { io, stdout } = mockIo();

    await expect(
      runComponentTeamsCommand(
        ['--format', 'json', '--team', 'Accessibility'],
        io,
        { XDG_CONFIG_HOME: temporaryDirectory },
        temporaryDirectory,
      ),
    ).resolves.toBe(0);
    expect(getComponents).not.toHaveBeenCalled();
    expect(stdout).toHaveBeenCalledWith('{}\n');
  });

  it('prints Markdown by default', async () => {
    vi.spyOn(Bugzilla.prototype, 'getTeams').mockResolvedValue(['Layout']);
    vi.spyOn(Bugzilla.prototype, 'getComponentsForTeam').mockResolvedValue({
      Layout: { Core: ['Layout'] },
    });
    const { io, stdout } = mockIo();

    await expect(
      runComponentTeamsCommand(
        [],
        io,
        { XDG_CONFIG_HOME: temporaryDirectory },
        temporaryDirectory,
      ),
    ).resolves.toBe(0);
    expect(stdout).toHaveBeenCalledWith('# Layout\n\n* Core::Layout\n');
  });

  it('reports failures from the team-list endpoint', async () => {
    vi.spyOn(Bugzilla.prototype, 'getTeams').mockRejectedValue(
      new BugzillaApiError(500, 'Team list failed'),
    );
    const { io, stderr } = mockIo();

    await expect(
      runComponentTeamsCommand(
        [],
        io,
        { XDG_CONFIG_HOME: temporaryDirectory },
        temporaryDirectory,
      ),
    ).resolves.toBe(1);
    expect(stderr).toHaveBeenCalledWith(
      'bz-component-teams: Team list failed\n',
    );
  });

  it('reports failures from a component endpoint', async () => {
    vi.spyOn(Bugzilla.prototype, 'getTeams').mockResolvedValue(['Layout']);
    vi.spyOn(Bugzilla.prototype, 'getComponentsForTeam').mockRejectedValue(
      new BugzillaApiError(503, 'Components failed'),
    );
    const { io, stderr } = mockIo();

    await expect(
      runComponentTeamsCommand(
        [],
        io,
        { XDG_CONFIG_HOME: temporaryDirectory },
        temporaryDirectory,
      ),
    ).resolves.toBe(1);
    expect(stderr).toHaveBeenCalledWith(
      'bz-component-teams: Components failed\n',
    );
  });
});
