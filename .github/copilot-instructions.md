# Project Guidelines (AguaVP Electron)

## Code Style
- Use JavaScript/JSX only. Do not migrate files to TypeScript unless explicitly requested.
- Preserve existing React Context patterns (no Redux/Zustand introduction).
- Keep changes focused and small; avoid broad refactors not required by the task.

## Build and Validation
- Install dependencies: `npm install`
- Local development: `npm run dev`
- Production build: `npm run build`
- Lint and autofix: `npm run lint`
- Format code: `npm run format`
- There is no automated test suite in this repo; validate changes manually in the running Electron app.

## Architecture
- This app uses Electron + React + Vite with an embedded API package (`@aguavp/api-server`).
- Process boundaries:
  - `src/main/**`: Electron main process (window lifecycle, IPC handlers, managers)
  - `src/preload/index.js`: Context bridge surface for renderer
  - `src/renderer/**`: React SPA and UI logic
- Treat renderer->main communication as a 3-step contract:
  1. Renderer calls `window.api.*`
  2. Preload maps to `ipcRenderer.invoke(...)`
  3. Main registers matching `ipcMain.handle(...)`
- If you add or rename an IPC operation, update all three layers.

## Conventions and Pitfalls
- PDF preview lifecycle is strict: do not delete temp PDF files in `useEffect` cleanup. Delete only from explicit close/action handlers.
- Keep `@react-pdf-viewer` usage consistent: pass `theme={effectiveTheme}` as a string value.
- Avoid `backdrop-blur-*` classes on fixed overlays; they can render as black on Windows GPU combinations.
- Keep release version/tag flow consistent with `package.json` version.

## Key Files to Check First
- `CLAUDE.md` (primary architecture and conventions)
- `src/main/index.js`
- `src/main/ipc/index.js`
- `src/main/managers/apiManager.js`
- `src/preload/index.js`
- `src/renderer/src/App.jsx`

## Link, Do Not Duplicate
- Architecture and release details: `CLAUDE.md`
- In-app documentation loading system: `IMPLEMENTACION_DOCUMENTACION.md`
- User help content: `ayuda/**`
- Basic setup: `README.md`

## Cross-Repo Context
- The embedded API package is built from sibling repo `api-AguaVP` as a local tarball.
- For API behavior/contracts, consult docs in `../api-AguaVP/docs/**` instead of copying endpoint details here.
