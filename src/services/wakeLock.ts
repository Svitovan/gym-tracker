interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: string, listener: EventListener) => void;
}

let wakeLockSentinel: WakeLockSentinelLike | null = null;
let isRequested = false;
let visibilityHandlerAttached = false;

export async function requestWakeLock(): Promise<boolean> {
  isRequested = true;

  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    console.log('[WakeLock] Screen Wake Lock API not supported on this browser');
    return false;
  }

  try {
    const sentinel = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<WakeLockSentinelLike> } }).wakeLock.request('screen');
    wakeLockSentinel = sentinel;
    console.log('[WakeLock] Screen Wake Lock active');

    wakeLockSentinel.addEventListener('release', () => {
      console.log('[WakeLock] Screen Wake Lock was released');
      wakeLockSentinel = null;
    });

    if (!visibilityHandlerAttached) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      visibilityHandlerAttached = true;
    }

    return true;
  } catch (err) {
    console.warn('[WakeLock] Failed to request Screen Wake Lock:', err);
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  isRequested = false;

  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
      console.log('[WakeLock] Released explicitly');
    } catch (err) {
      console.warn('[WakeLock] Error releasing:', err);
    }
  }

  if (visibilityHandlerAttached) {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    visibilityHandlerAttached = false;
  }
}

async function handleVisibilityChange(): Promise<void> {
  if (document.visibilityState === 'visible' && isRequested && !wakeLockSentinel) {
    console.log('[WakeLock] Re-requesting Wake Lock on visibility change to visible');
    await requestWakeLock();
  }
}
