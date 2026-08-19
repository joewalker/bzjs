# Coverage ignore comments

BZJS uses Vitest's v8 coverage provider through `ast-v8-to-istanbul`. It reads ignore comments from the original TypeScript source and supports the usual Istanbul markers.

Use the narrowest marker that excludes only the code that cannot be exercised. Do not use an ignore to avoid testing reachable behavior.

## If statements

Ignore only the unexecuted half when the other half is covered:

```ts
// istanbul ignore else
if (condition) {
  covered();
} else {
  unreachable();
}

// istanbul ignore if
if (unreachableCondition) {
  unreachable();
} else {
  covered();
}
```

## Switch cases

Place `ignore next` immediately before an unreachable case or default:

```ts
switch (value) {
  case 'expected':
    covered();
    break;

  // istanbul ignore next
  default:
    unreachable();
    break;
}
```

## Catch blocks and unreachable statements

Put the marker on a `catch` clause when the exception path cannot be induced:

```ts
try {
  covered();
} catch /* istanbul ignore next */ {
  unreachable();
}
```

For unreachable code after a throw, ignore the next statement. Wrap several statements in a block so a single marker has an explicit scope:

```ts
throw new Error('failure');

// istanbul ignore next
{
  unreachable();
  alsoUnreachable();
}
```

## Expressions

Place `ignore next` immediately before the unreachable ternary or nullish arm:

```ts
const label = condition ? 'expected' : /* istanbul ignore next */ 'unreachable';

const value = /* istanbul ignore next */ input ?? fallback;
```

If an expression-level marker does not map correctly, ignore the whole statement only after verifying the narrower form in the JSON coverage data:

```ts
// istanbul ignore next
const label = condition ? 'expected' : 'unreachable';
```

## Functions

Place `ignore next` immediately before a function that cannot be called:

```ts
// istanbul ignore next
function unreachable(): void {
  fail();
}
```

## Whole files and ranges

Do not ignore an entire file under `src` without explicit user approval. If the user approves it, place this marker at the top of the original source file:

```ts
/* istanbul ignore file */
```

For an exceptional multi-line range that cannot be expressed with an Istanbul marker, `ast-v8-to-istanbul` also supports `/* v8 ignore start */` and `/* v8 ignore stop */`. Prefer the narrower Istanbul markers above.
