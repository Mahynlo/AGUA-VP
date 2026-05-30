import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardBody } from '@nextui-org/react';
import { HiLocationMarker, HiCog, HiHashtag, HiCheck, HiX, HiWifi } from 'react-icons/hi';
import MarkerMap from "../../assets/svgs/Markador_azul_Agua_VP.svg";
import municipiojson from "../../../../public/VillaPesqueira.json";
import './MapaMedidores.css';
import { MAP_DEFAULT_CENTER, TILE_LAYER, SATELLITE_LAYER, HYBRID_LAYER, MUNICIPIO_STYLE } from './mapConfig';
import { useLeafletSetup } from './useLeafletSetup';
import OfflineTileLayer from './OfflineTileLayer';

// Tamaño de celda de agrupación por nivel de zoom (en grados).
// A zoom >= 16 se muestran todos los marcadores individuales.
const CLUSTER_CELL_SIZES = [
  { minZoom: 16, size: null   },
  { minZoom: 15, size: 0.0015 },
  { minZoom: 14, size: 0.003  },
  { minZoom:  0, size: 0.006  },
];

function computeClusters(medidores, zoom) {
  const entry = CLUSTER_CELL_SIZES.find(e => zoom >= e.minZoom);
  if (!entry?.size) {
    return medidores.map(m => ({ type: 'single', medidor: m }));
  }
  const { size } = entry;
  const cells = new Map();
  for (const m of medidores) {
    const key = `${Math.floor(m.latitud / size)},${Math.floor(m.longitud / size)}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(m);
  }
  return Array.from(cells.values()).map(group => {
    if (group.length === 1) return { type: 'single', medidor: group[0] };
    const lat = group.reduce((s, m) => s + m.latitud,  0) / group.length;
    const lng = group.reduce((s, m) => s + m.longitud, 0) / group.length;
    return { type: 'cluster', count: group.length, lat, lng, id: `cl-${group[0].id}` };
  });
}

// Rastrea zoom + límites visibles y notifica al padre cuando termina un movimiento.
// 'moveend' cubre tanto pan como zoom, así un solo listener basta.
const ViewTracker = React.memo(({ useMap, onViewChange }) => {
  const map = useMap();
  useEffect(() => {
    const update = () => onViewChange(map.getZoom(), map.getBounds().pad(0.25));
    update();
    map.on('moveend', update);
    return () => map.off('moveend', update);
  }, [map, onViewChange]);
  return null;
});

ViewTracker.displayName = 'ViewTracker';

// Componente invisible para ajustar tamaño e inicializar
const MapResizer = React.memo(({ useMap, onMapReady, setMapInstance }) => {
  const map = useMap();
  useEffect(() => {
    if (setMapInstance) setMapInstance(map);

    if (onMapReady) {
      const timer = setTimeout(() => {
        onMapReady(false);
        map.invalidateSize();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      map.invalidateSize();
    }
  }, [map, onMapReady, setMapInstance]);
  return null;
});

MapResizer.displayName = 'MapResizer';

// Componente del Mapa (Lógica interna)
const LeafletMap = React.memo(({ position, medidores, onMapReady, setMapError, selectedMedidor }) => {
  const { mapLibrary: MapLibrary, mapError: libError } = useLeafletSetup();
  const [mapInstance, setMapInstance] = useState(null);
  const [zoom, setZoom] = useState(13);
  const [bounds, setBounds] = useState(null);
  const markerRefs = React.useRef({});

  useEffect(() => {
    if (libError && setMapError) setMapError(true);
  }, [libError, setMapError]);

  // Navega al medidor seleccionado (zoom 18 = sin clustering)
  useEffect(() => {
    if (selectedMedidor && mapInstance && markerRefs.current[selectedMedidor.id]) {
      const marker = markerRefs.current[selectedMedidor.id];
      const { latitud, longitud } = selectedMedidor;
      requestAnimationFrame(() => {
        mapInstance.invalidateSize();
        mapInstance.setView([latitud, longitud], 18);
      });
      marker.openPopup();
    }
  }, [selectedMedidor, mapInstance]);

  const handleViewChange = useCallback((z, b) => {
    setZoom(z);
    setBounds(b);
  }, []);

  // Culling por viewport: solo renderizamos marcadores dentro de los límites visibles
  // (con 25% de margen). Reduce drásticamente el DOM en equipos sin GPU al hacer zoom.
  const visibleMedidores = useMemo(() => {
    if (!medidores?.length) return [];
    if (!bounds) return medidores; // primer render: zoom 13, ya muy agrupado (barato)
    const dentro = medidores.filter(
      (m) =>
        Number.isFinite(m.latitud) &&
        Number.isFinite(m.longitud) &&
        bounds.contains([m.latitud, m.longitud])
    );
    // El medidor seleccionado siempre se renderiza, aunque quede fuera de vista.
    if (selectedMedidor && !dentro.some((m) => m.id === selectedMedidor.id)) {
      const sel = medidores.find((m) => m.id === selectedMedidor.id);
      if (sel) dentro.push(sel);
    }
    return dentro;
  }, [medidores, bounds, selectedMedidor]);

  const customIcon = useMemo(() => {
    if (!MapLibrary?.L) return null;
    return new MapLibrary.L.Icon({
      iconUrl: MarkerMap,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  }, [MapLibrary]);

  const makeClusterIcon = useCallback((count) => {
    if (!MapLibrary?.L) return null;
    const size = count < 10 ? 36 : count < 100 ? 44 : 52;
    return new MapLibrary.L.DivIcon({
      html: `<div class="aguavp-cluster" style="width:${size}px;height:${size}px;line-height:${size}px;">${count}</div>`,
      className: '',
      iconSize: [size, size],
    });
  }, [MapLibrary]);

  // Reagrupa los marcadores visibles según el zoom actual
  const clusters = useMemo(
    () => (visibleMedidores.length ? computeClusters(visibleMedidores, zoom) : []),
    [visibleMedidores, zoom]
  );

  const MarkersRendered = useMemo(() => {
    if (!MapLibrary || !customIcon || !clusters.length) return null;
    const { Marker, Popup } = MapLibrary;

    return clusters.map((item) => {
      if (item.type === 'cluster') {
        return (
          <Marker
            key={item.id}
            position={[item.lat, item.lng]}
            icon={makeClusterIcon(item.count)}
          />
        );
      }

      const medidor = item.medidor;
      return (
        <Marker
          key={medidor.id}
          position={[medidor.latitud, medidor.longitud]}
          icon={customIcon}
          ref={(element) => {
            if (element) {
              markerRefs.current[medidor.id] = element;
            } else {
              delete markerRefs.current[medidor.id];
            }
          }}
        >
          <Popup className="custom-popup">
            <div className="p-4 min-w-[280px] bg-white/95 rounded-t-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
                  <HiCog className="text-white text-base" />
                </div>
                <h3 className="text-base font-bold text-gray-900 flex-1">
                  Medidor {medidor.numero_serie}
                </h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-md shadow-sm ${medidor.estado_medidor === "Activo" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                  {medidor.estado_medidor}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg">
                  <HiLocationMarker className="text-purple-600 text-lg flex-shrink-0" />
                  <span className="text-gray-800 font-medium">
                    {medidor.ubicacion || "Ubicación no especificada"}
                  </span>
                </div>

                <div className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
                  <HiHashtag className="text-orange-600 text-lg flex-shrink-0" />
                  <span className="text-gray-800 font-medium">
                    Serie: <span className="font-mono font-bold text-orange-700">{medidor.numero_serie}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  {medidor.cliente_id ? (
                    <>
                      <HiCheck className="text-green-600 text-lg flex-shrink-0" />
                      <span className="text-green-700 font-semibold">Asignado a cliente</span>
                    </>
                  ) : (
                    <>
                      <HiX className="text-red-600 text-lg flex-shrink-0" />
                      <span className="text-red-700 font-semibold">Disponible para asignar</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                  <span className="text-lg">🏙️</span>
                  <span className="text-blue-800 font-medium">Villa Pesqueira, Sonora</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">Coordenadas:</span>
                  <span className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded font-semibold">
                    {medidor.latitud?.toFixed(6)}, {medidor.longitud?.toFixed(6)}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-center">
                <span className="inline-flex items-center gap-1 text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full font-medium">
                  📍 Zona de Cobertura
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [MapLibrary, customIcon, clusters, makeClusterIcon]);

  if (!MapLibrary) return null;

  const { MapContainer, TileLayer, GeoJSON, useMap, LayersControl } = MapLibrary;

  return (
    <div className="h-full w-full">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={true}
        preferCanvas={true}
        className="h-full w-full leaflet-container"
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem", background: "transparent" }}
        whenReady={(map) => {
          setMapInstance(map.target);
        }}
      >
        <ViewTracker useMap={useMap} onViewChange={handleViewChange} />
        <MapResizer useMap={useMap} onMapReady={onMapReady} setMapInstance={setMapInstance} />

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

        <GeoJSON data={municipiojson} style={MUNICIPIO_STYLE} interactive={false} />

        {MarkersRendered}
      </MapContainer>
    </div>
  );
}, (prev, next) => {
  return (
    prev.position[0] === next.position[0] &&
    prev.position[1] === next.position[1] &&
    prev.medidores === next.medidores &&
    prev.selectedMedidor === next.selectedMedidor
  );
});

LeafletMap.displayName = 'LeafletMap';

const MapaMedidores = ({ medidores = [], selectedMedidor }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

  const estadisticas = useMemo(() => {
    if (!medidores || medidores.length === 0) return { total: 0, activos: 0, asignados: 0 };
    return medidores.reduce(
      (acc, m) => {
        if (m.estado_medidor === "Activo") acc.activos++;
        if (m.cliente_id) acc.asignados++;
        return acc;
      },
      { total: medidores.length, activos: 0, asignados: 0 }
    );
  }, [medidores]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-red-200">
        <div className="text-center text-red-500">
          <HiX className="text-4xl mx-auto mb-2" />
          <p>No se pudo cargar el mapa</p>
          <button onClick={() => window.location.reload()} className="text-sm underline mt-2">Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg border border-gray-200 isolate">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <div className="relative z-10 p-8">
            <Card className="max-w-md mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl">
              <CardBody className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <HiLocationMarker className="text-white text-3xl" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-3">
                  Cargando Mapa de Medidores
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-400 to-purple-500 h-1 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Preparando visualización de {medidores.length} medidores...
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                    <div className="font-medium text-green-600">Activos</div>
                    <div className="text-lg font-bold text-green-700">{estadisticas.activos}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                    <div className="font-medium text-blue-600">Asignados</div>
                    <div className="text-lg font-bold text-blue-700">{estadisticas.asignados}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="absolute top-4 right-4 z-[400]">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <HiWifi className="text-blue-500 text-sm" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Villa Pesqueira</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <LeafletMap
        position={MAP_DEFAULT_CENTER}
        medidores={medidores}
        onMapReady={setIsLoading}
        setMapError={setMapError}
        selectedMedidor={selectedMedidor}
      />
    </div>
  );
};

export default React.memo(MapaMedidores);
