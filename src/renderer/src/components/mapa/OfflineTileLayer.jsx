import { createTileLayerComponent, updateGridLayer, withPane } from '@react-leaflet/core';
import { tileLayerOffline } from 'leaflet.offline';

/**
 * Capa de tiles OSM con cacheo automático offline.
 * Sustituye a <TileLayer> para la capa de calles.
 *
 * - Online: descarga tiles normalmente Y los guarda en IndexedDB.
 * - Offline: sirve los tiles ya guardados desde IndexedDB.
 * - Solo aplica a la capa de calles (OSM). Satélite e Híbrido
 *   siguen siendo online-only.
 */
const OfflineTileLayer = createTileLayerComponent(
  function create({ url, ...options }, context) {
    const instance = tileLayerOffline(url, withPane(options, context));
    return { instance, context };
  },
  function update(instance, props, prevProps) {
    updateGridLayer(instance, props, prevProps);
    if (props.url !== prevProps.url) {
      instance.setUrl(props.url);
    }
  }
);

export default OfflineTileLayer;
