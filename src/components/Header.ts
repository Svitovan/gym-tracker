export function renderHeader(
  onBack?: () => void,
  backTitle?: string,
  onOpenSettings?: () => void
): HTMLElement {
  const header = document.createElement('header');
  header.className = 'app-header';

  const leftBox = document.createElement('div');
  leftBox.style.display = 'flex';
  leftBox.style.alignItems = 'center';
  leftBox.style.gap = '10px';

  if (onBack) {
    const backBtn = document.createElement('button');
    backBtn.className = 'btn-ghost';
    backBtn.style.padding = '0 8px';
    backBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>${backTitle || 'Back'}</span>
    `;
    backBtn.addEventListener('click', onBack);
    leftBox.appendChild(backBtn);
  } else {
    const logo = document.createElement('div');
    logo.className = 'app-logo';
    logo.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke="#10b981">
        <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4M6 12h12" stroke-linecap="round"/>
      </svg>
      <span>GYM TRACKER</span>
    `;
    leftBox.appendChild(logo);
  }

  const rightBox = document.createElement('div');
  rightBox.style.display = 'flex';
  rightBox.style.alignItems = 'center';
  rightBox.style.gap = '8px';

  const badge = document.createElement('div');
  badge.className = 'badge-offline';
  badge.title = 'All data stored locally on your device (IndexedDB)';
  badge.innerHTML = `
    <span class="dot"></span>
    <span>Offline</span>
  `;
  rightBox.appendChild(badge);

  if (onOpenSettings) {
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'btn-ghost';
    settingsBtn.style.padding = '0 6px';
    settingsBtn.style.minHeight = '36px';
    settingsBtn.style.width = '36px';
    settingsBtn.title = 'Settings & Backup';
    settingsBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    `;
    settingsBtn.addEventListener('click', onOpenSettings);
    rightBox.appendChild(settingsBtn);
  }

  header.appendChild(leftBox);
  header.appendChild(rightBox);
  return header;
}
