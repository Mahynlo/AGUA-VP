import Store from 'electron-store';

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

  // Recuperar estado (o usar default)
  const state = store.get('window-state', defaultBounds);

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

  /**
   * Vincula la ventana a los eventos de guardado.
   * @param {BrowserWindow} win 
   */
  const track = (win) => {
    // Restaurar si estaba maximizada
    if (state.isMaximized) {
      win.maximize();
    }
    
    // Escuchar eventos (debounced es manejado por el sistema operativo realmente, 
    // pero aquí guardamos en cada movimiento por simplicidad. 
    // electron-store es síncrono al sistema de archivos pero rápido en JSON pequeño).
    // Debounce manual para evitar escritura excesiva en disco
    let timeoutId = null;
    const debouncedSave = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveState(win);
      }, 1000); // Guardar 1 segundo después del último cambio
    };

    const events = ['resize', 'move'];
    events.forEach(event => {
       win.on(event, debouncedSave);
    });

    // Guardar inmediatamente al cerrar para no perder el último estado
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
