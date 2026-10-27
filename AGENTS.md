# Gym Tracker PWA - Agent Guidelines

This repository is a mobile-first strength-training tracker. Offline operation
and reliable local persistence are requirements; verify them rather than assuming
they are guaranteed by a successful build.

## Reading rules

Read [core principles](.agents/rules/00-overview.md) and
[verification](.agents/rules/05-testing-quality.md) for every change. Use the
[task-to-rule map](.agents/rules/README.md) to read additional rules before editing
the corresponding area. Do not assume a tool automatically loads them.

| Rules | Scope |
| --- | --- |
| [00 - Overview](.agents/rules/00-overview.md) | Scope, offline requirements, data safety |
| [01 - Architecture](.agents/rules/01-architecture.md) | Stack, source map, view lifecycle |
| [02 - Code style](.agents/rules/02-code-style.md) | TypeScript, DOM safety, CSS tokens |
| [03 - Mobile UX](.agents/rules/03-mobile-touch-ux.md) | Touch targets, accessibility, feedback |
| [04 - Storage](.agents/rules/04-storage-data.md) | IndexedDB, recovery, migrations, backup |
| [05 - Verification](.agents/rules/05-testing-quality.md) | Build and checks appropriate to the change |
| [06 - PWA](.agents/rules/06-pwa-offline.md) | Service worker, assets, updates, hosting |
| [07 - Templates and exports](.agents/rules/07-templates-exports.md) | Generator, shipped JSON, Markdown |

## Quick rules

1. Use Vanilla TypeScript, Vite, native CSS, and IndexedDB through `idb`.
   Do not add UI frameworks or libraries without an explicit user request.
2. Do not introduce external CDNs, fonts, analytics, or cloud API dependencies.
3. Use touch targets of at least 48 x 48 CSS px and prefer steppers for workout
   weights and reps. Keep text entry available for names and notes.
4. Reuse tokens from `src/styles/variables.css`.
5. Persist active-session changes. Handle failed writes and preserve recovery
   data until completion has been durably saved.
6. Do not change training plans, template IDs, or user data as incidental cleanup.
7. Always run `npm run build` after changes and report the checks actually performed.
