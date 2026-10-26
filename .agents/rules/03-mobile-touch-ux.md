# 03 - Mobile & Touch UX Rules (Gym Ergonomics)

## 1. Gym Environment Ergonomics

Operating conditions during workouts dictate distinct UX constraints:
- High physical fatigue and elevated heart rate.
- Wet/chalky fingers and reduced fine motor control.
- Screen brightness variations (harsh gym lighting or dim rooms).
- Distractions, rapid task-switching (between sets, logging, spotting).

## 2. Touch Target Rules

1. **Minimum 48×48px Click Target (`--touch-target-min`)**:
   - Every tappable element (buttons, checkboxes, chips, chevron toggles, stepper triggers) must have a touch target of at least `48px`.
   - Primary action buttons (e.g. "Complete Set", "Finish Workout", "Resume") must have a height of `56px` (`--btn-primary-h`).
2. **Stepper-First Input**:
   - Avoid invoking the mobile virtual keyboard during a workout session.
   - For weights: Provide instant increment/decrement steppers (`-5`, `-2.5`, `+1`, `+2.5`, `+5 kg`).
   - For reps: Provide single-tap steppers (`-1`, `+1`).
   - If manual numeric editing is needed, keep it optional via a direct tap on the number badge, but make steppers the primary method.
3. **Safe Hit Distances**:
   - Destructive actions ("Discard Workout", "Delete Routine") must never be placed immediately adjacent to common positive actions ("Next Set") without safe spacing and confirmation dialogs.

## 3. Sensory Feedback & Device APIs

- **Timer Chime**: Use Web Audio API (`src/services/sound.ts`) for synthesized alerts on rest timer completion.
- **Vibration**: Call `triggerVibration()` from `src/services/feedback.ts` upon set completion and rest timer end (with silent fallback if unsupported or blocked by the OS).
- **Wake Lock**: The active session view must acquire screen wake lock (`src/services/wakeLock.ts`) when a session starts and release it when the session ends or is discarded.
- **Undo Snackbars**: Provide a transient undo window (e.g., 5 seconds) whenever a set is marked complete or uncompleted.

## 4. Visual Contrast & Hierarchy

- Keep high contrast between text (`var(--text-primary)`, `var(--text-secondary)`) and cards (`var(--bg-surface-card)`).
- Distinct set type badges:
  - **Normal**: Neutral emerald border / text
  - **Warmup**: Amber (`var(--accent-warmup)`)
  - **Dropset**: Purple (`var(--accent-dropset)`)
  - **Failure**: Red (`var(--accent-failure)`)
