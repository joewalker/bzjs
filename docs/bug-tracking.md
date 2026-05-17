# Bug Tracking

We track bugs as issues in this [project's GitHub repository](https://github.com/joewalker/bzjs/issues).

## Severity levels

We classify bugs on a four-point severity scale, S1 through S4. Severity describes the impact of the bug on consumers of the library.

### S1: Silent wrong result or broad data corruption risk

A consumer using the library according to its documented contract receives a result that is wrong, with no error or warning to indicate the problem. This is the most dangerous category because callers cannot detect the failure and may propagate the bad data further. Security issues that allow malformed input to influence results in unintended ways also belong here.

### S2: Public API bug, crash, or misleading behavior likely to affect callers

The bug is loud rather than silent. A documented call throws unexpectedly, returns a structurally invalid value, or behaves in a way that contradicts what the documentation or method name promises. Severe performance problems also live here when they make a documented use case impractical in normal workloads, since unusable is functionally close to broken. The defining property of S2 is that a reasonable caller writing reasonable code will hit the problem and notice.

### S3: Edge case, confusing API, maintainability issue, or moderate performance problem

Issues in this band do not block correct use of the library but make it harder than it should be. Bugs that only trigger in narrow edge cases also belong in S3 unless the wrong result is silent, in which case they escalate to S1.

### S4: Cleanup or nit with low behavioral risk

Stylistic, cosmetic, or housekeeping items where the existing code works correctly and the proposed change is about clarity, consistency, or use of modern idioms. A deprecated method call that still works, an unused regex capture group, a comparator that could be expressed more concisely, a theoretical performance issue.

## Working with issues

When filing an issue, lead with the observed behavior, the expected behavior, and a minimal reproduction. Add the severity in a label (`S1`, `S2`, `S3`, or `S4`) so the backlog can be sorted by impact.
