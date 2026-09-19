let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  return audioContext;
}

export async function unlockAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
      console.log('[Sound] AudioContext resumed successfully');
    } catch (err) {
      console.warn('[Sound] Failed to resume AudioContext:', err);
    }
  }
}

export function playTimerDoneChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First tone (880 Hz - A5)
    playTone(ctx, 880, now, 0.15);

    // Second tone (1046.5 Hz - C6)
    playTone(ctx, 1046.5, now + 0.18, 0.25);

    // Final resonant chord (1318.5 Hz - E6)
    playTone(ctx, 1318.5, now + 0.38, 0.4);
  } catch (err) {
    console.warn('[Sound] Error playing chime:', err);
  }
}

function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}
