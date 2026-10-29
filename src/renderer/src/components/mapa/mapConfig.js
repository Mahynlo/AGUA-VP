// ============================================================
// Configuración compartida para todos los componentes de mapa
// ============================================================

/** Coordenada central del municipio de Villa Pesqueira */
export const MAP_DEFAULT_CENTER = [29.1180777, -109.9669819];

/** Zoom a partir del cual se muestran los números de orden de la ruta */
export const ZOOM_NUMEROS = 16;

/** TileLayer de OpenStreetMap (la clase permite oscurecer solo esta capa en modo oscuro) */
export const TILE_LAYER = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap contributors',
  className: 'aguavp-capa-calles',
  updateWhenIdle: true,
  updateWhenZooming: false,
  keepBuffer: 2,
};

/** TileLayer satelital puro (Google Maps) */
export const SATELLITE_LAYER = {
  url: 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  attribution: '&copy; Google Maps',
  subdomains: '0123',
  maxZoom: 20,
  updateWhenIdle: true,
  updateWhenZooming: false,
  keepBuffer: 2,
};

/** TileLayer híbrido: satélite + calles/etiquetas (Google Maps) */
export const HYBRID_LAYER = {
  url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  attribution: '&copy; Google Maps',
  subdomains: '0123',
  maxZoom: 20,
  updateWhenIdle: true,
  updateWhenZooming: false,
  keepBuffer: 2,
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

/**
 * Colores de los puntos, iguales en todos los mapas (y en sus leyendas).
 * Los puntos se dibujan en canvas (CircleMarker), mucho más ligeros que un icono por medidor.
 */
export const COLORES_PUNTO = {
  asignado: '#2563eb',   // medidor activo con cliente
  disponible: '#64748b', // sin cliente / fuera de la ruta
  inactivo: '#dc2626',   // medidor inactivo o retirado
  pendiente: '#f97316',  // en la ruta, sin lectura del período
  leido: '#16a34a',      // en la ruta, con lectura del período
};

/** Color de la línea de la ruta y de las conexiones de cada punto con el camino */
export const COLOR_RUTA = '#3b82f6';
export const COLOR_CONEXION = '#10b981';

/** Estilo de un punto (CircleMarker) según su color; `grande` para zoom cercano o el punto actual */
export const estiloPunto = (color, grande = false) => ({
  color: '#ffffff',
  weight: grande ? 2 : 1.5,
  fillColor: color,
  fillOpacity: 1,
});

/** Convierte latitud/longitud (número o texto) en [lat, lng] válido, o null */
export const coordenadas = (lat, lng) => {
  const la = Number.parseFloat(lat);
  const ln = Number.parseFloat(lng);
  return Number.isFinite(la) && Number.isFinite(ln) ? [la, ln] : null;
};
