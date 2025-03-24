import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON,Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import municipiojson from "../../../../public/VillaPesqueira.json"; 
import MarkerMap from "../../assets/svgs/MarkerMap.svg";
import L from "leaflet";
const MapaMedidores = () => {
  // SVG personalizado como icono
  const customIcon = new L.Icon({
    iconUrl: MarkerMap,   // Ruta de tu SVG
    iconSize: [40, 40],      // Tamaño del ícono (ancho, alto)
    iconAnchor: [20, 40],    // Punto de anclaje (centro inferior)
    popupAnchor: [0, -35]    // Ajuste del popup
  });
  const position = [29.1180777, -109.9669819]; // Coordenadas de Hermosillo (Ejemplo)
  const position2 = [29.116943, -109.968017 ]; // Coordenadas de Hermosillo (Ejemplo)
  const [municipioData, setMunicipioData] = useState(null);

  useEffect(() => {
    // Cargar los datos del municipio
    setMunicipioData(municipiojson);

  }, []);

  return (
    <div className="h-full w-full grid place-items-center"> 
      <MapContainer center={position} zoom={12} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 📍 Marcador con ícono personalizado */}
        <Marker position={position2} icon={customIcon}>
          <Popup>
            <div className="">
              <h1 className="text-lg font-bold">Medidor MP-123f</h1>
              <p className="text-sm">Ubicación: Calle 1</p>
              <p className="text-sm">Estatus: Activo</p>
              <p className="text-sm">Consumo medio: 1234.56 m3</p>
              <button className="bg-blue-500 text-white p-1 rounded mt-2">Ver más</button>
            </div>
          </Popup>
        </Marker>

       


        {/* 📍 Marcador en la ciudad */}
        <Marker position={position}>
          <Popup>
            <div className="">Punto</div>
          </Popup>
          <Tooltip permanent direction="top" offset={[0, -10]}>
            <span>Villa Pesqueira</span>
          </Tooltip>
        </Marker>

        {/* 🗺️ Dibujar el municipio si los datos están cargados */}
        {municipioData && <GeoJSON data={municipioData}  style={{ color: "#9294eb", weight: 5,fillColor: "rgba(203, 222, 236, 0.8)"}} />}
      </MapContainer>
    </div>
  );
};

export default MapaMedidores;







