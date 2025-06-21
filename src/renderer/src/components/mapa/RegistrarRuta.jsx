import { useEffect, useState } from 'react';
import {
  MapContainer, TileLayer, Polyline, Popup, useMapEvents, CircleMarker
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Input, Textarea, Button } from "@nextui-org/react";

function MapaSeleccion({ onAgregarPunto }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onAgregarPunto({ lat, lng });
    }
  });
  return null;
}

export default function RegistrarRuta() {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [puntosRuta, setPuntosRuta] = useState([]);
  const [dibujar, setDibujar] = useState(false);

  const handleAgregarPunto = (punto) => {
    setPuntosRuta([...puntosRuta, punto]);
  };

  const handleDibujarRuta = () => {
    if (puntosRuta.length >= 2) {
      setDibujar(true);
    } else {
      alert("Agrega al menos dos puntos para dibujar la ruta.");
    }
  };

  const reiniciarRuta = () => {
    setPuntosRuta([]);
    setDibujar(false);
  };

  const guardarRuta = () => {
    const ruta = { nombre, descripcion, puntos: puntosRuta };
    console.log("🚀 Ruta guardada:", ruta);
    alert("Ruta guardada (ver consola)");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div className="space-y-4">
        <Input label="Nombre de la ruta" value={nombre} onChange={e => setNombre(e.target.value)} />
        <Textarea label="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
        <div className='flex gap-2'>
          <Button color="primary" onClick={guardarRuta}>Guardar Ruta</Button>
          <Button color="secondary" onClick={handleDibujarRuta}>Dibujar Ruta</Button>
          <Button color="danger" onClick={reiniciarRuta}>Reiniciar</Button>
        </div>

        <ul className="text-sm mt-4">
          {puntosRuta.map((p, idx) => (
            <li key={idx}>
              🧭 Punto {idx + 1}: ({p.lat.toFixed(4)}, {p.lng.toFixed(4)})
            </li>
          ))}
        </ul>
      </div>

      <MapContainer center={[29.0745, -110.9560]} zoom={15} className="h-[500px] rounded-2xl shadow-lg">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapaSeleccion onAgregarPunto={handleAgregarPunto} />

        {/* Línea entre puntos */}
        {dibujar && puntosRuta.length >= 2 && (
          <Polyline positions={puntosRuta.map(p => [p.lat, p.lng])} color="blue" />
        )}

        {/* Círculo de inicio */}
        {puntosRuta.length > 0 && (
          <CircleMarker
            center={[puntosRuta[0].lat, puntosRuta[0].lng]}
            radius={4}
            color="green"
            fillColor="green"
            fillOpacity={0.8}
          >
            <Popup>Aquí inicia la ruta</Popup>
          </CircleMarker>
        )}

        {/* Círculo de fin */}
        {puntosRuta.length > 1 && (
          <CircleMarker
            center={[puntosRuta[puntosRuta.length - 1].lat, puntosRuta[puntosRuta.length - 1].lng]}
            radius={4}
            color="red"
            fillColor="red"
            fillOpacity={0.8}
          >
            <Popup>Aquí termina la ruta</Popup>
          </CircleMarker>
        )}

        {/* Círculos intermedios */}
        {puntosRuta.map((p, i) => (
          <CircleMarker
            key={i}
            center={[p.lat, p.lng]}
            radius={2.5}
            color="black"
            fillColor="gray"
            fillOpacity={0.7}
          />
        ))}
      </MapContainer>
    </div>
  );
}




