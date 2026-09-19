import type {
  Workout,
  Exercise,
  WorkoutSet,
  SetType,
} from '../types/workout.ts';
import {
  saveWorkout,
  getWorkoutById,
  searchCustomExercises,
  recordCustomExercise,
  getLastPerformanceForExercise,
  deleteWorkout,
} from '../db/index.ts';
import { showToast } from './Toast.ts';
import { generateUUID } from '../utils/uuid.ts';

export class WorkoutEditorView {
  private container: HTMLElement;
  private workoutId: string;
  private workout!: Workout;
  private onBack: () => void;
  private autoSaveTimeout: number | null = null;
  private isSaving = false;

  constructor(
    container: HTMLElement,
    workoutId: string,
    options: { onBack: () => void }
  ) {
    this.container = container;
    this.workoutId = workoutId;
    this.onBack = options.onBack;
  }

  public async init(): Promise<void> {
    const existing = await getWorkoutById(this.workoutId);
    if (!existing) {
      // Create new empty workout
      const now = Date.now();
      this.workout = {
        id: this.workoutId,
        title: 'New Workout',
        notes: '',
        created_at: now,
        updated_at: now,
        exercises: [],
      };
      await saveWorkout(this.workout);
    } else {
      this.workout = existing;
    }

    // Populate previous performance hints if any
    for (const ex of this.workout.exercises) {
      if (!ex.previous_performance && ex.name) {
        ex.previous_performance = await getLastPerformanceForExercise(ex.name);
      }
    }

    this.render();
  }

  private triggerAutoSave(): void {
    if (this.autoSaveTimeout) {
      window.clearTimeout(this.autoSaveTimeout);
    }

    const indicator = this.container.querySelector('.save-indicator') as HTMLElement;
    if (indicator) {
      indicator.textContent = '● Saving...';
      indicator.classList.add('saving');
    }

    this.autoSaveTimeout = window.setTimeout(async () => {
      this.isSaving = true;
      try {
        await saveWorkout(this.workout);
        // Also save all custom exercises
        for (const ex of this.workout.exercises) {
          if (ex.name.trim()) {
            await recordCustomExercise(ex.name, ex.default_rest_sec);
          }
        }
        if (indicator) {
          indicator.textContent = '✓ Saved locally';
          indicator.classList.remove('saving');
        }
      } catch (err) {
        console.error('Error auto-saving workout:', err);
        if (indicator) {
          indicator.textContent = '⚠ Save error';
        }
      } finally {
        this.isSaving = false;
      }
    }, 400);
  }

  public render(): void {
    this.container.innerHTML = '';

    const root = document.createElement('div');
    root.className = 'builder-root';

    // Header bar
    const topBar = document.createElement('div');
    topBar.className = 'builder-topbar';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-ghost';
    backBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Workouts</span>
    `;
    backBtn.addEventListener('click', () => {
      if (this.isSaving) {
        setTimeout(() => this.onBack(), 150);
      } else {
        this.onBack();
      }
    });

    const indicator = document.createElement('div');
    indicator.className = 'save-indicator';
    indicator.textContent = '✓ Saved locally';

    topBar.appendChild(backBtn);
    topBar.appendChild(indicator);
    root.appendChild(topBar);

    // Workout title & notes
    const headerCard = document.createElement('div');
    headerCard.className = 'card builder-header';

    const titleInput = document.createElement('input');
    titleInput.className = 'input-title input-field';
    titleInput.value = this.workout.title;
    titleInput.placeholder = 'Workout title (e.g. Day A)...';
    titleInput.addEventListener('input', () => {
      this.workout.title = titleInput.value;
      this.triggerAutoSave();
    });

    const notesInput = document.createElement('textarea');
    notesInput.className = 'workout-notes-input';
    notesInput.value = this.workout.notes || '';
    notesInput.placeholder = 'Workout notes (schedule, split, warmup)...';
    notesInput.addEventListener('input', () => {
      this.workout.notes = notesInput.value;
      this.triggerAutoSave();
    });

    headerCard.appendChild(titleInput);
    headerCard.appendChild(notesInput);
    root.appendChild(headerCard);

    // Exercises List
    const exercisesContainer = document.createElement('div');
    exercisesContainer.className = 'exercises-list';

    this.workout.exercises.forEach((exercise, exIndex) => {
      const exCard = this.createExerciseCard(exercise, exIndex);
      exercisesContainer.appendChild(exCard);
    });

    root.appendChild(exercisesContainer);

    // Add Exercise Button
    const addExBtn = document.createElement('button');
    addExBtn.className = 'btn-add-exercise';
    addExBtn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
      </svg>
      <span>+ Add Exercise</span>
    `;
    addExBtn.addEventListener('click', () => this.addExercise());
    root.appendChild(addExBtn);

    // Bottom Danger Zone (Delete Program)
    const dangerBox = document.createElement('div');
    dangerBox.style.textAlign = 'center';
    dangerBox.style.marginTop = '20px';
    dangerBox.style.marginBottom = '40px';

    const deleteWorkoutBtn = document.createElement('button');
    deleteWorkoutBtn.className = 'btn-danger';
    deleteWorkoutBtn.textContent = 'Delete this workout';
    deleteWorkoutBtn.addEventListener('click', async () => {
      if (confirm(`Delete workout "${this.workout.title}"?`)) {
        await deleteWorkout(this.workout.id);
        showToast('Workout deleted', 'info');
        this.onBack();
      }
    });
    dangerBox.appendChild(deleteWorkoutBtn);
    root.appendChild(dangerBox);

    this.container.appendChild(root);
  }

  private createExerciseCard(exercise: Exercise, exIndex: number): HTMLElement {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.exerciseId = exercise.id;

    // Card Header: Reorder (Up/Down) + Name Input + Delete Exercise
    const header = document.createElement('div');
    header.className = 'exercise-card-header';

    // Reorder Buttons
    const reorderGroup = document.createElement('div');
    reorderGroup.className = 'exercise-reorder-group';

    const upBtn = document.createElement('button');
    upBtn.className = 'reorder-btn';
    upBtn.innerHTML = '▲';
    upBtn.title = 'Move up';
    upBtn.disabled = exIndex === 0;
    upBtn.addEventListener('click', () => this.moveExercise(exIndex, -1));

    const downBtn = document.createElement('button');
    downBtn.className = 'reorder-btn';
    downBtn.innerHTML = '▼';
    downBtn.title = 'Move down';
    downBtn.disabled = exIndex === this.workout.exercises.length - 1;
    downBtn.addEventListener('click', () => this.moveExercise(exIndex, 1));

    reorderGroup.appendChild(upBtn);
    reorderGroup.appendChild(downBtn);
    header.appendChild(reorderGroup);

    // Exercise Name Input with Autocomplete
    const nameWrapper = document.createElement('div');
    nameWrapper.className = 'exercise-name-wrapper';

    const nameInput = document.createElement('input');
    nameInput.className = 'exercise-name-input';
    nameInput.value = exercise.name;
    nameInput.placeholder = 'Exercise name...';

    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.style.display = 'none';
    nameWrapper.appendChild(nameInput);
    nameWrapper.appendChild(dropdown);

    // Autocomplete handler
    const showSuggestions = async (query: string) => {
      const results = await searchCustomExercises(query);
      if (results.length === 0) {
        dropdown.style.display = 'none';
        return;
      }
      dropdown.innerHTML = '';
      results.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'autocomplete-item';
        row.innerHTML = `
          <span>${escapeHtml(item.name)}</span>
          <span class="rest-hint">rest ${item.default_rest_sec}s</span>
        `;
        row.addEventListener('mousedown', async (e) => {
          e.preventDefault();
          nameInput.value = item.name;
          exercise.name = item.name;
          exercise.default_rest_sec = item.default_rest_sec;
          dropdown.style.display = 'none';
          exercise.previous_performance = await getLastPerformanceForExercise(item.name);
          this.triggerAutoSave();
          this.render();
        });
        dropdown.appendChild(row);
      });
      dropdown.style.display = 'block';
    };

    nameInput.addEventListener('input', () => {
      exercise.name = nameInput.value;
      showSuggestions(nameInput.value);
      this.triggerAutoSave();
    });

    nameInput.addEventListener('focus', () => {
      if (nameInput.value.length >= 1) {
        showSuggestions(nameInput.value);
      }
    });

    nameInput.addEventListener('blur', () => {
      setTimeout(() => {
        dropdown.style.display = 'none';
      }, 200);
    });

    header.appendChild(nameWrapper);

    // Delete Exercise Button
    const deleteExBtn = document.createElement('button');
    deleteExBtn.className = 'btn-icon-danger';
    deleteExBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    `;
    deleteExBtn.title = 'Delete exercise';
    deleteExBtn.addEventListener('click', () => {
      if (confirm(`Delete exercise "${exercise.name || 'Untitled'}"?`)) {
        this.removeExercise(exercise.id);
      }
    });
    header.appendChild(deleteExBtn);
    card.appendChild(header);

    // Previous performance ghost data hint
    if (exercise.previous_performance) {
      const ghostBox = document.createElement('div');
      ghostBox.className = 'ghost-performance-box';
      ghostBox.innerHTML = `
        <span class="icon">⏱</span>
        <span>Last time (${exercise.previous_performance.date}): <strong>${escapeHtml(
        exercise.previous_performance.summary
      )}</strong></span>
      `;
      card.appendChild(ghostBox);
    }

    // Exercise Notes Input Field
    const notesBox = document.createElement('div');
    notesBox.className = 'exercise-notes-box';
    notesBox.innerHTML = `
      <span class="exercise-notes-icon">📝</span>
      <input
        type="text"
        class="exercise-notes-input"
        placeholder="Exercise notes (grip, seat height, warmup)..."
        value="${escapeHtml(exercise.notes || '')}"
      />
    `;
    const notesInput = notesBox.querySelector('input') as HTMLInputElement;
    notesInput.addEventListener('input', () => {
      exercise.notes = notesInput.value;
      this.triggerAutoSave();
    });
    card.appendChild(notesBox);

    // Rest Duration Config Row
    const metaRow = document.createElement('div');
    metaRow.className = 'exercise-meta-row';

    const restBox = document.createElement('div');
    restBox.className = 'rest-timer-config';
    restBox.innerHTML = `<span>Rest:</span>`;

    const chipsBox = document.createElement('div');
    chipsBox.className = 'rest-chips';

    const presets = [60, 90, 120, 180];
    presets.forEach((sec) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `rest-chip ${exercise.default_rest_sec === sec ? 'active' : ''}`;
      chip.textContent = `${sec}s`;
      chip.addEventListener('click', () => {
        exercise.default_rest_sec = sec;
        this.triggerAutoSave();
        this.render();
      });
      chipsBox.appendChild(chip);
    });

    restBox.appendChild(chipsBox);
    metaRow.appendChild(restBox);
    card.appendChild(metaRow);

    // Sets List
    const setsContainer = document.createElement('div');
    setsContainer.className = 'sets-container';

    exercise.sets.forEach((set, setIndex) => {
      const setRow = this.createSetRow(exercise, set, setIndex);
      setsContainer.appendChild(setRow);
    });

    card.appendChild(setsContainer);

    // Exercise Footer Actions: Add Set & Duplicate Last Set
    const footerActions = document.createElement('div');
    footerActions.className = 'exercise-footer-actions';

    const addSetBtn = document.createElement('button');
    addSetBtn.type = 'button';
    addSetBtn.className = 'btn-add-set';
    addSetBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
      </svg>
      <span>+ Set</span>
    `;
    addSetBtn.addEventListener('click', () => this.addSet(exercise.id));

    const dupSetBtn = document.createElement('button');
    dupSetBtn.type = 'button';
    dupSetBtn.className = 'btn-dup-set';
    dupSetBtn.title = 'Duplicate last set';
    dupSetBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      <span>Duplicate</span>
    `;
    dupSetBtn.addEventListener('click', () => this.duplicateLastSet(exercise.id));

    footerActions.appendChild(addSetBtn);
    footerActions.appendChild(dupSetBtn);
    card.appendChild(footerActions);

    return card;
  }

  private createSetRow(exercise: Exercise, set: WorkoutSet, setIndex: number): HTMLElement {
    const row = document.createElement('div');
    row.className = 'set-row';

    // 1. Set number
    const num = document.createElement('div');
    num.className = 'set-number';
    num.textContent = `${setIndex + 1}`;
    row.appendChild(num);

    // 2. Set Type Badge (click cycles normal -> warmup -> dropset -> failure)
    const typeBadge = document.createElement('div');
    typeBadge.className = `set-type-badge type-${set.type}`;
    typeBadge.textContent = this.getTypeLabel(set.type);
    typeBadge.title = 'Tap to switch set type (Normal / Warmup / Dropset / Failure)';
    typeBadge.addEventListener('click', () => {
      set.type = this.cycleSetType(set.type);
      typeBadge.className = `set-type-badge type-${set.type}`;
      typeBadge.textContent = this.getTypeLabel(set.type);
      this.triggerAutoSave();
    });
    row.appendChild(typeBadge);

    // 3. Weight Stepper Box
    const weightBox = document.createElement('div');
    weightBox.className = 'stepper-box';

    const weightMain = document.createElement('div');
    weightMain.className = 'stepper-main';

    const weightMinus = document.createElement('button');
    weightMinus.type = 'button';
    weightMinus.className = 'stepper-btn';
    weightMinus.textContent = '-';
    weightMinus.addEventListener('click', () => {
      set.target_weight = Math.max(0, roundToHalf(set.target_weight - 2.5));
      set.actual_weight = set.target_weight;
      weightInput.value = `${set.target_weight}`;
      this.triggerAutoSave();
    });

    const weightInput = document.createElement('input');
    weightInput.type = 'number';
    weightInput.className = 'stepper-val-input';
    weightInput.value = `${set.target_weight}`;
    weightInput.step = '0.5';
    weightInput.min = '0';
    weightInput.addEventListener('change', () => {
      const val = parseFloat(weightInput.value);
      set.target_weight = isNaN(val) ? 0 : Math.max(0, val);
      set.actual_weight = set.target_weight;
      this.triggerAutoSave();
    });

    const weightPlus = document.createElement('button');
    weightPlus.type = 'button';
    weightPlus.className = 'stepper-btn';
    weightPlus.textContent = '+';
    weightPlus.addEventListener('click', () => {
      set.target_weight = roundToHalf(set.target_weight + 2.5);
      set.actual_weight = set.target_weight;
      weightInput.value = `${set.target_weight}`;
      this.triggerAutoSave();
    });

    weightMain.appendChild(weightMinus);
    weightMain.appendChild(weightInput);
    weightMain.appendChild(weightPlus);

    // Quick steppers for weight: -5, +5, +1
    const weightQuick = document.createElement('div');
    weightQuick.className = 'stepper-quick-row';

    const qMinus5 = document.createElement('button');
    qMinus5.type = 'button';
    qMinus5.className = 'stepper-quick-btn';
    qMinus5.textContent = '-5';
    qMinus5.addEventListener('click', () => {
      set.target_weight = Math.max(0, roundToHalf(set.target_weight - 5));
      set.actual_weight = set.target_weight;
      weightInput.value = `${set.target_weight}`;
      this.triggerAutoSave();
    });

    const qPlus1 = document.createElement('button');
    qPlus1.type = 'button';
    qPlus1.className = 'stepper-quick-btn';
    qPlus1.textContent = '+1';
    qPlus1.addEventListener('click', () => {
      set.target_weight = roundToHalf(set.target_weight + 1);
      set.actual_weight = set.target_weight;
      weightInput.value = `${set.target_weight}`;
      this.triggerAutoSave();
    });

    const qPlus5 = document.createElement('button');
    qPlus5.type = 'button';
    qPlus5.className = 'stepper-quick-btn';
    qPlus5.textContent = '+5';
    qPlus5.addEventListener('click', () => {
      set.target_weight = roundToHalf(set.target_weight + 5);
      set.actual_weight = set.target_weight;
      weightInput.value = `${set.target_weight}`;
      this.triggerAutoSave();
    });

    weightQuick.appendChild(qMinus5);
    weightQuick.appendChild(qPlus1);
    weightQuick.appendChild(qPlus5);

    const weightLabel = document.createElement('div');
    weightLabel.className = 'stepper-label';
    weightLabel.textContent = 'kg';

    weightBox.appendChild(weightMain);
    weightBox.appendChild(weightQuick);
    weightBox.appendChild(weightLabel);
    row.appendChild(weightBox);

    // 4. Reps Stepper Box
    const repsBox = document.createElement('div');
    repsBox.className = 'stepper-box';

    const repsMain = document.createElement('div');
    repsMain.className = 'stepper-main';

    const repsMinus = document.createElement('button');
    repsMinus.type = 'button';
    repsMinus.className = 'stepper-btn';
    repsMinus.textContent = '-';
    repsMinus.addEventListener('click', () => {
      set.target_reps = Math.max(1, set.target_reps - 1);
      set.actual_reps = set.target_reps;
      repsInput.value = `${set.target_reps}`;
      this.triggerAutoSave();
    });

    const repsInput = document.createElement('input');
    repsInput.type = 'number';
    repsInput.className = 'stepper-val-input';
    repsInput.value = `${set.target_reps}`;
    repsInput.min = '1';
    repsInput.addEventListener('change', () => {
      const val = parseInt(repsInput.value, 10);
      set.target_reps = isNaN(val) ? 1 : Math.max(1, val);
      set.actual_reps = set.target_reps;
      this.triggerAutoSave();
    });

    const repsPlus = document.createElement('button');
    repsPlus.type = 'button';
    repsPlus.className = 'stepper-btn';
    repsPlus.textContent = '+';
    repsPlus.addEventListener('click', () => {
      set.target_reps = set.target_reps + 1;
      set.actual_reps = set.target_reps;
      repsInput.value = `${set.target_reps}`;
      this.triggerAutoSave();
    });

    repsMain.appendChild(repsMinus);
    repsMain.appendChild(repsInput);
    repsMain.appendChild(repsPlus);

    const repsLabel = document.createElement('div');
    repsLabel.className = 'stepper-label';
    repsLabel.textContent = 'reps';

    repsBox.appendChild(repsMain);
    repsBox.appendChild(repsLabel);
    row.appendChild(repsBox);

    // 5. Delete Set Button
    const actionsBox = document.createElement('div');
    actionsBox.className = 'set-actions';

    const deleteSetBtn = document.createElement('button');
    deleteSetBtn.type = 'button';
    deleteSetBtn.className = 'btn-icon-danger';
    deleteSetBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    `;
    deleteSetBtn.title = 'Delete set';
    deleteSetBtn.addEventListener('click', () => {
      this.removeSet(exercise.id, set.id);
    });

    actionsBox.appendChild(deleteSetBtn);
    row.appendChild(actionsBox);

    return row;
  }

  /* ==================== CRUD OPERATIONS ==================== */

  private addExercise(): void {
    const newExercise: Exercise = {
      id: generateUUID(),
      name: '',
      order_index: this.workout.exercises.length,
      default_rest_sec: 90,
      notes: '',
      previous_performance: null,
      sets: [
        {
          id: generateUUID(),
          set_number: 1,
          type: 'normal',
          target_weight: 40,
          actual_weight: 40,
          target_reps: 10,
          actual_reps: 10,
          is_completed: false,
          custom_rest_sec: null,
        },
      ],
    };

    this.workout.exercises.push(newExercise);
    this.triggerAutoSave();
    this.render();

    // Focus on new exercise name input
    setTimeout(() => {
      const inputs = this.container.querySelectorAll('.exercise-name-input');
      const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
      if (lastInput) {
        lastInput.focus();
        lastInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  private removeExercise(exerciseId: string): void {
    this.workout.exercises = this.workout.exercises.filter((ex) => ex.id !== exerciseId);
    this.workout.exercises.forEach((ex, idx) => {
      ex.order_index = idx;
    });
    this.triggerAutoSave();
    this.render();
    showToast('Exercise deleted', 'info');
  }

  private moveExercise(currentIndex: number, direction: -1 | 1): void {
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= this.workout.exercises.length) return;

    const temp = this.workout.exercises[currentIndex];
    this.workout.exercises[currentIndex] = this.workout.exercises[targetIndex];
    this.workout.exercises[targetIndex] = temp;

    this.workout.exercises.forEach((ex, idx) => {
      ex.order_index = idx;
    });

    this.triggerAutoSave();
    this.render();
  }

  private addSet(exerciseId: string): void {
    const ex = this.workout.exercises.find((e) => e.id === exerciseId);
    if (!ex) return;

    const lastSet = ex.sets[ex.sets.length - 1];
    const newSet: WorkoutSet = {
      id: generateUUID(),
      set_number: ex.sets.length + 1,
      type: 'normal',
      target_weight: lastSet ? lastSet.target_weight : 40,
      actual_weight: lastSet ? lastSet.target_weight : 40,
      target_reps: lastSet ? lastSet.target_reps : 10,
      actual_reps: lastSet ? lastSet.target_reps : 10,
      is_completed: false,
      custom_rest_sec: null,
    };

    ex.sets.push(newSet);
    this.triggerAutoSave();
    this.render();
  }

  private duplicateLastSet(exerciseId: string): void {
    const ex = this.workout.exercises.find((e) => e.id === exerciseId);
    if (!ex || ex.sets.length === 0) {
      this.addSet(exerciseId);
      return;
    }

    const lastSet = ex.sets[ex.sets.length - 1];
    const duplicated: WorkoutSet = {
      id: generateUUID(),
      set_number: ex.sets.length + 1,
      type: lastSet.type,
      target_weight: lastSet.target_weight,
      actual_weight: lastSet.target_weight,
      target_reps: lastSet.target_reps,
      actual_reps: lastSet.target_reps,
      is_completed: false,
      custom_rest_sec: lastSet.custom_rest_sec,
    };

    ex.sets.push(duplicated);
    this.triggerAutoSave();
    this.render();
    showToast(`Set #${duplicated.set_number} duplicated`, 'success');
  }

  private removeSet(exerciseId: string, setId: string): void {
    const ex = this.workout.exercises.find((e) => e.id === exerciseId);
    if (!ex) return;

    if (ex.sets.length <= 1) {
      showToast('Exercise must have at least one set', 'error');
      return;
    }

    ex.sets = ex.sets.filter((s) => s.id !== setId);
    ex.sets.forEach((s, idx) => {
      s.set_number = idx + 1;
    });

    this.triggerAutoSave();
    this.render();
  }

  private cycleSetType(current: SetType): SetType {
    switch (current) {
      case 'normal':
        return 'warmup';
      case 'warmup':
        return 'dropset';
      case 'dropset':
        return 'failure';
      case 'failure':
        return 'normal';
    }
  }

  private getTypeLabel(type: SetType): string {
    switch (type) {
      case 'normal':
        return 'NORM';
      case 'warmup':
        return 'W';
      case 'dropset':
        return 'D';
      case 'failure':
        return 'F';
    }
  }
}

function roundToHalf(num: number): number {
  return Math.round(num * 2) / 2;
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
