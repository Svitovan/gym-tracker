const fs = require('fs');
const crypto = require('crypto');

function uuid() {
  return crypto.randomUUID();
}

// Workout IDs kept stable for idempotent updates in IndexedDB
const WORKOUT_IDS = {
  day1: '16f6fc4a-3c03-4484-a5cf-4ef3e4fa6d0b',
  day2: '69e799c2-32da-4eb8-b0bd-17d7af22a0b1',
  day3: '927056b3-1ccb-4bfd-833a-f0869886efeb',
  day4: '54e93c42-9857-49f2-a633-07b57a4c13f2',
};

const workouts = [
  {
    id: WORKOUT_IDS.day1,
    title: '💥 Day 1 — Upper A (Strength Focus)',
    notes: '16 working sets (~55–60 min incl. warmup). Target RIR 2 on compound lifts, RIR 1–2 on isolation. Chest-supported row unloads lower back before leg day. Pairs 6A/6B can be alternated (60–90s rest between movements).',
    exercises: [
      {
        name: 'Barbell Bench Press',
        default_rest_sec: 150,
        notes: '3 × 5–8 reps, RIR 2. Rest 2–3 min. Retract scapulae, maintain solid leg drive. Select weight based on actual reps in reserve',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 }
        ]
      },
      {
        name: 'Pull-ups (Bodyweight / Weighted)',
        default_rest_sec: 150,
        notes: '3 × 6–8 reps, RIR 2. Rest 2–3 min. Full range of motion with dead hang pause. Log bodyweight and added weight separately',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 }
        ]
      },
      {
        name: 'Chest-Supported Row',
        default_rest_sec: 105,
        notes: '2 × 8–12 reps, RIR 1–2. Rest 90–120s. Machine or incline bench; minimizes lower-back fatigue before legs',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Incline Dumbbell Press (30°)',
        default_rest_sec: 105,
        notes: '2 × 8–12 reps, RIR 2. Rest 90–120s. Bench angle ~30°, focus on clavicular head of pecs',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Lateral Raises',
        default_rest_sec: 75,
        notes: '2 × 12–20 reps, RIR 1–2. Rest 60–90s. Controlled tempo without torso swing (7.5 kg benchmark)',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 }
        ]
      },
      {
        name: 'Standing Dumbbell Curls (Biceps)',
        default_rest_sec: 75,
        notes: 'Superset pair 6A/6B. 2 × 8–12 reps, RIR 1–2. Rest 60–90s before triceps. Control supination at the top',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Cable Triceps Pushdowns',
        default_rest_sec: 75,
        notes: 'Superset pair 6A/6B. 2 × 10–15 reps, RIR 1–2. Rest 60–90s before biceps. Keep elbows tucked to sides',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 }
        ]
      }
    ]
  },
  {
    id: WORKOUT_IDS.day2,
    title: '🦵 Day 2 — Legs (Strength Focus)',
    notes: '15 working sets (~55–60 min incl. warmup). Bulgarian split squats: both legs completed = 1 logged set. Alternate pairs 5A/5B: 2 superset rounds + 1 extra calf set. Optional 3–5 min light cooldown walk/spin.',
    exercises: [
      {
        name: 'Barbell Back Squat',
        default_rest_sec: 165,
        notes: '3 × 5–8 reps, RIR 2. Rest 2.5–3 min. Solid foot tripod, depth to parallel or below, braced core',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 }
        ]
      },
      {
        name: 'Romanian Deadlift (Barbell / Dumbbell)',
        default_rest_sec: 150,
        notes: '3 × 6–10 reps, RIR 2. Rest 2–3 min. Hips back, neutral spine, deep hamstring stretch',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 }
        ]
      },
      {
        name: 'Bulgarian Split Squat',
        default_rest_sec: 105,
        notes: '2 × 8–12 reps per leg, RIR 2. Rest 90–120s after both legs. Hold rack/wall for balance if needed',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Leg Curls (Seated / Lying)',
        default_rest_sec: 90,
        notes: '2 × 10–15 reps, RIR 1–2. Rest 90s. Hamstring isolation after Romanian deadlifts',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 }
        ]
      },
      {
        name: 'Standing Calf Raises',
        default_rest_sec: 60,
        notes: 'Superset pair 5A/5B (2 rounds + 1 extra calf set). 3 × 10–20 reps, RIR 1–2. Full stretch at bottom, squeeze at top',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 }
        ]
      },
      {
        name: 'Cable Crunches (Abs)',
        default_rest_sec: 60,
        notes: 'Superset pair 5A/5B (2 rounds). 2 × 10–15 reps, RIR 1–2. Flex spine down towards hips, do not hinge at hip joints',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 }
        ]
      }
    ]
  },
  {
    id: WORKOUT_IDS.day3,
    title: '⚡ Day 3 — Upper B (Hypertrophy Focus)',
    notes: '16 working sets (~50–60 min incl. warmup). No HIIT finishers (running is already in weekly schedule). Alternate pairs 6A/6B. RIR 2 on compounds, RIR 1–2 on isolation.',
    exercises: [
      {
        name: 'Flat Dumbbell Bench Press',
        default_rest_sec: 120,
        notes: '3 × 8–12 reps, RIR 2. Rest 2 min. Controlled descent, deep stretch at bottom, smooth press',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Lat Pulldown to Chest',
        default_rest_sec: 120,
        notes: '3 × 8–12 reps, RIR 1–2. Rest 2 min. Pull elbows down and slightly back, drive chest up to bar',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Overhead Press (Dumbbell / Machine)',
        default_rest_sec: 120,
        notes: '2 × 6–10 reps, RIR 2. Rest 2 min. Comfortable high-incline bench angle (75–85°), avoid excessive lower-back arch',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 }
        ]
      },
      {
        name: 'Lateral Raises',
        default_rest_sec: 75,
        notes: '2 × 12–20 reps, RIR 1–2. Rest 60–90s. Lead with elbows, controlled tempo, strict form (7.5 kg benchmark)',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 }
        ]
      },
      {
        name: 'Rear Delt Flyes / Reverse Pec Deck',
        default_rest_sec: 75,
        notes: '2 × 12–20 reps, RIR 1–2. Rest 60–90s. Machine or cable flyes leading with elbows back, avoid trapezius shrugging',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 }
        ]
      },
      {
        name: 'Incline Dumbbell Curls',
        default_rest_sec: 75,
        notes: 'Superset pair 6A/6B. 2 × 10–15 reps, RIR 1–2. Rest 60–90s before triceps. Bench at ~60°, deep stretch (10 kg benchmark)',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 }
        ]
      },
      {
        name: 'Overhead Cable Triceps Extensions',
        default_rest_sec: 75,
        notes: 'Superset pair 6A/6B. 2 × 10–15 reps, RIR 1–2. Rest 60–90s before biceps. Rope attachment, long head emphasis',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 }
        ]
      }
    ]
  },
  {
    id: WORKOUT_IDS.day4,
    title: '🔄 Day 4 — Full Body (Second Leg Stimulus)',
    notes: '14 working sets (~45–55 min incl. warmup). Second stimulus for quads, hamstrings, chest, back, calves, and abs. No finisher. Alternate pairs 5A/5B.',
    exercises: [
      {
        name: 'Hack Squat / Leg Press',
        default_rest_sec: 120,
        notes: '3 × 8–12 reps, RIR 2. Rest 2 min. Controlled descent, knees track over toes, keep hips anchored',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Leg Curls (Seated / Lying)',
        default_rest_sec: 90,
        notes: '3 × 10–15 reps, RIR 1–2. Rest 90s. Targeted second weekly stimulus for hamstrings',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 }
        ]
      },
      {
        name: 'Machine Chest Press',
        default_rest_sec: 105,
        notes: '2 × 8–12 reps, RIR 1–2. Rest 90–120s. Stable pectoral focus with minimal stabilizer fatigue',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Seated Cable Row',
        default_rest_sec: 105,
        notes: '2 × 8–12 reps, RIR 1–2. Rest 90–120s. Pull to lower abdomen, squeeze shoulder blades for 1s pause',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Calf Raises (Seated / Standing)',
        default_rest_sec: 60,
        notes: 'Superset pair 5A/5B (2 rounds). 2 × 12–20 reps, RIR 1–2. Completes 5 weekly calf sets. Full range of motion',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 }
        ]
      },
      {
        name: 'Cable Crunches (Abs)',
        default_rest_sec: 60,
        notes: 'Superset pair 5A/5B (2 rounds). 2 × 10–15 reps, RIR 1–2. Completes 4 weekly ab sets. Peak contraction on exhale',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 }
        ]
      }
    ]
  }
];

// Write default_workouts.json (used by Vite bundle and "Reload templates from default_workouts.json")
const templateWorkouts = workouts.map(w => ({
  title: w.title,
  notes: w.notes,
  exercises: w.exercises.map(ex => ({
    name: ex.name,
    default_rest_sec: ex.default_rest_sec,
    notes: ex.notes,
    sets: ex.sets.map(s => ({
      type: s.type,
      target_weight: s.target_weight,
      target_reps: s.target_reps
    }))
  }))
}));

fs.writeFileSync('src/data/default_workouts.json', JSON.stringify(templateWorkouts, null, 2), 'utf8');

// Build full Workout objects for backup/import payload
const now = 1790600000000;
const fullWorkouts = workouts.map((w) => ({
  id: w.id,
  title: w.title,
  notes: w.notes,
  created_at: now,
  updated_at: now,
  exercises: w.exercises.map((ex, exIdx) => ({
    id: uuid(),
    name: ex.name,
    order_index: exIdx,
    default_rest_sec: ex.default_rest_sec,
    notes: ex.notes,
    previous_performance: null,
    sets: ex.sets.map((s, sIdx) => ({
      id: uuid(),
      set_number: sIdx + 1,
      type: s.type || 'normal',
      target_weight: s.target_weight || 0,
      actual_weight: s.target_weight || 0,
      target_reps: s.target_reps || 10,
      actual_reps: s.target_reps || 10,
      is_completed: false,
      custom_rest_sec: null
    }))
  }))
}));

// Build custom exercises list for autocomplete
const customExercises = [];
const seenExercises = new Set();
for (const w of workouts) {
  for (const ex of w.exercises) {
    if (!seenExercises.has(ex.name)) {
      seenExercises.add(ex.name);
      customExercises.push({
        id: uuid(),
        name: ex.name,
        last_used_at: now,
        default_rest_sec: ex.default_rest_sec
      });
    }
  }
}

const backupPayload = {
  app: 'GymTrackerPWA',
  version: 1,
  exported_at: now,
  data: {
    workouts: fullWorkouts,
    user_custom_exercises: customExercises,
    workout_history: []
  }
};

const jsonStr = JSON.stringify(backupPayload, null, 2);

fs.writeFileSync('gym-tracker-import-4days.json', jsonStr, 'utf8');
fs.writeFileSync('public/gym-tracker-import.json', jsonStr, 'utf8');

console.log('Successfully generated English workout templates:');
console.log(' - src/data/default_workouts.json');
console.log(' - gym-tracker-import-4days.json');
console.log(' - public/gym-tracker-import.json');
