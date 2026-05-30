import Store from 'electron-store';

/**
 * Gestión centralizada de la "Escala visual" (zoom de la interfaz).
 *
 * Una sola fuente de verdad para:
 *  - Límites (clamp 50%–300%) compartidos entre botones y atajos de teclado.
 *  - Persistencia del factor entre reinicios (electron-store).
 *  - Notificación al renderer vía el evento `zoom-changed`.
 */

const store = new Store();

export const ZOOM_MIN = 0.5;     // 50%
export const ZOOM_MAX = 3.0;     // 300%
export const ZOOM_STEP = 0.1;    // 10%
export const ZOOM_DEFAULT = 1.0; // 100%

const STORE_KEY = 'zoom-factor';

// Redondear a un decimal evita la deriva de coma flotante (p. ej. 1.0999999).
const round1 = (n) => Math.round(n * 10) / 10;

export const clampZoom = (factor) => {
  const num = Number(factor);
  if (!Number.isFinite(num)) return ZOOM_DEFAULT;
  return Math.min(Math.max(round1(num), ZOOM_MIN), ZOOM_MAX);
};

export const getSavedZoom = () => clampZoom(store.get(STORE_KEY, ZOOM_DEFAULT));

const isUsable = (win) => win && !win.isDestroyed();

/**
 * Aplica un factor (con clamp), lo persiste y notifica al renderer.
 * @returns {number} factor final aplicado.
 */
export const applyZoom = (win, factor) => {
  const clamped = clampZoom(factor);
  if (isUsable(win)) {
    win.webContents.setZoomFactor(clamped);
    win.webContents.send('zoom-changed', clamped);
  }
  store.set(STORE_KEY, clamped);
  return clamped;
};

export const getZoom = (win) => (isUsable(win) ? win.webContents.getZoomFactor() : getSavedZoom());

export const zoomIn = (win) => applyZoom(win, getZoom(win) + ZOOM_STEP);

export const zoomOut = (win) => applyZoom(win, getZoom(win) - ZOOM_STEP);

export const zoomReset = (win) => applyZoom(win, ZOOM_DEFAULT);

/**
 * Restaura el factor guardado sobre la ventana (usar tras cada carga).
 * No reemite `zoom-changed` para no interferir con la carga del renderer;
 * la UI lee el valor real con `get-zoom-level` al abrirse.
 */
export const restoreZoom = (win) => {
  const saved = getSavedZoom();
  if (isUsable(win)) {
    win.webContents.setZoomFactor(saved);
  }
  return saved;
};
