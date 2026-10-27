# 07 - Templates, generated JSON, and Markdown exports

## Separate formats

| File / service | Role |
| --- | --- |
| `src/data/default_workouts.json` | Template array imported into the app bundle |
| `gym-tracker-import-4days.json` | Shipped example in JSON backup format |
| `public/gym-tracker-import.json` | Downloadable example in JSON backup format |
| `src/services/backup.ts` | User database backup/import contract; see rule 04 |
| `src/services/markdownExport.ts` | Readable export, not a restorable JSON backup |

Keep shipped examples available for targeted inspection. They are not private
user backups; do not hide them with broad JSON ignore patterns.

## Generator contract

- `scripts/generate_import_json.cjs` embeds workout definitions. Running
  `node scripts/generate_import_json.cjs` from the repository root overwrites all
  three JSON files above. It is not a read-only validation command.
- Before running it, compare its definitions with JSON and requested training
  changes. Editing only generated JSON can be undone by a later run.
- Preserve fixed workout IDs unless a requested migration requires changes.
  Exercise/set IDs are generated during a run: do not promise byte-identical
  output or preservation of every nested ID on rerun.
- Review all three output diffs. Check payload shape, workout IDs, exercises,
  set types, weights/reps, rest periods, and notes.
- Do not change exercise selection, volume, RIR guidance, or rest periods as
  side effects of application maintenance.

## Stored templates and synchronization

- Inspect `seedInitialDataIfEmpty()`, `syncDefaultWorkoutsIfMissing()`,
  `resetToDefaultWorkouts()`, and `removeObsoleteDefaultWorkouts()` together.
- Bundled templates and user-edited workouts are different data. Check modified
  existing routines and empty databases; preserve user edits and history.
- Current synchronization/cleanup relies on titles. Fixed generator IDs do not
  make every runtime seed/reset operation idempotent. Do not expand automatic
  title-based deletion/replacement; changes need a deliberate migration plan.

## Markdown and sharing

- Preserve planned template versus recorded history values. Handle zero values,
  Unicode titles, notes, and safe filenames.
- Escape user text for its Markdown/YAML context: quotes, newlines, and table
  separators need appropriate handling; HTML escaping alone is insufficient.
- Preserve download fallback when Web Share is unavailable or fails. Treat user
  cancellation as cancellation, not a failed workout save.
- Release temporary object URLs. Exports must not mutate templates or history.
- Check representative output and fallback behavior for export changes.
