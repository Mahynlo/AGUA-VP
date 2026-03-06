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
  HiCheck,
  HiSearch,
  HiX,
  HiPencil
} from "react-icons/hi";
import MapaLecturas from "../../mapa/MapaLecturas";
import { useRutas } from "../../../context/RutasContext";
import { useFeedback } from "../../../context/FeedbackContext";
import { useAuth } from "../../../context/AuthContext";

// Componente separado para el input de lectura
const LecturaInput = React.memo(React.forwardRef(
  ({ value, onChange, clienteId, onSave, isLoading, error, autoFocus, lecturaAnterior, capacidadMaxima = 99999, onConfirmarVueltaCero, onCorregirLectura }, ref) => {

  // Consumo calculado en tiempo real (resta normal)
  const consumoCalculado = useMemo(() => {
    const actual = parseFloat(value);
    if (isNaN(actual) || value === "") return null;
    if (lecturaAnterior === null || lecturaAnterior === undefined) return 0; // primera lectura
    const anterior = parseFloat(lecturaAnterior);
    return parseFloat((actual - anterior).toFixed(4));
  }, [value, lecturaAnterior]);

  // Consumo estimado si fue vuelta a cero (99,999.99 − anterior + actual)
  const consumoCalculadoRollover = useMemo(() => {
    const actual = parseFloat(value);
    if (isNaN(actual) || value === "" || lecturaAnterior === null || lecturaAnterior === undefined) return null;
    const anterior = parseFloat(lecturaAnterior);
    return parseFloat(((capacidadMaxima - anterior) + actual).toFixed(4));
  }, [value, lecturaAnterior]);

  const valorMenorQueAnterior =
    lecturaAnterior !== null && lecturaAnterior !== undefined &&
    value !== "" && !isNaN(parseFloat(value)) &&
    parseFloat(value) < parseFloat(lecturaAnterior);

  const fmtM3 = (v) => Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  return (
    <div className="space-y-3">

      {/* Lectura anterior de referencia */}
      {lecturaAnterior !== null && lecturaAnterior !== undefined ? (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2.5 border border-blue-100 dark:border-blue-800">
          <div>
            <p className="text-[11px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide">Lectura anterior (referencia)</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{fmtM3(lecturaAnterior)} m³</p>
          </div>
          {consumoCalculado !== null && !valorMenorQueAnterior && (
            <div className="text-right">
              <p className="text-[11px] font-semibold text-green-500 uppercase tracking-wide">Consumo calculado</p>
              <p className={`text-xl font-bold ${consumoCalculado >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {fmtM3(consumoCalculado)} m³
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-2.5 border border-amber-200 dark:border-amber-700">
          <div>
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Primera lectura</p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
              No hay lectura anterior registrada. El valor ingresado será el punto de inicio del medidor.
            </p>
          </div>
        </div>
      )}

      {/* Input: lectura actual del medidor */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Lectura actual del medidor (m³ acumulados)*
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
          placeholder={lecturaAnterior !== null && lecturaAnterior !== undefined ? String(Number(lecturaAnterior)) : "0.00"}
          disabled={isLoading}
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') e.preventDefault();
            if (e.key === 'Enter') { e.preventDefault(); if (!valorMenorQueAnterior) onSave(); }
          }}
          className={`border ${
            error ? 'border-red-500 focus:ring-red-500'
            : valorMenorQueAnterior ? 'border-orange-400 focus:ring-orange-500'
            : 'border-gray-300 focus:ring-blue-600 focus:border-blue-500'
          } text-gray-800 text-3xl font-bold rounded-xl pl-10 pr-4 py-4 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:border-gray-600 dark:text-white transition-all`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Spinner size="sm" />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

      {/* Panel de confirmación — aparece automáticamente cuando la lectura bajó */}
      {valorMenorQueAnterior ? (
        <div className="rounded-xl border-2 border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <p className="font-bold text-orange-700 dark:text-orange-300">Lectura menor que la anterior — confirmar</p>
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Anterior</p>
              <p className="font-bold text-lg text-gray-700 dark:text-gray-200">{fmtM3(lecturaAnterior)} m³</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Ingresaste</p>
              <p className="font-bold text-lg text-orange-600 dark:text-orange-400">{fmtM3(parseFloat(value))} m³</p>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wide">Si fue vuelta a cero, el consumo sería:</p>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-0.5">
              {consumoCalculadoRollover !== null ? fmtM3(consumoCalculadoRollover) : '—'} m³
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              ({fmtM3(capacidadMaxima)} − {fmtM3(lecturaAnterior)}) + {fmtM3(parseFloat(value))}
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              color="success"
              variant="solid"
              className="flex-1 font-bold"
              onPress={onConfirmarVueltaCero}
              isLoading={isLoading}
              startContent={!isLoading && <HiCheck />}
            >
              Sí, fue vuelta a cero
            </Button>
            <Button
              color="default"
              variant="bordered"
              className="flex-1 font-bold"
              onPress={onCorregirLectura}
              isDisabled={isLoading}
            >
              Corregir valor
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-end mt-4">
          <Button
            color="primary"
            onPress={onSave}
            isLoading={isLoading}
            isDisabled={!value || value.toString().trim() === ""}
            className="font-bold text-md px-8 shadow-md"
            size="lg"
            endContent={<HiCheck className="text-xl" />}
          >
            Guardar Lectura
          </Button>
        </div>
      )}
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

// Helper: normaliza texto quitando acentos y pasando a minúsculas
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
  const { obtenerInfoRuta, actualizarRutas, rutas, loading } = useRutas();
  const { setError, setSuccess } = useFeedback();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lecturas, setLecturas] = useState({});
  const [ruta, setRuta] = useState(null);
  const [lecturasGuardadas, setLecturasGuardadas] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroresLectura, setErroresLectura] = useState({});
  const [showSearch, setShowSearch] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [vueltasCero, setVueltasCero] = useState({});            // { [medidor_id]: boolean }
  const [lecturasRegistradas, setLecturasRegistradas] = useState({}); // { [medidor_id]: detalles del backend }
  const [modoRectificar, setModoRectificar] = useState({});            // { [medidor_id]: boolean }

  const lecturaInputRef = React.useRef(null);
  const searchInputRef = React.useRef(null);

  // Efecto 1: Carga los datos de la ruta UNA SOLA VEZ al montar (o cuando cambia rutaId).
  // No depende de 'rutas' para evitar recargar toda la ruta y resetear el formulario
  // cada vez que el contexto se actualice tras un guardado.
  useEffect(() => {
    if (!rutaId) return;
    obtenerInfoRuta(rutaId)
      .then((rutaData) => {
        if (!rutaData) {
          setRuta(null);
          setError("No se pudo cargar la ruta", "Toma de Lecturas");
          return;
        }
        setRuta({
          ...rutaData,
          puntos: (rutaData.puntos || []).filter(p => p.cliente_id)
        });
        setCurrentIndex(0);
        setLecturas({});
        setErroresLectura({});
        setVueltasCero({});
        // lecturasRegistradas y modoRectificar NO se resetean aquí: este efecto se
        // re-ejecuta cuando obtenerInfoRuta cambia de referencia tras actualizarRutas().
        // Los limpia el Efecto 1b que solo depende de rutaId.
      })
      .catch((error) => {
        console.error("Error al obtener la ruta:", error);
        setRuta(null);
        setError("Error al cargar la información de la ruta", "Toma de Lecturas");
      });
  }, [rutaId, obtenerInfoRuta, setError]);

  // Efecto 1b: Limpia estados de sesión de lectura SOLO cuando cambia de ruta.
  useEffect(() => {
    setLecturasRegistradas({});
    setModoRectificar({});
  }, [rutaId]);

  // Efecto 2: Mantiene lecturasGuardadas sincronizado con el contexto.
  // Cuando 'rutas' se actualiza (tras actualizarRutas()), este efecto refleja
  // el nuevo estado de completados sin recargar ni resetear nada más.
  useEffect(() => {
    if (!rutaId) return;
    const rutaEnContexto = rutas.find(r => r.id === rutaId);
    if (rutaEnContexto?.medidores_completados) {
      setLecturasGuardadas(new Set(rutaEnContexto.medidores_completados));
    }
  }, [rutas, rutaId]);

  const obtenerFechaActual = useCallback(() => {
    const ahora = new Date();
    return ahora.toISOString().split('T')[0];
  }, []);

  const hasValidData = ruta && ruta.puntos && ruta.puntos.length > 0;
  const total = hasValidData ? ruta.puntos.length : 0;
  const puntoActual = hasValidData ? ruta.puntos[currentIndex] : null;
  const lecturaActual = puntoActual ? (lecturas[puntoActual.medidor_id] || "") : "";
  const errorLecturaActual = puntoActual ? (erroresLectura[puntoActual.medidor_id] || "") : "";
  const lecturaAnteriorPunto = puntoActual ? (puntoActual.lectura_anterior_disponible ?? null) : null;
  const capMaxPunto = puntoActual ? (puntoActual.capacidad_maxima ?? 99999) : 99999;
  
  // CORRECCIÓN: Check reactivo para ver si la lectura está completada
  const isLecturaCompletada = useMemo(() => {
    if (!puntoActual) return false;
    return lecturasGuardadas.has(puntoActual.numero_serie);
  }, [puntoActual, lecturasGuardadas]);

  // Resultados de búsqueda sobre todos los puntos de la ruta
  const resultadosBusqueda = useMemo(() => {
    if (!hasValidData || !busqueda.trim()) return [];
    const term = norm(busqueda);
    return ruta.puntos
      .map((p, idx) => ({ ...p, idx }))
      .filter(
        (p) =>
          norm(p.cliente_nombre || "").includes(term) ||
          norm(p.numero_serie || "").includes(term) ||
          String(p.orden ?? p.idx + 1).includes(term)
      )
      .slice(0, 10);
  }, [busqueda, ruta, hasValidData]);

  const handleJumpTo = useCallback((idx) => {
    setCurrentIndex(idx);
    setShowSearch(false);
    setBusqueda("");
    setTimeout(() => lecturaInputRef.current?.focus(), 150);
  }, []);

  const handleToggleSearch = useCallback(() => {
    setShowSearch((v) => {
      if (!v) setTimeout(() => searchInputRef.current?.focus(), 50);
      return !v;
    });
    setBusqueda("");
  }, []);

  const handleCorregirLectura = useCallback(() => {
    if (!puntoActual) return;
    setLecturas(prev => ({ ...prev, [puntoActual.medidor_id]: "" }));
    setErroresLectura(prev => ({ ...prev, [puntoActual.medidor_id]: "" }));
    setTimeout(() => lecturaInputRef.current?.focus(), 50);
  }, [puntoActual]);

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

  const handleGuardarLectura = useCallback(async (forceVueltaCero = false) => {
    if (!puntoActual) return;
    const medidorId = puntoActual.medidor_id;
    const numeroSerieActual = puntoActual.numero_serie;
    const lectura = lecturas[medidorId];
    const lectAnterior = puntoActual.lectura_anterior_disponible ?? null;
    // Coercionar a boolean estricto: el Button de NextUI pasa un PressEvent como primer
    // argumento cuando se usa directamente como onPress, lo que causaría truthy incorrecto.
    const esVueltaCero = forceVueltaCero === true || vueltasCero[medidorId] === true;

    if (!lectura || lectura.toString().trim() === "") {
      setErroresLectura(prev => ({ ...prev, [medidorId]: "La lectura es obligatoria" }));
      return;
    }

    const lecturaNum = parseFloat(lectura);
    if (isNaN(lecturaNum) || lecturaNum < 0) {
      setErroresLectura(prev => ({ ...prev, [medidorId]: "La lectura no puede ser negativa" }));
      return;
    }

    setIsSubmitting(true);

    try {
      const tokensession = localStorage.getItem("token");
      const lecturaData = {
        medidor_id: medidorId,
        ruta_id: rutaId,
        lectura_actual: lecturaNum,
        vuelta_cero: esVueltaCero,
        fecha_lectura: obtenerFechaActual(),
        periodo: periodoMostrado,
        modificado_por: user.id,
      };

      const response = await window.api.registerLectura(lecturaData, tokensession);

      if (response.success) {
        setLecturasGuardadas(prevSet => {
          const newSet = new Set(prevSet);
          newSet.add(numeroSerieActual);
          return newSet;
        });
        // Limpiar flag de vuelta a cero al guardar
        setVueltasCero(prev => { const n = { ...prev }; delete n[medidorId]; return n; });
        // Guardar detalles desde el backend (fuente autoritativa) para el modo rectificación.
        // response.detalles.lectura_anterior es lo que el backend tenía en la BD al guardar,
        // no el estado del frontend que puede estar desactualizado.
        const lectAnteriorReal = response.detalles?.lectura_anterior !== undefined
            ? response.detalles.lectura_anterior
            : lectAnterior;
        setLecturasRegistradas(prev => ({
          ...prev,
          [medidorId]: {
            lectura_anterior: lectAnteriorReal,
            lectura_actual: response.detalles?.lectura_actual ?? lecturaNum,
            consumo_m3: response.detalles?.consumo_m3 ?? (lectAnteriorReal !== null ? Math.max(0, lecturaNum - lectAnteriorReal) : lecturaNum),
            lecturaId: response.lecturaID,
            vuelta_cero: esVueltaCero
          }
        }));
        setModoRectificar(prev => { const n = { ...prev }; delete n[medidorId]; return n; });

        setSuccess(`Lectura guardada exitosamente`, "Toma de Lecturas");
        setErroresLectura(prev => ({ ...prev, [medidorId]: "" }));

        if (currentIndex < total - 1) {
          setTimeout(() => setCurrentIndex(prev => prev + 1), 500);
        } else {
          setTimeout(() => {
            setSuccess(`¡Ruta completada!`, "Toma de Lecturas");
            actualizarRutas(periodoMostrado).catch(console.error);
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
  }, [puntoActual, lecturas, vueltasCero, rutaId, periodoMostrado, user.id, obtenerFechaActual, setSuccess, setError, currentIndex, total, actualizarRutas]);

  const handleConfirmarVueltaCero = useCallback(async () => {
    if (!puntoActual) return;
    setVueltasCero(prev => ({ ...prev, [puntoActual.medidor_id]: true }));
    await handleGuardarLectura(true);
  }, [puntoActual, handleGuardarLectura]);

  // Guarda la rectificación de una lectura ya registrada.
  // La lectura ANTERIOR no cambia — solo la lectura actual y el consumo recalculado.
  const handleRectificarGuardar = useCallback(async () => {
    if (!puntoActual) return;
    const medidorId = puntoActual.medidor_id;
    const infoAnterior = lecturasRegistradas[medidorId];
    const lecturaValue = lecturas[medidorId];

    // lecturaId: session actual → lecturasRegistradas; sesión anterior → puntoActual.ultima_lectura_id
    const lecturaId = infoAnterior?.lecturaId ?? puntoActual.ultima_lectura_id ?? null;
    if (!lecturaValue || !lecturaId) return;

    const nuevaLectura = parseFloat(lecturaValue);
    if (isNaN(nuevaLectura) || nuevaLectura < 0) {
      setErroresLectura(prev => ({ ...prev, [medidorId]: "La lectura no puede ser negativa" }));
      return;
    }

    // anterior: session actual → lecturasRegistradas; sesión anterior → puntoActual.ultima_lectura_anterior
    const lecturaAnteriorCalculo = infoAnterior?.lectura_anterior ?? puntoActual.ultima_lectura_anterior ?? null;

    setIsSubmitting(true);
    try {
      const tokensession = localStorage.getItem("token");
      const nuevoConsumo = lecturaAnteriorCalculo !== null
        ? Math.max(0, nuevaLectura - lecturaAnteriorCalculo)
        : nuevaLectura;

      const response = await window.api.modificarLectura(
        lecturaId,
        { lectura_actual: nuevaLectura, consumo_m3: nuevoConsumo },
        tokensession
      );

      if (response.success) {
        setLecturasRegistradas(prev => ({
          ...prev,
          [medidorId]: {
            ...(prev[medidorId] ?? { lectura_anterior: lecturaAnteriorCalculo, lecturaId }),
            lectura_actual: nuevaLectura,
            consumo_m3: nuevoConsumo
          }
        }));
        setModoRectificar(prev => { const n = { ...prev }; delete n[medidorId]; return n; });
        setSuccess("Lectura rectificada exitosamente", "Toma de Lecturas");
        setErroresLectura(prev => ({ ...prev, [medidorId]: "" }));
      } else {
        setErroresLectura(prev => ({ ...prev, [medidorId]: response.message }));
        setError(response.message, "Toma de Lecturas");
      }
    } catch (err) {
      const msg = "Error al rectificar la lectura.";
      setErroresLectura(prev => ({ ...prev, [medidorId]: msg }));
      setError(msg, "Toma de Lecturas");
    } finally {
      setIsSubmitting(false);
    }
  }, [puntoActual, lecturas, lecturasRegistradas, setSuccess, setError]);

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
      if (e.key === 'Escape') {
        e.preventDefault();
        // Si hay búsqueda abierta, cerrarla primero; si no, cerrar el modal
        if (showSearch) {
          setShowSearch(false);
          setBusqueda("");
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight' && !showSearch) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' && !showSearch) {
        e.preventDefault();
        handlePrev();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
}, [isOpen, handleNext, handlePrev, onClose, showSearch]);

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
              {/* Header con búsqueda integrada */}
              <ModalHeader className="flex gap-3 items-center border-b border-gray-100 dark:border-gray-800 pb-4 overflow-visible">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg shrink-0">
                  <HiLocationMarker className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>

                {/* Título o barra de búsqueda */}
                {showSearch ? (
                  <div className="flex-1 relative">
                    <div className="relative flex items-center">
                      <HiSearch className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por cliente, medidor o #orden…"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") { setShowSearch(false); setBusqueda(""); }
                          // Prevent arrow keys from also triggering carousel nav
                          if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.stopPropagation();
                        }}
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-blue-300 dark:border-blue-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    {/* Dropdown de resultados */}
                    {busqueda.trim() && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                        {resultadosBusqueda.length > 0 ? (
                          <div className="max-h-64 overflow-y-auto">
                            {resultadosBusqueda.map((punto) => {
                              const hecho = lecturasGuardadas.has(punto.numero_serie);
                              return (
                                <button
                                  key={punto.medidor_id}
                                  onClick={() => handleJumpTo(punto.idx)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-100 dark:border-gray-700 last:border-0 text-left transition-colors"
                                >
                                  <span className="text-[11px] font-bold text-gray-400 w-8 text-center shrink-0 tabular-nums">
                                    #{punto.orden ?? punto.idx + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate leading-tight">
                                      {punto.cliente_nombre || "Cliente"}
                                    </p>
                                    <p className="text-[11px] text-gray-400 truncate">
                                      {punto.numero_serie}
                                      {punto.ubicacion ? ` · ${punto.ubicacion}` : ""}
                                    </p>
                                  </div>
                                  {hecho ? (
                                    <span className="text-[11px] font-semibold text-green-600 dark:text-green-400 shrink-0 flex items-center gap-0.5">
                                      <HiCheck className="w-3 h-3" /> Hecho
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-semibold text-orange-500 shrink-0">Pendiente</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="px-4 py-3 text-xs text-center text-gray-400">Sin resultados</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold">Toma de Lecturas</h3>
                    <p className="text-sm font-normal text-gray-500 dark:text-gray-400 truncate">
                      {ruta.nombre} — {ruta.descripcion}
                    </p>
                  </div>
                )}

                {/* Botón lupa */}
                <button
                  onClick={handleToggleSearch}
                  title={showSearch ? "Cerrar búsqueda" : "Buscar cliente / medidor"}
                  className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  {showSearch
                    ? <HiX className="w-5 h-5" />
                    : <HiSearch className="w-5 h-5" />}
                </button>

                <div className="flex flex-col items-end gap-1 shrink-0">
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
                        {isLecturaCompletada && !modoRectificar[puntoActual?.medidor_id] ? (
                            <Card className="bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800 shadow-none">
                                <CardBody className="flex flex-col gap-3 py-5 px-4">
                                    {/* Encabezado */}
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                                            <HiCheck className="text-xl text-green-600 dark:text-green-300" />
                                        </div>
                                        <h4 className="text-base font-bold text-green-700 dark:text-green-400">Lectura Completada</h4>
                                    </div>

                                    {/* Detalles numéricos */}
                                    {lecturasRegistradas[puntoActual?.medidor_id] ? (
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg p-2 border border-green-100 dark:border-green-900">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Anterior</span>
                                                <span className="font-semibold text-gray-700 dark:text-gray-200">
                                                    {lecturasRegistradas[puntoActual.medidor_id].lectura_anterior !== null
                                                        ? `${Number(lecturasRegistradas[puntoActual.medidor_id].lectura_anterior).toLocaleString('es-MX', { minimumFractionDigits: 2 })} m³`
                                                        : '— (inicial)'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg p-2 border border-green-100 dark:border-green-900">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Actual</span>
                                                <span className="font-semibold text-green-700 dark:text-green-400">
                                                    {Number(lecturasRegistradas[puntoActual.medidor_id].lectura_actual).toLocaleString('es-MX', { minimumFractionDigits: 2 })} m³
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg p-2 border border-green-100 dark:border-green-900">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Consumo</span>
                                                <span className="font-semibold text-blue-700 dark:text-blue-400">
                                                    {Number(lecturasRegistradas[puntoActual.medidor_id].consumo_m3 ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} m³
                                                </span>
                                            </div>
                                            {lecturasRegistradas[puntoActual.medidor_id].vuelta_cero && (
                                                <div className="col-span-3 text-center text-xs text-orange-600 dark:text-orange-400 font-medium">
                                                    ⚠ Vuelta a cero registrada
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Lectura registrada en sesión anterior — mostrar datos del backend
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg p-2 border border-green-100 dark:border-green-900">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Anterior</span>
                                                <span className="font-semibold text-gray-700 dark:text-gray-200">
                                                    {puntoActual?.ultima_lectura_anterior !== null && puntoActual?.ultima_lectura_anterior !== undefined
                                                        ? `${Number(puntoActual.ultima_lectura_anterior).toLocaleString('es-MX', { minimumFractionDigits: 2 })} m³`
                                                        : '— (inicial)'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg p-2 border border-green-100 dark:border-green-900">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Actual</span>
                                                <span className="font-semibold text-green-700 dark:text-green-400">
                                                    {puntoActual?.lectura_anterior_disponible !== null && puntoActual?.lectura_anterior_disponible !== undefined
                                                        ? `${Number(puntoActual.lectura_anterior_disponible).toLocaleString('es-MX', { minimumFractionDigits: 2 })} m³`
                                                        : '—'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg p-2 border border-green-100 dark:border-green-900">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Consumo</span>
                                                <span className="font-semibold text-blue-700 dark:text-blue-400">
                                                    {puntoActual?.lectura_anterior_disponible !== null && puntoActual?.ultima_lectura_anterior !== null
                                                        ? `${Math.max(0, Number(puntoActual.lectura_anterior_disponible) - Number(puntoActual.ultima_lectura_anterior)).toLocaleString('es-MX', { minimumFractionDigits: 2 })} m³`
                                                        : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Botón rectificar */}
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="warning"
                                        startContent={<HiPencil />}
                                        onPress={() => {
                                            const med = puntoActual.medidor_id;
                                            setModoRectificar(prev => ({ ...prev, [med]: true }));
                                            // Pre-llenar: sesión actual → desde lecturasRegistradas; sesión anterior → lectura_anterior_disponible
                                            const lectActual = lecturasRegistradas[med]?.lectura_actual ?? puntoActual.lectura_anterior_disponible;
                                            if (lectActual !== undefined && lectActual !== null) {
                                                setLecturas(prev => ({ ...prev, [med]: String(lectActual) }));
                                            }
                                        }}
                                    >
                                        Rectificar Lectura
                                    </Button>
                                </CardBody>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {modoRectificar[puntoActual?.medidor_id] && (
                                    <div className="flex items-center justify-between bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 rounded-lg px-3 py-2">
                                        <span className="text-xs font-semibold text-warning-700 dark:text-warning-400">Modo rectificación — ingresa el valor correcto</span>
                                        <Button
                                            size="sm"
                                            variant="light"
                                            color="default"
                                            startContent={<HiX />}
                                            onPress={() => setModoRectificar(prev => { const n = { ...prev }; delete n[puntoActual.medidor_id]; return n; })}
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                )}
                                <LecturaInput
                                    ref={lecturaInputRef}
                                    value={lecturaActual}
                                    onChange={handleLecturaChange}
                                    clienteId={puntoActual?.medidor_id}
                                    onSave={modoRectificar[puntoActual?.medidor_id] ? handleRectificarGuardar : handleGuardarLectura}
                                    isLoading={isSubmitting}
                                    error={errorLecturaActual}
                                    autoFocus={true}
                                    lecturaAnterior={
                                        // En modo rectificación: usar lectura_anterior REAL
                                        // (1) Guardada esta sesión → desde lecturasRegistradas
                                        // (2) Sesión anterior → desde puntoActual.ultima_lectura_anterior (subquery backend)
                                        // (3) Flujo normal → lecturaAnteriorPunto
                                        modoRectificar[puntoActual?.medidor_id] && puntoActual?.medidor_id in lecturasRegistradas
                                            ? lecturasRegistradas[puntoActual.medidor_id].lectura_anterior
                                            : modoRectificar[puntoActual?.medidor_id]
                                                ? (puntoActual?.ultima_lectura_anterior ?? null)
                                                : lecturaAnteriorPunto
                                    }
                                    capacidadMaxima={capMaxPunto}
                                    onConfirmarVueltaCero={modoRectificar[puntoActual?.medidor_id] ? undefined : handleConfirmarVueltaCero}
                                    onCorregirLectura={modoRectificar[puntoActual?.medidor_id] ? undefined : handleCorregirLectura}
                                />
                            </div>
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
                                    <div key={idx} className={`w-2 h-2 rounded-full ${
                                        idx === currentIndex ? 'bg-blue-600' :
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


