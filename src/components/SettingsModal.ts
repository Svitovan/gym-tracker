import {
  exportDatabaseToJSON,
  importDatabaseFromJSON,
  getStorageDiagnostics,
} from '../services/backup.ts';
import { resetToDefaultWorkouts } from '../db/index.ts';
import { showToast } from './Toast.ts';

// Global deferred prompt for PWA installation
let deferredInstallPrompt: any = null;

export function registerInstallPromptListener(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    console.log('[PWA] beforeinstallprompt captured');
  });
}

export async function openSettingsModal(onDataUpdated?: () => void): Promise<void> {
  const existing = document.getElementById('settings-modal-overlay');
  if (existing) existing.remove();

  const diagnostics = await getStorageDiagnostics();

  const overlay = document.createElement('div');
  overlay.id = 'settings-modal-overlay';
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-dialog" style="max-width: 480px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="font-size: 1.35rem; display: flex; align-items: center; gap: 8px;">
          <span>⚙</span>
          <span>Settings & Data</span>
        </h2>
        <button class="btn-icon-danger" id="btn-close-settings" style="width: 32px; height: 32px; font-size: 1.2rem;">
          ✕
        </button>
      </div>

      <!-- 1. Backup & Restore Section -->
      <div style="margin-bottom: 20px;">
        <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase; margin-bottom: 8px;">
          Backup & Restore
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button class="btn-secondary" id="btn-export-json" style="width: 100%; justify-content: flex-start; padding: 0 14px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            <span>Export Data to JSON</span>
          </button>
          
          <label class="btn-secondary" style="width: 100%; justify-content: flex-start; padding: 0 14px; cursor: pointer;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <span>Import from JSON</span>
            <input type="file" id="input-import-json" accept=".json" style="display: none;" />
          </label>
        </div>
      </div>

      <!-- 2. Default Workouts Templates Section -->
      <div style="margin-bottom: 20px;">
        <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase; margin-bottom: 8px;">
          Default Templates (PC JSON)
        </div>
        <button class="btn-secondary" id="btn-load-defaults" style="width: 100%; justify-content: flex-start; padding: 0 14px; border-color: rgba(56, 189, 248, 0.4);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          <span>Reload templates from default_workouts.json</span>
        </button>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px; line-height: 1.3;">
          Updates or reloads workout templates configured in default_workouts.json.
        </div>
      </div>

      <!-- 3. Storage Status -->
      <div style="margin-bottom: 20px;">
        <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase; margin-bottom: 8px;">
          Local Storage (IndexedDB)
        </div>
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; font-size: 0.85rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Browser eviction protection:</span>
            <strong style="color: ${diagnostics.isPersisted ? 'var(--accent-primary)' : 'var(--accent-warmup)'};">
              ${diagnostics.isPersisted ? '✓ Persistent' : 'Standard'}
            </strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Storage Used:</span>
            <strong style="color: var(--text-primary);">${diagnostics.usageFormatted}</strong>
          </div>
        </div>
      </div>

      <!-- 4. PWA Installation Section -->
      <div style="margin-bottom: 20px;">
        <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase; margin-bottom: 8px;">
          App Installation
        </div>
        ${
          deferredInstallPrompt
            ? `
          <button class="btn-cyan" id="btn-install-pwa" style="width: 100%;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
            <span>Install to Home Screen</span>
          </button>
        `
            : `
          <div style="font-size: 0.85rem; color: var(--text-muted); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 10px 12px; line-height: 1.4;">
            💡 <strong>For iOS Safari:</strong> tap the Share button (⎋) at the bottom and select "Add to Home Screen" (+).<br/>
            💡 <strong>For Android Chrome:</strong> tap menu ⋮ and select "Install app".
          </div>
        `
        }
      </div>

      <button class="btn-primary" id="btn-settings-done" style="min-height: 48px;">
        Done
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close handlers
  const close = () => overlay.remove();
  overlay.querySelector('#btn-close-settings')?.addEventListener('click', close);
  overlay.querySelector('#btn-settings-done')?.addEventListener('click', close);

  // Export JSON
  overlay.querySelector('#btn-export-json')?.addEventListener('click', async () => {
    try {
      const res = await exportDatabaseToJSON();
      showToast(`Exported: ${res.workoutsCount} workouts, ${res.historyCount} history records`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Export failed', 'error');
    }
  });

  // Import JSON
  const fileInput = overlay.querySelector('#input-import-json') as HTMLInputElement;
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    if (!confirm('Restore data from file? Existing workouts and history will be merged.')) {
      fileInput.value = '';
      return;
    }

    try {
      const res = await importDatabaseFromJSON(file);
      showToast(
        `Restored: ${res.workoutsCount} workouts, ${res.historyCount} history records`,
        'success'
      );
      close();
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Import failed', 'error');
    } finally {
      fileInput.value = '';
    }
  });

  // Load Default Workouts from default_workouts.json
  overlay.querySelector('#btn-load-defaults')?.addEventListener('click', async () => {
    try {
      const count = await resetToDefaultWorkouts();
      showToast(`Loaded ${count} workouts from default_workouts.json`, 'success');
      close();
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Failed to load templates', 'error');
    }
  });

  // PWA Install CTA
  overlay.querySelector('#btn-install-pwa')?.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      console.log(`[PWA] User choice: ${outcome}`);
      deferredInstallPrompt = null;
      close();
    }
  });
}
