# 05 - Verification and quality

## Required build

Run `npm run build` after changes, including agent-rule changes. It already runs
`tsc && vite build`; repeating `npx tsc --noEmit` is usually redundant. The current
package has no test or lint script; do not claim those checks passed.

Inspect warnings/failures and distinguish existing failures from new ones.
A build establishes compilation and bundling, not offline behavior, durability,
accessibility, or successful operation on a phone.

## Checks by changed area

Use a separate browser profile/origin and synthetic records for data checks.
Do not clear the user's real IndexedDB or service-worker cache.

| Changed area | Relevant checks |
| --- | --- |
| Documentation / ignore rules | Referenced files, commands, names, intended include/exclude patterns |
| Views / CSS | Affected flow at a narrow viewport, target sizes, focus, labels, modals |
| Session / timer | Rapid edits then reload, notes, added/removed sets, background/return timer, undo/discard |
| Completion / persistence | History saved before recovery cleanup, failed writes preserve recovery, no duplicates on retry |
| DB schema | Upgrade from a supported older DB with workouts, history, and active session intact |
| Backup / import | JSON round trip, malformed/nested invalid data, version and ID conflicts, no partial writes on failure |
| Templates / exports | Generator effects/IDs, existing edited routines, Markdown, download/share fallback |
| PWA / hosting | Production offline reload, assets, update with active session, headers; follow rule 06 |

Add focused automated checks for risky data or calculation changes when useful.
Do not add a test framework for documentation-only work or tests that merely
mirror implementation. Do not run a mutating generator to check documentation.

## Reporting

- Review the final diff for unrelated changes, generated artifacts, and personal data.
- State changes, checks actually performed, outcomes, and limitations.
- Distinguish source inspection, build, desktop browser, and real-device checks.
  Mark unperformed checks explicitly rather than inferring runtime success.
