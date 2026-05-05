import { useMemo, useCallback, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Popup,
  CircleMarker,
  Marker,
  Tooltip,
  useMapEvents,
  LayersControl,
} from "react-leaflet";
import { LatLng, Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import './MapaMedidores.css';
import markerIcon from "../../assets/svgs/Markador_azul_Agua_VP.svg";
import { MAP_DEFAULT_CENTER, TILE_LAYER, SATELLITE_LAYER, HYBRID_LAYER } from './mapConfig';
import OfflineTileLayer from './OfflineTileLayer';

const MOSTRAR_NUMEROS_ZOOM = 16;

// 🔥 OPTIMIZACIÓN 1: El ZoomHandler ahora solo avisa cuando cruzamos el umbral (de <16 a >=16), 
// evitando que todo el componente se re-renderice en cada pequeño scroll del ratón.
const ZoomThresholdHandler = ({ isZoomedIn, onThresholdChange }) => {
  useMapEvents({
    zoomend: (e) => {
      const currentZoom = e.target.getZoom();
      const isCurrentlyZoomedIn = currentZoom >= MOSTRAR_NUMEROS_ZOOM;
      if (isZoomedIn !== isCurrentlyZoomedIn) {
        onThresholdChange(isCurrentlyZoomedIn);
      }
    },
  });
  return null;
};

// 🔥 OPTIMIZACIÓN 2: Reducción del uso de memoria (Garbage Collector).
// Se eliminó la creación de `new LatLng` dentro del bucle. Solo se crea el candidato.
const getClosestPoint = (punto, ruta) => {
  if (!ruta || ruta.length < 2) return { closest: null, distance: Infinity };

  const pLatLng = new LatLng(punto[0], punto[1]);
  const [py, px] = punto; // lat, lng
  let minDist = Infinity;
  let closest = null;

  for (let i = 0; i < ruta.length - 1; i++) {
    const [ay, ax] = ruta[i];
    const [by, bx] = ruta[i + 1];

    const abx = bx - ax, aby = by - ay;
    const apx = px - ax, apy = py - ay;

    const ab_ap = abx * apx + aby * apy;
    const ab_ab = abx * abx + aby * aby;
    
    let t = ab_ab === 0 ? 0 : ab_ap / ab_ab;
    t = Math.max(0, Math.min(1, t));

    const closestX = ax + abx * t;
    const closestY = ay + aby * t;

    // Solo instanciamos el candidato final para usar la fórmula geodésica de Leaflet
    const candidate = new LatLng(closestY, closestX);
    const dist = pLatLng.distanceTo(candidate);

    if (dist < minDist) {
      minDist = dist;
      closest = [closestY, closestX];
    }
  }

  return { closest, distance: minDist };
};

export default function MapaRutas({
  medidores = [],
  puntosRuta = [],
  rutaCalculada,
  dibujar,
  onAgregarMedidor,
  onEliminarMedidor,
  readOnly = false,
}) {
  // Ahora guardamos un booleano, no el nivel exacto de zoom
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  const customIcon = useMemo(() => new Icon({
    iconUrl: markerIcon,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35],
  }), []);

  // 🔥 OPTIMIZACIÓN 3: Diccionario O(1) para búsquedas instantáneas
  // Evita iterar el array completo de medidores por cada punto en la ruta
  const medidoresDict = useMemo(() => {
    const dict = new Map();
    for (const m of medidores) {
      dict.set(m.id, m);
    }
    return dict;
  }, [medidores]);

  const inicio = puntosRuta[0];
  const fin = puntosRuta[puntosRuta.length - 1];

  const conexionesExtremos = useMemo(() => {
    const conexiones = [];
    if (!readOnly && dibujar && rutaCalculada?.ruta?.length >= 2) {
      if (inicio) {
        const { closest, distance } = getClosestPoint([inicio.lat, inicio.lng], rutaCalculada.ruta);
        if (distance > 5) conexiones.push({ key: "conex-inicio", from: [inicio.lat, inicio.lng], to: closest });
      }
      if (fin) {
        const { closest, distance } = getClosestPoint([fin.lat, fin.lng], rutaCalculada.ruta);
        if (distance > 5) conexiones.push({ key: "conex-fin", from: [fin.lat, fin.lng], to: closest });
      }
    }
    return conexiones;
  }, [inicio, fin, rutaCalculada, dibujar, readOnly]);

  const conexionesIntermedias = useMemo(() => {
    const conexiones = [];
    if (!readOnly && dibujar && rutaCalculada?.puntos_gps?.length > 0 && rutaCalculada?.ruta?.length >= 2) {
       rutaCalculada.puntos_gps.forEach((punto, idx) => {
        const { closest, distance } = getClosestPoint(punto, rutaCalculada.ruta);
        if (distance > 5) {
          conexiones.push({ key: `conex-${idx}`, from: punto, to: closest });
        }
      });
    }
    return conexiones;
  }, [rutaCalculada, dibujar, readOnly]);

  const medidoresEnRutaIds = useMemo(() => new Set(puntosRuta.map((p) => p.id)), [puntosRuta]);

  const handleToggleMedidor = useCallback((medidor, enRuta) => {
    if (enRuta) {
      const index = puntosRuta.findIndex((p) => p.id === medidor.id);
      if (index !== -1) onEliminarMedidor(index);
    } else {
      onAgregarMedidor({ id: medidor.id, lat: medidor.latitud, lng: medidor.longitud, numero_serie: medidor.numero_serie });
    }
  }, [puntosRuta, onAgregarMedidor, onEliminarMedidor]);

  // 🔥 OPTIMIZACIÓN 4: Renderizados de marcadores memorizados
  // Si dibujas una línea o agregas un punto, los medidores que NO cambiaron no se vuelven a procesar.
  const MarkersDisponibles = useMemo(() => {
    return medidores.map((medidor) => {
      if (medidoresEnRutaIds.has(medidor.id)) return null;

      return (
        <Marker key={medidor.id} position={[medidor.latitud, medidor.longitud]} icon={customIcon}>
          <Popup className="custom-popup" closeButton={false} autoPanPadding={[40, 40]}>
            <div className="p-2 min-w-[220px]">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-neutral-700">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-full flex-shrink-0">
                  <span className="text-sm">💧</span>
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                  Serie: {medidor.numero_serie}
                </h3>
              </div>
              {!readOnly && (
                <button
                  onClick={() => handleToggleMedidor(medidor, false)}
                  className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  <><span>➕</span> Agregar a ruta</>
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [medidores, medidoresEnRutaIds, customIcon, readOnly, handleToggleMedidor]);

  const MarkersEnRuta = useMemo(() => {
    const currentRadius = isZoomedIn ? 11 : 6;

    return puntosRuta.map((p, i) => {
      // 🔥 Uso del Diccionario O(1) en lugar de medidores.find() O(N)
      const medidorCompleto = medidoresDict.get(p.id) || p;

      return (
        <CircleMarker
          key={`punto-${p.id || i}`}
          center={[p.lat, p.lng]}
          radius={currentRadius}
          pathOptions={{
            color: "#ffffff",
            fillColor: "#f97316",
            fillOpacity: 1,
            weight: isZoomedIn ? 2 : 1
          }}
        >
          {isZoomedIn && (
            <Tooltip direction="center" offset={[0, 0]} opacity={1} permanent className="leaflet-tooltip-own">
              {i + 1}
            </Tooltip>
          )}

          <Popup className="custom-popup" closeButton={false} autoPanPadding={[40, 40]}>
            <div className="p-2 min-w-[220px]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-neutral-700">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-full flex-shrink-0 font-black text-xs w-6 h-6 flex items-center justify-center">
                    {i + 1}
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                    Serie: {medidorCompleto.numero_serie}
                  </h3>
                </div>
              </div>
              {!readOnly && (
                <button
                  onClick={() => handleToggleMedidor(medidorCompleto, true)}
                  className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20"
                >
                  <><span>🗑</span> Quitar de ruta</>
                </button>
              )}
            </div>
          </Popup>
        </CircleMarker>
      );
    });
  }, [puntosRuta, medidoresDict, isZoomedIn, readOnly, handleToggleMedidor]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-neutral-800 relative z-0">
      <MapContainer
        center={MAP_DEFAULT_CENTER}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        className="leaflet-container h-full w-full bg-gray-50 dark:bg-neutral-900"
      >
        <ZoomThresholdHandler isZoomedIn={isZoomedIn} onThresholdChange={setIsZoomedIn} />

        <LayersControl position="bottomright">
          <LayersControl.BaseLayer checked name="🌐 Mapa Calles">
            <OfflineTileLayer {...TILE_LAYER} />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🛰️ Satélite">
            <TileLayer {...SATELLITE_LAYER} />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🗺️ Híbrido">
            <TileLayer {...HYBRID_LAYER} />
          </LayersControl.BaseLayer>
        </LayersControl>

        {dibujar && rutaCalculada?.ruta?.length >= 2 && (
          <Polyline positions={rutaCalculada.ruta.map(([lat, lng]) => [lat, lng])} pathOptions={{ color: "#3b82f6", weight: 5, opacity: 0.85, lineCap: "round", lineJoin: "round" }} />
        )}
        {conexionesExtremos.map(({ key, from, to }) => (
          <Polyline key={key} positions={[from, to]} pathOptions={{ color: "#10b981", dashArray: "8, 8", weight: 3, opacity: 0.8 }} />
        ))}
        {conexionesIntermedias.map(({ key, from, to }) => (
          <Polyline key={key} positions={[from, to]} pathOptions={{ color: "#10b981", dashArray: "4, 8", weight: 2, opacity: 0.6 }} />
        ))}

        {MarkersDisponibles}
        {MarkersEnRuta}
      </MapContainer>

      <style>{`
        .leaflet-tooltip.leaflet-tooltip-own {
          background-color: transparent;
          border: none;
          box-shadow: none;
          font-size: 11px;
          font-weight: 800;
          color: white;
          text-shadow: 0px 1px 2px rgba(0,0,0,0.5);
        }
        .leaflet-tooltip.leaflet-tooltip-own::before {
          display: none;
        }
        .leaflet-control-layers {
          border: none !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }
      `}</style>
    </div>
  );
}
