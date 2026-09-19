import type { Workout } from '../types/workout.ts';
import { getAllWorkouts, deleteWorkout, getActiveSession, clearActiveSession } from '../db/index.ts';
import { showToast } from './Toast.ts';

export class WorkoutListView {
  private container: HTMLElement;
  private onSelectWorkout: (id: string) => void;
  private onCreateWorkout: () => void;
  private onStartSession: (workoutId?: string) => void;

  constructor(
    container: HTMLElement,
    options: {
      onSelectWorkout: (id: string) => void;
      onCreateWorkout: () => void;
      onStartSession: (workoutId?: string) => void;
    }
  ) {
    this.container = container;
    this.onSelectWorkout = options.onSelectWorkout;
    this.onCreateWorkout = options.onCreateWorkout;
    this.onStartSession = options.onStartSession;
  }

  public async render(): Promise<void> {
    this.container.innerHTML = '';

    // Check for active unfinished session
    const active = await getActiveSession();
    if (active) {
      const elapsedMins = Math.max(1, Math.round((Date.now() - active.started_at) / 60000));
      const banner = document.createElement('div');
      banner.className = 'active-session-banner';
      banner.innerHTML = `
        <div class="active-session-banner-top">
          <div class="active-session-banner-title">
            <span>⚡</span>
            <span>Workout in progress: ${escapeHtml(active.title)}</span>
          </div>
          <span style="font-size: 0.85rem; color: var(--accent-cyan); font-weight: 700;">${elapsedMins} min</span>
        </div>
        <div class="active-session-banner-actions">
          <button class="btn-primary" id="btn-resume-session" style="min-height: 46px;">
            ▶ Resume Workout
          </button>
          <button class="btn-danger" id="btn-discard-session" style="min-height: 46px;">
            Discard
          </button>
        </div>
      `;

      banner.querySelector('#btn-resume-session')?.addEventListener('click', () => {
        this.onStartSession();
      });

      banner.querySelector('#btn-discard-session')?.addEventListener('click', async () => {
        if (confirm('Discard unsaved active workout?')) {
          await clearActiveSession();
          showToast('Active workout discarded', 'info');
          await this.render();
        }
      });

      this.container.appendChild(banner);
    }

    const workouts = await getAllWorkouts();

    // Top action bar
    const topBar = document.createElement('div');
    topBar.style.display = 'flex';
    topBar.style.justifyContent = 'space-between';
    topBar.style.alignItems = 'center';
    topBar.style.marginBottom = '20px';

    const title = document.createElement('h1');
    title.textContent = 'My Workouts';
    topBar.appendChild(title);

    this.container.appendChild(topBar);

    // Primary CTA button to create a new program
    const newBtn = document.createElement('button');
    newBtn.className = 'btn-primary';
    newBtn.style.marginBottom = '24px';
    newBtn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
      </svg>
      <span>+ New Workout</span>
    `;
    newBtn.addEventListener('click', () => this.onCreateWorkout());
    this.container.appendChild(newBtn);

    // Workouts grid or empty state
    if (workouts.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'empty-state card';
      emptyBox.innerHTML = `
        <div class="empty-state-icon">🏋️‍♂️</div>
        <h2>No workouts saved</h2>
        <p style="margin-top: 6px; font-size: 0.95rem; color: var(--text-muted);">
          Create your first workout routine with custom exercises and sets.
        </p>
      `;
      this.container.appendChild(emptyBox);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'workouts-grid';

    for (const workout of workouts) {
      const card = this.createWorkoutCard(workout);
      grid.appendChild(card);
    }

    this.container.appendChild(grid);
  }

  private createWorkoutCard(workout: Workout): HTMLElement {
    const card = document.createElement('div');
    card.className = 'workout-card';

    const totalExercises = workout.exercises.length;
    const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

    const updatedDate = new Date(workout.updated_at).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    });

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div class="workout-card-title">${escapeHtml(workout.title || 'Untitled Workout')}</div>
        <span style="font-size: 0.75rem; color: var(--text-muted);">${updatedDate}</span>
      </div>
      ${
        workout.notes
          ? `<p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4;">${escapeHtml(
              workout.notes
            )}</p>`
          : ''
      }
      <div class="workout-card-meta">
        <span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 6h16M4 12h16M4 18h7" stroke-linecap="round"/>
          </svg>
          ${totalExercises} ${totalExercises === 1 ? 'exercise' : 'exercises'}
        </span>
        <span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="16" rx="2"/>
            <path d="M7 8h10M7 12h10M7 16h6"/>
          </svg>
          ${totalSets} ${totalSets === 1 ? 'set' : 'sets'}
        </span>
      </div>
    `;

    const actions = document.createElement('div');
    actions.className = 'workout-card-actions';

    // Start Workout CTA
    const startBtn = document.createElement('button');
    startBtn.className = 'btn-cyan';
    startBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      <span>Start</span>
    `;
    startBtn.addEventListener('click', () => this.onStartSession(workout.id));

    // Edit Workout
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-secondary';
    editBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
      <span>Edit</span>
    `;
    editBtn.addEventListener('click', () => this.onSelectWorkout(workout.id));

    // Delete Workout
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-danger';
    deleteBtn.style.padding = '0';
    deleteBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    `;
    deleteBtn.title = 'Delete workout';
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm(`Delete workout "${workout.title}"?`)) {
        await deleteWorkout(workout.id);
        showToast('Workout deleted', 'info');
        await this.render();
      }
    });

    actions.appendChild(startBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    return card;
  }
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
