import type {
  ActiveSession,
  Exercise,
  WorkoutSet,
  SetType,
  WorkoutHistory,
} from '../types/workout.ts';
import {
  getActiveSession,
  saveActiveSession,
  clearActiveSession,
  getWorkoutById,
  saveWorkout,
  saveWorkoutHistory,
  recordCustomExercise,
  getLastPerformanceForExercise,
} from '../db/index.ts';
import { unlockAudioContext } from '../services/sound.ts';
import { triggerTimerDoneFeedback } from '../services/feedback.ts';
import { requestWakeLock, releaseWakeLock } from '../services/wakeLock.ts';
import { generateUUID } from '../utils/uuid.ts';
import { showToast } from './Toast.ts';

export class WorkoutSessionView {
  private container: HTMLElement;
  private session!: ActiveSession;
  private onFinishCallback: () => void;

  private elapsedInterval: number | null = null;
  private timerInterval: number | null = null;
  private undoTimer: number | null = null;
  private lastCompletedSetRef: { exIndex: number; setIndex: number } | null = null;

  constructor(container: HTMLElement, options: { onFinish: () => void }) {
    this.container = container;
    this.onFinishCallback = options.onFinish;
  }

  public async start(workoutId?: string): Promise<void> {
    // Unlock Audio Context & Screen Wake Lock
    await unlockAudioContext();
    await requestWakeLock();

    // 1. Check for existing active session to restore
    const existing = await getActiveSession();
    if (existing) {
      this.session = existing;
    } else {
      // Create new session from template
      const now = Date.now();
      let title = 'Свободная тренировка';
      let exercises: Exercise[] = [];

      if (workoutId) {
        const template = await getWorkoutById(workoutId);
        if (template) {
          title = template.title;
          // Deep clone exercises
          exercises = JSON.parse(JSON.stringify(template.exercises));
        }
      }

      // If empty, add a default starting exercise
      if (exercises.length === 0) {
        exercises = [
          {
            id: generateUUID(),
            name: 'Жим штанги лежа',
            order_index: 0,
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
          },
        ];
      }

      // Load previous performance ghost data for each exercise
      for (const ex of exercises) {
        if (!ex.previous_performance && ex.name) {
          ex.previous_performance = await getLastPerformanceForExercise(ex.name);
        }
      }

      this.session = {
        id: 'active',
        workout_id: workoutId || null,
        title,
        started_at: now,
        exercises,
        active_exercise_index: 0,
        active_set_index: 0,
        timer: null,
      };

      await saveActiveSession(this.session);
    }

    this.startTimers();
    this.render();
  }

  private startTimers(): void {
    // 1. Elapsed workout timer
    this.elapsedInterval = window.setInterval(() => {
      const elapsedEl = document.getElementById('session-elapsed-display');
      if (elapsedEl) {
        elapsedEl.textContent = this.formatDuration(Date.now() - this.session.started_at);
      }
    }, 1000);

    // 2. Rest timer interval
    this.timerInterval = window.setInterval(() => {
      this.updateRestTimerTick();
    }, 250);
  }

  private updateRestTimerTick(): void {
    if (!this.session.timer || !this.session.timer.is_running) return;

    const remainingMs = this.session.timer.end_timestamp - Date.now();
    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

    const digitsEl = document.getElementById('rest-timer-digits');
    const fillEl = document.getElementById('rest-progress-fill');

    if (digitsEl) {
      digitsEl.textContent = this.formatRestTime(remainingSec);
    }

    if (fillEl && this.session.timer.duration_sec > 0) {
      const progressPercent = Math.min(
        100,
        Math.max(0, ((this.session.timer.duration_sec - remainingSec) / this.session.timer.duration_sec) * 100)
      );
      fillEl.style.width = `${progressPercent}%`;
    }

    // Timer Finished!
    if (remainingMs <= 0) {
      this.session.timer.is_running = false;
      saveActiveSession(this.session);

      // Trigger multi-sensory notification
      triggerTimerDoneFeedback();
      showToast('Отдых окончен! Время следующего подхода', 'info');

      // Re-render rest timer widget
      this.renderRestTimerWidget();
    }
  }

  private startRestTimer(seconds: number): void {
    const end = Date.now() + seconds * 1000;
    this.session.timer = {
      end_timestamp: end,
      duration_sec: seconds,
      is_running: true,
    };
    saveActiveSession(this.session);
    this.renderRestTimerWidget();
  }

  private adjustRestTimer(deltaSec: number): void {
    if (!this.session.timer || !this.session.timer.is_running) return;
    this.session.timer.end_timestamp += deltaSec * 1000;
    if (deltaSec > 0) {
      this.session.timer.duration_sec += deltaSec;
    }
    saveActiveSession(this.session);
    this.updateRestTimerTick();
  }

  private skipRestTimer(): void {
    if (this.session.timer) {
      this.session.timer.is_running = false;
      saveActiveSession(this.session);
      this.renderRestTimerWidget();
    }
  }

  public render(): void {
    this.container.innerHTML = '';

    const root = document.createElement('div');
    root.className = 'session-root';

    // 1. Top Bar
    const topBar = document.createElement('div');
    topBar.className = 'session-topbar';

    const leftBox = document.createElement('div');
    leftBox.style.display = 'flex';
    leftBox.style.alignItems = 'center';
    leftBox.style.gap = '10px';

    const timerBadge = document.createElement('div');
    timerBadge.className = 'session-elapsed-timer';
    timerBadge.innerHTML = `
      <span class="timer-dot"></span>
      <span id="session-elapsed-display">${this.formatDuration(Date.now() - this.session.started_at)}</span>
    `;
    leftBox.appendChild(timerBadge);

    const finishTopBtn = document.createElement('button');
    finishTopBtn.className = 'btn-danger';
    finishTopBtn.style.minHeight = '38px';
    finishTopBtn.style.padding = '0 14px';
    finishTopBtn.textContent = 'Закончить';
    finishTopBtn.addEventListener('click', () => this.showFinishModal());

    topBar.appendChild(leftBox);
    topBar.appendChild(finishTopBtn);
    root.appendChild(topBar);

    // 2. Rest Timer Widget Container
    const restTimerContainer = document.createElement('div');
    restTimerContainer.id = 'rest-timer-container';
    root.appendChild(restTimerContainer);

    // 3. Exercise Navigation Chips / Tabs
    const navTabs = document.createElement('div');
    navTabs.className = 'exercise-nav-tabs';
    this.session.exercises.forEach((ex, idx) => {
      const allDone = ex.sets.length > 0 && ex.sets.every((s) => s.is_completed);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `exercise-tab-chip ${idx === this.session.active_exercise_index ? 'active' : ''} ${
        allDone ? 'completed' : ''
      }`;
      chip.innerHTML = `${allDone ? '✓ ' : ''}${idx + 1}. ${escapeHtml(ex.name || 'Упражнение')}`;
      chip.addEventListener('click', () => {
        this.session.active_exercise_index = idx;
        // Select first incomplete set in this exercise
        const firstIncomplete = ex.sets.findIndex((s) => !s.is_completed);
        this.session.active_set_index = firstIncomplete !== -1 ? firstIncomplete : 0;
        saveActiveSession(this.session);
        this.render();
      });
      navTabs.appendChild(chip);
    });
    root.appendChild(navTabs);

    // 4. Focus Exercise Card
    const currentEx = this.session.exercises[this.session.active_exercise_index] || this.session.exercises[0];
    if (currentEx) {
      const exCard = this.createExerciseCard(currentEx);
      root.appendChild(exCard);
    }

    // 5. Fixed Bottom Action Bar
    const bottomBar = this.createBottomActionBar();
    root.appendChild(bottomBar);

    this.container.appendChild(root);

    // Initial render of rest timer widget if active
    this.renderRestTimerWidget();
  }

  private renderRestTimerWidget(): void {
    const container = document.getElementById('rest-timer-container');
    if (!container) return;

    container.innerHTML = '';
    if (!this.session.timer || !this.session.timer.is_running) return;

    const remainingSec = Math.max(0, Math.ceil((this.session.timer.end_timestamp - Date.now()) / 1000));

    const widget = document.createElement('div');
    widget.className = 'rest-timer-widget';

    widget.innerHTML = `
      <div class="rest-timer-header">
        <span class="tag">Отдых между подходами</span>
        <button class="btn-ghost" id="btn-skip-rest" style="padding:0 4px;font-size:0.8rem;color:var(--accent-cyan);">
          Пропустить ✕
        </button>
      </div>
      <div class="rest-timer-display">
        <span class="rest-timer-digits" id="rest-timer-digits">${this.formatRestTime(remainingSec)}</span>
        <span class="rest-timer-unit">сек</span>
      </div>
      <div class="rest-progress-bar-bg">
        <div class="rest-progress-bar-fill" id="rest-progress-fill" style="width: 0%;"></div>
      </div>
    `;

    const controls = document.createElement('div');
    controls.className = 'rest-timer-controls';

    const btnMinus15 = document.createElement('button');
    btnMinus15.className = 'rest-control-btn';
    btnMinus15.textContent = '-15 сек';
    btnMinus15.addEventListener('click', () => this.adjustRestTimer(-15));

    const btnPlus30 = document.createElement('button');
    btnPlus30.className = 'rest-control-btn';
    btnPlus30.textContent = '+30 сек';
    btnPlus30.addEventListener('click', () => this.adjustRestTimer(30));

    const btnSkip = document.createElement('button');
    btnSkip.className = 'rest-control-btn rest-control-skip';
    btnSkip.textContent = 'К подходу ➔';
    btnSkip.addEventListener('click', () => this.skipRestTimer());

    controls.appendChild(btnMinus15);
    controls.appendChild(btnPlus30);
    controls.appendChild(btnSkip);
    widget.appendChild(controls);

    container.appendChild(widget);

    // Bind header skip button
    const headerSkip = widget.querySelector('#btn-skip-rest');
    if (headerSkip) {
      headerSkip.addEventListener('click', () => this.skipRestTimer());
    }

    this.updateRestTimerTick();
  }

  private createExerciseCard(exercise: Exercise): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '20px';

    // Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'flex-start';
    header.style.marginBottom = '12px';

    header.innerHTML = `
      <div>
        <div style="font-size: 0.8rem; color: var(--accent-cyan); font-weight: 700; text-transform: uppercase;">
          Упражнение ${this.session.active_exercise_index + 1} из ${this.session.exercises.length}
        </div>
        <h2 style="margin-top: 2px;">${escapeHtml(exercise.name || 'Упражнение')}</h2>
      </div>
    `;

    // Dropdown / quick menu for dynamic edits (on the fly)
    const addSetQuick = document.createElement('button');
    addSetQuick.className = 'btn-secondary';
    addSetQuick.style.fontSize = '0.8rem';
    addSetQuick.style.minHeight = '36px';
    addSetQuick.innerHTML = `+ Подход`;
    addSetQuick.addEventListener('click', () => this.addSetToCurrentExercise());
    header.appendChild(addSetQuick);

    card.appendChild(header);

    // Previous performance hint (Ghost Data)
    if (exercise.previous_performance) {
      const ghostBox = document.createElement('div');
      ghostBox.className = 'ghost-performance-box';
      ghostBox.innerHTML = `
        <span class="icon">⏱</span>
        <span>В прошлый раз (${exercise.previous_performance.date}): <strong>${escapeHtml(
        exercise.previous_performance.summary
      )}</strong></span>
      `;
      card.appendChild(ghostBox);
    }

    // Sets List
    const setsContainer = document.createElement('div');
    setsContainer.className = 'sets-container';

    exercise.sets.forEach((set, sIdx) => {
      const row = this.createSessionSetRow(exercise, set, sIdx);
      setsContainer.appendChild(row);
    });

    card.appendChild(setsContainer);

    // Exercise notes (if any)
    if (exercise.notes) {
      const notesEl = document.createElement('p');
      notesEl.style.fontSize = '0.85rem';
      notesEl.style.color = 'var(--text-muted)';
      notesEl.style.marginTop = '8px';
      notesEl.textContent = `💡 ${exercise.notes}`;
      card.appendChild(notesEl);
    }

    return card;
  }

  private createSessionSetRow(exercise: Exercise, set: WorkoutSet, setIndex: number): HTMLElement {
    const row = document.createElement('div');
    const isActive = setIndex === this.session.active_set_index;
    row.className = `session-set-row ${isActive ? 'active' : ''} ${set.is_completed ? 'completed' : ''}`;

    // Click row to focus
    row.addEventListener('click', (e) => {
      // Don't trigger if clicked a button or input directly
      if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'INPUT') {
        return;
      }
      this.session.active_set_index = setIndex;
      saveActiveSession(this.session);
      this.render();
    });

    // 1. Completion indicator / Check circle
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    checkBtn.className = 'session-set-check';
    checkBtn.innerHTML = set.is_completed ? '✓' : `${setIndex + 1}`;
    checkBtn.title = set.is_completed ? 'Снять отметку' : 'Отметить выполненным';
    checkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSetCompletion(exercise, set, setIndex);
    });
    row.appendChild(checkBtn);

    // 2. Set Type Badge
    const typeBadge = document.createElement('div');
    typeBadge.className = `set-type-badge type-${set.type}`;
    typeBadge.textContent = this.getTypeLabel(set.type);
    typeBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      set.type = this.cycleSetType(set.type);
      typeBadge.className = `set-type-badge type-${set.type}`;
      typeBadge.textContent = this.getTypeLabel(set.type);
      saveActiveSession(this.session);
    });
    row.appendChild(typeBadge);

    // 3. Weight Steppers
    const weightBox = document.createElement('div');
    weightBox.className = 'stepper-box';

    const weightMain = document.createElement('div');
    weightMain.className = 'stepper-main';

    const wMinus = document.createElement('button');
    wMinus.type = 'button';
    wMinus.className = 'stepper-btn';
    wMinus.textContent = '-';
    wMinus.addEventListener('click', (e) => {
      e.stopPropagation();
      set.actual_weight = Math.max(0, roundToHalf((set.actual_weight || set.target_weight) - 2.5));
      wInput.value = `${set.actual_weight}`;
      saveActiveSession(this.session);
    });

    const wInput = document.createElement('input');
    wInput.type = 'number';
    wInput.className = 'stepper-val-input';
    wInput.value = `${set.actual_weight || set.target_weight}`;
    wInput.step = '0.5';
    wInput.addEventListener('click', (e) => e.stopPropagation());
    wInput.addEventListener('change', () => {
      const val = parseFloat(wInput.value);
      set.actual_weight = isNaN(val) ? 0 : Math.max(0, val);
      saveActiveSession(this.session);
    });

    const wPlus = document.createElement('button');
    wPlus.type = 'button';
    wPlus.className = 'stepper-btn';
    wPlus.textContent = '+';
    wPlus.addEventListener('click', (e) => {
      e.stopPropagation();
      set.actual_weight = roundToHalf((set.actual_weight || set.target_weight) + 2.5);
      wInput.value = `${set.actual_weight}`;
      saveActiveSession(this.session);
    });

    weightMain.appendChild(wMinus);
    weightMain.appendChild(wInput);
    weightMain.appendChild(wPlus);

    // Quick steppers
    const wQuick = document.createElement('div');
    wQuick.className = 'stepper-quick-row';

    const qM5 = document.createElement('button');
    qM5.type = 'button';
    qM5.className = 'stepper-quick-btn';
    qM5.textContent = '-5';
    qM5.addEventListener('click', (e) => {
      e.stopPropagation();
      set.actual_weight = Math.max(0, roundToHalf((set.actual_weight || set.target_weight) - 5));
      wInput.value = `${set.actual_weight}`;
      saveActiveSession(this.session);
    });

    const qP1 = document.createElement('button');
    qP1.type = 'button';
    qP1.className = 'stepper-quick-btn';
    qP1.textContent = '+1';
    qP1.addEventListener('click', (e) => {
      e.stopPropagation();
      set.actual_weight = roundToHalf((set.actual_weight || set.target_weight) + 1);
      wInput.value = `${set.actual_weight}`;
      saveActiveSession(this.session);
    });

    const qP5 = document.createElement('button');
    qP5.type = 'button';
    qP5.className = 'stepper-quick-btn';
    qP5.textContent = '+5';
    qP5.addEventListener('click', (e) => {
      e.stopPropagation();
      set.actual_weight = roundToHalf((set.actual_weight || set.target_weight) + 5);
      wInput.value = `${set.actual_weight}`;
      saveActiveSession(this.session);
    });

    wQuick.appendChild(qM5);
    wQuick.appendChild(qP1);
    wQuick.appendChild(qP5);

    const wLabel = document.createElement('div');
    wLabel.className = 'stepper-label';
    wLabel.textContent = 'кг';

    weightBox.appendChild(weightMain);
    weightBox.appendChild(wQuick);
    weightBox.appendChild(wLabel);
    row.appendChild(weightBox);

    // 4. Reps Steppers
    const repsBox = document.createElement('div');
    repsBox.className = 'stepper-box';

    const rMain = document.createElement('div');
    rMain.className = 'stepper-main';

    const rMinus = document.createElement('button');
    rMinus.type = 'button';
    rMinus.className = 'stepper-btn';
    rMinus.textContent = '-';
    rMinus.addEventListener('click', (e) => {
      e.stopPropagation();
      set.actual_reps = Math.max(1, (set.actual_reps || set.target_reps) - 1);
      rInput.value = `${set.actual_reps}`;
      saveActiveSession(this.session);
    });

    const rInput = document.createElement('input');
    rInput.type = 'number';
    rInput.className = 'stepper-val-input';
    rInput.value = `${set.actual_reps || set.target_reps}`;
    rInput.min = '1';
    rInput.addEventListener('click', (e) => e.stopPropagation());
    rInput.addEventListener('change', () => {
      const val = parseInt(rInput.value, 10);
      set.actual_reps = isNaN(val) ? 1 : Math.max(1, val);
      saveActiveSession(this.session);
    });

    const rPlus = document.createElement('button');
    rPlus.type = 'button';
    rPlus.className = 'stepper-btn';
    rPlus.textContent = '+';
    rPlus.addEventListener('click', (e) => {
      e.stopPropagation();
      set.actual_reps = (set.actual_reps || set.target_reps) + 1;
      rInput.value = `${set.actual_reps}`;
      saveActiveSession(this.session);
    });

    rMain.appendChild(rMinus);
    rMain.appendChild(rInput);
    rMain.appendChild(rPlus);

    const rLabel = document.createElement('div');
    rLabel.className = 'stepper-label';
    rLabel.textContent = 'повт';

    repsBox.appendChild(rMain);
    repsBox.appendChild(rLabel);
    row.appendChild(repsBox);

    // 5. Delete set button (if more than 1 set)
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-icon-danger';
    delBtn.innerHTML = '✕';
    delBtn.title = 'Удалить подход';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteSet(exercise, set.id);
    });
    row.appendChild(delBtn);

    return row;
  }

  /* ==================== BOTTOM ACTION BAR ==================== */

  private createBottomActionBar(): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'session-bottom-bar';

    const currentEx = this.session.exercises[this.session.active_exercise_index];
    const currentSet = currentEx?.sets[this.session.active_set_index];

    const allExercisesCompleted = this.session.exercises.every((ex) =>
      ex.sets.every((s) => s.is_completed)
    );

    const finishSetBtn = document.createElement('button');
    finishSetBtn.className = `btn-finish-set ${allExercisesCompleted ? 'all-done' : ''}`;

    if (allExercisesCompleted) {
      finishSetBtn.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>ЗАВЕРШИТЬ ТРЕНИРОВКУ</span>
      `;
      finishSetBtn.addEventListener('click', () => this.showFinishModal());
    } else {
      const setNum = (this.session.active_set_index || 0) + 1;
      finishSetBtn.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>ЗАВЕРШИТЬ ПОДХОД #${setNum}</span>
      `;
      finishSetBtn.addEventListener('click', () => {
        if (currentEx && currentSet) {
          this.completeCurrentSet(currentEx, currentSet);
        }
      });
    }

    bar.appendChild(finishSetBtn);
    return bar;
  }

  /* ==================== EXECUTION LOGIC ==================== */

  private completeCurrentSet(exercise: Exercise, set: WorkoutSet): void {
    set.is_completed = true;
    if (!set.actual_weight) set.actual_weight = set.target_weight;
    if (!set.actual_reps) set.actual_reps = set.target_reps;

    // Save custom exercise usage
    if (exercise.name.trim()) {
      recordCustomExercise(exercise.name, exercise.default_rest_sec);
    }

    // Save ref for Undo
    this.lastCompletedSetRef = {
      exIndex: this.session.active_exercise_index,
      setIndex: this.session.active_set_index,
    };

    // Show Undo Snackbar
    this.showUndoSnackbar(exercise.name, set.set_number);

    // Start rest timer
    const restDuration = set.custom_rest_sec || exercise.default_rest_sec || 90;
    this.startRestTimer(restDuration);

    // Advance to next set or next exercise
    this.advanceToNextSet();

    saveActiveSession(this.session);
    this.render();
  }

  private toggleSetCompletion(exercise: Exercise, set: WorkoutSet, setIndex: number): void {
    set.is_completed = !set.is_completed;
    if (set.is_completed) {
      if (!set.actual_weight) set.actual_weight = set.target_weight;
      if (!set.actual_reps) set.actual_reps = set.target_reps;
      this.session.active_set_index = setIndex;
      this.startRestTimer(set.custom_rest_sec || exercise.default_rest_sec || 90);
    }
    saveActiveSession(this.session);
    this.render();
  }

  private advanceToNextSet(): void {
    const currentEx = this.session.exercises[this.session.active_exercise_index];
    if (!currentEx) return;

    // Look for next incomplete set in current exercise
    const nextSetIdx = currentEx.sets.findIndex(
      (s, idx) => idx > this.session.active_set_index && !s.is_completed
    );

    if (nextSetIdx !== -1) {
      this.session.active_set_index = nextSetIdx;
    } else {
      // Look for next exercise with incomplete sets
      const nextExIdx = this.session.exercises.findIndex(
        (ex, idx) => idx > this.session.active_exercise_index && ex.sets.some((s) => !s.is_completed)
      );

      if (nextExIdx !== -1) {
        this.session.active_exercise_index = nextExIdx;
        const firstIncomplete = this.session.exercises[nextExIdx].sets.findIndex((s) => !s.is_completed);
        this.session.active_set_index = firstIncomplete !== -1 ? firstIncomplete : 0;
      }
    }
  }

  private showUndoSnackbar(exerciseName: string, setNumber: number): void {
    // Clear previous undo timer
    if (this.undoTimer) {
      window.clearTimeout(this.undoTimer);
    }

    const existingBar = document.getElementById('session-undo-bar');
    if (existingBar) existingBar.remove();

    const snackbar = document.createElement('div');
    snackbar.id = 'session-undo-bar';
    snackbar.className = 'undo-snackbar';
    snackbar.innerHTML = `
      <span>${escapeHtml(exerciseName)}: сет #${setNumber} выполнен</span>
      <button class="undo-btn" id="btn-undo-action">Отменить</button>
    `;

    document.body.appendChild(snackbar);

    const undoBtn = snackbar.querySelector('#btn-undo-action');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        this.undoLastCompletion();
        snackbar.remove();
      });
    }

    this.undoTimer = window.setTimeout(() => {
      snackbar.remove();
      this.lastCompletedSetRef = null;
    }, 5500);
  }

  private undoLastCompletion(): void {
    if (!this.lastCompletedSetRef) return;

    const { exIndex, setIndex } = this.lastCompletedSetRef;
    const targetEx = this.session.exercises[exIndex];
    if (targetEx && targetEx.sets[setIndex]) {
      targetEx.sets[setIndex].is_completed = false;
      this.session.active_exercise_index = exIndex;
      this.session.active_set_index = setIndex;

      // Cancel rest timer if it was running
      if (this.session.timer) {
        this.session.timer.is_running = false;
      }

      saveActiveSession(this.session);
      this.render();
      showToast('Отметка подхода отменена', 'info');
    }

    this.lastCompletedSetRef = null;
  }

  /* ==================== ON-THE-FLY EDITS ==================== */

  private addSetToCurrentExercise(): void {
    const ex = this.session.exercises[this.session.active_exercise_index];
    if (!ex) return;

    const last = ex.sets[ex.sets.length - 1];
    const newSet: WorkoutSet = {
      id: generateUUID(),
      set_number: ex.sets.length + 1,
      type: last ? last.type : 'normal',
      target_weight: last ? last.actual_weight || last.target_weight : 40,
      actual_weight: last ? last.actual_weight || last.target_weight : 40,
      target_reps: last ? last.actual_reps || last.target_reps : 10,
      actual_reps: last ? last.actual_reps || last.target_reps : 10,
      is_completed: false,
      custom_rest_sec: null,
    };

    ex.sets.push(newSet);
    this.session.active_set_index = ex.sets.length - 1;
    saveActiveSession(this.session);
    this.render();
    showToast(`Добавлен подход #${newSet.set_number}`, 'success');
  }

  private deleteSet(exercise: Exercise, setId: string): void {
    if (exercise.sets.length <= 1) {
      showToast('Нельзя удалить единственный подход', 'error');
      return;
    }

    exercise.sets = exercise.sets.filter((s) => s.id !== setId);
    exercise.sets.forEach((s, idx) => {
      s.set_number = idx + 1;
    });

    if (this.session.active_set_index >= exercise.sets.length) {
      this.session.active_set_index = exercise.sets.length - 1;
    }

    saveActiveSession(this.session);
    this.render();
  }

  /* ==================== FINISH WORKOUT MODAL ==================== */

  private showFinishModal(): void {
    const existing = document.getElementById('finish-modal-overlay');
    if (existing) existing.remove();

    // 1. Calculate statistics
    let totalVolumeKg = 0;
    let totalReps = 0;
    let completedSetsCount = 0;

    for (const ex of this.session.exercises) {
      for (const s of ex.sets) {
        if (s.is_completed) {
          completedSetsCount++;
          const reps = s.actual_reps || s.target_reps || 0;
          const weight = s.actual_weight || s.target_weight || 0;
          totalReps += reps;
          // Exclude warmup from volume
          if (s.type !== 'warmup') {
            totalVolumeKg += weight * reps;
          }
        }
      }
    }

    const durationMin = Math.max(1, Math.round((Date.now() - this.session.started_at) / 60000));

    const overlay = document.createElement('div');
    overlay.id = 'finish-modal-overlay';
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
      <div class="modal-dialog">
        <h2 style="font-size: 1.4rem; display: flex; align-items: center; gap: 8px;">
          <span>🎉</span>
          <span>Завершение тренировки</span>
        </h2>
        <p style="color: var(--text-secondary); margin-top: 4px; font-size: 0.95rem;">
          Отличная работа! Тренировка «${escapeHtml(this.session.title)}» подошла к концу.
        </p>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-value">${totalVolumeKg.toLocaleString('ru-RU')}</div>
            <div class="stat-label">Тоннаж (кг)</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${durationMin}</div>
            <div class="stat-label">Время (мин)</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${completedSetsCount}</div>
            <div class="stat-label">Подходов</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${totalReps}</div>
            <div class="stat-label">Повторений</div>
          </div>
        </div>

        ${
          this.session.workout_id
            ? `
          <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; margin: 16px 0; font-size: 0.9rem; color: var(--text-primary); user-select: none;">
            <input type="checkbox" id="chk-update-template" checked style="width: 18px; height: 18px; margin-top: 2px; accent-color: var(--accent-primary);" />
            <span>Обновить базовый шаблон программы новыми весами для следующей тренировки</span>
          </label>
        `
            : ''
        }

        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
          <button class="btn-primary" id="btn-confirm-finish">
            ✓ Сохранить и завершить
          </button>
          <button class="btn-ghost" id="btn-cancel-finish" style="color: var(--text-secondary);">
            Продолжить тренировку
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cancelBtn = overlay.querySelector('#btn-cancel-finish');
    cancelBtn?.addEventListener('click', () => overlay.remove());

    const confirmBtn = overlay.querySelector('#btn-confirm-finish');
    confirmBtn?.addEventListener('click', async () => {
      const updateTemplateChk = overlay.querySelector('#chk-update-template') as HTMLInputElement | null;
      const shouldUpdateTemplate = updateTemplateChk?.checked ?? false;

      await this.persistAndCompleteWorkout(shouldUpdateTemplate, totalVolumeKg, totalReps);
      overlay.remove();
    });
  }

  private async persistAndCompleteWorkout(
    updateTemplate: boolean,
    totalVolumeKg: number,
    totalReps: number
  ): Promise<void> {
    const finishedAt = Date.now();

    // 1. Update base template if requested
    if (updateTemplate && this.session.workout_id) {
      const template = await getWorkoutById(this.session.workout_id);
      if (template) {
        for (const sessionEx of this.session.exercises) {
          const tmplEx = template.exercises.find((e) => e.name.toLowerCase() === sessionEx.name.toLowerCase());
          if (tmplEx) {
            sessionEx.sets.forEach((sSet, sIdx) => {
              if (tmplEx.sets[sIdx]) {
                if (sSet.actual_weight) tmplEx.sets[sIdx].target_weight = sSet.actual_weight;
                if (sSet.actual_reps) tmplEx.sets[sIdx].target_reps = sSet.actual_reps;
              }
            });
          }
        }
        await saveWorkout(template);
      }
    }

    // 2. Save into workout_history
    const historyRecord: WorkoutHistory = {
      id: generateUUID(),
      workout_id: this.session.workout_id,
      title: this.session.title,
      started_at: this.session.started_at,
      finished_at: finishedAt,
      total_volume_kg: totalVolumeKg,
      total_reps: totalReps,
      snapshot: this.session.exercises,
    };
    await saveWorkoutHistory(historyRecord);

    // 3. Clean up active session
    await clearActiveSession();

    // 4. Release resources
    this.dispose();

    showToast('Тренировка успешно сохранена в историю!', 'success');
    this.onFinishCallback();
  }

  public dispose(): void {
    if (this.elapsedInterval) {
      window.clearInterval(this.elapsedInterval);
      this.elapsedInterval = null;
    }
    if (this.timerInterval) {
      window.clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.undoTimer) {
      window.clearTimeout(this.undoTimer);
      this.undoTimer = null;
    }
    const undoBar = document.getElementById('session-undo-bar');
    if (undoBar) undoBar.remove();

    releaseWakeLock();
  }

  /* ==================== HELPERS ==================== */

  private formatDuration(ms: number): string {
    const totalSec = Math.floor(Math.max(0, ms) / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }

  private formatRestTime(sec: number): string {
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    if (mins > 0) {
      return `${mins}:${remSec.toString().padStart(2, '0')}`;
    }
    return `${sec}`;
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
        return 'ОБ';
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
