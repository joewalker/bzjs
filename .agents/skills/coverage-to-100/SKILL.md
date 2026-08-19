---
name: coverage-to-100
description: Use in this repository when coverage thresholds are failing, or when the user asks to "get coverage to 100", "cover the rest", or "add ignore comments for X". Guides targeted tests or `/* istanbul ignore ... */` comments for Vitest's v8 coverage provider via `ast-v8-to-istanbul`.
---

# Coverage to 100%

Raise statement, branch, function, and line coverage to 100%. Prefer tests. Use `/* istanbul ignore ... */` comments only for code that cannot usefully be exercised, such as an unreachable defensive branch or a platform-specific fallback.

## Tests-vs-ignore heuristic

Indications that test coverage is required:

- Region is on the production happy path (not an error/cleanup branch)
- Function is exported or part of a public API
- The uncovered region is > 5 lines
- It is clear that the region can be easily triggered from a test

Indications that an 'ignore' is acceptable:

- The uncovered region is < 3 lines
- It is an error or edge case, such as a defensive `catch` or `default`
- The region is on a platform-specific fallback
- The region is development-only code
- The region is otherwise unreachable

Before ignoring any branch, actively try to construct an input that reaches it. Many apparently defensive branches are reachable with adversarial input, such as an empty string, missing key, or malformed response. Use an ignore only after confirming that a meaningful test cannot reach the branch.

## Test Configuration

- This project uses vitest, configured using `vitest.config.ts` in the root directory.
- The output coverage files are saved to `cache/coverage/coverage-final.json` and `cache/coverage/coverage-summary.json`.
- Run the whole suite with coverage using `pnpm test --coverage --coverage.include='src/**/*.ts'`. The explicit include reveals executable source files that no test imports.

## Verifying 100%

Before declaring coverage complete, confirm `cache/coverage/coverage-summary.json` reports 100 for statements, branches, functions, and lines for the target executable files and totals. A file whose statement, branch, function, and line totals are all zero has no executable code and is not applicable, even though the JSON reporter displays its percentage as zero.

Then check `cache/coverage/coverage-final.json`. For each relevant executable source file, every value in `s` and `f` must be greater than zero, and every number in every `b` branch-count array must be greater than zero. Any zero means there is still an uncovered statement, function, or branch path.

## Workflow

1. Run a full build (`pnpm build`) before the first measurement, then run the whole suite with the coverage command above.
2. Read each uncovered region in context and apply the heuristic above.
3. Write a test that follows the existing test style, or add the narrowest justified ignore comment. When adding an ignore, read [references/ignore-comments.md](references/ignore-comments.md) for the syntax supported by this repository's coverage provider.
4. After each source edit, run `pnpm format`, `pnpm tsc`, and the whole coverage suite again. Iterate until the JSON reports confirm 100%. Ask the user about ambiguous cases instead of guessing.

## Notes

- Run the whole suite, not just a target file. Tests elsewhere in the repository may exercise the same source.
- Do not add imports solely to make a file appear in coverage. Use `coverage.include` so unimported executable files are reported honestly.
- Do not write tests for type-only files. Treat an all-zero coverage-map total as no executable code.
- Do not ignore an entire file under `src` without explicit user approval.

## Sources

- ast-v8-to-istanbul: https://github.com/AriPerkkio/ast-v8-to-istanbul#ignoring-code
- Vitest coverage: https://vitest.dev/guide/coverage.html#including-and-excluding-files-from-coverage-report
