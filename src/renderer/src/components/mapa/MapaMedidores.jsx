import React, { useEffect, useState, useMemo } from "react";
import { Card, CardBody, Chip } from '@nextui-org/react';
import { HiLocationMarker, HiCog, HiHashtag, HiCheck, HiX, HiWifi, HiUser } from 'react-icons/hi';
import MarkerMap from "../../assets/svgs/Markador_azul_Agua_VP.svg";
import municipiojson from "../../../../public/VillaPesqueira.json";
import './MapaMedidores.css';

// 1. Componente invisible para ajustar tamaño e inicializar
const MapResizer = ({ useMap, onMapReady, setMapInstance }) => {
  const map = useMap();
  useEffect(() => {
    // 1. Guardar instancia del mapa
    if (setMapInstance) setMapInstance(map);

    // 2. Avisar que el mapa está listo
    if (onMapReady) {
      console.log("MapResizer: Signaling Map Ready");
      // Pequeño delay para asegurar renderizado visual
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
};

// 2. Componente del Mapa (Lógica interna)
const LeafletMap = React.memo(({ position, municipioData, medidores, onMapReady, setMapError, selectedMedidor }) => {
  const [MapLibrary, setMapLibrary] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const markerRefs = React.useRef({});

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      try {
        if (typeof window !== "undefined") {
          const L = (await import("leaflet")).default;
          const ReactLeaflet = await import("react-leaflet");

          // Fix leaflet icons
          delete L.Icon.Default.prototype._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          });

          if (isMounted) {
            setMapLibrary({ ...ReactLeaflet, L });
          }
        }
      } catch (error) {
        console.error("Error loading map:", error);
        if (isMounted && setMapError) setMapError(true);
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [setMapError]);

  // Efecto para mover el mapa cuando cambia el medidor seleccionado
  useEffect(() => {
    if (selectedMedidor && mapInstance && markerRefs.current[selectedMedidor.id]) {
      const marker = markerRefs.current[selectedMedidor.id];
      const { latitud, longitud } = selectedMedidor;

      // 0. Asegurar que el mapa conoce su tamaño real (sin bloquear el render)
      requestAnimationFrame(() => {
        mapInstance.invalidateSize();

        // 1. Mover el mapa (flyTo natural, sin forzar duración)
        // Leaflet calculará la duración basada en la distancia (physics-based)
        mapInstance.flyTo([latitud, longitud], 18, {
          animate: true,
          easeLinearity: 0.25
        });
      });

      // 2. Abrir el popup
      marker.openPopup();
    }
  }, [selectedMedidor, mapInstance]);

  const customIcon = useMemo(() => {
    if (MapLibrary?.L) {
      return new MapLibrary.L.Icon({
        iconUrl: MarkerMap,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
    }
    return null;
  }, [MapLibrary]);

  // Renderizado de marcadores
  const MarkersRendered = useMemo(() => {
    if (!MapLibrary || !customIcon || !medidores) return null;
    const { Marker, Popup } = MapLibrary;

    return medidores.map((medidor) => (
      <Marker
        key={medidor.id}
        position={[medidor.latitud, medidor.longitud]}
        icon={customIcon}
        ref={(element) => {
          if (element) markerRefs.current[medidor.id] = element;
        }}
      >
        <Popup className="custom-popup">
          {/* ... (Popup content remains same) ... */}
          <div className="p-4 min-w-[280px] bg-white/95 rounded-t-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
                <HiCog className="text-white text-base" />
              </div>
              <h3 className="text-base font-bold text-gray-900 flex-1">
                Medidor {medidor.numero_serie}
              </h3>
              <Chip
                size="sm"
                color={medidor.estado_medidor === "Activo" ? "success" : "danger"}
                variant="solid"
                className="font-semibold shadow-sm"
              >
                {medidor.estado_medidor}
              </Chip>
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
    ));
  }, [MapLibrary, customIcon, medidores]);

  if (!MapLibrary) return null;

  const { MapContainer, TileLayer, GeoJSON, useMap } = MapLibrary;

  return (
    <div className="h-full w-full">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={true}
        className="h-full w-full leaflet-container"
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem", background: "transparent" }}
        whenReady={(map) => {
          setMapInstance(map.target);
          setTimeout(() => onMapReady(false), 500);
        }}
      >
        <MapResizer useMap={useMap} />

        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {municipioData && (
          <GeoJSON
            data={municipioData}
            style={{
              color: "#3b82f6",
              weight: 3,
              fillColor: "rgba(59, 130, 246, 0.1)",
              fillOpacity: 0.1,
              dashArray: "5, 5"
            }}
          />
        )}

        {MarkersRendered}
      </MapContainer>
    </div>
  );
}, (prev, next) => {
  return (
    prev.position[0] === next.position[0] &&
    prev.medidores === next.medidores &&
    prev.municipioData === next.municipioData &&
    prev.selectedMedidor === next.selectedMedidor // Important: Re-render if selection changes
  );
});

LeafletMap.displayName = 'LeafletMap';

const MapaMedidores = ({ medidores = [], selectedMedidor }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [municipioData, setMunicipioData] = useState(null);

  const position = useMemo(() => [29.1180777, -109.9669819], []);

  const estadisticas = useMemo(() => {
    if (!medidores) return { total: 0, activos: 0, asignados: 0 };
    const total = medidores.length;
    const activos = medidores.filter(m => m.estado_medidor === "Activo").length;
    const asignados = medidores.filter(m => m.cliente_id).length;
    return { total, activos, asignados };
  }, [medidores]);

  // Safety Timeout: Force loading to false if map hangs
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setMunicipioData(municipiojson);
  }, []);

  // Renderizado de error
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

      {/* LOADING OVERLAY - Se muestra SOBRE el mapa, no EN LUGAR DEL mapa */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center">
          {/* Fondo con efecto de ondas */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 animate-pulse">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
          </div>

          {/* Contenido de loading (Tus estilos originales) */}
          <div className="relative z-10 p-8">
            <Card className="max-w-md mx-auto bg-white/60 backdrop-blur-xl backdrop-saturate-150 border border-white/30 shadow-2xl">
              <CardBody className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center animate-bounce">
                    <HiLocationMarker className="text-white text-3xl" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-700 mb-3">
                  Cargando Mapa de Medidores
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-400 to-purple-500 h-1 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Preparando visualización de {medidores.length} medidores...
                  </p>
                </div>

                {/* Mini estadísticas */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2">
                    <div className="font-medium text-green-600">Activos</div>
                    <div className="text-lg font-bold text-green-700">{estadisticas.activos}</div>
                  </div>
                  <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2">
                    <div className="font-medium text-blue-600">Asignados</div>
                    <div className="text-lg font-bold text-blue-700">{estadisticas.asignados}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Indicador Flotante (Se oculta durante carga para no ensuciar) */}
      {!isLoading && (
        <div className="absolute top-4 right-4 z-[400]">
          <Card className="bg-white/80 backdrop-blur-xl backdrop-saturate-150 border border-white/40 shadow-xl">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <HiWifi className="text-blue-500 text-sm" />
                <span className="text-xs font-medium text-gray-700">Villa Pesqueira</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* El Mapa se renderiza siempre para que pueda inicializarse */}
      <LeafletMap
        position={position}
        municipioData={municipioData}
        medidores={medidores}
        onMapReady={setIsLoading} // Pasamos la función para apagar el loading
        setMapError={setMapError}
        selectedMedidor={selectedMedidor}
      />
    </div>
  );
};

export default React.memo(MapaMedidores);







