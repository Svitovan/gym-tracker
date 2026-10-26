# 02 - Code Style & TypeScript Conventions

## 1. TypeScript Standards

- **Strict Typing**:
  - `noImplicitAny` is enforced by `tsconfig.json`. Never use `any`. Use `unknown` with type narrowing if the type is indeterminate.
  - Define interfaces in `src/types/` (e.g. `workout.ts`). Keep domain types centralized.
  - Return types and parameter types must be explicitly annotated for all public and exported functions/methods.
- **Null Safety**:
  - Be explicit with `null` vs `undefined`.
  - Use optional chaining (`?.`) and nullish coalescing (`??`) instead of loose boolean truthiness checks (`||`) when checking numbers or booleans (e.g., `value ?? 0` to preserve `0`).

## 2. Component Design & DOM Manipulation

- **Class-Based Views**:
  - Views follow the pattern:
    ```ts
    export class ExampleView {
      private container: HTMLElement;
      private options: ExampleOptions;

      constructor(container: HTMLElement, options: ExampleOptions) {
        this.container = container;
        this.options = options;
      }

      public async render(): Promise<void> {
        this.container.innerHTML = '';
        // Build DOM structure
      }

      public destroy(): void {
        // Clear intervals, timeouts, and global window/document listeners
      }
    }
    ```
- **XSS & HTML Escaping**:
  - When injecting dynamic user strings (workout titles, exercise names, notes) into `.innerHTML`, always sanitize using an `escapeHtml()` helper:
    ```ts
    function escapeHtml(str: string): string {
      return str.replace(/[&<>'"]/g, (tag) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      }[tag] || tag));
    }
    ```
  - Prefer `document.createElement()` and `element.textContent` for element construction where feasible.

## 3. Styling & CSS Conventions

- **CSS Custom Properties**:
  - All color tokens, border radiuses, font stacks, and touch metrics are declared in `src/styles/variables.css`.
  - Never introduce hardcoded hex colors or arbitrary px dimensions when an equivalent design token exists:
    - Backgrounds: `var(--bg-app)`, `var(--bg-surface)`, `var(--bg-surface-elevated)`, `var(--bg-surface-card)`
    - Borders: `var(--border-subtle)`, `var(--border-card)`, `var(--border-focus)`
    - Accents: `var(--accent-primary)`, `var(--accent-cyan)`, `var(--accent-warmup)`, `var(--accent-dropset)`, `var(--accent-failure)`
    - Touch metrics: `var(--touch-target-min)` (48px), `var(--btn-primary-h)` (56px)
- **Modular Stylesheets**:
  - Keep view-specific CSS separated into `src/styles/{view}.css` (`main.css`, `builder.css`, `session.css`, `history.css`).
  - Do not use inline styles for complex layouts; use CSS classes.
