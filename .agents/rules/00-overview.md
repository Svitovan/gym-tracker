# 00 - Project Overview & Agent Core Rules

## 1. Project Mission
**Gym Tracker PWA** is a high-performance, offline-first Progressive Web App designed specifically for strength training tracking in the gym. It is built to be fast, reliable, privacy-first, and effortless to use on mobile devices with sweaty hands and trembling muscles between heavy sets.

## 2. Core Non-Negotiable Principles

1. **100% Offline-First & Zero Cloud Dependency**:
   - The app must work fully without an internet connection.
   - Never add cloud API calls, third-party analytics, remote tracking, or remote fonts that break offline mode.
   - All user routines, exercise logs, and history reside strictly on the user's device in **IndexedDB**.

2. **Gym-First Touch UX**:
   - The user is in a gym: hands are sweaty, muscles are fatigued, attention is divided.
   - Never require manual keyboard typing where a touch stepper or single-tap button will suffice.
   - All interactive touch targets must have a minimum size of **48×48px**.

3. **Zero Data Loss Guarantee**:
   - Active workout session state must be continuously persisted in IndexedDB.
   - Accidental page reload, browser crash, or phone lock must seamlessly resume without losing recorded sets, elapsed time, or notes.
   - Provide undo protections for destructive actions (e.g. discarding sessions, deleting workouts).

4. **Lean Tech Stack (No Framework Creep)**:
   - Built on **Vanilla TypeScript**, native **CSS3 tokens**, and **Vite**.
   - Do not install React, Vue, Svelte, Tailwind, or heavyweight component libraries without explicit user request.
   - Keep the bundle lightweight, fast to parse on mobile CPUs, and instant to boot.

## 3. Agent Operating Protocol
- **Inspect Before Modifying**: Read existing types (`src/types/workout.ts`), database stores (`src/db/index.ts`), and style tokens (`src/styles/variables.css`) before creating or refactoring code.
- **Maintain TypeScript Strict Mode**: Never introduce `any` types or bypass compiler checks with `@ts-ignore` unless documented and strictly necessary.
- **Verify Build**: Always run `npm run build` after changes to ensure clean TypeScript compilation and bundle production.
