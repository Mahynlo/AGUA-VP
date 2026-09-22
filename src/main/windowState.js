import Store from 'electron-store';
import { screen } from 'electron';

/**
 * Gestiona la persistencia de la posición y tamaño de la ventana.
 * @returns {Object} { x, y, width, height, track }
 */
export function setupWindowState() {
  const store = new Store();

  // Valores por defecto
  const defaultBounds = {
    width: 1200,
    height: 750,
  };

  // Verifica que el bound guardado realmente quepa en alguna pantalla conectada
  const isVisibleOnAnyDisplay = (bounds) => {
    if (bounds.x == null || bounds.y == null) return false;

    return screen.getAllDisplays().some((display) => {
      const area = display.workArea;
      return (
        bounds.x >= area.x &&
        bounds.y >= area.y &&
        bounds.x + bounds.width <= area.x + area.width &&
        bounds.y + bounds.height <= area.y + area.height
      );
    });
  };

  // Recuperar estado (o usar default)
  let state = store.get('window-state', defaultBounds);

  // Si el estado guardado no es visible en ninguna pantalla actual, descartarlo
  if (!state.isMaximized && !isVisibleOnAnyDisplay(state)) {
    state = defaultBounds;
  }

  const saveState = (win) => {
    if (!win.isDestroyed()) {
      if (win.isMaximized()) {
        store.set('window-state.isMaximized', true);
      } else {
        const bounds = win.getBounds();
        store.set('window-state', {
          ...bounds,
          isMaximized: false
        });
      }
    }
  };

  const track = (win) => {
    if (state.isMaximized) {
      win.maximize();
    }

    let timeoutId = null;
    const debouncedSave = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveState(win);
      }, 1000);
    };

    const events = ['resize', 'move'];
    events.forEach(event => {
       win.on(event, debouncedSave);
    });

    win.on('close', () => {
      if (timeoutId) clearTimeout(timeoutId);
      saveState(win);
    });
  };

  return {
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    track,
  };
}
