# Project agent rules

These documents are referenced by root `AGENTS.md`. Read relevant files explicitly;
automatic loading and `.agentignore` support depend on the tool. Numbered names
organize documents; they do not guarantee load order.

## Task-to-rule map

Always read `00-overview.md` and `05-testing-quality.md`. Add the files below for
the affected area; a task can require more than one row.

| Task | Additional rules |
| --- | --- |
| Navigation, lifecycle, architecture, dependencies | `01-architecture.md`, `02-code-style.md` |
| DOM, TypeScript, styles | `02-code-style.md` |
| Mobile controls, accessibility, feedback, device APIs | `01-architecture.md`, `02-code-style.md`, `03-mobile-touch-ux.md` |
| Session, timers, completion | `01-architecture.md`, `02-code-style.md`, `03-mobile-touch-ux.md`, `04-storage-data.md` |
| IndexedDB, migration, JSON backup/import | `02-code-style.md`, `04-storage-data.md` |
| Worker, manifest, assets, hosting, offline updates | `01-architecture.md`, `06-pwa-offline.md` |
| Default workouts, generator, JSON examples, Markdown | `02-code-style.md`, `04-storage-data.md`, `07-templates-exports.md` |

## Maintaining rules

- Keep instructions concise, actionable, and specific to this checkout.
- Reference source definitions rather than copying large interfaces or code.
- Separate current behavior, desired invariants, and known limitations.
- Update rules with relevant behavior changes; recheck names and paths.
- Avoid duplicate requirements, tool-specific limits, and loading promises.
- `.agentignore` reduces context for supporting tools. It does not replace
  `.gitignore`, access permissions, or handling of personal data.
