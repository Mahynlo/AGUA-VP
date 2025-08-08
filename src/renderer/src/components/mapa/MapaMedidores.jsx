import React, { useEffect, useState, useMemo } from "react";
import { Card, CardBody, Chip } from '@nextui-org/react';
import { HiLocationMarker, HiCog, HiHashtag, HiCheck, HiX, HiWifi } from 'react-icons/hi';
import MarkerMap from "../../assets/svgs/Markador_azul_Agua_VP.svg";
import municipiojson from "../../../../public/VillaPesqueira.json";
import './MapaMedidores.css';

// Componente LeafletMap separado para evitar redefinición constante
const LeafletMap = React.memo(({ position, municipioData, medidores, setIsLoading, setMapError }) => {
  const [MapComponents, setMapComponents] = useState(null);

  useEffect(() => {
    const loadMapComponents = async () => {
      try {
        const leafletComponents = await import('react-leaflet');
        const L = await import('leaflet');
        
        // Fix para los iconos
        delete L.default.Icon.Default.prototype._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        setMapComponents(leafletComponents);
      } catch (error) {
        console.error('Error loading map components:', error);
        setMapError(true);
      }
    };

    loadMapComponents();
  }, [setMapError]);

  // Icono personalizado memoizado
  const customIcon = useMemo(() => {
    if (typeof window !== 'undefined' && window.L) {
      return new window.L.Icon({
        iconUrl: MarkerMap,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
    }
    return null;
  }, []);

  if (!MapComponents) return null;

  const { MapContainer, TileLayer, Marker, Popup, GeoJSON } = MapComponents;

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{ 
          height: "100%", 
          width: "100%", 
          borderRadius: "0.5rem",
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none"
        }}
        className="leaflet-container"
        whenCreated={() => {
          // Map está listo, remover loading
          setTimeout(() => setIsLoading(false), 500);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Delimitación de zona de cobertura */}
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

        {/* Marcadores de medidores con popups estilizados */}
        {medidores.map((medidor) => (
          <Marker
            key={medidor.id}
            position={[medidor.latitud, medidor.longitud]}
            icon={customIcon}
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
        ))}
      </MapContainer>
    </div>
  );
}, (prevProps, nextProps) => {
  // Función de comparación personalizada para optimizar re-renders
  return (
    prevProps.position[0] === nextProps.position[0] &&
    prevProps.position[1] === nextProps.position[1] &&
    prevProps.medidores?.length === nextProps.medidores?.length &&
    prevProps.municipioData === nextProps.municipioData
  );
});

LeafletMap.displayName = 'LeafletMap';

const MapaMedidores = ({ medidores = [] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [municipioData, setMunicipioData] = useState(null);

  // Memoizar la posición central para evitar re-renders innecesarios
  const position = useMemo(() => [29.1180777, -109.9669819], []);

  // Estadísticas de medidores memoizadas
  const estadisticas = useMemo(() => {
    const activos = medidores.filter(m => m.estado_medidor === "Activo").length;
    const asignados = medidores.filter(m => m.cliente_id !== null).length;
    
    return {
      total: medidores.length,
      activos,
      inactivos: medidores.length - activos,
      asignados,
      disponibles: medidores.length - asignados
    };
  }, [medidores]);

  // Cargar datos del municipio una sola vez
  useEffect(() => {
    setMunicipioData(municipiojson);
  }, []);

  useEffect(() => {
    // Verificar si react-leaflet está disponible
    const checkLeaflet = async () => {
      try {
        // Intentar cargar el componente dinámicamente
        const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet');
        await import('leaflet/dist/leaflet.css');
        
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error cargando Leaflet:', error);
        setMapError(true);
        setIsLoading(false);
      }
    };

    checkLeaflet();
  }, []);

  // Estado de error para mostrar fallback UI
  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Card className="max-w-md mx-auto bg-gradient-to-br from-red-50 to-red-100 backdrop-blur-md backdrop-saturate-150 border-red-200 shadow-xl">
          <CardBody className="p-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <HiX className="text-red-500 text-2xl" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-red-700 mb-2">Error al cargar el mapa</h3>
            <p className="text-red-600 text-sm mb-4">
              No se pudo cargar el componente del mapa. Verifica tu conexión a internet.
            </p>
            <button 
              onClick={() => {
                setMapError(false);
                setIsLoading(true);
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Reintentar
            </button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Estado de carga con efecto glassmorphism
  if (isLoading) {
    return (
      <div className="w-full h-full relative overflow-hidden">
        {/* Fondo con efecto de ondas */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 animate-pulse">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
        </div>
        
        {/* Contenido de loading */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
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
              
              {/* Mini estadísticas mientras carga */}
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
    );
  }

  return (
    <div className="w-full h-full relative">
      

      {/* Indicador de cobertura */}
      <div className="absolute top-4 right-4 z-[1000]">
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

      {/* Mapa principal */}
      <div className="w-full h-full rounded-lg overflow-hidden shadow-lg border border-gray-200">
        <LeafletMap
          position={position}
          municipioData={municipioData}
          medidores={medidores}
          setIsLoading={setIsLoading}
          setMapError={setMapError}
        />
      </div>
    </div>
  );
};

export default MapaMedidores;







