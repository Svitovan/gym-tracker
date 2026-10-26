# 05 - Quality Assurance & Verification

## 1. Verification Commands

Run these checks whenever you modify code:

```bash
# Typecheck and production bundle build (must exit with code 0)
npm run build

# TypeScript compiler dry-run (strict type checking without emitting JS)
npx tsc --noEmit
```

## 2. Pre-Completion Quality Checklist

Before finishing any task or reporting completion to the user, ensure:

- [ ] **Type Safety**: Zero TypeScript compiler errors (`tsc --noEmit`). No introduced `any` types.
- [ ] **Build Integrity**: `npm run build` runs and creates `/dist` without warnings or failures.
- [ ] **Offline Isolation**: No newly introduced external CDNs, fonts, telemetry, or remote scripts.
- [ ] **Touch Usability**: All buttons, cards, and interactive elements satisfy `--touch-target-min` (>= 48px).
- [ ] **Memory Leaks**: Event listeners attached to `window`, `document`, or global intervals/timeouts are cleaned up when navigating away or destroying views.
- [ ] **IndexedDB Resilience**: Any new data schema change includes migration logic and maintains backward compatibility with existing stored user data.
- [ ] **PWA Assets**: Any new routes, icons, or audio assets are registered in `sw.js` cache list if necessary.

## 3. Handling Edge Cases

- **Zero / Negative Values**: Ensure weight steppers don't drop below 0kg and reps don't drop below 0.
- **Timer Skew**: Rest timer must calculate time remaining using `Date.now()` and absolute target timestamps (`end_timestamp`), rather than trusting `setInterval` ticks which throttle when the phone screen turns off.
- **Storage Quota**: IndexedDB operations should gracefully catch quota errors if persistent storage is not granted.
