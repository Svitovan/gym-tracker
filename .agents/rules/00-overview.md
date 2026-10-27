# 00 - Project overview and core rules

## Product requirements

- Keep routine editing, workout recording, history, and backup usable locally.
  Store user data in IndexedDB; do not add accounts, cloud APIs, analytics,
  remote scripts, fonts, or CDNs.
- Optimize for one-handed gym use: large targets, readable contrast, and steppers
  for repeated numeric adjustments. Allow free text for exercise names and notes.
- Keep the stack lean: Vanilla TypeScript, native CSS, Vite, and `idb`.
  Do not add UI frameworks or libraries without an explicit user request.

## Data safety

- Persist every active-session mutation and handle write failures. Reload or
  interruption must recover the last successfully saved state.
- Do not claim absolute protection against browser eviction or device failure.
  Persistent storage is a request; JSON backups remain important.
- Preserve recovery data until history is saved. Use confirmation or undo for
  destructive user actions, as appropriate to the flow.
- Do not clear the user's database or caches to make a change appear to work.
  Use a separate test origin or browser profile with synthetic data.

## Working protocol

- Inspect the exact checkout and existing changes before editing.
- Read relevant rules using this directory's README. Inspect domain types,
  database methods, and CSS tokens before changing those areas.
- Keep changes in scope. Do not alter exercises, training volume, rest periods,
  weights, template IDs, or stored user data incidentally.
- Treat `docs/plan.md` as requirements and other plans as proposals until code
  confirms implementation. Report discrepancies instead of assuming completion.
- Keep new code strictly typed. Improve existing type escapes in the touched
  area without unrelated rewrites.
- Run `npm run build` after changes. Separate verified results, requirements,
  and known limitations in the handoff.
