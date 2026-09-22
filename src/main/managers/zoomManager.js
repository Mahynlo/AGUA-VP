import Store from 'electron-store';
import { BrowserWindow } from 'electron';

/**
 * Gestión centralizada de la "Escala visual" (zoom de la interfaz).
 *
 * Una sola fuente de verdad para:
 *  - Límites (clamp 50%–300%) compartidos entre botones, atajos de teclado y ratón.
 *  - Persistencia del factor entre reinicios (electron-store).
 *  - Prevención de desbordamiento/deriva en coma flotante.
 *  - Prevención de doble disparo por concurrencia entre atajos nativos y eventos DOM.
 *  - Notificación al renderer vía el evento `zoom-changed`.
 */

const store = new Store();

export const ZOOM_MIN = 0.5;     // 50%
export const ZOOM_MAX = 3.0;     // 300%
export const ZOOM_STEP = 0.1;    // 10%
export const ZOOM_DEFAULT = 1.0; // 100%

const STORE_KEY = 'zoom-factor';
const THROTTLE_MS = 120; // 120ms evita doble disparo simultáneo menú+DOM sin entorpecer clics manuales

let lastActionTime = 0;

// Redondear a un decimal evita la deriva de coma flotante (p. ej. 1.0999999).
const round1 = (n) => Math.round(n * 10) / 10;

export const clampZoom = (factor) => {
  const num = Number(factor);
  if (!Number.isFinite(num)) return ZOOM_DEFAULT;
  return Math.min(Math.max(round1(num), ZOOM_MIN), ZOOM_MAX);
};

export const getSavedZoom = () => clampZoom(store.get(STORE_KEY, ZOOM_DEFAULT));

let currentCachedZoom = getSavedZoom();

const isUsable = (win) => win && !win.isDestroyed();

const resolveWindow = (win) => {
  if (isUsable(win)) return win;
  const focused = BrowserWindow.getFocusedWindow();
  if (isUsable(focused)) return focused;
  return BrowserWindow.getAllWindows().find((w) => isUsable(w) && w.isVisible()) || null;
};

/**
 * Aplica un factor (con clamp), lo persiste y notifica a las ventanas visibles del usuario.
 * Las ventanas ocultas de impresión en segundo plano nunca son alteradas.
 * @returns {number} factor final aplicado.
 */
export const applyZoom = (win, factor) => {
  const clamped = clampZoom(factor);
  currentCachedZoom = clamped;
  store.set(STORE_KEY, clamped);

  const targetWin = resolveWindow(win);
  if (targetWin) {
    targetWin.webContents.setZoomFactor(clamped);
    targetWin.webContents.send('zoom-changed', clamped);
  }

  // Si hay otras ventanas de usuario visibles abiertas (ej. Centro de Ayuda), mantenerlas sincronizadas
  try {
    BrowserWindow.getAllWindows().forEach((w) => {
      if (isUsable(w) && w.isVisible() && w !== targetWin) {
        w.webContents.setZoomFactor(clamped);
        w.webContents.send('zoom-changed', clamped);
      }
    });
  } catch {
    // Si ocurre algún error en enumeración de ventanas, no bloquea la ejecución
  }

  return clamped;
};

export const getZoom = (win) => {
  const targetWin = resolveWindow(win);
  if (targetWin) {
    try {
      const actual = round1(targetWin.webContents.getZoomFactor());
      if (Number.isFinite(actual) && Math.abs(actual - currentCachedZoom) < 0.05) {
        return currentCachedZoom;
      }
      return actual;
    } catch {
      // fallback
    }
  }
  return currentCachedZoom;
};

export const zoomIn = (win) => {
  const now = Date.now();
  if (now - lastActionTime < THROTTLE_MS) {
    return currentCachedZoom;
  }
  lastActionTime = now;
  return applyZoom(win, round1(getZoom(win) + ZOOM_STEP));
};

export const zoomOut = (win) => {
  const now = Date.now();
  if (now - lastActionTime < THROTTLE_MS) {
    return currentCachedZoom;
  }
  lastActionTime = now;
  return applyZoom(win, round1(getZoom(win) - ZOOM_STEP));
};

export const zoomReset = (win) => {
  const now = Date.now();
  if (now - lastActionTime < THROTTLE_MS) {
    return currentCachedZoom;
  }
  lastActionTime = now;
  return applyZoom(win, ZOOM_DEFAULT);
};

/**
 * Restaura el factor guardado sobre la ventana (usar tras cada carga).
 * No reemite `zoom-changed` para no interferir con la carga inicial del renderer;
 * la UI lee el valor real con `get-zoom-level` al montarse o abrirse.
 */
export const restoreZoom = (win) => {
  const saved = getSavedZoom();
  currentCachedZoom = saved;
  const targetWin = resolveWindow(win);
  if (targetWin) {
    targetWin.webContents.setZoomFactor(saved);
  }
  return saved;
};
