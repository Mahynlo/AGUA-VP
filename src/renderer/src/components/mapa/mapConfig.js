// ============================================================
// Configuración compartida para todos los componentes de mapa
// ============================================================

/** Coordenada central del municipio de Villa Pesqueira */
export const MAP_DEFAULT_CENTER = [29.1180777, -109.9669819];

/** TileLayer de OpenStreetMap */
export const TILE_LAYER = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap contributors',
};

/** TileLayer satelital puro (Google Maps) */
export const SATELLITE_LAYER = {
  url: 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  attribution: '&copy; Google Maps',
  subdomains: '0123',
  maxZoom: 20,
};

/** TileLayer híbrido: satélite + calles/etiquetas (Google Maps) */
export const HYBRID_LAYER = {
  url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  attribution: '&copy; Google Maps',
  subdomains: '0123',
  maxZoom: 20,
};

/** Estilo GeoJSON del límite municipal (con relleno sutil) */
export const MUNICIPIO_STYLE = {
  color: '#3b82f6',
  weight: 3,
  fillColor: 'rgba(59, 130, 246, 0.1)',
  fillOpacity: 0.1,
  dashArray: '5, 5',
};

/** Estilo GeoJSON del límite municipal (sin relleno — para SelectorCoordenadas) */
export const MUNICIPIO_STYLE_NO_FILL = {
  color: '#3b82f6',
  weight: 3,
  fillOpacity: 0,
  dashArray: '5, 5',
};

/** URLs CDN de los iconos por defecto de Leaflet */
export const LEAFLET_ICON_CDN = {
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
};
