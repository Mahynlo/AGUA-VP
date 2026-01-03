import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, GeoJSON, useMapEvents, useMap } from "react-leaflet";
import { Card, CardBody } from "@nextui-org/react";
import { HiLocationMarker, HiGlobeAlt, HiMap } from "react-icons/hi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Importaciones de recursos
import municipiojson from "../../../../public/VillaPesqueira.json";
import ubicacionIcon from "../../assets/svgs/Markador_azul_Agua_VP.svg";

// 1. Componente para corregir tamaño (Vital para Modals)
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// 2. Componente para manejar clicks en el mapa
const LocationMarker = ({ position, onSelect, icon }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      // Actualizamos los inputs con 6 decimales
      onSelect({
        lat: lat.toFixed(6),
        lng: lng.toFixed(6)
      });
    },
  });

  return position ? <Marker position={position} icon={icon} /> : null;
};

// 3. Componente para mover el mapa suavemente
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom(), { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

export default function SelectorCoordenadas({
  valorInicial = { lat: "29.1180777", lng: "-109.9669819" },
  onChange,
}) {
  const [coordenadas, setCoordenadas] = useState(valorInicial);

  // Icono memoizado
  const customIcon = useMemo(() => {
    return new L.Icon({
      iconUrl: ubicacionIcon,
      iconSize: [35, 35],
      iconAnchor: [17, 35],
      popupAnchor: [0, -30],
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      shadowSize: [35, 35]
    });
  }, []);

  // Sync internal state with prop changes - Deep compare to avoid loops on new object references
  useEffect(() => {
    if (valorInicial) {
      setCoordenadas(prev => {
        // Only update if significantly different
        if (prev.lat == valorInicial.lat && prev.lng == valorInicial.lng) return prev;
        return valorInicial;
      });
    }
  }, [JSON.stringify(valorInicial)]);

  // Sync internal state with prop changes
  useEffect(() => {
    if (valorInicial) {
      setCoordenadas(valorInicial);
    }
  }, [valorInicial]);

  // Notificar al padre solo si son válidas
  useEffect(() => {
    const lat = parseFloat(coordenadas.lat);
    const lng = parseFloat(coordenadas.lng);
    if (!isNaN(lat) && !isNaN(lng) && onChange) {
      onChange({ lat, lng });
    }
  }, [coordenadas, onChange]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Permitir escribir sin bloquear signos negativos o puntos
    setCoordenadas((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Calcular posición válida para el mapa
  const position = useMemo(() => {
    const lat = parseFloat(coordenadas.lat);
    const lng = parseFloat(coordenadas.lng);
    return (!isNaN(lat) && !isNaN(lng)) ? [lat, lng] : null;
  }, [coordenadas.lat, coordenadas.lng]);

  const defaultCenter = [29.1180777, -109.9669819];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

      {/* Columna Izquierda: Mapa */}
      <div className="lg:col-span-2 h-[300px] lg:h-full min-h-[300px] rounded-xl overflow-hidden shadow-md border-2 border-gray-200 dark:border-gray-700 relative z-0">
        <MapContainer
          center={position || defaultCenter}
          zoom={15}
          scrollWheelZoom={true}
          className="h-full w-full bg-gray-100" // Fondo gris mientras carga
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <MapResizer />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />

          {/* Capa del Municipio SIN RELLENO */}
          <GeoJSON
            data={municipiojson}
            style={{
              color: "#3b82f6",   // Color del borde (Azul)
              weight: 3,          // Grosor del borde
              fillOpacity: 0,     // <--- IMPORTANTE: Transparencia total del relleno
              dashArray: "5, 5"   // Borde punteado
            }}
          />

          <LocationMarker
            position={position}
            onSelect={setCoordenadas}
            icon={customIcon}
          />

          <MapUpdater center={position} />
        </MapContainer>

        {/* Badge de coordenadas */}
        <div className="absolute top-3 right-3 z-[400] bg-white/90 dark:bg-black/80 backdrop-blur px-3 py-1 rounded-full text-xs font-mono border border-gray-200 dark:border-gray-700 shadow-sm">
          {position ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : "Selecciona un punto"}
        </div>
      </div>

      {/* Columna Derecha: Inputs Personalizados */}
      <div className="flex flex-col justify-center space-y-5">

        {/* Input Latitud */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Latitud
          </label>
          <div className="relative w-full flex">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg border-r border-gray-300 dark:border-gray-600 pr-2 py-1">
              <HiLocationMarker className="text-blue-600" />
            </span>
            <input
              type="text"
              name="lat"
              placeholder="Ej: 29.118..."
              value={coordenadas.lat}
              onChange={handleInputChange}
              className="border border-gray-300 focus:ring-blue-600 focus:border-blue-500 text-gray-600 rounded-xl pl-12 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200 font-mono text-sm"
            />
          </div>
        </div>

        {/* Input Longitud */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Longitud
          </label>
          <div className="relative w-full flex">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg border-r border-gray-300 dark:border-gray-600 pr-2 py-1">
              <HiGlobeAlt className="text-blue-600" />
            </span>
            <input
              type="text"
              name="lng"
              placeholder="Ej: -109.96..."
              value={coordenadas.lng}
              onChange={handleInputChange}
              className="border border-gray-300 focus:ring-blue-600 focus:border-blue-500 text-gray-600 rounded-xl pl-12 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200 font-mono text-sm"
            />
          </div>
        </div>

        <Card className="border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/20 shadow-none mt-2">
          <CardBody className="p-3 flex gap-3 items-start">
            <HiMap className="text-blue-500 text-xl mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Haz clic en el mapa para capturar la ubicación exacta del medidor automáticamente.
            </p>
          </CardBody>
        </Card>

      </div>
    </div>
  );
}




