// src/components/rutas/MapaRutas.jsx
import {
  MapContainer,
  TileLayer,
  Polyline,
  Popup,
  CircleMarker,
  Marker,
  Tooltip,
} from "react-leaflet";
import { LatLng, Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "../../assets/svgs/Markador_azul_Agua_VP.svg";

function getClosestPoint(punto, ruta) {
  const p = new LatLng(punto[0], punto[1]);
  let minDist = Infinity;
  let closest = null;

  for (let i = 0; i < ruta.length - 1; i++) {
    const a = new LatLng(ruta[i][0], ruta[i][1]);
    const b = new LatLng(ruta[i + 1][0], ruta[i + 1][1]);

    const [ax, ay] = [a.lng, a.lat];
    const [bx, by] = [b.lng, b.lat];
    const [px, py] = [p.lng, p.lat];

    const abx = bx - ax, aby = by - ay;
    const apx = px - ax, apy = py - ay;

    const ab_ap = abx * apx + aby * apy;
    const ab_ab = abx * abx + aby * aby;
    let t = ab_ap / ab_ab;

    t = Math.max(0, Math.min(1, t));
    const closestX = ax + abx * t;
    const closestY = ay + aby * t;

    const candidate = new LatLng(closestY, closestX);
    const dist = p.distanceTo(candidate);

    if (dist < minDist) {
      minDist = dist;
      closest = [closestY, closestX];
    }
  }

  return { closest, distance: minDist };
}

const customIcon = new Icon({
  iconUrl: markerIcon,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});


export default function MapaRutas({
  medidores = [],
  puntosRuta,
  rutaCalculada,
  dibujar,
  onAgregarMedidor,
  onEliminarMedidor,
}) {
  const inicio = puntosRuta?.[0];
  const fin = puntosRuta?.[puntosRuta.length - 1];

  const conexionesExtremos = [];

  if (dibujar && rutaCalculada?.ruta?.length >= 2) {
    if (inicio) {
      const { closest, distance } = getClosestPoint([inicio.lat, inicio.lng], rutaCalculada.ruta);
      if (distance > 5) {
        conexionesExtremos.push({
          key: "conex-inicio",
          from: [inicio.lat, inicio.lng],
          to: closest,
        });
      }
    }

    if (fin) {
      const { closest, distance } = getClosestPoint([fin.lat, fin.lng], rutaCalculada.ruta);
      if (distance > 5) {
        conexionesExtremos.push({
          key: "conex-fin",
          from: [fin.lat, fin.lng],
          to: closest,
        });
      }
    }
  }

  const estaEnRuta = (medidor) =>
  puntosRuta.some((p) => p.id === medidor.id);


  return (
    <MapContainer
      center={[29.1180777, -109.9669819]}
      zoom={15}
       scrollWheelZoom={true} 
       style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {dibujar && rutaCalculada?.ruta?.length >= 2 && (
        <Polyline positions={rutaCalculada.ruta.map(([lat, lng]) => [lat, lng])} color="blue" />
      )}

      {conexionesExtremos.map(({ key, from, to }) => (
        <Polyline key={key} positions={[from, to]} color="green" dashArray="5,10" weight={2} />
      ))}

      {dibujar &&
        rutaCalculada?.puntos_gps?.map((punto, idx) => {
          const { closest, distance } = getClosestPoint(punto, rutaCalculada.ruta);
          return distance > 5 ? (
            <Polyline
              key={`conex-${idx}`}
              positions={[punto, closest]}
              color="green"
              dashArray="5,10"
              weight={2}
            />
          ) : null;
        })}

      {/* 🔹 Medidores como marcadores con botón dinámico */}
      {medidores.map((medidor) => {
        const enRuta = estaEnRuta(medidor);
        const handleClick = () => {
          if (enRuta) {
            const index = puntosRuta.findIndex((p) => p.id === medidor.id);
            if (index !== -1) onEliminarMedidor(index);
          } else {
            onAgregarMedidor({
              id: medidor.id,
              lat: medidor.latitud,
              lng: medidor.longitud,
              numero_serie: medidor.numero_serie,
            });
          }
        };

        return (
          <Marker
            key={medidor.id}
            position={[medidor.latitud, medidor.longitud]}
            icon={customIcon}
          >
            <Popup>
              <div>
                <h1 className="font-bold">Medidor {medidor.numero_serie}</h1>
                <p>Ubicación: {medidor.ubicacion || "N/A"}</p>
                <p>Estado: {medidor.estado_medidor}</p>
                <button
                  onClick={handleClick}
                  className={`mt-2 px-3 py-1 text-white rounded ${
                    enRuta ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {enRuta ? "🗑 Quitar de Ruta" : "➕ Agregar a Ruta"}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* 🔹 Visualización de puntos ya agregados */}
      {puntosRuta.map((p, i) => (
        <CircleMarker
          key={`punto-${i}`}
          center={[p.lat, p.lng]}
          radius={6}
          color="orange"
          fillColor="orange"
          fillOpacity={0.8}
        >
          <Tooltip direction="top" offset={[0, -10]} permanent>
            {i + 1}
          </Tooltip>
          <Popup>Punto #{i + 1}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

