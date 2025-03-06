import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import municipiojson from "../../../../public/VillaPesqueira.json"; 
const MapaMedidores = () => {
  const position = [29.117720, -109.969130

  ]; // Coordenadas de Hermosillo (Ejemplo)
  const [municipioData, setMunicipioData] = useState(null);

  useEffect(() => {
    // Cargar los datos del municipio
    setMunicipioData(municipiojson);

  }, []);

  return (
    <div className="h-[700px] w-[900px] bg-gray-200 relative z-0 mt-3">
      <MapContainer center={position} zoom={12} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 📍 Marcador en la ciudad */}
        <Marker position={position}>
          <Popup>Villa Pesqueira</Popup>
        </Marker>

        {/* 🗺️ Dibujar el municipio si los datos están cargados */}
        {municipioData && <GeoJSON data={municipioData} style={{ color: "#9294eb", weight: 5,fillColor: "rgba(203, 222, 236, 0.8)"}} />}
      </MapContainer>
    </div>
  );
};

export default MapaMedidores;







