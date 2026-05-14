import { useState, useEffect } from 'react';
import { LEAFLET_ICON_CDN } from './mapConfig';

let cachedLibrary = null;
let loadPromise = null;

const loadLeafletLibrary = async () => {
  if (cachedLibrary) return cachedLibrary;

  if (!loadPromise) {
    loadPromise = (async () => {
      const L = (await import('leaflet')).default;
      const ReactLeaflet = await import('react-leaflet');

      if (!L.Icon.Default.__aguavpPatched) {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions(LEAFLET_ICON_CDN);
        L.Icon.Default.__aguavpPatched = true;
      }

      return { ...ReactLeaflet, L };
    })();
  }

  cachedLibrary = await loadPromise;
  return cachedLibrary;
};

/**
 * Hook compartido para cargar Leaflet y react-leaflet de forma asíncrona.
 * Devuelve { mapLibrary, mapError }.
 * mapLibrary incluye todas las exportaciones de react-leaflet más L (Leaflet core).
 */
export const useLeafletSetup = () => {
  const [mapLibrary, setMapLibrary] = useState(() => cachedLibrary);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (cachedLibrary) {
      return () => {
        isMounted = false;
      };
    }

    const load = async () => {
      try {
        const library = await loadLeafletLibrary();
        if (isMounted) {
          setMapLibrary(library);
        }
      } catch (err) {
        loadPromise = null;
        console.error('[useLeafletSetup] Error cargando Leaflet:', err);
        if (isMounted) setMapError(true);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return { mapLibrary, mapError };
};
