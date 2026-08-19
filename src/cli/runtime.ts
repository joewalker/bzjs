export interface CliIo {
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
}

/**
 * The process-backed IO implementation used by executable entry points.
 */
export const processIo: CliIo = {
  stdout(text: string): void {
    process.stdout.write(text);
  },
  stderr(text: string): void {
    process.stderr.write(text);
  },
};

/**
 * Convert an unknown thrown value into a concise CLI error message.
 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
