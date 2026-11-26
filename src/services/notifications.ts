const PREFERENCE_KEY = 'gym-tracker.rest-notifications';

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!window.isSecureContext || !('Notification' in window) || !('serviceWorker' in navigator)
      || typeof ServiceWorkerRegistration === 'undefined'
      || typeof ServiceWorkerRegistration.prototype.showNotification !== 'function') {
    return 'unsupported';
  }
  return Notification.permission;
}

export function areRestNotificationsEnabled(): boolean {
  try {
    return localStorage.getItem(PREFERENCE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setRestNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(PREFERENCE_KEY, String(enabled));
}

// Call only from an explicit user interaction.
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  const permission = getNotificationPermission();
  return permission === 'default' ? Notification.requestPermission() : permission;
}

async function showNotification(title: string, body: string, tag: string): Promise<void> {
  if (getNotificationPermission() !== 'granted') {
    throw new Error('Notification permission is not granted.');
  }

  // Unlike serviceWorker.ready, this does not wait forever if registration failed.
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.active) {
    throw new Error('Service Worker is not active. Reload the app and try again.');
  }

  await registration.showNotification(title, {
    body,
    tag,
    icon: '/icon.svg',
    silent: false,
  });
}

export async function showRestFinishedNotification(sessionStart: number, deadline: number): Promise<void> {
  if (!areRestNotificationsEnabled() || getNotificationPermission() !== 'granted') return;

  try {
    // A stable tag deduplicates the same timer in the system notification tray.
    await showNotification('Rest finished!', 'Time for your next set.', `gym-rest-${sessionStart}-${deadline}`);
  } catch (err) {
    // Optional device feedback must never interrupt workout recording.
    console.warn('[Notifications] Rest notification failed:', err);
  }
}

export async function showTestNotification(): Promise<void> {
  await showNotification('Gym Tracker', 'Test notification. Your notifications are working.', 'gym-notification-test');
}
