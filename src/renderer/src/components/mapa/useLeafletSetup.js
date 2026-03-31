import { useState, useEffect } from 'react';
import { LEAFLET_ICON_CDN } from './mapConfig';

/**
 * Hook compartido para cargar Leaflet y react-leaflet de forma asíncrona.
 * Devuelve { mapLibrary, mapError }.
 * mapLibrary incluye todas las exportaciones de react-leaflet más L (Leaflet core).
 */
export const useLeafletSetup = () => {
  const [mapLibrary, setMapLibrary] = useState(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const L = (await import('leaflet')).default;
        const ReactLeaflet = await import('react-leaflet');

        // Corregir iconos por defecto de Leaflet
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions(LEAFLET_ICON_CDN);

        if (isMounted) {
          setMapLibrary({ ...ReactLeaflet, L });
        }
      } catch (err) {
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
