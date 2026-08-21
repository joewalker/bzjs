# @joewalker/bzjs

A TypeScript client for the [Bugzilla REST API](https://wiki.mozilla.org/Bugzilla:REST_API), focused on Mozilla's bugzilla.mozilla.org.

Zero runtime dependencies. Works anywhere with a native `fetch` (Node 18+, Deno, Bun, browsers).

## Install

```sh
pnpm add @joewalker/bzjs
```

## Usage

```ts
import { Bugzilla, BugStatus, MatchType } from '@joewalker/bzjs';

const bz = new Bugzilla(); // defaults to bugzilla.mozilla.org
// or: new Bugzilla({ origin: 'https://bz.example.com', apiKey: '...' })

// Fetch a single bug
const bug = await bz.getBug(1234567);

// Search for bugs
const { bugs, checkUrl } = await bz.search({
  product: 'Core',
  bugStatus: [BugStatus.new, BugStatus.assigned],
  keywords: ['sec-high'],
});

// Count matching bugs (without fetching full records)
const { bugCount } = await bz.count({
  product: 'Firefox',
  bugSeverity: ['S1', 'S2'],
});

// Get comments and attachments
const comments = await bz.comments(1234567);
const attachments = await bz.attachments(1234567);

// Component teams
const teams = await bz.getTeams();
const components = await bz.getComponentsForTeam('Layout');
```

### checkUrl

Both `search()` and `count()` return a `checkUrl` property -- the equivalent `buglist.cgi` URL you can open in a browser to see the same results.

### Field selection

Limit which fields are returned to reduce payload size:

```ts
const { bugs } = await bz.search({
  product: 'Core',
  bugFields: ['bug_status', 'assigned_to', 'summary'],
  limit: 25,
  offset: 0,
});
```

Use `excludeFields` to omit fields that are expensive or unnecessary. For example, Bugzilla normally returns base64 attachment bodies with attachment metadata:

```ts
const attachments = await bz.attachments(1234567, {
  excludeFields: ['data'],
});
```

### Advanced search

Use field/matchType/value tuples for advanced queries:

```ts
const { bugs } = await bz.search({
  advanced: [
    {
      field: 'cf_status_firefox120',
      matchType: MatchType.equals,
      value: 'affected',
    },
    { field: 'priority', matchType: MatchType.anyexact, value: 'P1' },
  ],
});
```

### Errors

Non-successful HTTP responses reject with `BugzillaApiError`. Its `status` property contains the HTTP status code, allowing callers to distinguish authentication and authorization failures from other API errors.

## Command-line tools

The package installs `bz-help`, `bz-search`, and `bz-show`. It also installs a `bzjs` dispatcher so the commands are convenient to run directly from npm. The CLI requires Node 18.3 or newer.

```sh
# Run without a permanent installation
npx @joewalker/bzjs search "scroll anchoring" --product Core --limit 10
npx @joewalker/bzjs show 1234567
npx @joewalker/bzjs show 'https://bugzilla.mozilla.org/show_bug.cgi?id=1234567'

# Select a standalone executable explicitly
npx --package=@joewalker/bzjs bz-search --product Core
npm exec --package=@joewalker/bzjs -- bz-show 1234567

# Or install both commands globally
npm install -g @joewalker/bzjs
bz-search --product Core
bz-show 1234567
bz-show https://bugzil.la/1234567
```

From a development checkout, run `pnpm build` followed by `npm link` to expose the three commands.

### Authentication

Public bugs do not require authentication. To read bugs available to your Bugzilla account, first create an API key in Bugzilla:

<https://bugzilla.mozilla.org/userprefs.cgi?tab=apikey>

For a globally installed CLI, the recommended location is the per-user configuration file:

```text
$XDG_CONFIG_HOME/bzjs/config.env
```

When `XDG_CONFIG_HOME` is unset, this is `~/.config/bzjs/config.env`. On Windows, `%APPDATA%\bzjs\config.env` is used. Create the directory with user-only permissions and put the key in `config.env`:

```dotenv
BUGZILLA_API_KEY=your-api-key
```

On Unix-like systems, restrict access to the directory and file:

```sh
chmod 700 ~/.config/bzjs
chmod 600 ~/.config/bzjs/config.env
```

For project-specific configuration, place the same setting in `.env` in the current working directory. This means the directory from which `bz-search` or `bz-show` is invoked, not the installed package directory.

Prefer the conventional underscore spelling, `BUGZILLA_API_KEY`. The spelling `BUGZILLA-API-KEY` is also accepted in the process environment and `.env` files for compatibility. For a shell environment variable, use the underscore spelling:

```sh
export BUGZILLA_API_KEY=your-api-key
```

Configuration precedence is:

1. `BUGZILLA_API_KEY` and `BUGZILLA_ORIGIN` in the process environment.
2. An explicit `--env-file`, when supplied.
3. `.env` in the current working directory.
4. The per-user configuration file.

An explicit `--env-file` replaces both automatically discovered files. API keys are sent only in the `X-BUGZILLA-API-KEY` request header and are never included in command output or query URLs.

Use `BUGZILLA_ORIGIN` for another Bugzilla installation when authenticating. API keys are scoped to that configured origin by the `Bugzilla` client. `--origin` can select another instance for unauthenticated requests, but it never authorizes an instance to receive a key. This is to avoid LLMs accidentally disclosing API keys.

### bz-help

`bz-help` prints the complete option reference for both `bz-show` and `bz-search`, with the shared credentials section shown once. It is equivalent to `bzjs help` and is intended as an easy way to give an LLM an overview of the command-line package.

### bz-search

`bz-search` returns Markdown by default and limits output to 25 bugs. A positional phrase searches bug summaries.

```sh
bz-search "anchor positioning" \
  --product Core \
  --component Layout \
  --status NEW \
  --status ASSIGNED \
  --severity S1 \
  --limit 20
```

Common options include repeatable `--component`, `--id`, `--status`, `--severity`, and `--keyword` filters; `--assigned-to`; `--limit`; `--offset`; and `--verbosity compact|normal|full`. Use `--format json` for structured output or `--check-url-only` to print the equivalent Bugzilla browser URL.

Advanced conditions use `--where FIELD:OP:VALUE`, where the field can be a friendly `BugField` key or a Bugzilla field name:

```sh
bz-search --where priority:anyexact:P1
```

### bz-show

`bz-show BUG_ID_OR_URL` writes an LLM-oriented Markdown document to stdout. Redirect it normally or use `--output`:

```sh
bz-show 1234567 > bug-1234567.md
bz-show 1234567 --output bug-1234567.md
bz-show 'https://bugzilla.mozilla.org/show_bug.cgi?id=1234567'
bz-show 'https://bugzil.la/1234567'
```

When the target is a URL, `bz-show` infers both the bug ID and the Bugzilla base URL. This also supports Bugzilla installations under a path, such as `https://bugs.example.com/bugzilla/show_bug.cgi?id=123`. Bugzilla.mozilla.org is trusted by default. Other URL-derived origins must match the configured `BUGZILLA_ORIGIN`; `--origin` selects a destination but does not authorize it to receive an API key. Direct library callers explicitly bind an API key to the `origin` passed to the `Bugzilla` constructor.

Comments use a fail-closed trust policy because public Bugzilla comments may contain prompt injection:

- `--comments auto`, the default, includes comments only when the bug has a non-empty `groups` array.
- `--comments none` never includes comment bodies.

The normal CLI build does not provide an option to include public or unclassified comment bodies.

Comment 0, the initial description, follows the same policy. Missing group information is treated as untrusted. Free-form metadata such as summaries is always identified as potentially user-supplied.

The default `--references known` mode extracts canonical Phabricator revisions and links to recognized development sites from redacted comments without including the surrounding prose or fetching the targets. Use `--references none` to disable extraction or `--references all` to retain all HTTP references.

Use `--verbosity compact|normal|full`, `--max-comments`, and `--max-comment-chars` to bound the document. Run either command with `--help` for its complete option list, or run `bzjs help` for both command references in one LLM-friendly document.

## Development

```sh
pnpm install
pnpm build       # compile TypeScript to dist/
pnpm test        # run tests
pnpm lint        # oxlint
pnpm format      # oxfmt
```
