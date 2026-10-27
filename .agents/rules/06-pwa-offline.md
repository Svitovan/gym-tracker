# 06 - PWA, offline assets, and updates

## Inspect together

- `public/sw.js`: cache name, precache list, install/activate/fetch handlers.
- `src/main.ts`: registration, update handling, `controllerchange` reload.
- `public/manifest.json`, `public/icon.svg`, `index.html`: shell and metadata.
- `vite.config.ts`, `netlify.toml`: build paths, SPA fallback, cache headers.

## Requirements for changes

- Keep core operation independent of networking after initial installation and
  caching. Do not add runtime CDNs, remote fonts, analytics, or cloud APIs.
- Inspect emitted asset paths for build/cache changes. Precaching HTML alone
  does not establish offline availability of hashed JS/CSS and required assets.
  Do not hardcode generated hash names.
- Keep cache updates consistent with the HTML/assets they serve. Check upgrades
  from an older cached build as well as clean installation.
- Review `skipWaiting()`, client claiming, and automatic reload together. Updates
  must preserve active-session changes; do not add forced reloads that interrupt
  writes. Follow recovery requirements in rule 04.
- When changing activation cleanup, remove only caches owned by this app.
- Keep the worker and HTML revalidatable under hosting headers. Confirm missing
  assets do not silently receive SPA HTML instead of the expected type.
- Verify worker behavior in a secure context (localhost or HTTPS). Plain HTTP
  on a LAN is not evidence of installable/offline PWA functionality.

## Current behavior and limitations

- The worker precaches `/`, `/index.html`, `/manifest.json`, and `/icon.svg`.
  Navigation uses network with cached fallback; other GET requests use cached
  responses with network refresh or fetch-and-cache on a miss.
- `main.ts` registers only in a secure context and reloads on controller changes.
  Test updates during a session as a data-safety scenario.
- `index.html` currently connects to Google Fonts. Removing this external
  dependency is a separate implementation task. Do not describe the current app
  as having no external network requests.

## Verification

Build and use production preview, wait for worker control, disable networking,
and reload. Exercise list, editor, recovery, history, and required assets. Test an
update with an active session. Inspect worker/cache state and network failures.
Record browser and origin; claim phone verification only when checked on a phone.
A dev-server visit or successful build is insufficient.
