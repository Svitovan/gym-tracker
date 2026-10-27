# 02 - Code style and DOM safety

## TypeScript

- Preserve strict mode and unused-code checks in `tsconfig.json`.
- Do not introduce `any`, `@ts-ignore`, or unchecked casts for untrusted data.
  Narrow `unknown` with runtime checks, especially at JSON import boundaries.
- Keep shared domain types in `src/types/workout.ts` and implementation-only
  types near their consumers. Annotate public/exported function boundaries.
- Preserve valid zero values: use `??` instead of `||` where zero is meaningful.
  Validate finite numbers and domain ranges at input boundaries.
- Fix existing type escapes in the touched area when practical; avoid unrelated
  repository-wide refactors.

## DOM and lifecycle

- Prefer `textContent`, `createElement()`, and DOM properties for user-supplied
  titles, exercise names, notes, and imported strings.
- With `innerHTML`, escape dynamic text and quoted attribute values for their
  insertion context. HTML escaping does not validate URLs, CSS, or scripts;
  do not interpolate untrusted data into those contexts.
- Reuse an appropriate existing escaping helper in the touched area. Avoid
  introducing abstractions solely to rewrite unrelated components.
- Follow the view's existing lifecycle. Release owned intervals, timeouts,
  global listeners, and object URLs when no longer needed.

## CSS

- Reuse `src/styles/variables.css` for colors, fonts, radii, shadows, touch sizes,
  and transitions. Add a token when a reusable design value is missing.
- Keep layout in CSS classes and view-specific stylesheets rather than growing
  inline templates. Runtime-calculated values may use DOM style properties.
- Inspect existing tokens, including `--bg-surface`, `--accent-primary`,
  `--touch-target-min`, and `--btn-primary-h`, before use.
- Do not add remote font imports. Preserve local/system fallbacks.
