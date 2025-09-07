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
  Input,
  Chip,
  Progress,
  Divider,
  Spinner,
  Skeleton,
} from "@nextui-org/react";
import { HiLocationMarker, HiUser, HiCalendar, HiHashtag, HiMap, HiPhone, HiCalculator } from "react-icons/hi";
import MapaLecturas from "../../mapa/MapaLecturas"; // Componente del mapa desde la carpeta correcta
import { useRutas } from "../../../context/RutasContext";
import { useFeedback } from "../../../context/FeedbackContext";
import { useAuth } from "../../../context/AuthContext";
// Componente separado para el input de lectura para evitar re-renders del mapa
const LecturaInput = React.memo(React.forwardRef(({ value, onChange, clienteId, onSave, isLoading, error, autoFocus }, ref) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Lectura Actual (m³)*
      </label>
      <div className="relative w-full flex">
        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
          <HiCalculator className="inline-block mr-1 h-5 w-5 text-blue-600" />
        </span>
        <input
          ref={ref}
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={onChange}
          placeholder="Ingrese la lectura en m³"
          disabled={isLoading}
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            // Prevenir la entrada de signos negativos y otros caracteres no deseados
            if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
              e.preventDefault();
            }
          }}
          className={`border ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-600 focus:border-blue-500'} text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white text-lg font-semibold ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          * La lectura se guarda al presionar "Guardar Lectura"
        </p>
        <Button
          size="sm"
          color="success"
          variant="flat"
          onPress={onSave}
          isLoading={isLoading}
          isDisabled={!value || value.trim() === ""}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          Guardar Lectura
        </Button>
      </div>
    </div>
  );
}));

// Componente separado para el mapa que no se re-renderiza con cambios de input
const MapaContainer = React.memo(({ lat, lng, cliente, ciudad }) => {
  
  return (
    <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-0 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-full">
            <HiMap className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Ubicación del Medidor
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {ciudad}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardBody className="pt-0">
        <div className="h-[400px] rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
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
  // Solo re-renderizar si cambian las coordenadas o el cliente
  return (
    prevProps.lat === nextProps.lat &&
    prevProps.lng === nextProps.lng &&
    prevProps.cliente?.id === nextProps.cliente?.id &&
    prevProps.ciudad === nextProps.ciudad
  );
});

export default function CarruselLecturasModal({ rutaId, periodoMostrado }) {
  const { obtenerInfoRuta, actualizarRutas, rutas, loading } = useRutas();
  const { setError, setSuccess } = useFeedback();
  const { user } = useAuth();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lecturas, setLecturas] = useState({});
  const [ruta, setRuta] = useState(null);
  const [lecturasGuardadas, setLecturasGuardadas] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroresLectura, setErroresLectura] = useState({});
  
  // Ref para el input de lectura
  const lecturaInputRef = React.useRef(null);

  // Efecto para obtener la información de la ruta cuando cambie rutaId
  useEffect(() => {
    if (rutaId) {
      obtenerInfoRuta(rutaId)
        .then((rutaData) => {
          console.log("Ruta obtenida:", rutaData);
          setRuta(rutaData);
          // Reiniciar estados cuando cambie la ruta
          setCurrentIndex(0);
          setLecturas({});
          setErroresLectura({});
          
          // Inicializar lecturas guardadas desde la información de la ruta del contexto
          const rutaEnContexto = rutas.find(r => r.id === rutaId);
          if (rutaEnContexto && rutaEnContexto.medidores_completados) {
            setLecturasGuardadas(new Set(rutaEnContexto.medidores_completados));
            console.log("Lecturas ya completadas:", rutaEnContexto.medidores_completados);
          } else {
            setLecturasGuardadas(new Set());
          }
        })
        .catch((error) => {
          console.error("Error al obtener la ruta:", error);
          setRuta(null);
          setError("Error al cargar la información de la ruta", "Toma de Lecturas");
        });
    }
  }, [rutaId, obtenerInfoRuta, rutas]);

  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const obtenerFechaActual = useCallback(() => {
    const ahora = new Date();
    return ahora.toISOString().split('T')[0];
  }, []);

  // Verificar si hay datos válidos antes de usarlos
  const hasValidData = ruta && ruta.puntos && ruta.puntos.length > 0;
  const total = hasValidData ? ruta.puntos.length : 0;
  const puntoActual = hasValidData ? ruta.puntos[currentIndex] : null;
  const lecturaActual = puntoActual ? (lecturas[puntoActual.medidor_id] || "") : "";
  const errorLecturaActual = puntoActual ? (erroresLectura[puntoActual.medidor_id] || "") : "";

  // Verificar si el punto actual ya tiene lectura completada
  const isLecturaCompletada = puntoActual ? lecturasGuardadas.has(puntoActual.numero_serie) : false;

  // Memoizar las props del mapa para evitar re-renders innecesarios
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

  // Usar useCallback para estabilizar el handler
  const handleLecturaChange = useCallback((e) => {
    if (!puntoActual) return;
    
    const medidorId = puntoActual.medidor_id;
    let value = e.target.value;
    
    // Filtrar valores negativos y caracteres no deseados
    if (value !== '' && (parseFloat(value) < 0 || value.includes('-'))) {
      value = value.replace('-', ''); // Remover signos negativos
      if (parseFloat(value) < 0) {
        value = '0';
      }
    }
    
    setLecturas(prev => ({
      ...prev,
      [medidorId]: value,
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (erroresLectura[medidorId]) {
      setErroresLectura(prev => ({
        ...prev,
        [medidorId]: ""
      }));
    }
  }, [puntoActual, erroresLectura]);

  // Función para guardar una lectura individual
  const handleGuardarLectura = useCallback(async () => {
    if (!puntoActual) return;
    
    const medidorId = puntoActual.medidor_id;
    const lectura = lecturas[medidorId];

    // Validaciones
    if (!lectura || lectura.trim() === "") {
      setErroresLectura(prev => ({
        ...prev,
        [medidorId]: "La lectura es obligatoria"
      }));
      return;
    }

    if (parseFloat(lectura) < 0) {
      setErroresLectura(prev => ({
        ...prev,
        [medidorId]: "La lectura no puede ser negativa"
      }));
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
        // Actualizar inmediatamente el estado local
        const nuevasLecturasGuardadas = new Set([...lecturasGuardadas, puntoActual.numero_serie]);
        setLecturasGuardadas(nuevasLecturasGuardadas);
        setSuccess(`Lectura guardada exitosamente para el medidor ${puntoActual.numero_serie}`, "Toma de Lecturas");
        
        // Limpiar error si existía
        setErroresLectura(prev => ({
          ...prev,
          [medidorId]: ""
        }));

        // ✅ NO actualizar rutas después de cada lectura individual
        // Solo actualizar el estado local y hacer fetch al final

        // Siempre avanzar al siguiente punto si hay más
        if (currentIndex < total - 1) {
          setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
          }, 500); // Esperar un poco para mostrar el mensaje de éxito
        }
        // Si era la última lectura, actualizar rutas una sola vez
        else {
          setTimeout(() => {
            setSuccess(`¡Ruta completada! Todas las lecturas han sido registradas exitosamente.`, "Toma de Lecturas");
            // Solo actualizar rutas cuando se completa toda la ruta
            actualizarRutas(periodoMostrado).catch(console.error);
          }, 500);
        }
      } else {
        setErroresLectura(prev => ({
          ...prev,
          [medidorId]: response.message
        }));
        setError(response.message, "Toma de Lecturas");
      }
    } catch (err) {
      const errorMsg = "Error al guardar la lectura. Intenta nuevamente.";
      setErroresLectura(prev => ({
        ...prev,
        [medidorId]: errorMsg
      }));
      setError(errorMsg, "Toma de Lecturas");
    } finally {
      setIsSubmitting(false);
    }
  }, [puntoActual, lecturas, rutaId, periodoMostrado, user.id, obtenerFechaActual, setSuccess, setError, currentIndex, total, lecturasGuardadas, actualizarRutas]);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
      // Enfocar el input después del cambio solo si la lectura no está completada
      setTimeout(() => {
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
      // Enfocar el input después del cambio solo si la lectura no está completada
      setTimeout(() => {
        const anteriorPunto = ruta.puntos[currentIndex - 1];
        if (anteriorPunto && !lecturasGuardadas.has(anteriorPunto.numero_serie) && lecturaInputRef.current) {
          lecturaInputRef.current?.focus();
        }
      }, 100);
    }
  }, [currentIndex, ruta, lecturasGuardadas]);

  // Efecto para enfocar el input cuando se abre el modal o cambia el punto actual
  useEffect(() => {
    if (isOpen && lecturaInputRef.current && !isLecturaCompletada) {
      // Usar setTimeout para asegurar que el DOM esté completamente renderizado
      const timer = setTimeout(() => {
        lecturaInputRef.current?.focus();
      }, 150); // Aumentamos el delay ligeramente
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentIndex, isLecturaCompletada]);

  // Manejador de teclas para atajos de teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Enter para guardar lectura (solo si el input tiene focus y la lectura no está completada)
      if (e.key === 'Enter' && !isLecturaCompletada && document.activeElement === lecturaInputRef.current?.querySelector('input')) {
        e.preventDefault();
        handleGuardarLectura();
      }
      // Escape para cerrar modal
      else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      // Flecha derecha para siguiente (si no está enfocado el input o la lectura está completada)
      else if (e.key === 'ArrowRight' && (isLecturaCompletada || document.activeElement !== lecturaInputRef.current?.querySelector('input'))) {
        e.preventDefault();
        handleNext();
      }
      // Flecha izquierda para anterior (si no está enfocado el input o la lectura está completada)
      else if (e.key === 'ArrowLeft' && (isLecturaCompletada || document.activeElement !== lecturaInputRef.current?.querySelector('input'))) {
        e.preventDefault();
        handlePrev();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleGuardarLectura, handleNext, handlePrev, onClose, isLecturaCompletada]);

  // Función para finalizar la ruta manualmente
  const handleFinalizarRuta = useCallback(() => {
    if (!hasValidData) return;
    
    const lecturasNoGuardadas = ruta.puntos.filter(punto => 
      !lecturasGuardadas.has(punto.numero_serie)
    );

    if (lecturasNoGuardadas.length > 0) {
      setError(`Hay ${lecturasNoGuardadas.length} lecturas sin guardar. Por favor, guarda todas las lecturas antes de finalizar.`, "Toma de Lecturas");
      return;
    }

    setSuccess(`Ruta ${ruta.nombre} finalizada exitosamente. Se guardaron ${lecturasGuardadas.size} lecturas.`, "Toma de Lecturas");
    
    // Actualizar rutas una sola vez al finalizar
    actualizarRutas(periodoMostrado).catch(console.error);
    
    onClose();
  }, [hasValidData, ruta, lecturasGuardadas, setError, setSuccess, onClose, actualizarRutas, periodoMostrado]);

  // Si no hay ruta cargada, mostrar loading
  if (!hasValidData) {
    return (
      <>
        <Button 
          color="primary" 
          onPress={onOpen}
          isDisabled={true}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          startContent={<HiMap className="text-lg" />}
        >
          {loading || ruta === null ? (
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              Cargando...
            </div>
          ) : (
            "Sin medidores disponibles"
          )}
        </Button>
      </>
    );
  }

  return (
    <>
      <Button 
        color="primary" 
        onPress={onOpen}
        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
        startContent={<HiMap className="text-lg" />}
      >
        Tomar Lecturas
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => {
          // Solo permitir cerrar manualmente, no automáticamente
          if (!open) {
            onClose();
          }
        }}
        size="5xl"
        isDismissible={false}
        scrollBehavior="inside"
        isKeyboardDismissDisabled={true}
        backdrop="blur"
        classNames={{
          backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
          base: "border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]",
          header: "border-b-[1px] border-[#292f46]",
          footer: "border-t-[1px] border-[#292f46]",
          closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex items-center justify-between w-full px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-full">
                      <HiLocationMarker className="text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Toma de Lecturas</h2>
                      <p className="text-sm opacity-90">{ruta.nombre} - {ruta.descripcion}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Chip 
                      color="warning" 
                      variant="flat"
                      className="text-white bg-white/20"
                    >
                      {currentIndex + 1} de {total}
                    </Chip>
                    <Progress
                      value={(currentIndex + 1) / total * 100}
                      className="mt-2 w-32"
                      color="warning"
                      size="sm"
                    />
                    <p className="text-xs mt-1 opacity-75">
                      {lecturasGuardadas.size} de {total} guardadas
                    </p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Información del Cliente */}
                  <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-0 shadow-xl">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                          <HiUser className="text-white text-lg" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Información del Cliente
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Cliente y datos del medidor
                          </p>
                        </div>
                        {lecturasGuardadas.has(puntoActual?.numero_serie) && (
                          <Chip color="success" variant="flat" size="sm">
                            ✓ Guardada
                          </Chip>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardBody className="pt-0 space-y-4">
                      {/* Grid de información */}
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                            <HiUser className="text-base" />
                            Cliente:
                          </span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-white">
                            {puntoActual?.cliente_nombre || "N/A"}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2">
                            <HiLocationMarker className="text-base" />
                            Dirección:
                          </span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-white">
                            {puntoActual?.cliente_direccion || "N/A"}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                            <HiPhone className="text-base" />
                            Teléfono:
                          </span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-white">
                            {puntoActual?.cliente_telefono || "N/A"}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-2">
                            <HiHashtag className="text-base" />
                            Medidor:
                          </span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-white">
                            {puntoActual?.numero_serie || "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                            <HiLocationMarker className="text-base" />
                            Ubicación Medidor:
                          </span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-white">
                            {puntoActual?.ubicacion || "N/A"}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm font-medium text-teal-600 dark:text-teal-400 flex items-center gap-2">
                            <HiCalendar className="text-base" />
                            Fecha:
                          </span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-white">
                            {new Date().toLocaleDateString('es-MX', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm font-medium text-pink-600 dark:text-pink-400 flex items-center gap-2">
                            <HiUser className="text-base" />
                            Orden:
                          </span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-white">
                            {puntoActual?.orden || 0} de {total}
                          </span>
                        </div>
                      </div>

                      <Divider className="my-4" />

                      {/* Input de lectura */}
                      {isLecturaCompletada ? (
                        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                          <CardBody className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <div className="p-1 bg-green-500 rounded-full">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-green-700 dark:text-green-400 font-semibold">
                                Lectura ya completada
                              </span>
                            </div>
                            <p className="text-sm text-green-600 dark:text-green-300">
                              Esta lectura ya fue registrada en el sistema para el período {periodoMostrado}
                            </p>
                            <p className="text-xs text-green-500 dark:text-green-400 mt-2">
                              Medidor: {puntoActual?.numero_serie}
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

                      {/* Coordenadas */}
                      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800">
                        <CardBody className="p-3">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="text-center">
                              <p className="text-green-600 dark:text-green-400 font-medium">Latitud</p>
                              <p className="font-semibold text-gray-800 dark:text-white">{puntoActual?.latitud || "N/A"}°</p>
                            </div>
                            <div className="text-center">
                              <p className="text-blue-600 dark:text-blue-400 font-medium">Longitud</p>
                              <p className="font-semibold text-gray-800 dark:text-white">{puntoActual?.longitud || "N/A"}°</p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </CardBody>
                  </Card>

                  {/* Mapa */}
                  {mapaProps && (
                    <MapaContainer
                      lat={mapaProps.lat}
                      lng={mapaProps.lng}
                      cliente={mapaProps.cliente}
                      ciudad={ruta?.nombre || ""}
                    />
                  )}
                </div>
              </ModalBody>

              <ModalFooter className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between w-full">
                  <Button
                    onClick={handlePrev}
                    color="default"
                    variant="bordered"
                    isDisabled={currentIndex === 0}
                    className="border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    startContent={<span className="text-lg">←</span>}
                  >
                    Anterior
                  </Button>

                  <div className="flex items-center gap-3">
                    {/* Indicadores de progreso */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: total }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === currentIndex
                              ? "bg-blue-500"
                              : (hasValidData && lecturasGuardadas.has(ruta.puntos[i]?.numero_serie))
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          title={`Punto ${i + 1} - ${hasValidData && lecturasGuardadas.has(ruta.puntos[i]?.numero_serie) ? 'Guardado' : 'Pendiente'}`}
                        />
                      ))}
                    </div>
                    
                    <Button
                      onClick={handleNext}
                      color="primary"
                      isDisabled={currentIndex === total - 1}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                      endContent={<span className="text-lg">→</span>}
                    >
                      Siguiente
                    </Button>

                    <Button 
                      color="success" 
                      onClick={handleFinalizarRuta}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                      isDisabled={lecturasGuardadas.size !== total}
                    >
                      {lecturasGuardadas.size === total ? 'Cerrar' : `Finalizar Ruta (${lecturasGuardadas.size}/${total})`}
                    </Button>
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


