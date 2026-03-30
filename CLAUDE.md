# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Vite + Electron hot reload)
npm run build        # Production build
npm run build:win    # Package for Windows (electron-builder)
npm run lint         # ESLint with auto-fix
npm run format       # Prettier formatting
```

No test suite exists. Validation is manual via the running app.

## Architecture Overview

AguaVP is an Electron 31 desktop app (water utility management system). The backend is an Express API (`@aguavp/api-server`) embedded as a local npm tarball and run inside the main process on port 3000. The renderer is a React 18 + Vite SPA.

```
Main Process (Node.js)
├── src/main/index.js           — BrowserWindow creation, app lifecycle
├── src/main/ipc/ipcHandlers.js — Core IPC: print, preview, file ops, zoom
├── src/main/ipc/*.js           — Feature IPC: clientes, medidores, facturas, pagos…
├── src/main/managers/
│   ├── apiManager.js           — Starts/stops @aguavp/api-server; secrets via safeStorage
│   ├── logManager.js           — File-based logging
│   └── updateManager.js        — electron-updater
└── src/auth/                   — JWT generation/verification (shared with renderer)

Preload (Context Bridge)
└── src/preload/index.js        — Exposes window.api, window.system, window.electronAPI

Renderer (React SPA)
├── src/renderer/src/App.jsx    — HashRouter + nested context providers
├── src/renderer/src/context/   — 15 React Context providers (data + auth)
├── src/renderer/src/hooks/     — Custom hooks for business logic
├── src/renderer/src/components/
│   ├── vistas/                 — Page components (Clientes, Medidores, Impresion…)
│   ├── recibo/                 — Print-only views (Recibo, ReporteLecturas…)
│   └── ui/                     — Shared UI components
└── src/renderer/src/utils/     — Pure utility functions
```

## IPC Pattern

All renderer→main communication goes through the preload bridge:

```js
// Renderer
const result = await window.api.fetchClientes(token, params);

// Preload (src/preload/index.js)
fetchClientes: (token, params) => ipcRenderer.invoke('fetch-clientes', token, params),

// Main (src/main/ipc/ipcHandlers.js or feature file)
ipcMain.handle('fetch-clientes', async (event, token, params) => { ... });
```

## State Management

React Context API only — no Redux/Zustand. Providers are stacked in `App.jsx`:

```
ThemeProvider → FeedbackProvider → DashboardProvider → ReportesProvider
  → AuthAppProvider → HashRouter → AuthProvider → [15 domain providers]
```

Each context exposes a custom hook (`useClientes()`, `useMedidores()`, etc.). Data fetching calls IPC → embedded API → SQLite. Caches live in context state or `useRef` (prefer `useRef` for caches to avoid stale `useCallback` closures).

## Print / Preview System

The preview flow creates a hidden BrowserWindow, renders the React route (with `?print=true`), calls `printToPDF()`, saves to temp, and returns the `file:///` path to the renderer. The modal (`ModalVistaPrevia`) displays it via `@react-pdf-viewer/core`.

**Critical invariant:** Never delete temp PDF files in a `useEffect` cleanup — React StrictMode (dev) unmounts→remounts components, which would delete the file before the viewer loads it. Always delete in an explicit user-action handler (`handleClose`).

Print-only routes (`/recibo`, `/reporteLecturas`, `/reporteClientes`, `/comprobante-pago`) are hidden from navigation and detect `?print=true` to render without UI chrome.

## Key Conventions

- **Security:** `webSecurity: !is.dev` on the main window. The preview window uses `webSecurity: false` to allow loading `file:///` URLs.
- **Theme:** Dark mode via Tailwind `darkMode: 'class'`. The custom `useTheme()` hook (in `src/renderer/src/theme/`) manages `'light' | 'dark' | 'system'`. Pass `theme={effectiveTheme}` (string) to `<Viewer>` — not `{ theme: effectiveTheme }`.
- **PDF viewer:** `defaultLayoutPlugin` llama `React.useMemo` internamente — NO envolverlo en `useMemo` externo (viola Rules of Hooks). Llamarlo directamente en el cuerpo del componente es correcto.
- **`backdrop-blur` in Electron:** Avoid `backdrop-blur-*` Tailwind classes on fixed overlays — they render as solid black on many Windows GPU configs.
- **API package:** `@aguavp/api-server` is installed from `../api-AguaVP/aguavp-api-server-*.tgz`. To update the API, rebuild the tarball in the `api-AguaVP` project and `npm install` here.
- **No TypeScript:** Pure JSX throughout. No type checking.
- **`tailwindcss-animate`** is NOT installed. The `animate-in`/`fade-in` classes in some components are inert (no animation runs, but the elements render normally).
