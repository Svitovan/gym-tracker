# 01 - Architecture

## Stack and source map

The current package uses Vite 6, TypeScript 5 in strict mode, and `idb` 8.
Inspect `package.json`, `package-lock.json`, and `tsconfig.json` for dependency
or build changes; do not duplicate exact resolved versions here.

| Path | Responsibility |
| --- | --- |
| `src/main.ts` | Bootstrap, navigation, service-worker registration |
| `src/components/` | DOM view classes, header, settings modal, toasts |
| `src/types/workout.ts` | Workouts, exercises, sets, active session, history |
| `src/db/index.ts` | IndexedDB schema, CRUD, seed and template synchronization |
| `src/services/backup.ts` | JSON backup/import and storage diagnostics |
| `src/services/markdownExport.ts` | Template/history Markdown and sharing |
| `src/services/sound.ts`, `src/services/feedback.ts`, `src/services/wakeLock.ts` | Optional device APIs |
| `src/styles/` | Tokens in `variables.css`, global and view-specific styles |
| `src/utils/uuid.ts` | UUID support |
| `src/data/default_workouts.json` | Templates bundled with the app |
| `public/` | Worker, manifest, icon, downloadable import JSON |
| `scripts/generate_import_json.cjs` | Generator with embedded workout definitions |
| `docs/` | Requirements and proposals; verify implementation status |
| `netlify.toml` | Build, SPA fallback, cache headers |

## Views and lifecycle

- `App.navigate()` switches `LIST`, `HISTORY`, `EDITOR`, and `SESSION` views.
  Keep this routing model unless the task requires changing it.
- `App.init()` initializes storage and templates, then checks `getActiveSession()`
  to resume an existing session.
- Lists/history use `render()`, the editor uses `init()`, and the session uses
  `start(workoutId?)`. Inspect actual signatures before calling them.
- `WorkoutSessionView.dispose()` releases session resources; navigation calls it
  when leaving a session. Preserve this integration.
- Clean up owned timers and global listeners when views are replaced. Prevent
  asynchronous work from updating a disposed view.
- Keep class-based views and functional helpers where they already exist.
  Do not rename lifecycle methods or add a base class merely for uniformity.
