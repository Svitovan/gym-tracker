# 03 - Mobile, touch, and accessibility

## Gym input

- Every interactive target must be at least 48 x 48 CSS px, including icon
  buttons, toggles, and steppers. Primary actions use `--btn-primary-h`
  (currently 56px). Measure the hit area, not just the icon.
- Prefer weight steppers (`-5`, `-2.5`, `+1`, `+2.5`, `+5 kg`) and rep steppers
  (`-1`, `+1`). Manual numeric entry may supplement them.
- Keep text entry for names and notes; do not impose a closed exercise catalog.
- Separate destructive actions from common actions with spacing and confirmation
  or undo. Preserve existing undo when changing set completion.
- Keep primary controls usable on narrow screens without horizontal scrolling.
  Account for the keyboard and mobile safe areas.

## Accessibility

- Give icon-only controls accessible names. Use semantic buttons and labels.
- Preserve keyboard access and visible focus. Modals must manage focus, prevent
  focus from moving behind them, and restore focus on close.
- Keep text readable against surfaces. Do not communicate set type, completion,
  or errors only through color, vibration, or sound; retain visible text/state.
- Respect reduced-motion preferences for new animations and flashes.

## Optional device APIs

- Timer feedback uses `triggerTimerDoneFeedback()` in `src/services/feedback.ts`
  and synthesized audio from `src/services/sound.ts`.
- Preserve user-gesture audio initialization through `unlockAudioContext()`.
- Use `requestWakeLock()` and `releaseWakeLock()` from `src/services/wakeLock.ts`;
  preserve visibility recovery and session cleanup.
- Feature-detect APIs and handle refusal/failure. Missing audio, vibration,
  Wake Lock, or sharing must not block workout recording or saving.
- Calculate remaining time from absolute timestamps and `Date.now()`;
  interval ticks only refresh the display.
