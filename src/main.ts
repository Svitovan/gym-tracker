import './utils/uuid.ts';
import './styles/main.css';
import './styles/builder.css';
import './styles/session.css';
import './styles/history.css';

import { getDB, seedInitialDataIfEmpty, getActiveSession } from './db/index.ts';
import { renderHeader } from './components/Header.ts';
import { WorkoutListView } from './components/WorkoutList.ts';
import { WorkoutEditorView } from './components/WorkoutEditor.ts';
import { WorkoutSessionView } from './components/WorkoutSession.ts';
import { WorkoutHistoryView } from './components/WorkoutHistoryView.ts';
import { registerInstallPromptListener, openSettingsModal } from './components/SettingsModal.ts';
import { generateUUID } from './utils/uuid.ts';

type AppView =
  | { type: 'LIST' }
  | { type: 'HISTORY' }
  | { type: 'EDITOR'; workoutId: string }
  | { type: 'SESSION'; workoutId?: string };

class App {
  private root: HTMLElement;
  private currentView: AppView = { type: 'LIST' };
  private activeSessionView: WorkoutSessionView | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  public async init(): Promise<void> {
    // 1. Initialize DB and seed initial template if empty
    await getDB();
    await seedInitialDataIfEmpty();

    // 2. Register PWA install prompt & Service Worker
    registerInstallPromptListener();
    this.registerServiceWorker();

    // 3. Check if there's an ongoing active session
    const active = await getActiveSession();
    if (active) {
      this.navigate({ type: 'SESSION' });
    } else {
      this.navigate({ type: 'LIST' });
    }

    // 4. Online/Offline listeners
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
  }

  private registerServiceWorker(): void {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && window.isSecureContext) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[ServiceWorker] Active with scope:', reg.scope);
            reg.update().catch(() => {});
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[ServiceWorker] New version installed, activating...');
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn('[ServiceWorker] Registration failed:', err);
          });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }

  private updateOnlineStatus(): void {
    const badge = document.querySelector('.badge-offline');
    if (!badge) return;
    if (navigator.onLine) {
      badge.innerHTML = `<span class="dot" style="background:#38bdf8;box-shadow:0 0 8px #38bdf8;"></span><span>Offline Ready</span>`;
    } else {
      badge.innerHTML = `<span class="dot" style="background:#10b981;box-shadow:0 0 8px #10b981;"></span><span>Offline</span>`;
    }
  }

  public navigate(view: AppView): void {
    // Clean up active session listeners if leaving session
    if (this.currentView.type === 'SESSION' && view.type !== 'SESSION') {
      if (this.activeSessionView) {
        this.activeSessionView.dispose();
        this.activeSessionView = null;
      }
    }

    this.currentView = view;
    this.render();
  }

  private render(): void {
    this.root.innerHTML = '';

    // Only render default generic header for LIST, HISTORY and EDITOR
    if (this.currentView.type !== 'SESSION') {
      const isEditor = this.currentView.type === 'EDITOR';
      const header = renderHeader(
        isEditor ? () => this.navigate({ type: 'LIST' }) : undefined,
        isEditor ? 'Workouts' : undefined,
        () => openSettingsModal(() => this.render())
      );
      this.root.appendChild(header);
    }

    // Main content area
    const content = document.createElement('main');
    content.id = 'main-content';
    this.root.appendChild(content);

    // If on main screens (LIST or HISTORY), render top Navigation Tabs
    if (this.currentView.type === 'LIST' || this.currentView.type === 'HISTORY') {
      const navTabs = document.createElement('nav');
      navTabs.className = 'main-nav-tabs';
      navTabs.innerHTML = `
        <button class="main-nav-tab ${this.currentView.type === 'LIST' ? 'active' : ''}" id="tab-nav-programs">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 6h16M4 12h16M4 18h7" stroke-linecap="round"/>
          </svg>
          <span>Workouts</span>
        </button>
        <button class="main-nav-tab ${this.currentView.type === 'HISTORY' ? 'active' : ''}" id="tab-nav-history">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20V10M18 20V4M6 20v-4" stroke-linecap="round"/>
          </svg>
          <span>History</span>
        </button>
      `;

      navTabs.querySelector('#tab-nav-programs')?.addEventListener('click', () => {
        if (this.currentView.type !== 'LIST') {
          this.navigate({ type: 'LIST' });
        }
      });

      navTabs.querySelector('#tab-nav-history')?.addEventListener('click', () => {
        if (this.currentView.type !== 'HISTORY') {
          this.navigate({ type: 'HISTORY' });
        }
      });

      content.appendChild(navTabs);
    }

    // Sub-view container
    const viewContainer = document.createElement('div');
    viewContainer.id = 'view-container';
    content.appendChild(viewContainer);

    if (this.currentView.type === 'LIST') {
      const listView = new WorkoutListView(viewContainer, {
        onSelectWorkout: (id) => this.navigate({ type: 'EDITOR', workoutId: id }),
        onCreateWorkout: () => {
          const newId = generateUUID();
          this.navigate({ type: 'EDITOR', workoutId: newId });
        },
        onStartSession: (workoutId) => {
          this.navigate({ type: 'SESSION', workoutId });
        },
      });
      listView.render();
    } else if (this.currentView.type === 'HISTORY') {
      const historyView = new WorkoutHistoryView(viewContainer, {
        onNavigateToPrograms: () => this.navigate({ type: 'LIST' }),
      });
      historyView.render();
    } else if (this.currentView.type === 'EDITOR') {
      const editorView = new WorkoutEditorView(viewContainer, this.currentView.workoutId, {
        onBack: () => this.navigate({ type: 'LIST' }),
      });
      editorView.init();
    } else if (this.currentView.type === 'SESSION') {
      this.activeSessionView = new WorkoutSessionView(viewContainer, {
        onFinish: () => this.navigate({ type: 'HISTORY' }),
      });
      this.activeSessionView.start(this.currentView.workoutId);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  if (appContainer) {
    const app = new App(appContainer);
    app.init();
  }
});
