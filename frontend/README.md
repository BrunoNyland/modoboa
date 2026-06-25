# Modoboa frontend

Single-page application for Modoboa, built with **Vue 3** + **Vuetify 4** and
bundled by **Vite 8 (Rolldown)**. It is the host of a **Module Federation**
setup: Modoboa plugins are loaded at runtime as remotes, registered from a
manifest served by the backend.

- **UI:** Vue 3, Vuetify 4, ApexCharts, TipTap (rich text)
- **State / routing:** Pinia, vue-router
- **i18n:** `vue3-gettext`
- **Auth:** OpenID Connect via `oidc-client-ts` (backend is the OIDC provider)
- **HTTP:** axios (`src/api/repository.js`)
- **Build:** Vite 8 + `@module-federation/vite`

---

## Prerequisites

- **Node.js 22** (Vite 8 requires a modern Node)
- **Yarn** (classic / v1 — the repo ships a `yarn.lock`; do **not** use npm)

```bash
node -v          # must start with v22
corepack enable  # or: npm install -g yarn
```

## Install

```bash
cd frontend
yarn install
```

---

## Running

### With a real backend

```bash
yarn dev
```

Starts Vite on **https://localhost:3000** (self-signed certificate — accept the
browser warning). Requests to `/api` and `/media` are proxied to the backend at
`http://127.0.0.1:8000` (or `https://api:8000` when `DOCKER=yes`). You need a
Modoboa backend running and an OIDC login.

### Without a backend (mocked) — recommended for UI work

```bash
yarn dev:mock
```

Same dev server, but the API is intercepted by **Mock Service Worker (MSW)** and
OIDC login is bypassed, so the app boots **already logged in** with fake data —
no backend required. See [Mocked development](#mocked-development-msw) below.

> `dev:mock` is `cross-env VITE_MOCK_API=true vite` (works on Linux, macOS and
> Windows). In mock mode the dev server runs over **plain HTTP** — a self-signed
> HTTPS cert breaks the MSW service-worker registration, and `http://localhost`
> is still a secure context for service workers.

### Storybook (isolated components)

```bash
# one-time install (kept out of package.json to preserve --frozen-lockfile CI):
yarn add -D storybook@^10 @storybook/vue3-vite@^10
yarn storybook        # http://localhost:6006
```

Config lives in `.storybook/` (preview wires Vuetify + i18n + Pinia + an
in-memory router). See `DEV_SEM_BACKEND.md` for details.

---

## Building

```bash
yarn build
```

Outputs the production bundle to **`../modoboa/frontend_dist/`** (consumed by the
Python package / `load_initial_data`, which symlinks it into the served
`frontend/` directory). Notes:

- JS and CSS are **minified**; CSS is not code-split (`cssCodeSplit: false`).
- All files under `assets/` are **content-hashed** (including the Module
  Federation `mf-entry-bootstrap-*` shims, hashed by the `relocateMfBootstrap`
  plugin in `vite.config.js`), so they can be served as **immutable**.
  `index.html` and `/remoteEntry.js` stay unhashed and must be served
  `no-cache`.

---

## Runtime configuration (`config.json`)

`src/main.js` fetches **`config.json`** at runtime (served from `public/` in dev,
provided per-instance in production) before mounting; the value is stored in
`src/config.js` (`setGlobalConfig` / `useGlobalConfig`). Keys:

| Key | Purpose |
| --- | --- |
| `API_BASE_URL` | Base URL for API calls (e.g. `/api/v2/`) |
| `API_DOC_URL` | Swagger schema URL |
| `OAUTH_AUTHORITY_URL` | OIDC authority (backend) |
| `OAUTH_CLIENT_ID` | OIDC client id |
| `OAUTH_REDIRECT_URI` / `OAUTH_POST_REDIRECT_URI` | OIDC redirects |
| `HTML_PAGE_TITLE` | Document title |

In production the deployed instance ships its own `config.json` (it is **not**
overwritten by package updates).

---

## Internationalization (languages)

Translations use **`vue3-gettext`**. There are two distinct concerns:
**authoring** translations (`.po` files) and **bundling** a subset of languages.

### How it flows

```
source strings (.vue/.js)
   │  yarn gettext:extract
   ▼
src/locale/<lang>/app.po        ← per-language catalogs (edited by translators)
   │  yarn gettext:compile
   ▼
src/locale/translations.json    ← compiled, contains ALL languages
   │  bundledTranslations() (vite.config.js) + locales.config.js
   ▼
virtual:modoboa-translations    ← only the ENABLED languages reach the bundle
   │
   ▼
src/plugins/gettext.js          ← vue3-gettext, restricted to enabled languages
```

### Authoring translations

```bash
# 1. Pull new/changed strings from the code into every .po catalog
yarn gettext:extract

# 2. Translate: edit src/locale/<lang>/app.po (msgstr "...")

# 3. Compile all .po into src/locale/translations.json
yarn gettext:compile
```

- The set of catalogs and the output path are defined in **`gettext.config.cjs`**.
- `src/locale/translations.json` is committed and always contains **every**
  language. English (`en`) is the source language and needs no translation.

### Choosing which languages ship in the build

Shipping every language embeds them all in the main JS bundle. To trim it, edit
**`locales.config.js`**:

```js
// locales.config.js
const BUNDLED_LOCALES = ['en', 'pt_BR']  // 👈 ship only these
```

`en` is always included. To select languages **without** editing the file, set
`MODOBOA_LOCALES` at build time:

```bash
MODOBOA_LOCALES=en,pt_BR,fr yarn build
```

Only the selected languages end up in the bundle, and the language selector in
the UI only offers those (see `src/plugins/gettext.js`).

### Available locale codes

```
en  br(Breton)  cs  de  el  es  fi  fr  it  ja  nl  pl  pt_BR  ru  sv  tr  zh
```

> Note: `pt_BR` is Brazilian Portuguese; `br` is **Breton** (not Brazil).

---

## Mocked development (MSW)

`yarn dev:mock` runs the full app with no backend. Everything is gated behind the
`VITE_MOCK_API` env var; the MSW worker is **dynamically imported**, so it is
**dead-code-eliminated from production builds** (msw never ships).

| File | Role |
| --- | --- |
| `src/mocks/fixtures.js` | Fake data (user, mailboxes, emails, domains…) |
| `src/mocks/handlers.js` | Which endpoints return what + a **catch-all** |
| `src/mocks/browser.js` | Registers the service worker |
| `public/mockServiceWorker.js` | MSW worker (generated by `msw init`) |

- `src/main.js` starts the worker only when `VITE_MOCK_API` is set, and exposes
  `globalThis.__MODOBOA_MOCK_API__` so the federated stores can detect mock mode
  (`import.meta.env` is not reliably injected into Module-Federation-exposed
  modules).
- `src/stores/auth.store.js` → `validateAccess()` / `login()` / `$reset()` skip
  OIDC in mock mode.
- **Bootstrap endpoints mocked:** `account/me/`, `account/available_applications/`,
  `frontend/plugins/` (returns `[]` → no remotes), `parameters/global/*`, theme,
  statistics, languages, webmail, etc.
- The **catch-all** returns an empty paginated list and logs
  `[mock] sem fixture: GET /api/v2/...` in the console so you know which fixture
  to add next.

**To work on a specific view:** open the console, find the unmocked endpoint the
catch-all reported, and add a handler in `handlers.js` returning the shape that
view expects (use `fixtures.js` as a base).

---

## Project structure

```
src/
  api/         axios wrappers (repository.js = the configured instance)
  components/   reusable components (account, admin, webmail, contacts, tools…)
  layouts/      page shells per area (admin, webmail, user, account…)
  views/        route-level pages
  router/       routes + auth guard + plugin-route registration
  stores/       Pinia stores (auth, global, plugins, webmail…)
  plugins/      vuetify, gettext, router glue, filters, permissions, icons
  mocks/        MSW handlers/fixtures (dev only)
  locale/       gettext catalogs + compiled translations.json
  config.js     runtime config holder (set from config.json at boot)
  utils/        helpers (incl. federation.js for remotes)
.storybook/     Storybook config + example story
locales.config.js   which languages are bundled
gettext.config.cjs  vue-gettext extract/compile config
vite.config.js      build config (federation, translations, asset hashing)
```

---

## Testing, linting, formatting

```bash
yarn test            # vitest (run once)
yarn test:watch      # vitest watch mode
yarn lint            # eslint --fix on src
yarn lint-no-fix     # eslint without fixing
yarn format          # prettier --write
```

---

## Module Federation notes

- This app is the **host** (`modoboa_host`). It exposes a few modules
  (`./stores`, `./repository`, `./MenuItems`, `./ConfirmDialog`, `./ColorField`)
  and shares singletons (`vue`, `vue-router`, `pinia`, `vuetify`, `vue3-gettext`).
- Plugin **remotes** are registered at runtime from the backend manifest
  (`/frontend/plugins/`), see `src/utils/federation.js` and `src/router/index.js`.
  In mocked mode that manifest is `[]`, so plugin pages are absent but the core
  app runs.
- `@module-federation/vite` emits bootstrap shim files at the bundle root; the
  `relocateMfBootstrap` plugin moves them under `assets/`, content-hashes them,
  and rewrites the references in `index.html`.
