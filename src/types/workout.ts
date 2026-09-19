export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

export interface WorkoutSet {
  id: string;
  set_number: number;
  type: SetType;
  target_weight: number;
  actual_weight: number;
  target_reps: number;
  actual_reps: number;
  is_completed: boolean;
  custom_rest_sec: number | null;
}

export interface PreviousPerformance {
  date: string;
  summary: string;
  best_set?: { weight: number; reps: number };
}

export interface Exercise {
  id: string;
  name: string;
  order_index: number;
  default_rest_sec: number;
  notes: string;
  previous_performance: PreviousPerformance | null;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  title: string;
  notes: string;
  created_at: number;
  updated_at: number;
  exercises: Exercise[];
}

export interface UserCustomExercise {
  id: string;
  name: string;
  last_used_at: number;
  default_rest_sec: number;
}

export interface ActiveSession {
  id: 'active';
  workout_id: string | null;
  title: string;
  started_at: number;
  exercises: Exercise[];
  active_exercise_index: number;
  active_set_index: number;
  timer: {
    end_timestamp: number;
    duration_sec: number;
    is_running: boolean;
  } | null;
}

export interface WorkoutHistory {
  id: string;
  workout_id: string | null;
  title: string;
  started_at: number;
  finished_at: number;
  total_volume_kg: number;
  total_reps: number;
  snapshot: Exercise[];
}
