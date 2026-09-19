import { playTimerDoneChime } from './sound.ts';

export function triggerTimerDoneFeedback(): void {
  // 1. Play synthesized audio chime
  playTimerDoneChime();

  // 2. Vibration feedback (Android / supported devices)
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate([200, 100, 200, 100, 400]);
    } catch (e) {
      console.warn('[Feedback] Vibration API error:', e);
    }
  }

  // 3. iOS Screen Flash Fallback (creates high-contrast visual flash)
  triggerScreenFlash();
}

export function triggerScreenFlash(): void {
  let flashEl = document.getElementById('screen-flash-overlay');
  if (!flashEl) {
    flashEl = document.createElement('div');
    flashEl.id = 'screen-flash-overlay';
    flashEl.className = 'screen-flash';
    document.body.appendChild(flashEl);
  }

  // Trigger re-animation
  flashEl.classList.remove('active');
  // Trigger reflow
  void flashEl.offsetWidth;
  flashEl.classList.add('active');

  setTimeout(() => {
    flashEl?.classList.remove('active');
  }, 1000);
}
