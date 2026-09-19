import type { WorkoutHistory } from '../types/workout.ts';
import { getWorkoutHistory, deleteWorkoutHistory, getHistoryStats } from '../db/index.ts';
import { showToast } from './Toast.ts';

export class WorkoutHistoryView {
  private container: HTMLElement;
  private onNavigateToPrograms: () => void;

  constructor(container: HTMLElement, options: { onNavigateToPrograms: () => void }) {
    this.container = container;
    this.onNavigateToPrograms = options.onNavigateToPrograms;
  }

  public async render(): Promise<void> {
    this.container.innerHTML = '';

    const root = document.createElement('div');

    const history = await getWorkoutHistory();
    const stats = await getHistoryStats();

    // 1. Title
    const titleBar = document.createElement('div');
    titleBar.style.marginBottom = '16px';
    titleBar.innerHTML = `<h1>История и аналитика</h1>`;
    root.appendChild(titleBar);

    // 2. KPI Cards
    const kpiGrid = document.createElement('div');
    kpiGrid.className = 'kpi-grid';

    const volumeDisplay =
      stats.totalVolumeKg >= 1000
        ? `${(stats.totalVolumeKg / 1000).toFixed(1)} т`
        : `${stats.totalVolumeKg} кг`;

    kpiGrid.innerHTML = `
      <div class="kpi-card volume">
        <div class="kpi-value">${volumeDisplay}</div>
        <div class="kpi-label">Тоннаж</div>
      </div>
      <div class="kpi-card workouts">
        <div class="kpi-value">${stats.totalWorkouts}</div>
        <div class="kpi-label">Тренировок</div>
      </div>
      <div class="kpi-card duration">
        <div class="kpi-value">${stats.avgDurationMin} <span style="font-size:0.9rem;font-weight:600;">мин</span></div>
        <div class="kpi-label">Сред. время</div>
      </div>
    `;
    root.appendChild(kpiGrid);

    // 3. History List or Empty State
    if (history.length === 0) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'empty-state card';
      emptyCard.innerHTML = `
        <div class="empty-state-icon">📊</div>
        <h2>История пока пуста</h2>
        <p style="margin-top: 6px; font-size: 0.95rem; color: var(--text-muted); margin-bottom: 20px;">
          Завершите свою первую тренировку, и здесь появятся подробные отчеты, поднятый тоннаж и аналитика.
        </p>
      `;

      const startFirstBtn = document.createElement('button');
      startFirstBtn.className = 'btn-primary';
      startFirstBtn.style.maxWidth = '280px';
      startFirstBtn.style.margin = '0 auto';
      startFirstBtn.textContent = 'Перейти к программам';
      startFirstBtn.addEventListener('click', () => this.onNavigateToPrograms());
      emptyCard.appendChild(startFirstBtn);

      root.appendChild(emptyCard);
      this.container.appendChild(root);
      return;
    }

    const list = document.createElement('div');
    list.className = 'history-list';

    for (const session of history) {
      const card = this.createHistoryCard(session);
      list.appendChild(card);
    }

    root.appendChild(list);
    this.container.appendChild(root);
  }

  private createHistoryCard(session: WorkoutHistory): HTMLElement {
    const card = document.createElement('div');
    card.className = 'history-card';

    const startDate = new Date(session.started_at);
    const dateFormatted = startDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      weekday: 'short',
    });
    const timeFormatted = startDate.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const durationMin = Math.max(1, Math.round((session.finished_at - session.started_at) / 60000));

    // Count completed sets
    let completedSetsCount = 0;
    session.snapshot.forEach((ex) => {
      completedSetsCount += ex.sets.filter((s) => s.is_completed || (s.actual_reps && s.actual_reps > 0)).length;
    });

    card.innerHTML = `
      <div class="history-card-header">
        <div>
          <span class="history-date-badge">${dateFormatted} • ${timeFormatted}</span>
          <div class="history-title">${escapeHtml(session.title)}</div>
        </div>
      </div>
      <div class="history-summary-chips">
        <span class="history-chip accent">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4M6 12h12" stroke-linecap="round"/>
          </svg>
          ${session.total_volume_kg.toLocaleString('ru-RU')} кг
        </span>
        <span class="history-chip">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          ${durationMin} мин
        </span>
        <span class="history-chip">
          ${completedSetsCount} ${getDeclension(completedSetsCount, ['подход', 'подхода', 'подходов'])}
        </span>
        <span class="history-chip">
          ${session.total_reps} повт.
        </span>
      </div>
    `;

    // Header actions: Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon-danger';
    deleteBtn.title = 'Удалить эту тренировку из истории';
    deleteBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    `;
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm(`Удалить тренировку «${session.title}» (${dateFormatted}) из истории?`)) {
        await deleteWorkoutHistory(session.id);
        showToast('Запись удалена из истории', 'info');
        await this.render();
      }
    });

    const header = card.querySelector('.history-card-header');
    if (header) header.appendChild(deleteBtn);

    // Collapsible Accordion Toggle for Session Snapshot
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'history-snapshot-toggle';
    toggleBtn.innerHTML = `
      <span>Снимок тренировки (${session.snapshot.length} упражнений)</span>
      <span class="arrow" style="transition: transform 0.2s;">▼</span>
    `;

    const snapshotContent = document.createElement('div');
    snapshotContent.className = 'history-snapshot-content';
    snapshotContent.style.display = 'none';

    session.snapshot.forEach((exercise) => {
      const exItem = document.createElement('div');
      exItem.className = 'snapshot-exercise-item';

      const validSets = exercise.sets.filter((s) => s.is_completed || (s.actual_reps && s.actual_reps > 0));
      if (validSets.length === 0) return;

      exItem.innerHTML = `<div class="snapshot-exercise-name">${escapeHtml(exercise.name)}</div>`;
      if (exercise.notes) {
        const noteEl = document.createElement('div');
        noteEl.style.fontSize = '0.78rem';
        noteEl.style.color = 'var(--text-muted)';
        noteEl.style.marginTop = '2px';
        noteEl.style.marginBottom = '6px';
        noteEl.textContent = `💡 ${exercise.notes}`;
        exItem.appendChild(noteEl);
      }

      const setsGrid = document.createElement('div');
      setsGrid.className = 'snapshot-sets-grid';

      validSets.forEach((s) => {
        const badge = document.createElement('div');
        badge.className = 'snapshot-set-badge';
        const typeTag = s.type !== 'normal' ? `<span class="set-tag ${s.type[0]}">${s.type[0].toUpperCase()}</span>` : '';
        badge.innerHTML = `
          ${typeTag}
          <span>#${s.set_number}: <strong>${s.actual_weight || s.target_weight}кг</strong> × ${s.actual_reps || s.target_reps}</span>
        `;
        setsGrid.appendChild(badge);
      });

      exItem.appendChild(setsGrid);
      snapshotContent.appendChild(exItem);
    });

    toggleBtn.addEventListener('click', () => {
      const isVisible = snapshotContent.style.display !== 'none';
      snapshotContent.style.display = isVisible ? 'none' : 'flex';
      const arrow = toggleBtn.querySelector('.arrow') as HTMLElement;
      if (arrow) {
        arrow.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
      }
    });

    card.appendChild(toggleBtn);
    card.appendChild(snapshotContent);

    return card;
  }
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getDeclension(num: number, forms: [string, string, string]): string {
  const n = Math.abs(num) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}
