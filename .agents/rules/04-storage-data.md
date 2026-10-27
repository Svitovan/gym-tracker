# 04 - Storage, recovery, and JSON backup

## Current contract

Inspect `src/db/index.ts` and `src/types/workout.ts` before storage changes.
The database is currently `gym_tracker_db`, version 1, using `idb`.
All stores use an `id` key path:

| Store | Indexes / key details |
| --- | --- |
| `workouts` | `by-updated` on `updated_at` |
| `active_session` | Single record with `id: 'active'` |
| `user_custom_exercises` | `by-name`, `by-last-used` |
| `workout_history` | `by-workout-id`, `by-started` |

Read previous performance with `getLastPerformanceForExercise(name)`.
Keep history snapshots independent from later template edits.

JSON backup version 1 in `src/services/backup.ts` has this shape:

```text
{ app: 'GymTrackerPWA', version: 1, exported_at: number,
  data: { workouts: Workout[], user_custom_exercises: UserCustomExercise[],
          workout_history: WorkoutHistory[] } }
```

`active_session` is excluded from export/import. This backup does not recover an
active session. Raw template arrays are a different format and are not currently
accepted by the backup importer.

## Required behavior for changes

- Persist every active-session mutation: weights, reps, completion, notes,
  exercise/set edits, active position, and timers. Prevent stale writes from
  overwriting newer state during rapid interactions.
- Handle failed writes visibly without discarding the in-memory workout or its
  last saved recovery record. Report save success only after writes commit.
- Save history before clearing the active session. For completion changes, make
  related history/template/session writes atomic where needed so failure or retry
  cannot lose a session or create duplicate history.
- Clearing a session on discard requires the existing deliberate user action.
- Bump `DB_VERSION` for store/index changes. Implement incremental, non-destructive
  upgrades from supported older versions; preserve IDs and history. Delete stores
  only when converting their data within the same upgrade transaction.
- For import changes, validate the full payload before writing: app/version,
  nested records, IDs, set types, finite numbers, and allowed ranges. Commit
  related stores in one transaction and report success after `tx.done`.
- Preserve valid backup compatibility and define merge/conflict behavior.
  Do not silently turn merging into replacement or reset unrelated data.
- Handle quota, transaction, and database-open errors. Persistent-storage
  permission does not guarantee browser data can never be removed.
- Do not introduce deletion or overwriting of user routines based only on titles.
  Review seeding and template synchronization with rule 07.

## Known limitations, not guarantees

- The current importer checks only part of the payload and uses separate
  transactions per store. Full validation and atomic import remain requirements.
- Completion currently updates templates, writes history, and clears the session
  through separate operations. Many session saves are not awaited by callers.
- Current obsolete-template cleanup identifies routines by title. Do not expand
  that behavior; address its data-safety risks in a scoped task.
