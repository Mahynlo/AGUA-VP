import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Progress,
  Divider,
  Spinner,
} from "@nextui-org/react";
import {
  HiLocationMarker,
  HiUser,
  HiCalendar,
  HiHashtag,
  HiMap,
  HiPhone,
  HiCalculator,
  HiArrowLeft,
  HiArrowRight,
  HiCheck
} from "react-icons/hi";
import MapaLecturas from "../../mapa/MapaLecturas";
import { useRutas } from "../../../context/RutasContext";
import { useFeedback } from "../../../context/FeedbackContext";
import { useAuth } from "../../../context/AuthContext";

// Componente separado para el input de lectura
const LecturaInput = React.memo(React.forwardRef(({ value, onChange, clienteId, onSave, isLoading, error, autoFocus }, ref) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Lectura Actual (m³)*
      </label>
      <div className="relative w-full flex">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg">
          <HiCalculator />
        </span>
        <input
          ref={ref}
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={onChange}
          placeholder="0.00"
          disabled={isLoading}
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
              e.preventDefault();
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              onSave();
            }
          }}
          className={`border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-600 focus:border-blue-500'} text-gray-800 text-3xl font-bold rounded-xl pl-10 pr-4 py-4 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:border-gray-600 dark:text-white transition-all`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Spinner size="sm" />
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      <div className="flex items-center justify-end mt-4">
        <Button
          color="primary"
          onPress={onSave}
          isLoading={isLoading}
          isDisabled={!value || value.trim() === ""}
          className="font-bold text-md px-8 shadow-md"
          size="lg"
          endContent={<HiCheck className="text-xl" />}
        >
          Guardar Lectura
        </Button>
      </div>
    </div>
  );
}));

// Componente separado para el mapa
const MapaContainer = React.memo(({ lat, lng, cliente, ciudad }) => {
  return (
    <Card className="h-full border border-gray-200 dark:border-zinc-700 shadow-sm">
      <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-teal-100 dark:bg-teal-900/30 rounded-lg text-teal-600 dark:text-teal-400">
            <HiMap className="text-lg" />
          </div>
          <h4 className="font-bold text-large text-gray-800 dark:text-white">Mapa de Ubicación</h4>
        </div>
      </CardHeader>
      <CardBody className="overflow-hidden py-2">
        <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
          <MapaLecturas
            lat={lat}
            lng={lng}
            cliente={cliente}
          />
        </div>
      </CardBody>
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.lat === nextProps.lat &&
    prevProps.lng === nextProps.lng &&
    prevProps.cliente?.id === nextProps.cliente?.id
  );
});

// Componente auxiliar para filas de información
const InfoRow = ({ label, value, icon: Icon, colorClass, valueClass = "" }) => (
  <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-700">
    <span className={`text-sm font-medium flex items-center gap-2 ${colorClass}`}>
      <Icon className="text-lg" />
      {label}:
    </span>
    <span className={`text-sm font-semibold text-gray-800 dark:text-white text-right ${valueClass}`}>
      {value || "N/A"}
    </span>
  </div>
);

export default function CarruselLecturasModal({ rutaId, periodoMostrado }) {
  const { obtenerInfoRuta, actualizarRutas, actualizarProgresoRuta, rutas, loading } = useRutas();
  const { setError, setSuccess } = useFeedback();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lecturas, setLecturas] = useState({});
  const [ruta, setRuta] = useState(null);
  const [lecturasGuardadas, setLecturasGuardadas] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroresLectura, setErroresLectura] = useState({});

  const lecturaInputRef = React.useRef(null);

  // Ref para controlar si ya se inicializó la ruta actual
  const initializedRutaId = React.useRef(null);

  useEffect(() => {
    // Si cambiamos de ruta, reseteamos todo
    if (rutaId && initializedRutaId.current !== rutaId) {
      initializedRutaId.current = rutaId;
      setCurrentIndex(0);
      setLecturas({});
      setErroresLectura({});
      // Fetch inicial
      obtenerInfoRuta(rutaId)
        .then((rutaData) => {
          setRuta(rutaData);
        })
        .catch((error) => {
          console.error("Error al obtener la ruta:", error);
          setRuta(null);
          setError("Error al cargar la información de la ruta", "Toma de Lecturas");
        });
    }

    // Efecto separado para actualizar SOLO el estado de completados cuando cambia el contexto
    // sin resetear el índice ni las lecturas locales
    if (rutaId && rutas.length > 0) {
      const rutaEnContexto = rutas.find(r => r.id === rutaId);
      if (rutaEnContexto && rutaEnContexto.medidores_completados) {
        setLecturasGuardadas(new Set(rutaEnContexto.medidores_completados));
      }
    }
  }, [rutaId, rutas, obtenerInfoRuta, setError]);



  const obtenerFechaActual = useCallback(() => {
    const ahora = new Date();
    return ahora.toISOString().split('T')[0];
  }, []);

  const hasValidData = ruta && ruta.puntos && ruta.puntos.length > 0;
  const total = hasValidData ? ruta.puntos.length : 0;
  const puntoActual = hasValidData ? ruta.puntos[currentIndex] : null;
  const lecturaActual = puntoActual ? (lecturas[puntoActual.medidor_id] || "") : "";
  const errorLecturaActual = puntoActual ? (erroresLectura[puntoActual.medidor_id] || "") : "";

  // CORRECCIÓN: Check reactivo para ver si la lectura está completada
  const isLecturaCompletada = useMemo(() => {
    if (!puntoActual) return false;
    return lecturasGuardadas.has(puntoActual.numero_serie);
  }, [puntoActual, lecturasGuardadas]);

  const mapaProps = useMemo(() => {
    if (!puntoActual) return null;
    return {
      lat: puntoActual.latitud,
      lng: puntoActual.longitud,
      cliente: {
        id: puntoActual.medidor_id,
        nombre: puntoActual.cliente_nombre || `Medidor ${puntoActual.numero_serie}`,
        dirección: puntoActual.cliente_direccion || puntoActual.ubicacion,
        medidor: puntoActual.numero_serie,
        telefono: puntoActual.cliente_telefono,
        ciudad: ruta?.nombre || ""
      }
    };
  }, [puntoActual, ruta?.nombre]);

  const handleLecturaChange = useCallback((e) => {
    if (!puntoActual) return;
    const medidorId = puntoActual.medidor_id;
    let value = e.target.value;

    if (value !== '' && (parseFloat(value) < 0 || value.includes('-'))) {
      value = value.replace('-', '');
      if (parseFloat(value) < 0) value = '0';
    }

    setLecturas(prev => ({ ...prev, [medidorId]: value }));
    if (erroresLectura[medidorId]) {
      setErroresLectura(prev => ({ ...prev, [medidorId]: "" }));
    }
  }, [puntoActual, erroresLectura]);

  const handleGuardarLectura = useCallback(async () => {
    if (!puntoActual) return;
    const medidorId = puntoActual.medidor_id;
    // Capturar el número de serie AQUÍ para evitar problemas de cierre/cambio
    const numeroSerieActual = puntoActual.numero_serie;
    const lectura = lecturas[medidorId];

    if (!lectura || lectura.trim() === "") {
      setErroresLectura(prev => ({ ...prev, [medidorId]: "La lectura es obligatoria" }));
      return;
    }

    if (parseFloat(lectura) < 0) {
      setErroresLectura(prev => ({ ...prev, [medidorId]: "La lectura no puede ser negativa" }));
      return;
    }

    setIsSubmitting(true);

    try {
      const tokensession = localStorage.getItem("token");
      const lecturaData = {
        medidor_id: medidorId,
        ruta_id: rutaId,
        consumo_m3: parseFloat(lectura),
        fecha_lectura: obtenerFechaActual(),
        periodo: periodoMostrado,
        modificado_por: user.id,
      };

      const response = await window.api.registerLectura(lecturaData, tokensession);

      if (response.success) {
        // BACKEND-FIRST STRATEGY: 
        // Recargamos el contexto global que contiene los "medidores_completados"
        await actualizarRutas(periodoMostrado);
        window.dispatchEvent(new CustomEvent('dashboard-update'));

        setSuccess(`Lectura guardada exitosamente`, "Toma de Lecturas");
        setErroresLectura(prev => ({ ...prev, [medidorId]: "" }));

        // Avanzar automáticamente
        if (currentIndex < total - 1) {
          setTimeout(() => setCurrentIndex(prev => prev + 1), 500);
        } else {
          setTimeout(() => {
            setSuccess(`¡Ruta completada!`, "Toma de Lecturas");
            // Nota: actualizarRutas ya se llamó arriba, no es necesario llamar de nuevo, 
            // pero si se quiere asegurar al finalizar, no hace daño.
          }, 500);
        }
      } else {
        setErroresLectura(prev => ({ ...prev, [medidorId]: response.message }));
        setError(response.message, "Toma de Lecturas");
      }
    } catch (err) {
      const errorMsg = "Error al guardar la lectura.";
      setErroresLectura(prev => ({ ...prev, [medidorId]: errorMsg }));
      setError(errorMsg, "Toma de Lecturas");
    } finally {
      setIsSubmitting(false);
    }
  }, [puntoActual, lecturas, rutaId, periodoMostrado, user.id, obtenerFechaActual, setSuccess, setError, currentIndex, total, actualizarRutas]);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
      setTimeout(() => {
        // Enfocar input si la SIGUIENTE lectura no está guardada
        const siguientePunto = ruta.puntos[currentIndex + 1];
        if (siguientePunto && !lecturasGuardadas.has(siguientePunto.numero_serie) && lecturaInputRef.current) {
          lecturaInputRef.current?.focus();
        }
      }, 100);
    }
  }, [currentIndex, total, ruta, lecturasGuardadas]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setTimeout(() => {
        // Enfocar input si la ANTERIOR lectura no está guardada
        const anteriorPunto = ruta.puntos[currentIndex - 1];
        if (anteriorPunto && !lecturasGuardadas.has(anteriorPunto.numero_serie) && lecturaInputRef.current) {
          lecturaInputRef.current?.focus();
        }
      }, 100);
    }
  }, [currentIndex, ruta, lecturasGuardadas]);

  // Manejador de teclado global para el modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      // Si el input está enfocado, el Enter lo maneja el onKeyDown del input, 
      // pero si no, o si es navegación, lo manejamos aquí.

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        // Permitir navegación con flechas siempre
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  const handleFinalizarRuta = useCallback(() => {
    if (!hasValidData) return;
    const lecturasNoGuardadas = ruta.puntos.filter(punto => !lecturasGuardadas.has(punto.numero_serie));

    if (lecturasNoGuardadas.length > 0) {
      setError(`Faltan ${lecturasNoGuardadas.length} lecturas por registrar.`, "Toma de Lecturas");
      return;
    }

    setSuccess(`Ruta ${ruta.nombre} finalizada.`, "Toma de Lecturas");
    actualizarRutas(periodoMostrado).catch(console.error);
    onClose();
  }, [hasValidData, ruta, lecturasGuardadas, setError, setSuccess, onClose, actualizarRutas, periodoMostrado]);

  if (!hasValidData) {
    return (
      <Button
        color="primary"
        onPress={onOpen}
        isDisabled={true}
        className="font-semibold shadow-md"
        startContent={<HiMap className="text-lg" />}
      >
        {loading || ruta === null ? <div className="flex items-center gap-2"><Spinner size="sm" />Cargando...</div> : "Sin medidores"}
      </Button>
    );
  }

  return (
    <>
      <Button
        color="primary"
        onPress={onOpen}
        className="font-semibold shadow-md"
        startContent={<HiMap className="text-lg" />}
      >
        Tomar Lecturas
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => { if (!open) onClose(); }}
        size="5xl"
        isDismissible={false}
        scrollBehavior="inside"
        isKeyboardDismissDisabled={true}
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/60 backdrop-blur-sm",
          modal: "bg-white dark:bg-zinc-900 rounded-xl shadow-2xl",
          closeButton: "hover:bg-red-600 hover:text-white text-gray-600 dark:text-gray-300",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              {/* Header Consistente */}
              <ModalHeader className="flex gap-3 items-center border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <HiLocationMarker className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Toma de Lecturas</h3>
                  <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    {ruta.nombre} - {ruta.descripcion}
                  </p>

                  {/* Warning: Missing Meters Logic */}
                  {(() => {
                    const rutaSummary = rutas.find(r => r.id === rutaId);
                    const expectedTotal = rutaSummary ? rutaSummary.total_puntos : 0; // Assuming total_puntos is available in summary
                    const actualTotal = ruta?.puntos ? ruta.puntos.length : 0;
                    const missingCount = expectedTotal - actualTotal;

                    if (missingCount > 0) {
                      return (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium border border-orange-200 dark:border-orange-800">
                          <span>⚠ <strong>{missingCount} medidor{missingCount !== 1 ? 'es' : ''}</strong> sin cliente asignado (faltan en esta lista).</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Chip size="sm" variant="flat" color="warning" className="font-semibold">
                    {currentIndex + 1} / {total}
                  </Chip>
                  <Progress
                    size="sm"
                    value={(lecturasGuardadas.size / total) * 100}
                    color="success"
                    className="w-24"
                    aria-label="Progreso"
                  />
                </div>
              </ModalHeader>

              <ModalBody className="py-6 bg-gray-50 dark:bg-black/20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">

                  {/* Columna Izquierda: Datos y Formulario */}
                  <div className="space-y-6 flex flex-col h-full">

                    {/* Tarjeta de Información Completa */}
                    <Card className="border border-gray-200 dark:border-zinc-700 shadow-sm">
                      <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
                        <div className="flex justify-between w-full items-start">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                              <HiUser className="text-lg" />
                            </div>
                            <h4 className="font-bold text-large text-gray-800 dark:text-white">Información del Cliente</h4>
                          </div>
                          {isLecturaCompletada && (
                            <Chip color="success" variant="flat" size="sm" startContent={<HiCheck />}>
                              Registrado
                            </Chip>
                          )}
                        </div>
                      </CardHeader>
                      <CardBody className="py-2">
                        <div className="grid grid-cols-1 gap-2">
                          <InfoRow
                            label="Cliente"
                            value={puntoActual?.cliente_nombre}
                            icon={HiUser}
                            colorClass="text-blue-600 dark:text-blue-400"
                          />
                          <InfoRow
                            label="Dirección"
                            value={puntoActual?.cliente_direccion}
                            icon={HiLocationMarker}
                            colorClass="text-purple-600 dark:text-purple-400"
                            valueClass="truncate max-w-[200px]"
                          />
                          <InfoRow
                            label="Teléfono"
                            value={puntoActual?.cliente_telefono}
                            icon={HiPhone}
                            colorClass="text-green-600 dark:text-green-400"
                          />
                          <InfoRow
                            label="Medidor"
                            value={puntoActual?.numero_serie}
                            icon={HiHashtag}
                            colorClass="text-orange-600 dark:text-orange-400"
                          />
                          <InfoRow
                            label="Ubicación Medidor"
                            value={puntoActual?.ubicacion}
                            icon={HiLocationMarker}
                            colorClass="text-indigo-600 dark:text-indigo-400"
                          />
                          <InfoRow
                            label="Fecha"
                            value={new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                            icon={HiCalendar}
                            colorClass="text-teal-600 dark:text-teal-400"
                          />
                          <InfoRow
                            label="Orden"
                            value={`${puntoActual?.orden || 0} de ${total}`}
                            icon={HiUser}
                            colorClass="text-pink-600 dark:text-pink-400"
                          />
                        </div>
                      </CardBody>
                    </Card>

                    {/* Área de Lectura */}
                    <div className="flex-1 flex flex-col justify-center">
                      {isLecturaCompletada ? (
                        <Card className="bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800 shadow-none">
                          <CardBody className="flex flex-col items-center py-8">
                            <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full mb-3">
                              <HiCheck className="text-2xl text-green-600 dark:text-green-300" />
                            </div>
                            <h4 className="text-lg font-bold text-green-700 dark:text-green-400">Lectura Completada</h4>
                            <p className="text-sm text-green-600 dark:text-green-300 text-center mt-1">
                              El consumo para el medidor <strong>{puntoActual?.numero_serie}</strong> ya fue registrado.
                            </p>
                          </CardBody>
                        </Card>
                      ) : (
                        <LecturaInput
                          ref={lecturaInputRef}
                          value={lecturaActual}
                          onChange={handleLecturaChange}
                          clienteId={puntoActual?.medidor_id}
                          onSave={handleGuardarLectura}
                          isLoading={isSubmitting}
                          error={errorLecturaActual}
                          autoFocus={true}
                        />
                      )}
                    </div>
                  </div>

                  {/* Columna Derecha: Mapa */}
                  <div className="h-full min-h-[400px]">
                    {mapaProps && (
                      <MapaContainer
                        lat={mapaProps.lat}
                        lng={mapaProps.lng}
                        cliente={mapaProps.cliente}
                        ciudad={ruta?.nombre || ""}
                      />
                    )}
                  </div>
                </div>
              </ModalBody>

              <ModalFooter className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-zinc-900 py-4">
                <div className="flex w-full justify-between items-center">
                  <Button
                    isIconOnly
                    variant="flat"
                    isDisabled={currentIndex === 0}
                    onPress={handlePrev}
                  >
                    <HiArrowLeft />
                  </Button>

                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500 font-medium self-center">
                      Navegar
                    </span>
                    {/* Puntos indicadores compactos */}
                    <div className="flex gap-1 self-center">
                      {Array.from({ length: Math.min(total, 5) }).map((_, i) => {
                        // Lógica para mostrar dots cercanos
                        let idx = i;
                        if (total > 5 && currentIndex > 2) idx = currentIndex - 2 + i;
                        if (idx >= total) return null;

                        return (
                          <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentIndex ? 'bg-blue-600' :
                            (lecturasGuardadas.has(ruta.puntos[idx]?.numero_serie) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600')
                            }`} />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {currentIndex < total - 1 ? (
                      <Button
                        color="primary"
                        onPress={handleNext}
                        endContent={<HiArrowRight />}
                      >
                        Siguiente
                      </Button>
                    ) : (
                      <Button
                        color="success"
                        className="text-white font-bold"
                        onPress={handleFinalizarRuta}
                        isDisabled={lecturasGuardadas.size !== total}
                        endContent={<HiCheck />}
                      >
                        Finalizar Ruta
                      </Button>
                    )}
                  </div>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}


