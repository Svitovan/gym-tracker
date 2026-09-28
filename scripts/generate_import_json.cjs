const fs = require('fs');
const crypto = require('crypto');

function uuid() {
  return crypto.randomUUID();
}

const workouts = [
  {
    title: '💥 День 1 — Верх A (Силовой уклон)',
    notes: 'Цель: Максимальное механическое напряжение, сила и база. Время: ~65 мин. Ноги свежие к завтра.',
    exercises: [
      {
        name: 'Жим штанги лёжа',
        default_rest_sec: 180,
        notes: 'RIR 2 (5–8 повт). Лопатки сведены, стабильный упор ногами',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 }
        ]
      },
      {
        name: 'Подтягивания с весом / без',
        default_rest_sec: 150,
        notes: 'RIR 1–2 (6–8 повт). Полная амплитуда с паузой внизу',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 }
        ]
      },
      {
        name: 'Жим гантелей на наклонной скамье (30°)',
        default_rest_sec: 120,
        notes: 'RIR 1–2 (8–10 повт). Акцент на верхний пучок грудных',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Тяга гантели/штанги с опорой грудью',
        default_rest_sec: 120,
        notes: 'RIR 1–2 (8–10 повт). Исключает нагрузку на поясницу',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Разведения гантелей в стороны',
        default_rest_sec: 60,
        notes: 'Суперсет 1. RIR 1–0 (12–15 повт). Плавно, без рывков корпусом',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 }
        ]
      },
      {
        name: 'Сгибание рук с гантелями стоя (бицепс)',
        default_rest_sec: 75,
        notes: 'Суперсет 1. RIR 1 (8–12 повт). Супинация кисти в верхней точке',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Разведения на заднюю дельту (наклон/блок)',
        default_rest_sec: 60,
        notes: 'Суперсет 2. RIR 1–0 (12–15 повт). Движение строго через локти',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 }
        ]
      },
      {
        name: 'Разгибание рук на блоке (трицепс)',
        default_rest_sec: 75,
        notes: 'Суперсет 2. RIR 1–0 (10–12 повт). Локти прижаты к корпусу',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 }
        ]
      }
    ]
  },
  {
    title: '🦵 День 2 — Ноги (Оптимизированный порядок + Заминка)',
    notes: 'Цель: Квадрицепсы, бицепсы бедра, ягодицы с защитой поясницы. Время: ~60 мин + 8–10 мин заминка на велотренажере (Zone 1–2, пульс 100–120 уд/мин).',
    exercises: [
      {
        name: 'Присед со штангой на спине',
        default_rest_sec: 180,
        notes: 'RIR 2 (5–8 повт). Контролируемый спуск, без отбива',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 },
          { type: 'normal', target_weight: 0, target_reps: 8 }
        ]
      },
      {
        name: 'Сгибание ног в тренажёре лёжа/сидя',
        default_rest_sec: 90,
        notes: 'RIR 1 (10–12 повт). Разгрузка спины, памп задней поверхности',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 }
        ]
      },
      {
        name: 'Румынская тяга с гантелями / штангой',
        default_rest_sec: 150,
        notes: 'RIR 1–2 (8–10 повт). Отвод таза назад, нейтральная спина',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Болгарский сплит-присед',
        default_rest_sec: 90,
        notes: 'RIR 1 (8–12 повт на ногу). Можно держаться за стойку для баланса',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Разгибание ног в тренажёре',
        default_rest_sec: 75,
        notes: 'RIR 0–1 (12–15 повт). Пауза 1 сек в верхней точке',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 }
        ]
      },
      {
        name: 'Подъём на носки стоя (икры)',
        default_rest_sec: 45,
        notes: 'Суперсет. RIR 0–1 (10–15 повт). 2 сек пауза в растяжке внизу',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 }
        ]
      },
      {
        name: 'Пресс (скручивания на блоке или подъем ног)',
        default_rest_sec: 60,
        notes: 'Суперсет. RIR 1 (10–15 повт). Подконтрольное сокращение',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 }
        ]
      }
    ]
  },
  {
    title: '⚡ День 3 — Верх B + 🔥 HIIT Финишер #1',
    notes: 'Цель: Изоляция, метаболический стресс, проработка в удлинённых позициях. Время: ~60 мин + 8 мин финишер (AirBike 15/45 или Табата Concept2).',
    exercises: [
      {
        name: 'Жим гантелей на горизонтальной скамье',
        default_rest_sec: 120,
        notes: 'RIR 1–2 (8–12 повт). Глубокое растяжение грудных внизу',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Тяга верхнего блока к груди',
        default_rest_sec: 120,
        notes: 'RIR 1 (8–12 повт). Средний/нейтральный хват',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Жим гантелей сидя / Жим в хаммере',
        default_rest_sec: 120,
        notes: 'RIR 1–2 (8–12 повт). Наклон спинки 75–80° для здоровья плеч',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Горизонтальная тяга блока к поясу',
        default_rest_sec: 90,
        notes: 'RIR 1 (8–12 повт). Сведение лопаток с фиксацией на 1 сек',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Разведения в стороны (гантели или кроссовер)',
        default_rest_sec: 60,
        notes: 'Суперсет 1. RIR 0–1 (12–20 повт). Акцент на среднюю дельту',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 }
        ]
      },
      {
        name: 'Сгибание рук на наклонной скамье (бицепс)',
        default_rest_sec: 75,
        notes: 'Суперсет 1. RIR 1 (10–12 повт). Мощная растяжка длинной головки',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 }
        ]
      },
      {
        name: 'Обратная бабочка (Rear Pec-Deck)',
        default_rest_sec: 60,
        notes: 'Суперсет 2. RIR 0–1 (12–20 повт). Задняя дельта',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 }
        ]
      },
      {
        name: 'Французский жим с гантелью / блоком из-за головы',
        default_rest_sec: 75,
        notes: 'Суперсет 2. RIR 1 (10–12 повт). Растяжка длинной головки трицепса',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 }
        ]
      }
    ]
  },
  {
    title: '🔄 День 4 — Full Body + 🔥 HIIT Финишер #2',
    notes: 'Цель: Поддерживающий стимул для ног, закрепление объёма верха. Время: ~55 мин + 10 мин финишер (EMOM 10 мин / Сани + Канаты / No-Equipment).',
    exercises: [
      {
        name: 'Фронтальный присед / Гакк / Жим ногами',
        default_rest_sec: 120,
        notes: 'RIR 2 (8–10 повт). Чистая работа квадрицепса',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Жим в тренажере сидя (Chest Press)',
        default_rest_sec: 90,
        notes: 'RIR 1 (8–12 повт). Безопасная работа без стабилизаторов',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Подтягивания нейтральным хватом / Верхний блок',
        default_rest_sec: 90,
        notes: 'RIR 1 (8–12 повт). Фокус на широчайшие',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Ягодичный мост со штангой / тренажер',
        default_rest_sec: 90,
        notes: 'RIR 1 (8–12 повт). Пиковое сокращение вверху 1–2 сек',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 },
          { type: 'normal', target_weight: 0, target_reps: 10 }
        ]
      },
      {
        name: 'Тяга горизонтального блока одной рукой',
        default_rest_sec: 75,
        notes: 'RIR 1 (10–12 повт). Глубокая амплитуда широчайшей',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 }
        ]
      },
      {
        name: 'Разведения в стороны на блоке / гантели',
        default_rest_sec: 45,
        notes: 'Суперсет. RIR 0–1 (15–20 повт). Пампинг дельт',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 },
          { type: 'normal', target_weight: 0, target_reps: 15 }
        ]
      },
      {
        name: 'Сгибания на бицепс молотковым хватом',
        default_rest_sec: 50,
        notes: 'Суперсет. RIR 1 (10–12 повт). Брахиалис и предплечья',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 }
        ]
      },
      {
        name: 'Разгибания на трицепс с канатной рукоятью',
        default_rest_sec: 60,
        notes: 'Суперсет. RIR 0–1 (10–15 повт). Финальный памп рук',
        sets: [
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 },
          { type: 'normal', target_weight: 0, target_reps: 12 }
        ]
      }
    ]
  }
];

// Write default_workouts.json
fs.writeFileSync('src/data/default_workouts.json', JSON.stringify(workouts, null, 2), 'utf8');

// Write GymTrackerPWA Backup JSON for direct file import in mobile app
const now = Date.now();
const fullWorkouts = workouts.map((w) => ({
  id: uuid(),
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

fs.writeFileSync('gym-tracker-import-4days.json', JSON.stringify(backupPayload, null, 2), 'utf8');
console.log('Successfully generated default_workouts.json and gym-tracker-import-4days.json!');
