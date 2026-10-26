# Project Agent Rules Directory (`.agents/rules/`)

This directory contains modular guidelines and constraints loaded by AI coding assistants (such as Google Antigravity, Cursor, Claude Code, and Copilot).

## Structure & Purpose

| File | Scope | Summary |
| :--- | :--- | :--- |
| **`00-overview.md`** | Core Mission | Non-negotiables: 100% offline-first, gym ergonomics, zero framework creep, zero data loss. |
| **`01-architecture.md`** | Architecture | Directory layout, Vite + TypeScript + IndexedDB stack, routing & lifecycle. |
| **`02-code-style.md`** | Code Conventions | TypeScript strict mode, class-based component pattern, XSS escaping, CSS variables. |
| **`03-mobile-touch-ux.md`** | Mobile UX | 48px touch targets, steppers instead of keyboard inputs, audio & haptic feedback. |
| **`04-storage-data.md`** | Persistence | IndexedDB schema (`GymTrackerDB`), migrations, active session recovery, backup JSON. |
| **`05-testing-quality.md`** | QA & Verification | Verification commands (`npm run build`, `tsc --noEmit`), pre-commit checklist, edge cases. |

## How to Add or Modify Rules

1. **Keep Rules Actionable**: Write direct instructions, code patterns, and concrete constraints. Avoid generic prose.
2. **Respect Context Budget**:
   - Each rule file should remain concise (well below the 24 KB / 24,000 bytes Antigravity per-file limit).
   - Rules are loaded automatically by Antigravity and merged into the active rule set.
3. **Numbering Convention**: Use 2-digit prefixes (`00-`, `01-`, etc.) to control file ordering and logical reading flow.
