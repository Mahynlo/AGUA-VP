import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  GeoJSON,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import municipiojson from "../../../../public/VillaPesqueira.json";
import ubicacionIcon from "../../assets/svgs/Markador_azul_Agua_VP.svg";
import L from "leaflet";

// Icono personalizado
const customIcon = new L.Icon({
  iconUrl: ubicacionIcon,
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -30],
});

function ClickMapa({ onSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onSelect({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
    },
  });
  return null;
}

function MoverMapa({ coordenadas }) {
  const map = useMap();
  useEffect(() => {
    const lat = parseFloat(coordenadas.lat);
    const lng = parseFloat(coordenadas.lng);

    if (!isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], map.getZoom(), {
        duration: 0.5,
      });
    }
  }, [coordenadas]);
  return null;
}

export default function SelectorCoordenadas({
  valorInicial = { lat: "29.1180777", lng: "-109.9669819" },
  onChange,
}) {
  const [coordenadas, setCoordenadas] = useState(valorInicial);

  // Reportar solo si son válidas
  useEffect(() => {
    const lat = parseFloat(coordenadas.lat);
    const lng = parseFloat(coordenadas.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      onChange({ lat, lng });
    }
  }, [coordenadas]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCoordenadas((prev) => ({
      ...prev,
      [name]: value, // sin parseFloat aquí
    }));
  };

  const lat = parseFloat(coordenadas.lat);
  const lng = parseFloat(coordenadas.lng);
  const coordenadasValidas = !isNaN(lat) && !isNaN(lng);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Inputs */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-white">Latitud</label>
        <input
          type="number"
          name="lat"
          value={coordenadas.lat}
          onChange={handleInputChange}
          step="0.000001"
          placeholder="Ej: 29.1180777"
          className="w-full p-2 rounded-md border dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
        />

        <label className="block text-sm font-medium text-gray-700 dark:text-white">Longitud</label>
        <input
          type="number"
          name="lng"
          value={coordenadas.lng}
          onChange={handleInputChange}
          step="0.000001"
          placeholder="Ej: -109.9669819"
          className="w-full p-2 rounded-md border dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Mapa */}
      <div className="h-[250px] rounded-md overflow-hidden border dark:border-gray-600">
        <MapContainer
          center={[
            !isNaN(lat) ? lat : 29.1180777,
            !isNaN(lng) ? lng : -109.9669819,
          ]}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <ClickMapa
            onSelect={(coords) => {
              setCoordenadas({
                lat: coords.lat.toString(),
                lng: coords.lng.toString(),
              });
            }}
          />

          <MoverMapa coordenadas={coordenadas} />

          {/* Solo muestra el marcador si las coordenadas son válidas */}
          {!isNaN(lat) && !isNaN(lng) && (
            <Marker position={[lat, lng]} icon={customIcon} />
          )}

          <GeoJSON
            data={municipiojson}
            style={{
              color: "#5f88f5",
              weight: 2,
              fillColor: "rgba(173, 216, 230, 0.3)",
            }}
          />
        </MapContainer>

      </div>
    </div>
  );
}




