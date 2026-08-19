/**
 * Escape a value that will be displayed as one line of Markdown.
 */
export function escapeMarkdownInline(value: unknown): string {
  return String(value)
    .replace(/[\r\n]+/gu, ' ')
    .replace(/([\\`*_[\]<>#|])/gu, '\\$1');
}

/**
 * Wrap arbitrary text in a fence that the text itself cannot terminate.
 */
export function fencedText(value: string): string {
  let longestRun = 0;
  for (const match of value.matchAll(/`+/gu)) {
    longestRun = Math.max(longestRun, match[0].length);
  }

  const fence = '`'.repeat(Math.max(3, longestRun + 1));
  const sanitized = [...value]
    .filter(character => {
      const codePoint = character.codePointAt(0) ?? 0;
      return (
        codePoint >= 32 ||
        character === '\n' ||
        character === '\r' ||
        character === '\t'
      );
    })
    .join('');
  return `${fence}text\n${sanitized}\n${fence}`;
}
