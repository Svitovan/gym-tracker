# 01 - Architecture & Technology Stack

## 1. Directory Structure

```text
gym-tracker/
├── public/                 # Static assets, PWA manifest, service worker (sw.js), icons
├── docs/                   # Product requirements, workout program templates, plans
├── scripts/                # Node/utility automation scripts (e.g. template generation)
├── src/
│   ├── components/         # View classes and UI components (DOM-based)
│   ├── data/               # Default preloaded workout programs (JSON)
│   ├── db/                 # IndexedDB schema, connection pool, and repository methods
│   ├── services/           # Browser API services (Web Audio, WakeLock, Backup, Feedback)
│   ├── styles/             # Modular CSS stylesheets (variables.css, main.css, view-specific)
│   ├── types/              # TypeScript interfaces, domain types, and discriminated unions
│   ├── utils/              # Pure utility functions (UUID generator, math, formatting)
│   └── main.ts             # Application bootstrapper, App router, and SW registration
├── index.html              # Single Page Application HTML entrypoint
├── netlify.toml            # Deployment & caching headers configuration
├── tsconfig.json           # Strict TypeScript configuration
└── vite.config.ts          # Vite build configuration (port 3000, host: true)
```

## 2. Technology Stack & Role

| Technology | Purpose | Key Details |
| :--- | :--- | :--- |
| **Vite 6** | Bundler & Dev Server | Fast HMR, ESM build, root-relative asset resolution |
| **TypeScript 5.x** | Language & Safety | Strict mode enabled, `target: ES2022`, module: `ESNext` |
| **IndexedDB (`idb`)** | Persistence Layer | Lightweight promise wrapper over browser IndexedDB |
| **Vanilla DOM & CSS** | View Layer | Class-based views with explicit lifecycle, CSS Custom Properties |
| **Service Worker (`sw.js`)** | PWA Caching | Offline cache-first strategy for app shell and assets |
| **Native Web APIs** | Device Integration | Web Audio API (sound), Vibration API, Screen Wake Lock API |

## 3. Application Lifecycle & Routing (`src/main.ts`)

- **View Routing**: Managed by the `App` class using the `AppView` discriminated union:
  ```ts
  type AppView =
    | { type: 'LIST' }
    | { type: 'HISTORY' }
    | { type: 'EDITOR'; workoutId: string }
    | { type: 'SESSION'; workoutId?: string };
  ```
- **Active Session Resume**: On boot, `App.init()` checks `getActiveSession()`. If an in-progress workout exists, it automatically navigates to `{ type: 'SESSION' }`.
- **View Lifecycle**: Views instantiate with a `container: HTMLElement` and options/callbacks. If a view attaches intervals or global listeners (like `WorkoutSessionView`), ensure a cleanup method (`destroy()`) is implemented and called on navigation.
