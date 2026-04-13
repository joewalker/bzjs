# bzjs

A TypeScript client for the [Bugzilla REST API](https://wiki.mozilla.org/Bugzilla:REST_API), focused on Mozilla's bugzilla.mozilla.org.

Zero runtime dependencies. Works anywhere with a native `fetch` (Node 18+, Deno, Bun, browsers).

## Install

```sh
pnpm add github:joewalker/bzjs#COMMIT_HASH
```

## Usage

```ts
import { Bugzilla, BugStatus, MatchType } from 'bzjs';

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
});
```

### Advanced search

Use field/matchType/value tuples for advanced queries:

```ts
const { bugs } = await bz.search({
  advanced: [
    { field: 'cf_status_firefox120', matchType: MatchType.equals, value: 'affected' },
    { field: 'priority', matchType: MatchType.anyexact, value: 'P1' },
  ],
});
```

## Development

```sh
pnpm install
pnpm build       # compile TypeScript to dist/
pnpm test        # run tests
pnpm lint        # oxlint
pnpm fmt         # oxfmt
```
