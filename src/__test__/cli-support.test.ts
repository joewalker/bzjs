import { afterEach, describe, expect, it, vi } from 'vitest';

import { escapeMarkdownInline, fencedText } from '../cli/markdown.js';
import { errorMessage, processIo } from '../cli/runtime.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Markdown helpers', () => {
  it('escapes inline Markdown and folds line breaks', () => {
    expect(escapeMarkdownInline('a\\`*_[]<>#|\r\nb')).toBe(
      'a\\\\\\`\\*\\_\\[\\]\\<\\>\\#\\| b',
    );
    expect(escapeMarkdownInline(42)).toBe('42');
  });

  it('chooses a safe fence and removes unsafe control characters', () => {
    expect(fencedText('before ``` after\n\tkeep\u0000drop')).toBe(
      '````text\nbefore ``` after\n\tkeepdrop\n````',
    );
    expect(fencedText('plain')).toBe('```text\nplain\n```');
  });
});

describe('runtime helpers', () => {
  it('writes through process-backed standard streams', () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    processIo.stdout('output');
    processIo.stderr('error');

    expect(stdout).toHaveBeenCalledWith('output');
    expect(stderr).toHaveBeenCalledWith('error');
  });

  it('extracts Error messages and stringifies other values', () => {
    expect(errorMessage(new Error('failure'))).toBe('failure');
    expect(errorMessage(123)).toBe('123');
  });
});
