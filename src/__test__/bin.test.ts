import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const commandMocks = vi.hoisted(() => ({
  runSearchCommand: vi.fn().mockResolvedValue(10),
  runShowCommand: vi.fn().mockResolvedValue(20),
}));

vi.mock('../cli/search.js', () => ({
  runSearchCommand: commandMocks.runSearchCommand,
}));

vi.mock('../cli/show.js', () => ({
  runShowCommand: commandMocks.runShowCommand,
}));

const originalArgv = process.argv;
const originalExitCode = process.exitCode;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.exitCode = undefined;
});

afterAll(() => {
  process.argv = originalArgv;
  process.exitCode = originalExitCode;
});

describe('standalone entry points', () => {
  it('dispatches bz-search arguments', async () => {
    process.argv = ['node', 'bz-search', 'summary', '--limit', '1'];

    await import('../bin/bz-search.js');

    expect(commandMocks.runSearchCommand).toHaveBeenCalledWith([
      'summary',
      '--limit',
      '1',
    ]);
    expect(process.exitCode).toBe(10);
  });

  it('dispatches bz-show arguments', async () => {
    process.argv = ['node', 'bz-show', '123'];

    await import('../bin/bz-show.js');

    expect(commandMocks.runShowCommand).toHaveBeenCalledWith(['123']);
    expect(process.exitCode).toBe(20);
  });
});

describe('bzjs dispatcher', () => {
  it.each([[[]], [['--help']], [['-h']]])(
    'prints help for arguments %j',
    async args => {
      process.argv = ['node', 'bzjs', ...args];
      const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

      await import('../bin/bzjs.js');

      expect(stdout).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
      expect(process.exitCode).toBe(0);
    },
  );

  it('dispatches search', async () => {
    process.argv = ['node', 'bzjs', 'search', 'summary'];

    await import('../bin/bzjs.js');

    expect(commandMocks.runSearchCommand).toHaveBeenCalledWith(['summary']);
    expect(process.exitCode).toBe(10);
  });

  it('dispatches show', async () => {
    process.argv = ['node', 'bzjs', 'show', '123'];

    await import('../bin/bzjs.js');

    expect(commandMocks.runShowCommand).toHaveBeenCalledWith(['123']);
    expect(process.exitCode).toBe(20);
  });

  it('reports unknown commands', async () => {
    process.argv = ['node', 'bzjs', 'unknown'];
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    await import('../bin/bzjs.js');

    expect(stderr).toHaveBeenCalledWith(
      expect.stringContaining('bzjs: unknown command unknown'),
    );
    expect(process.exitCode).toBe(1);
  });
});
