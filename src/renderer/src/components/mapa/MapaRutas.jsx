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
import './MapaMedidores.css'; // Reutilizamos los estilos mejorados
import markerIcon from "../../assets/svgs/Markador_azul_Agua_VP.svg";
import { HiPlus, HiTrash, HiHashtag, HiLocationMarker, HiCheck } from "react-icons/hi";
// Nota: React-Leaflet no soporta componentes React dentro de Popups estáticos fácilmente,
// así que usaremos HTML/CSS puro para el contenido del popup o renderToStaticMarkup si fuera necesario.
// Aquí mantendré tu estructura lógica pero con clases de Tailwind.

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
  readOnly = false, // New prop
}) {
  const inicio = puntosRuta?.[0];
  const fin = puntosRuta?.[puntosRuta.length - 1];

  const conexionesExtremos = [];

  // Only calculate extra connections if NOT readOnly
  if (!readOnly && dibujar && rutaCalculada?.ruta?.length >= 2) {
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
    <div className="w-full h-full rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-zinc-800">
      <MapContainer
        center={[29.1180777, -109.9669819]}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
        className="leaflet-container h-full w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Ruta principal (Azul más moderno) */}
        {dibujar && rutaCalculada?.ruta?.length >= 2 && (
          <Polyline
            positions={rutaCalculada.ruta.map(([lat, lng]) => [lat, lng])}
            pathOptions={{ color: "#3b82f6", weight: 4, opacity: 0.8 }}
          />
        )}

        {/* Conexiones extremos (Verde esmeralda punteado) - Only if NOT readOnly */}
        {!readOnly && conexionesExtremos.map(({ key, from, to }) => (
          <Polyline
            key={key}
            positions={[from, to]}
            pathOptions={{ color: "#10b981", dashArray: "10, 10", weight: 3, opacity: 0.7 }}
          />
        ))}

        {/* Conexiones intermedias - Only if NOT readOnly */}
        {!readOnly && dibujar &&
          rutaCalculada?.puntos_gps?.map((punto, idx) => {
            const { closest, distance } = getClosestPoint(punto, rutaCalculada.ruta);
            return distance > 5 ? (
              <Polyline
                key={`conex-${idx}`}
                positions={[punto, closest]}
                pathOptions={{ color: "#10b981", dashArray: "5, 10", weight: 2, opacity: 0.6 }}
              />
            ) : null;
          })}

        {/* 🔹 Medidores con Popup Estilizado */}
        {medidores.map((medidor) => {
          const enRuta = estaEnRuta(medidor);

          return (
            <Marker
              key={medidor.id}
              position={[medidor.latitud, medidor.longitud]}
              icon={customIcon}
            >
              <Popup className="custom-popup" closeButton={false}>
                <div className="p-1 min-w-[200px]">
                  {/* Header del Popup */}
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-zinc-700">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                      <span className="text-lg">💧</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                      Medidor {medidor.numero_serie}
                    </h3>
                  </div>

                  {/* Cuerpo del Popup */}
                  <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300 mb-3">
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">📍</span>
                      <span>{medidor.ubicacion || "Ubicación N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${medidor.estado_medidor === 'Activo' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span>{medidor.estado_medidor}</span>
                    </div>
                  </div>

                  {/* Botón de Acción - HIDDEN IN READONLY */}
                  {!readOnly && (
                    <button
                      onClick={() => {
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
                      }}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold text-white shadow-sm transition-all flex items-center justify-center gap-2 ${enRuta
                          ? "bg-red-500 hover:bg-red-600 shadow-red-200 dark:shadow-none"
                          : "bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none"
                        }`}
                    >
                      {enRuta ? (
                        <><span>🗑</span> Quitar</>
                      ) : (
                        <><span>➕</span> Agregar</>
                      )}
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 🔹 Puntos de Ruta (CircleMarkers) con Tooltip mejorado */}
        {puntosRuta.map((p, i) => (
          <CircleMarker
            key={`punto-${i}`}
            center={[p.lat, p.lng]}
            radius={8}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#f97316", // Naranja (orange-500)
              fillOpacity: 1,
              weight: 2
            }}
          >
            <Tooltip
              direction="center"
              offset={[0, 0]}
              opacity={1}
              permanent
              className="bg-transparent border-0 shadow-none text-white font-bold text-xs label-tooltip"
            >
              {i + 1}
            </Tooltip>

            {/* Popup simple al hacer clic en el punto naranja */}
            <Popup className="custom-popup" closeButton={false}>
              <div className="text-center p-1">
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                  Orden #{i + 1}
                </span>
                <p className="text-[10px] text-gray-500 m-0">
                  {p.numero_serie}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Estilos CSS locales para el tooltip transparente */}
      <style>{`
        .leaflet-tooltip.label-tooltip {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
          font-size: 10px;
          font-weight: 800;
          color: white;
        }
        .leaflet-tooltip.label-tooltip:before {
          display: none;
        }
      `}</style>
    </div>
  );
}

