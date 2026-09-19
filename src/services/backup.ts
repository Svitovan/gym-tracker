import { getDB } from '../db/index.ts';
import type { Workout, UserCustomExercise, WorkoutHistory } from '../types/workout.ts';

export interface BackupPayload {
  app: 'GymTrackerPWA';
  version: number;
  exported_at: number;
  data: {
    workouts: Workout[];
    user_custom_exercises: UserCustomExercise[];
    workout_history: WorkoutHistory[];
  };
}

export async function exportDatabaseToJSON(): Promise<{
  workoutsCount: number;
  exercisesCount: number;
  historyCount: number;
}> {
  const db = await getDB();

  const workouts = await db.getAll('workouts');
  const user_custom_exercises = await db.getAll('user_custom_exercises');
  const workout_history = await db.getAll('workout_history');

  const payload: BackupPayload = {
    app: 'GymTrackerPWA',
    version: 1,
    exported_at: Date.now(),
    data: {
      workouts,
      user_custom_exercises,
      workout_history,
    },
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gym-tracker-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return {
    workoutsCount: workouts.length,
    exercisesCount: user_custom_exercises.length,
    historyCount: workout_history.length,
  };
}

export async function importDatabaseFromJSON(file: File): Promise<{
  workoutsCount: number;
  exercisesCount: number;
  historyCount: number;
}> {
  const text = await file.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error('Файл не является корректным JSON');
  }

  if (!parsed || typeof parsed !== 'object' || (parsed as BackupPayload).app !== 'GymTrackerPWA') {
    throw new Error('Некорректный формат резервной копии Gym Tracker');
  }

  const payload = parsed as BackupPayload;
  const db = await getDB();

  let workoutsCount = 0;
  let exercisesCount = 0;
  let historyCount = 0;

  // Import Workouts
  if (Array.isArray(payload.data?.workouts)) {
    const tx = db.transaction('workouts', 'readwrite');
    for (const w of payload.data.workouts) {
      if (w.id && w.title) {
        await tx.store.put(w);
        workoutsCount++;
      }
    }
    await tx.done;
  }

  // Import Custom Exercises
  if (Array.isArray(payload.data?.user_custom_exercises)) {
    const tx = db.transaction('user_custom_exercises', 'readwrite');
    for (const ex of payload.data.user_custom_exercises) {
      if (ex.id && ex.name) {
        await tx.store.put(ex);
        exercisesCount++;
      }
    }
    await tx.done;
  }

  // Import Workout History
  if (Array.isArray(payload.data?.workout_history)) {
    const tx = db.transaction('workout_history', 'readwrite');
    for (const h of payload.data.workout_history) {
      if (h.id && h.title) {
        await tx.store.put(h);
        historyCount++;
      }
    }
    await tx.done;
  }

  return {
    workoutsCount,
    exercisesCount,
    historyCount,
  };
}

export interface StorageDiagnostics {
  isPersisted: boolean;
  usageFormatted: string;
  quotaFormatted: string;
}

export async function getStorageDiagnostics(): Promise<StorageDiagnostics> {
  let isPersisted = false;
  let usageFormatted = 'Н/Д';
  let quotaFormatted = 'Н/Д';

  if (typeof navigator !== 'undefined' && navigator.storage) {
    try {
      if (navigator.storage.persisted) {
        isPersisted = await navigator.storage.persisted();
      }
      if (navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage !== undefined) {
          usageFormatted = formatBytes(estimate.usage);
        }
        if (estimate.quota !== undefined) {
          quotaFormatted = formatBytes(estimate.quota);
        }
      }
    } catch (e) {
      console.warn('[StorageDiagnostics] Error reading storage estimate:', e);
    }
  }

  return {
    isPersisted,
    usageFormatted,
    quotaFormatted,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
