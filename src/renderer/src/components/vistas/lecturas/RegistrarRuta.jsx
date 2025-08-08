// src/components/rutas/ModalRegistrarRuta.jsx
import { useState, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Input,
  Card,
  CardBody,
  Chip
} from "@nextui-org/react";
import { HiPlus, HiMap, HiLocationMarker, HiPencil } from "react-icons/hi";

import MapaRutas from "../../mapa/MapaRutas";
import { useMedidores } from "../../../context/MedidoresContext";
import { useAuth } from "../../../context/AuthContext";
import { useRutas } from "../../../context/RutasContext";

//para los iconos de los mensajes de feedback
import { useFeedback } from "../../../context/FeedbackContext";

export default function ModalRegistrarRuta() {
  // Hook para manejar el estado del modal
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  // Estados para manejar los datos de la ruta
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [puntosRuta, setPuntosRuta] = useState([]);
  const [dibujar, setDibujar] = useState(false);
  const [rutaCalculada, setRutaCalculada] = useState(null);

  // Contextos para manejar feedback, medidores, autenticación y rutas
  const { setSuccess, setError } = useFeedback(); // Importa el contexto de feedback
  const [isRegistering, setIsRegistering] = useState(false);
  const { medidores } = useMedidores();
  const { user } = useAuth();
  const { actualizarRutas } = useRutas();

  // Maneja el evento de agregar un punto a la ruta
  const handleAgregarPunto = useCallback((punto) => {
    setPuntosRuta((prev) => [...prev, punto]);
  }, []);

  // Elimina un punto de la ruta por su índice
  const eliminarPuntoRuta = useCallback((index) => {
    setPuntosRuta((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Maneja el evento de agregar un punto al mapa
  const handleDibujarRuta = async () => {
    console.log("📌 Puntos GPS para calcular ruta:", puntosRuta);
    try {
      const resultado = await window.api.calcularRuta(puntosRuta);
      setRutaCalculada(resultado);
      setDibujar(true);
    } catch (error) {
      console.error("❌ Error al calcular ruta:", error.message);
      setError(`No se pudo calcular la ruta añade puntos al mapa.->${error.message}`, "Registro de Rutas");
    }
  };

  // Reiniciar los estados de la ruta 
  const reiniciarRuta = () => {
    setPuntosRuta([]);
    setRutaCalculada(null);
    setDibujar(false);
    
  };

  const guardarRuta = async () => {
    setError("");
    setSuccess("");
    setIsRegistering(true);

    //validación de campos
    const camposFaltantes = [];

    if (!nombre.trim()) camposFaltantes.push("Nombre");
    if (!descripcion.trim()) camposFaltantes.push("Descripción");

    if (puntosRuta.length < 2) {
      camposFaltantes.push("Al menos 2 puntos deben ser seleccionados");
    }

    if (!rutaCalculada || !Array.isArray(rutaCalculada.ruta) || rutaCalculada.ruta.length === 0) {
      camposFaltantes.push("Ruta calculada (usa el botón 'Dibujar Ruta')");
    }

    if (camposFaltantes.length > 0) {
      setError(
        `Los siguientes campos son obligatorios:\n ${camposFaltantes.join("\n, ")}`,
        "Registro de Rutas"
      );
      setIsRegistering(false);
      return;
    }


    // Preparar datos para enviar al backend
    try {
      const token_session = localStorage.getItem("token"); // Obtener el token de sesión del almacenamiento local

      const ruta = {// Estructura del objeto ruta
        nombre,
        descripcion,
        puntos: puntosRuta.map(p => ({ id: p.id })),
        ruta_calculada: rutaCalculada?.ruta || [],
        distancia_km: rutaCalculada?.distancia_total_km || 0,
        instrucciones: rutaCalculada?.instrucciones || [],
        creado_por: user?.id,
      };


      const response = await window.api.registerRuta({ ruta, token_session });
      //console.log("📌 Respuesta al registrar ruta:", response);

      if (response.success) { // Si la respuesta es exitosa
        setSuccess("Ruta registrada exitosamente.", "Registro de Rutas");

        setTimeout(() => {
          reiniciarRuta();
          setNombre("");
          setDescripcion("");
        
          onClose(); // Cerrar modal
          actualizarRutas(); // Actualizar rutas en el contexto
          setIsRegistering(false);
        }, 2000);
      } else { // Si hubo un error al registrar la ruta
        setError(response.message || "No se pudo registrar la ruta.", "Registro de Rutas");
        setIsRegistering(false);
      }
    } catch (err) { // Manejo de errores al registrar la ruta
      //console.error("❌ Error al guardar ruta:", err);
      setError("Ocurrió un error al registrar la ruta.", "Registro de Rutas");
      setIsRegistering(false);
    }
  };

  return (
    <>
      <Button 
        color="primary" 
        onPress={onOpen}
        startContent={<HiPlus className="w-4 h-4" />}
        variant="solid"
      >
        Nueva Ruta
      </Button>

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        size="5xl" 
        backdrop="transparent"
        scrollBehavior="inside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        placement="center"
        classNames={{
                    closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
                }}
      >
        <ModalContent>
          <>
            <ModalHeader className="flex items-center gap-2 text-xl font-bold">
              <HiMap className="w-6 h-6 text-blue-600" />
              Crear Nueva Ruta de Lectura
            </ModalHeader>
            
            <ModalBody className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 dark:text-white">
                <div className="space-y-4">
                  <label className="text-sm font-semibold">Nombre de la ruta</label>
                  <input
                    type="text"
                    className="rounded-xl p-2.5 w-full dark:bg-neutral-800"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                  <label className="text-sm font-semibold">Descripción de la ruta</label>
                  <textarea
                    className="rounded-xl p-2.5 w-full h-32 dark:bg-neutral-800"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    required
                  />

                  <div className="flex gap-2">
                    <Button color="secondary" onClick={handleDibujarRuta}>Dibujar Ruta</Button>
                    <Button color="danger" onClick={reiniciarRuta}>Reiniciar</Button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-2 text-sm">
                    <div className="bg-white p-2 rounded h-[250px] w-[250px] shadow max-h-[250px] overflow-auto dark:bg-gray-700">
                      <h3 className="font-semibold mb-2">📍 Puntos:</h3>
                      <ul className="space-y-1">
                        {puntosRuta.map((p, idx) => (
                          <li key={idx} className="flex items-center justify-between bg-gray-100 dark:bg-gray-600 p-1 rounded">
                            🧭 Punto {idx + 1}: ({p.lat.toFixed(4)}, {p.lng.toFixed(4)})
                            <button
                              onClick={() => eliminarPuntoRuta(idx)}
                              className="ml-2 text-red-600 dark:text-gray-200 text-xs bg-red-200 dark:bg-red-600 rounded px-2 py-1 hover:bg-red-300 dark:hover:bg-red-700"
                            >
                              Quitar
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {rutaCalculada?.instrucciones?.length > 0 && (
                      <div className="bg-white p-2 rounded shadow max-h-[250px] w-[200px] overflow-auto dark:bg-gray-700">
                        <h3 className="font-semibold mb-2">📌 Instrucciones:</h3>
                        <ul className="space-y-1">
                          {rutaCalculada.instrucciones.map((ins, idx) => (
                            <li key={idx}>
                              {ins.accion} sobre {ins.calle} ({ins.distancia_m.toFixed(0)} m)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-[300px] md:h-[580px] rounded-2xl shadow-lg z-0">
                  <MapaRutas
                    medidores={medidores}
                    puntosRuta={puntosRuta}
                    rutaCalculada={rutaCalculada}
                    dibujar={dibujar}
                    onAgregarMedidor={handleAgregarPunto}
                    onEliminarMedidor={eliminarPuntoRuta}
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>

              <Button
                color="success"
                onClick={guardarRuta}
                isDisabled={isRegistering}
                variant="light"
                className="text-white bg-green-700 hover:bg-green-800 focus:ring-2 focus:outline-none font-medium rounded-xl text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700"
              >
                {isRegistering ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Procesando...
                  </span>
                ) : (
                  "Guardar Ruta"
                )}
              </Button>
              <Button color="danger" className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 font-medium rounded-xl text-sm px-5 py-2.5" onClick={onClose}>Cancelar</Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </>
  );
}
