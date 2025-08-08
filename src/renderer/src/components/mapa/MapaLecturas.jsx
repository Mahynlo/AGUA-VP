import React, { useEffect, useState, useMemo } from "react";
import { Card, CardBody, Chip } from '@nextui-org/react';
import { HiLocationMarker, HiUser, HiHashtag } from 'react-icons/hi';
import MarkerMap from "../../assets/svgs/Markador_azul_Agua_VP.svg";
import municipiojson from "../../../../public/VillaPesqueira.json";
import './MapaMedidores.css';

// Componente LeafletMap separado para evitar redefinición constante
const LeafletMap = React.memo(({ position, municipioData, lat, lng, cliente, setIsLoading, setMapError }) => {
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
        zoom={16}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
        className="leaflet-container"
        whenCreated={() => {
          // Map está listo, remover loading
          setTimeout(() => setIsLoading(false), 500);
        }}
      >
        <TileLayer
          
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

        {/* Marcador del medidor */}
        {lat && lng && (
          <Marker position={position} icon={customIcon}>
            <Popup className="custom-popup">
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1 bg-blue-100 rounded-full">
                    <HiUser className="text-blue-600 text-sm" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">{cliente?.nombre}</h3>
                </div>
                
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <HiLocationMarker className="text-purple-500" />
                    <span>{cliente?.dirección}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <HiHashtag className="text-orange-500" />
                    <span>Medidor: {cliente?.medidor}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span>🏙️</span>
                    <span>{cliente?.ciudad}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Coordenadas:</span>
                    <span className="font-mono text-gray-700">
                      {lat?.toFixed(6)}, {lng?.toFixed(6)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-blue-600 font-medium">
                  📍 Zona de Cobertura: Villa Pesqueira
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}, (prevProps, nextProps) => {
  // Función de comparación personalizada para el componente LeafletMap
  return (
    prevProps.position[0] === nextProps.position[0] &&
    prevProps.position[1] === nextProps.position[1] &&
    prevProps.lat === nextProps.lat &&
    prevProps.lng === nextProps.lng &&
    prevProps.cliente?.id === nextProps.cliente?.id &&
    prevProps.cliente?.nombre === nextProps.cliente?.nombre &&
    prevProps.cliente?.medidor === nextProps.cliente?.medidor &&
    prevProps.municipioData === nextProps.municipioData
  );
});

LeafletMap.displayName = 'LeafletMap';

const MapaLecturas = ({ lat, lng, cliente }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [municipioData, setMunicipioData] = useState(null);

  // Memoizar la posición para evitar re-renders innecesarios
  const position = useMemo(() => [lat || 29.567, lng || -109.456], [lat, lng]);

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

  // Si hay error, mostrar mapa fallback
  if (mapError || !window.L) {
    return (
      <div className="relative h-full w-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg overflow-hidden">
        {/* Fondo de mapa estático */}
        <div className="absolute inset-0 opacity-30">
          <div className="grid grid-cols-8 h-full">
            {Array.from({ length: 64 }, (_, i) => (
              <div key={i} className={`border border-gray-300 dark:border-gray-600 ${Math.random() > 0.7 ? 'bg-green-200 dark:bg-green-800' : 'bg-blue-100 dark:bg-blue-900'}`} />
            ))}
          </div>
        </div>

        {/* Marcador central con icono personalizado */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
              <HiLocationMarker className="text-white text-lg" />
            </div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rotate-45"></div>
            {/* Sombra del marcador */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-black/20 rounded-full blur-sm"></div>
          </div>
        </div>

        {/* Delimitación de zona (representación visual) */}
        <div className="absolute inset-4 border-2 border-dashed border-blue-400 rounded-lg opacity-30 pointer-events-none"></div>

        {/* Información del cliente overlay */}
        <div className="absolute top-4 left-4 z-10">
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardBody className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-gray-800 dark:text-white">
                  {cliente?.nombre}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Medidor: {cliente?.medidor}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Información de ubicación */}
        <div className="absolute bottom-4 left-4 z-10">
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardBody className="p-3">
              <div className="flex items-center gap-2 text-xs">
                <Chip size="sm" color="warning" variant="flat">
                  MAPA ESTÁTICO
                </Chip>
                <span className="text-gray-600 dark:text-gray-300 font-mono">
                  {lat?.toFixed(6)}, {lng?.toFixed(6)}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                📍 {cliente?.ciudad}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Información detallada */}
        <div className="absolute bottom-4 right-4 z-10">
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg max-w-xs">
            <CardBody className="p-3">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <HiUser className="text-blue-500" />
                  <span className="font-semibold">{cliente?.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiLocationMarker className="text-purple-500" />
                  <span>{cliente?.dirección}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiHashtag className="text-orange-500" />
                  <span>Medidor: {cliente?.medidor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🏙️</span>
                  <span>{cliente?.ciudad}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-1 text-blue-600">
                    <span>📍</span>
                    <span className="font-medium">Zona: Villa Pesqueira</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-blue-600 dark:text-blue-400 font-medium">Cargando mapa...</p>
          </div>
        </div>
      )}

      <LeafletMap 
        position={position}
        municipioData={municipioData}
        lat={lat}
        lng={lng}
        cliente={cliente}
        setIsLoading={setIsLoading}
        setMapError={setMapError}
      />

      {/* Información de ubicación */}
      {!isLoading && (
        <div className="absolute bottom-4 left-4 z-[1000]">
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardBody className="p-3">
              <div className="flex items-center gap-2 text-xs">
                <Chip size="sm" color="success" variant="flat">
                  GPS
                </Chip>
                <span className="text-gray-600 dark:text-gray-300 font-mono">
                  {lat?.toFixed(6)}, {lng?.toFixed(6)}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                📍 {cliente?.ciudad}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Información del cliente overlay */}
      {!isLoading && (
        <div className="absolute top-4 right-4 z-[1000]">
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardBody className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-gray-800 dark:text-white">
                  {cliente?.nombre}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Medidor: {cliente?.medidor}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

// Función de comparación para React.memo - solo re-renderizar si cambian las coordenadas o el cliente
MapaLecturas.displayName = 'MapaLecturas';

export default React.memo(MapaLecturas, (prevProps, nextProps) => {
  return (
    prevProps.lat === nextProps.lat &&
    prevProps.lng === nextProps.lng &&
    prevProps.cliente?.id === nextProps.cliente?.id &&
    prevProps.cliente?.nombre === nextProps.cliente?.nombre &&
    prevProps.cliente?.medidor === nextProps.cliente?.medidor
  );
});
