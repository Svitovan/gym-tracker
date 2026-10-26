# 04 - Storage & Data Persistence (IndexedDB)

## 1. Database Architecture (`src/db/index.ts`)

The database is built on **IndexedDB** using the `idb` library.
- **Database Name**: `gym_tracker_db`
- **Current Version**: `1`

### Object Stores & Indexes

```ts
interface GymTrackerDB extends DBSchema {
  workouts: {
    key: string;
    value: Workout;
    indexes: { 'by-updated': number };
  };
  active_session: {
    key: string;               // Static key: 'active'
    value: ActiveSession;
  };
  user_custom_exercises: {
    key: string;
    value: UserCustomExercise;
    indexes: {
      'by-name': string;
      'by-last-used': number;
    };
  };
  workout_history: {
    key: string;
    value: WorkoutHistory;
    indexes: {
      'by-workout-id': string;
      'by-started': number;
    };
  };
}
```

## 2. Schema Evolution & Migration Rules

1. **Version Bumping**: When adding a new object store or modifying indexes, increment `DB_VERSION` in `src/db/index.ts`.
2. **Safe Upgrade Blocks**:
   ```ts
   upgrade(db, oldVersion, newVersion, transaction) {
     if (oldVersion < 1) {
       // Initial schema
     }
     if (oldVersion < 2) {
       // Step-by-step non-destructive migrations
     }
   }
   ```
3. **Never Clear Stores During Upgrades**: Never use `db.deleteObjectStore()` in production migrations unless explicitly converting data into a new format within the same transaction.

## 3. Active Session Recovery Contract

- **Frequent Synchronization**: Any mutation to the active workout session (set completion, weight/rep adjustment, note edit, rest timer update) must immediately persist to `active_session` store using `saveActiveSession(session)`.
- **Completion & Discard Cleanup**: When a workout is finished (`finishSession()`) or discarded, `clearActiveSession()` must be called to ensure subsequent app boots return to the main workout list.
- **Ghost Data (Previous Performance)**: When loading exercises for a workout or session, enrich them with `getPreviousPerformance(exerciseName)` from `workout_history` so users can see previous weights and reps.

## 4. Export & Import Integrity

- **JSON Format**: Data exports produce a structured JSON object containing:
  - App metadata and timestamp
  - `workouts` array
  - `history` array
  - `custom_exercises` array
- **Import Validation**: When importing (`src/services/backup.ts`), strictly validate JSON schema structure before writing to IndexedDB to avoid corrupting user databases.
