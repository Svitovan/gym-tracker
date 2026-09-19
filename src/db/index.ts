import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  Workout,
  ActiveSession,
  UserCustomExercise,
  WorkoutHistory,
  PreviousPerformance,
} from '../types/workout.ts';
import { generateUUID } from '../utils/uuid.ts';
import defaultWorkoutsData from '../data/default_workouts.json';

interface GymTrackerDB extends DBSchema {
  workouts: {
    key: string;
    value: Workout;
    indexes: { 'by-updated': number };
  };
  active_session: {
    key: string;
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

const DB_NAME = 'gym_tracker_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<GymTrackerDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<GymTrackerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GymTrackerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 1. Workouts
        if (!db.objectStoreNames.contains('workouts')) {
          const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
          workoutStore.createIndex('by-updated', 'updated_at');
        }

        // 2. Active Session
        if (!db.objectStoreNames.contains('active_session')) {
          db.createObjectStore('active_session', { keyPath: 'id' });
        }

        // 3. User Custom Exercises
        if (!db.objectStoreNames.contains('user_custom_exercises')) {
          const exerciseStore = db.createObjectStore('user_custom_exercises', { keyPath: 'id' });
          exerciseStore.createIndex('by-name', 'name');
          exerciseStore.createIndex('by-last-used', 'last_used_at');
        }

        // 4. Workout History
        if (!db.objectStoreNames.contains('workout_history')) {
          const historyStore = db.createObjectStore('workout_history', { keyPath: 'id' });
          historyStore.createIndex('by-workout-id', 'workout_id');
          historyStore.createIndex('by-started', 'started_at');
        }
      },
    });

    // Request persistent storage if supported
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persistent) => {
        console.log(`[Storage] Persistent storage granted: ${persistent}`);
      }).catch((err) => {
        console.warn('[Storage] Could not request persistence:', err);
      });
    }
  }

  return dbPromise;
}

/* ==================== WORKOUTS CRUD ==================== */

export async function getAllWorkouts(): Promise<Workout[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('workouts', 'by-updated');
  return all.reverse(); // Newest first
}

export async function getWorkoutById(id: string): Promise<Workout | undefined> {
  const db = await getDB();
  return db.get('workouts', id);
}

export async function saveWorkout(workout: Workout): Promise<void> {
  const db = await getDB();
  workout.updated_at = Date.now();
  await db.put('workouts', workout);
}

export async function deleteWorkout(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('workouts', id);
}

/* ==================== USER CUSTOM EXERCISES ==================== */

export async function getAllCustomExercises(): Promise<UserCustomExercise[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('user_custom_exercises', 'by-last-used');
  return all.reverse();
}

export async function searchCustomExercises(query: string): Promise<UserCustomExercise[]> {
  const all = await getAllCustomExercises();
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return all.slice(0, 8);
  return all
    .filter((ex) => ex.name.toLowerCase().includes(trimmed))
    .slice(0, 8);
}

export async function recordCustomExercise(name: string, default_rest_sec = 90): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;

  const db = await getDB();
  const all = await db.getAll('user_custom_exercises');
  const existing = all.find((ex) => ex.name.toLowerCase() === trimmed.toLowerCase());

  if (existing) {
    existing.last_used_at = Date.now();
    if (default_rest_sec) existing.default_rest_sec = default_rest_sec;
    await db.put('user_custom_exercises', existing);
  } else {
    const newEx: UserCustomExercise = {
      id: generateUUID(),
      name: trimmed,
      last_used_at: Date.now(),
      default_rest_sec: default_rest_sec || 90,
    };
    await db.put('user_custom_exercises', newEx);
  }
}

/* ==================== ACTIVE SESSION ==================== */

export async function getActiveSession(): Promise<ActiveSession | undefined> {
  const db = await getDB();
  return db.get('active_session', 'active');
}

export async function saveActiveSession(session: ActiveSession): Promise<void> {
  const db = await getDB();
  await db.put('active_session', session);
}

export async function clearActiveSession(): Promise<void> {
  const db = await getDB();
  await db.delete('active_session', 'active');
}

/* ==================== WORKOUT HISTORY ==================== */

export async function getWorkoutHistory(): Promise<WorkoutHistory[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('workout_history', 'by-started');
  return all.reverse();
}

export async function saveWorkoutHistory(history: WorkoutHistory): Promise<void> {
  const db = await getDB();
  await db.put('workout_history', history);
}

export async function deleteWorkoutHistory(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('workout_history', id);
}

export interface HistoryStats {
  totalWorkouts: number;
  totalVolumeKg: number;
  totalReps: number;
  avgDurationMin: number;
}

export async function getHistoryStats(): Promise<HistoryStats> {
  const history = await getWorkoutHistory();
  if (history.length === 0) {
    return {
      totalWorkouts: 0,
      totalVolumeKg: 0,
      totalReps: 0,
      avgDurationMin: 0,
    };
  }

  let totalVolume = 0;
  let totalReps = 0;
  let totalDurationMs = 0;

  for (const session of history) {
    totalVolume += session.total_volume_kg || 0;
    totalReps += session.total_reps || 0;
    totalDurationMs += Math.max(0, session.finished_at - session.started_at);
  }

  const avgDurationMin = Math.round(totalDurationMs / history.length / 60000);

  return {
    totalWorkouts: history.length,
    totalVolumeKg: Math.round(totalVolume),
    totalReps,
    avgDurationMin: Math.max(1, avgDurationMin),
  };
}

export async function getLastPerformanceForExercise(
  exerciseName: string
): Promise<PreviousPerformance | null> {
  const trimmed = exerciseName.trim().toLowerCase();
  if (!trimmed) return null;

  const history = await getWorkoutHistory();
  for (const session of history) {
    const match = session.snapshot.find((ex) => ex.name.toLowerCase() === trimmed);
    if (match && match.sets.length > 0) {
      const completedSets = match.sets.filter((s) => s.is_completed || s.actual_reps > 0);
      if (completedSets.length === 0) continue;

      const setSummaries = completedSets.map(
        (s) => `${s.actual_weight || s.target_weight}кг × ${s.actual_reps || s.target_reps}`
      );

      const dateStr = new Date(session.finished_at).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      });

      return {
        date: dateStr,
        summary: setSummaries.join(', '),
      };
    }
  }

  return null;
}

export interface DefaultWorkoutTemplate {
  title: string;
  notes?: string;
  exercises: {
    name: string;
    default_rest_sec?: number;
    notes?: string;
    sets: {
      type?: 'normal' | 'warmup' | 'dropset' | 'failure';
      target_weight?: number;
      target_reps?: number;
      custom_rest_sec?: number | null;
    }[];
  }[];
}

/**
 * Loads or resets workouts from default_workouts.json.
 * If a workout with the same title exists and overwrite is true, its exercises and notes are updated.
 * If it doesn't exist, it is created.
 */
export async function resetToDefaultWorkouts(
  options: { overwrite?: boolean } = { overwrite: true }
): Promise<number> {
  const templates = defaultWorkoutsData as DefaultWorkoutTemplate[];
  const existingWorkouts = await getAllWorkouts();
  const now = Date.now();
  let count = 0;

  for (const template of templates) {
    const existing = existingWorkouts.find(
      (w) => w.title.trim().toLowerCase() === template.title.trim().toLowerCase()
    );

    if (existing && !options.overwrite) {
      continue;
    }

    const workoutId = existing ? existing.id : generateUUID();
    const workout: Workout = {
      id: workoutId,
      title: template.title,
      notes: template.notes || '',
      created_at: existing ? existing.created_at : now,
      updated_at: now,
      exercises: template.exercises.map((ex, exIdx) => ({
        id: generateUUID(),
        name: ex.name,
        order_index: exIdx,
        default_rest_sec: ex.default_rest_sec ?? 90,
        notes: ex.notes || '',
        previous_performance: null,
        sets: (ex.sets || []).map((s, sIdx) => ({
          id: generateUUID(),
          set_number: sIdx + 1,
          type: (s.type as any) || 'normal',
          target_weight: s.target_weight ?? 0,
          actual_weight: s.target_weight ?? 0,
          target_reps: s.target_reps ?? 10,
          actual_reps: s.target_reps ?? 10,
          is_completed: false,
          custom_rest_sec: s.custom_rest_sec ?? null,
        })),
      })),
    };

    // Register each exercise in user_custom_exercises for search/autocomplete
    for (const ex of template.exercises) {
      await recordCustomExercise(ex.name, ex.default_rest_sec ?? 90);
    }

    await saveWorkout(workout);
    count++;
  }

  return count;
}

export async function syncDefaultWorkoutsIfMissing(): Promise<number> {
  const templates = defaultWorkoutsData as DefaultWorkoutTemplate[];
  const existingWorkouts = await getAllWorkouts();
  const now = Date.now();
  let addedCount = 0;

  for (const template of templates) {
    const exists = existingWorkouts.some(
      (w) => w.title.trim().toLowerCase() === template.title.trim().toLowerCase()
    );

    if (!exists) {
      const workout: Workout = {
        id: generateUUID(),
        title: template.title,
        notes: template.notes || '',
        created_at: now,
        updated_at: now,
        exercises: template.exercises.map((ex, exIdx) => ({
          id: generateUUID(),
          name: ex.name,
          order_index: exIdx,
          default_rest_sec: ex.default_rest_sec ?? 90,
          notes: ex.notes || '',
          previous_performance: null,
          sets: (ex.sets || []).map((s, sIdx) => ({
            id: generateUUID(),
            set_number: sIdx + 1,
            type: (s.type as any) || 'normal',
            target_weight: s.target_weight ?? 0,
            actual_weight: s.target_weight ?? 0,
            target_reps: s.target_reps ?? 10,
            actual_reps: s.target_reps ?? 10,
            is_completed: false,
            custom_rest_sec: s.custom_rest_sec ?? null,
          })),
        })),
      };

      for (const ex of template.exercises) {
        await recordCustomExercise(ex.name, ex.default_rest_sec ?? 90);
      }

      await saveWorkout(workout);
      addedCount++;
    }
  }

  return addedCount;
}

export async function seedInitialDataIfEmpty(): Promise<void> {
  const workouts = await getAllWorkouts();
  if (workouts.length === 0) {
    await resetToDefaultWorkouts({ overwrite: false });
  } else {
    // Automatically add any newly introduced templates that user doesn't have yet!
    await syncDefaultWorkoutsIfMissing();
  }
}
