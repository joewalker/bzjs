import { BugzillaApiError } from '../bugzilla.js';
import { errorMessage } from './runtime.js';

export interface CliErrorContext {
  readonly apiKeyConfigured: boolean;
  readonly localConfigFile: string;
  readonly origin: string;
  readonly userConfigFile: string;
}

/** Format a CLI error, adding actionable authentication help when relevant. */
export function formatCliError(
  command: string,
  error: unknown,
  context?: CliErrorContext,
): string {
  const firstLine = `${command}: ${errorMessage(error)}`;
  if (
    context == null ||
    !(error instanceof BugzillaApiError) ||
    (error.status !== 401 && error.status !== 403)
  ) {
    return `${firstLine}\n`;
  }

  const keyStatus = context.apiKeyConfigured
    ? 'An API key was configured, but Bugzilla rejected the request. The key may be invalid, or the account may not have permission to view this bug.'
    : 'No Bugzilla API key was found.';
  const apiKeyUrl = `${context.origin.replace(/\/+$/u, '')}/userprefs.cgi?tab=apikey`;

  return `${firstLine}

${keyStatus}

Create or manage Bugzilla API keys here:
${apiKeyUrl}

Then set BUGZILLA_API_KEY in one of these locations:
- Process environment
- User configuration: ${context.userConfigFile}

File contents:
BUGZILLA_API_KEY=your-api-key
`;
}
