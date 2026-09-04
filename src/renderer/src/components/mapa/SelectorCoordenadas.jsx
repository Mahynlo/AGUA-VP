import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, GeoJSON, useMapEvents, useMap, LayersControl } from "react-leaflet";
import { Card, CardBody } from "@nextui-org/react";
import { HiLocationMarker, HiGlobeAlt, HiMap } from "react-icons/hi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Importaciones de recursos
import municipiojson from "../../../../public/VillaPesqueira.json";
import ubicacionIcon from "../../assets/svgs/Markador_azul_Agua_VP.svg";
import { MAP_DEFAULT_CENTER, TILE_LAYER, SATELLITE_LAYER, HYBRID_LAYER, MUNICIPIO_STYLE_NO_FILL } from './mapConfig';
import OfflineTileLayer from './OfflineTileLayer';

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

// 3. Componente para mover el mapa al cambiar coordenadas
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
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

  // Sync internal state when prop changes
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


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

      {/* Columna Izquierda: Mapa */}
      <div className="lg:col-span-2 h-[300px] lg:h-full min-h-[300px] rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 relative z-0">
        <MapContainer
          center={position || MAP_DEFAULT_CENTER}
          zoom={15}
          scrollWheelZoom={true}
          preferCanvas={true}
          className="h-full w-full bg-slate-100 dark:bg-zinc-900" // Fondo gris mientras carga
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <MapResizer />
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

          {/* Capa del Municipio SIN RELLENO */}
          <GeoJSON data={municipiojson} style={MUNICIPIO_STYLE_NO_FILL} interactive={false} />

          <LocationMarker
            position={position}
            onSelect={setCoordenadas}
            icon={customIcon}
          />

          <MapUpdater center={position} />
        </MapContainer>

        {/* Badge de coordenadas */}
        <div className="absolute top-3 right-3 z-[400] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-none px-3 py-1 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 shadow-sm">
          {position ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : "Selecciona un punto"}
        </div>
      </div>

      {/* Columna Derecha: Inputs Personalizados */}
      <div className="flex flex-col justify-center space-y-4">

        {/* Input Latitud */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">
            Latitud
          </label>
          <div className="relative w-full flex items-center">
            <span className="absolute left-3.5 text-blue-600 dark:text-blue-400 pointer-events-none text-base">
              <HiLocationMarker />
            </span>
            <input
              type="text"
              name="lat"
              placeholder="Ej: 29.118..."
              value={coordenadas.lat}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none transition-all"
            />
          </div>
        </div>

        {/* Input Longitud */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 block">
            Longitud
          </label>
          <div className="relative w-full flex items-center">
            <span className="absolute left-3.5 text-blue-600 dark:text-blue-400 pointer-events-none text-base">
              <HiGlobeAlt />
            </span>
            <input
              type="text"
              name="lng"
              placeholder="Ej: -109.96..."
              value={coordenadas.lng}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none transition-all"
            />
          </div>
        </div>

        <div className="rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-500/10 dark:bg-blue-950/20 p-3.5 flex gap-3 items-start mt-2">
          <HiMap className="text-blue-600 dark:text-blue-400 text-lg mt-0.5 shrink-0" />
          <p className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
            Haz clic en el mapa para capturar la ubicación exacta del medidor automáticamente.
          </p>
        </div>

      </div>
    </div>
  );
}




