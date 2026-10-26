# Gym Tracker PWA - Agent Guidelines (`AGENTS.md`)

This repository is an offline-first, mobile-first Progressive Web App (PWA) designed for strength training tracking in the gym.

Detailed, modular rule documents are maintained in [`.agents/rules/`](.agents/rules/):
- **Core Principles**: [`.agents/rules/00-overview.md`](.agents/rules/00-overview.md) (100% offline-first, zero cloud dependencies, zero data loss, lean stack).
- **Architecture**: [`.agents/rules/01-architecture.md`](.agents/rules/01-architecture.md) (Vanilla TypeScript, Vite 6, IndexedDB via `idb`, CSS tokens).
- **Code Style**: [`.agents/rules/02-code-style.md`](.agents/rules/02-code-style.md) (Strict TypeScript, class-based DOM views, CSS variables from `variables.css`).
- **Mobile & Touch UX**: [`.agents/rules/03-mobile-touch-ux.md`](.agents/rules/03-mobile-touch-ux.md) (>=48px touch targets, steppers instead of keyboard typing, vibration/audio cues).
- **Data & Storage**: [`.agents/rules/04-storage-data.md`](.agents/rules/04-storage-data.md) (IndexedDB schema, crash recovery, JSON backup/restore).
- **Quality Assurance**: [`.agents/rules/05-testing-quality.md`](.agents/rules/05-testing-quality.md) (Verification commands, regression prevention).

## Quick Agent Rules Summary

1. **Stack**: Vanilla TypeScript + Vite + IndexedDB (`idb`). Do not install React, Vue, Tailwind, or external UI component libraries.
2. **Offline First**: Never introduce external CDNs, remote analytics, or cloud APIs. The app must run 100% locally.
3. **Gym Ergonomics**: All interactive touch targets must be >= 48px. Prefer steppers (`-5`, `-2.5`, `+1`, `+2.5`, `+5 kg`) over virtual keyboard inputs.
4. **Styles**: Always use CSS custom properties from `src/styles/variables.css` (`var(--bg-surface)`, `var(--accent-primary)`, etc.).
5. **Session Safety**: The active workout session must be continually saved to IndexedDB (`active_session` store) so no user data is lost on reload or crash.
6. **Verification**: Always verify changes by running `npm run build`.
