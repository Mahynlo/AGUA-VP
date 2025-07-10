import { useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Popup,
  useMapEvents,
  CircleMarker,
  Tooltip,
} from "react-leaflet";
import { LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  useDisclosure,
} from "@nextui-org/react";

function MapaSeleccion({ onAgregarPunto }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onAgregarPunto({ lat, lng });
    },
  });
  return null;
}

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

    const abx = bx - ax,
      aby = by - ay;
    const apx = px - ax,
      apy = py - ay;

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

export default function ModalRegistrarRuta() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [puntosRuta, setPuntosRuta] = useState([]);
  const [dibujar, setDibujar] = useState(false);
  const [rutaCalculada, setRutaCalculada] = useState(null);

  const handleAgregarPunto = useCallback((punto) => {
    setPuntosRuta((prev) => [...prev, punto]);
  }, []);

  const handleDibujarRuta = async () => {
    try {
      const resultado = await window.api.calcularRuta(puntosRuta);
      setRutaCalculada(resultado);
      setDibujar(true);
    } catch (error) {
      console.error("❌ Error al calcular ruta:", error.message);
      alert("No se pudo calcular la ruta.");
    }
  };

  const reiniciarRuta = () => {
    setPuntosRuta([]);
    setRutaCalculada(null);
    setDibujar(false);
  };

  const guardarRuta = () => {
    const ruta = {
      nombre,
      descripcion,
      puntos: puntosRuta,
      ruta_calculada: rutaCalculada?.ruta || [],
      distancia_km: rutaCalculada?.distancia_total_km || 0,
      instrucciones: rutaCalculada?.instrucciones || [],
    };

    console.log("📦 Ruta guardada:", ruta);
    alert("Ruta guardada.");
    onClose();
  };

  return (
    <>
      <Button color="primary" onPress={onOpen}>
        Registrar nueva ruta
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        scrollBehavior="inside" // Permite el scroll dentro del modal
        classNames={{
          header: "dark:border-b border-b border-gray-400 dark:border-[#6879bd]",
          footer: "dark:border-t border-t border-gray-400 dark:border-[#6879bd]",
          closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
        }}
        backdrop="transparent"
      >
        <ModalContent className="bg-gray-200 dark:bg-gray-800 rounded-2xl shadow-lg">
          <>
            <ModalHeader className="text-2xl font-bold text-gray-900 bg-gray-300 dark:bg-gray-700 dark:text-white">
              Registro de Ruta
            </ModalHeader>
            <ModalBody className="bg-gray-200 dark:bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 dark:text-white dark:bg-gray-800">
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Nombre de la ruta
                  </label>
                  <input
                    type="text"
                    className="bg-gray-50 border dark:border-gray-500 text-gray-900 text-sm rounded-xl block w-full p-2.5 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                    placeholder="Nombre de la ruta"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Descripción de la ruta
                  </label>
                  <textarea
                    type="text"
                    className="bg-gray-50 border h-32 rounded-xl dark:border-gray-600 text-gray-900 text-sm block w-full p-2.5 dark:bg-neutral-800 dark:text-white"
                    placeholder="Descripción de la ruta"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    required
                  />


                  <div className="flex gap-2">
                    <Button color="primary" onClick={guardarRuta}>Guardar Ruta</Button>
                    <Button color="secondary" onClick={handleDibujarRuta}>Dibujar Ruta</Button>
                    <Button color="danger" onClick={reiniciarRuta}>Reiniciar</Button>
                  </div>

                  <div className="flex text-sm text-gray-600 dark:text-gray-300 items-center gap-2 ">
                    <div className="bg-white p-4 rounded shadow text-sm max-h-[250px] overflow-auto dark:bg-gray-700">
                      <h3 className="text-md font-semibold mb-2">📍 Puntos de la ruta:</h3>
                      <ul className="list-disc list-inside space-y-1">

                        {puntosRuta.map((p, idx) => (

                          <li key={idx}>🧭 Punto {idx + 1}: ({p.lat.toFixed(4)}, {p.lng.toFixed(4)})</li>
                        ))}
                      </ul>
                    </div>


                    {rutaCalculada?.instrucciones?.length > 0 && (
                      <div className="bg-white p-4 rounded shadow text-sm max-h-[250px] overflow-auto dark:bg-gray-700">
                        <h3 className="text-md font-semibold mb-2">📌 Instrucciones:</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {rutaCalculada.instrucciones.map((ins, idx) => (
                            <li key={idx}>{ins.accion} sobre {ins.calle} ({ins.distancia_m.toFixed(0)} m)</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                </div>

                <MapContainer center={[29.1180777, -109.9669819]} zoom={15} className="w-full h-[300px] md:h-[500px] rounded-2xl shadow-lg">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapaSeleccion onAgregarPunto={handleAgregarPunto} />

                  {dibujar && rutaCalculada?.ruta?.length >= 2 && (
                    <Polyline
                      positions={rutaCalculada.ruta.map(([lat, lng]) => [lat, lng])}
                      color="blue"
                    />
                  )}

                  {dibujar && rutaCalculada?.puntos_gps?.map((punto, idx) => {
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

                  {puntosRuta.map((p, i) => (
                    <CircleMarker
                      key={`previo-${i}`}
                      center={[p.lat, p.lng]}
                      radius={6}
                      color="orange"
                      fillColor="orange"
                      fillOpacity={0.8}
                    >
                      <Tooltip direction="top" offset={[0, -10]} permanent>
                        {i + 1}
                      </Tooltip>
                      <Popup>Punto marcado #{i + 1}</Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </ModalBody>
            <ModalFooter className="bg-gray-300 dark:bg-gray-700">
              <Button color="default" onClick={onClose}>Cancelar</Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </>
  );
}








