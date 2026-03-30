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
  HiPencil,
  HiExclamation
} from "react-icons/hi";
import MapaLecturas from "../../mapa/MapaLecturas";
import { useRutas } from "../../../context/RutasContext";
import { useFeedback } from "../../../context/FeedbackContext";
import { useAuth } from "../../../context/AuthContext";

// Componente separado para el input de lectura (UI Premium)
const LecturaInput = React.memo(React.forwardRef(
  ({ value, onChange, clienteId, onSave, isLoading, error, autoFocus, lecturaAnterior, capacidadMaxima = 99999, onConfirmarVueltaCero, onCorregirLectura }, ref) => {

  const consumoCalculado = useMemo(() => {
    const actual = parseFloat(value);
    if (isNaN(actual) || value === "") return null;
    if (lecturaAnterior === null || lecturaAnterior === undefined) return 0;
    const anterior = parseFloat(lecturaAnterior);
    return parseFloat((actual - anterior).toFixed(4));
  }, [value, lecturaAnterior]);

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
    <div className="space-y-4">

      {/* Lectura anterior de referencia */}
      {lecturaAnterior !== null && lecturaAnterior !== undefined ? (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100/50 dark:border-blue-800/30">
          <div>
            <p className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider mb-1">Lectura Anterior</p>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300 tracking-tight">{fmtM3(lecturaAnterior)} <span className="text-sm opacity-70">m³</span></p>
          </div>
          {consumoCalculado !== null && !valorMenorQueAnterior && (
            <div className="text-right border-l pl-4 border-blue-200 dark:border-blue-800/50">
              <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider mb-1">Consumo (Resta)</p>
              <p className={`text-2xl font-black tracking-tight ${consumoCalculado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                +{fmtM3(consumoCalculado)} <span className="text-sm opacity-70">m³</span>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-800/30">
          <HiExclamation className="text-amber-500 text-xl shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">Primera lectura del medidor</p>
            <p className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70 leading-snug">
              No hay un registro anterior. El valor que ingreses será el punto de partida oficial.
            </p>
          </div>
        </div>
      )}

      {/* Input: lectura actual del medidor */}
      <div className="pt-2">
        <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Ingresar Lectura Actual (m³)
        </label>
        <div className="relative w-full flex shadow-sm rounded-2xl group">
            <span className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl transition-colors ${valorMenorQueAnterior ? 'text-orange-500' : 'text-blue-500 group-focus-within:text-blue-600'}`}>
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
            className={`
                w-full pl-14 pr-16 py-4 text-3xl font-black rounded-2xl transition-all duration-200 focus:outline-none focus:ring-4
                bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-white placeholder-slate-300 dark:placeholder-zinc-600
                ${error 
                    ? 'border-2 border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50 dark:bg-red-900/10'
                    : valorMenorQueAnterior 
                        ? 'border-2 border-orange-400 focus:ring-orange-500/20 focus:border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                        : 'border-2 border-slate-200 dark:border-zinc-700 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-300'
                }
            `}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center">
                {isLoading ? (
                    <Spinner size="sm" color="primary" />
                ) : (
                    <span className="text-slate-400 font-bold">m³</span>
                )}
            </div>
        </div>
        {error && <p className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1"><HiExclamation /> {error}</p>}
      </div>

      {/* Panel de confirmación — aparece automáticamente cuando la lectura bajó */}
      {valorMenorQueAnterior ? (
        <div className="rounded-2xl border border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-900/10 p-5 space-y-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-200/50 dark:bg-orange-800/50 rounded-full">
                <HiExclamation className="text-orange-600 dark:text-orange-400 text-lg" />
            </div>
            <p className="font-bold text-orange-800 dark:text-orange-300 text-sm">Alerta: La lectura es menor que la anterior</p>
          </div>
          
          <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Mes Anterior</p>
              <p className="font-black text-lg text-slate-700 dark:text-zinc-200">{fmtM3(lecturaAnterior)} <span className="text-xs opacity-60">m³</span></p>
            </div>
            <HiArrowRight className="text-slate-300" />
            <div className="text-right">
              <p className="text-[10px] text-orange-500 uppercase tracking-wider font-bold mb-0.5">Ingresaste</p>
              <p className="font-black text-lg text-orange-600 dark:text-orange-400">{fmtM3(parseFloat(value))} <span className="text-xs opacity-60">m³</span></p>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/30 flex justify-between items-center">
            <div>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Si el medidor dio vuelta a cero:</p>
                <p className="text-xs text-indigo-500/70 dark:text-indigo-400/70 mt-0.5 font-medium">
                ({fmtM3(capacidadMaxima)} − {fmtM3(lecturaAnterior)}) + {fmtM3(parseFloat(value))}
                </p>
            </div>
            <div className="text-right">
                <p className="text-xl font-black text-indigo-700 dark:text-indigo-300">
                {consumoCalculadoRollover !== null ? fmtM3(consumoCalculadoRollover) : '—'} <span className="text-xs opacity-60">m³</span>
                </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              color="warning"
              variant="solid"
              className="flex-1 font-bold text-white shadow-md shadow-orange-500/20"
              onPress={onConfirmarVueltaCero}
              isLoading={isLoading}
              startContent={!isLoading && <HiCheck />}
            >
              Confirmar Vuelta a Cero
            </Button>
            <Button
              color="default"
              variant="flat"
              className="flex-1 font-bold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
              onPress={onCorregirLectura}
              isDisabled={isLoading}
            >
              Corregir Error
            </Button>
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <Button
            color="primary"
            onPress={onSave}
            isLoading={isLoading}
            isDisabled={!value || value.toString().trim() === ""}
            className="w-full font-bold text-base h-12 shadow-lg shadow-blue-500/30"
            endContent={!isLoading && <HiArrowRight className="text-lg" />}
          >
            Guardar y Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}));

// Componente separado para el mapa
const MapaContainer = React.memo(({ lat, lng, cliente, ciudad }) => {
  return (
    <Card className="w-full h-full border-none shadow-sm bg-slate-50 dark:bg-zinc-800/50 rounded-2xl overflow-hidden flex flex-col min-h-[350px] sm:min-h-[400px]">
      <CardHeader className="pb-3 pt-4 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-zinc-700/50 shrink-0">
        <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
            <HiMap className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-slate-800 dark:text-white leading-none">Mapa de Ubicación</h4>
      </CardHeader>
      <CardBody className="p-0 relative flex-1 min-h-0">
          <MapaLecturas 
            lat={lat} 
            lng={lng} 
            cliente={cliente}
          />
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

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// InfoRow (Premium UI)
const InfoRow = ({ label, value, icon: Icon, colorClass, valueClass = "" }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800/50 last:border-0">
    <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 ${colorClass}`}>
      <Icon className="text-base shrink-0" />
      {label}
    </span>
    <span className={`text-sm font-bold text-slate-800 dark:text-zinc-100 text-right ${valueClass}`}>
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
  const [vueltasCero, setVueltasCero] = useState({});
  const [lecturasRegistradas, setLecturasRegistradas] = useState({});
  const [modoRectificar, setModoRectificar] = useState({});

  const lecturaInputRef = React.useRef(null);
  const searchInputRef = React.useRef(null);

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
      })
      .catch((error) => {
        console.error("Error al obtener la ruta:", error);
        setRuta(null);
        setError("Error al cargar la información de la ruta", "Toma de Lecturas");
      });
  }, [rutaId, obtenerInfoRuta, setError]);

  useEffect(() => {
    setLecturasRegistradas({});
    setModoRectificar({});
  }, [rutaId]);

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
  
  const isLecturaCompletada = useMemo(() => {
    if (!puntoActual) return false;
    return lecturasGuardadas.has(puntoActual.numero_serie);
  }, [puntoActual, lecturasGuardadas]);

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
        setVueltasCero(prev => { const n = { ...prev }; delete n[medidorId]; return n; });
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

  const handleRectificarGuardar = useCallback(async () => {
    if (!puntoActual) return;
    const medidorId = puntoActual.medidor_id;
    const infoAnterior = lecturasRegistradas[medidorId];
    const lecturaValue = lecturas[medidorId];

    const lecturaId = infoAnterior?.lecturaId ?? puntoActual.ultima_lectura_id ?? null;
    if (!lecturaValue || !lecturaId) return;

    const nuevaLectura = parseFloat(lecturaValue);
    if (isNaN(nuevaLectura) || nuevaLectura < 0) {
      setErroresLectura(prev => ({ ...prev, [medidorId]: "La lectura no puede ser negativa" }));
      return;
    }

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
        const anteriorPunto = ruta.puntos[currentIndex - 1];
        if (anteriorPunto && !lecturasGuardadas.has(anteriorPunto.numero_serie) && lecturaInputRef.current) {
          lecturaInputRef.current?.focus();
        }
      }, 100);
    }
  }, [currentIndex, ruta, lecturasGuardadas]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
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
        className="font-bold shadow-md bg-blue-600 hover:bg-blue-700 text-white"
        startContent={<HiMap className="text-lg" />}
      >
        {loading || ruta === null ? <div className="flex items-center gap-2"><Spinner size="sm" color="white"/>Cargando...</div> : "Sin medidores"}
      </Button>
    );
  }

  return (
    <>
      <Button 
        color="primary" 
        onPress={onOpen}
        className="font-bold shadow-md shadow-blue-500/30"
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
          base: "bg-white dark:bg-zinc-900 shadow-2xl h-[95vh] w-full max-w-[1300px]", 
          backdrop: "bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md",
          header: "border-b border-slate-100 dark:border-zinc-800",
          footer: "border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900",
          closeButton: "hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 text-slate-400 dark:text-zinc-500 transition-colors z-50",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              {/* Header con búsqueda integrada */}
              <ModalHeader className="flex gap-4 items-center pt-5 px-4 sm:px-6 pb-4 overflow-visible shrink-0">
                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0 hidden sm:flex">
                  <HiLocationMarker className="w-6 h-6" />
                </div>

                {/* Título o barra de búsqueda */}
                {showSearch ? (
                  <div className="flex-1 relative animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative flex items-center">
                      <HiSearch className="absolute left-4 w-5 h-5 text-blue-500 pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar cliente, medidor o #orden..."
                        onKeyDown={(e) => {
                          if (e.key === "Escape") { setShowSearch(false); setBusqueda(""); }
                          if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.stopPropagation();
                        }}
                        className="w-full pl-12 pr-4 py-3 text-sm font-medium border-2 border-blue-400/50 dark:border-blue-600 rounded-xl bg-white dark:bg-zinc-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 shadow-sm transition-all"
                      />
                    </div>

                    {/* Dropdown de resultados */}
                    {busqueda.trim() && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-[9999] bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
                        {resultadosBusqueda.length > 0 ? (
                          <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            {resultadosBusqueda.map((punto) => {
                              const hecho = lecturasGuardadas.has(punto.numero_serie);
                              return (
                                <button
                                  key={punto.medidor_id}
                                  onClick={() => handleJumpTo(punto.idx)}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-700/50 border-b border-slate-100 dark:border-zinc-700/50 last:border-0 text-left transition-colors"
                                >
                                  <span className="text-xs font-black text-slate-400 dark:text-zinc-500 w-8 text-center shrink-0 bg-slate-100 dark:bg-zinc-800 py-1 rounded-md">
                                    #{punto.orden ?? punto.idx + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate leading-tight mb-0.5">
                                      {punto.cliente_nombre || "Cliente"}
                                    </p>
                                    <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                                      <span className="font-mono text-blue-600 dark:text-blue-400 mr-2">{punto.numero_serie}</span>
                                      {punto.ubicacion ? ` ${punto.ubicacion}` : ""}
                                    </p>
                                  </div>
                                  {hecho ? (
                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
                                      <HiCheck className="text-sm" /> Hecho
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-500 dark:text-orange-400 shrink-0 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md">
                                        Pendiente
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-6 text-center">
                            <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">Sin resultados</p>
                            <p className="text-xs text-slate-400 mt-1">Verifica el nombre o número de serie.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 animate-in fade-in duration-200">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                        Toma de Lecturas
                    </h2>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-1 truncate">
                      {ruta.nombre} <span className="opacity-50 mx-1">•</span> {ruta.descripcion}
                    </p>
                  </div>
                )}

                {/* Botón lupa */}
                <button
                  onClick={handleToggleSearch}
                  title={showSearch ? "Cerrar búsqueda" : "Buscar cliente / medidor"}
                  className={`shrink-0 p-2.5 rounded-xl transition-all duration-200 ${
                      showSearch 
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100' 
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {showSearch ? <HiX className="w-5 h-5" /> : <HiSearch className="w-5 h-5" />}
                </button>

                <div className="flex flex-col items-end justify-center shrink-0 w-24 sm:w-32 border-l border-slate-200 dark:border-zinc-700/50 pl-2 sm:pl-4 ml-1 sm:ml-2">
                  <div className="flex justify-between w-full items-end mb-1.5">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avance</span>
                    <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-zinc-100">
                        {currentIndex + 1} <span className="text-[10px] sm:text-xs font-medium text-slate-400">/ {total}</span>
                    </span>
                  </div>
                  <Progress
                    size="sm"
                    value={(lecturasGuardadas.size / total) * 100}
                    color="success"
                    className="w-full h-1.5"
                    classNames={{ track: "bg-slate-200 dark:bg-zinc-800", indicator: "rounded-full" }}
                    aria-label="Progreso"
                  />
                </div>
              </ModalHeader>

              <ModalBody className="p-4 sm:p-6 bg-slate-50/50 dark:bg-black/20 overflow-y-auto custom-scrollbar">
                {/* CAMBIO AQUI: En móviles es flex-col, en escritorio es un grid de 2 columnas */}
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8 lg:h-full">
                  
                  {/* Columna Izquierda: Datos y Formulario */}
                  {/* CAMBIO AQUI: lg:h-full permite que en móvil tome su tamaño natural */}
                  <div className="flex flex-col gap-4 sm:gap-6 lg:h-full lg:min-h-0">
                    
                    {/* Tarjeta de Información Completa */}
                    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl shrink-0 border border-slate-200 dark:border-zinc-800">
                      <CardHeader className="pb-0 pt-4 sm:pt-5 px-4 sm:px-5 flex-col items-start border-b border-slate-100 dark:border-zinc-800/50 pb-3 sm:pb-4">
                        <div className="flex justify-between w-full items-start">
                            <div className="flex items-center gap-2 sm:gap-3 mb-1">
                                <div className="p-1.5 sm:p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400 hidden sm:block">
                                    <HiUser className="text-lg" />
                                </div>
                                <h4 className="font-bold text-base sm:text-lg text-slate-800 dark:text-zinc-100">Información del Cliente</h4>
                            </div>
                            {isLecturaCompletada && (
                                <Chip color="success" variant="flat" size="sm" startContent={<HiCheck />} className="font-bold uppercase tracking-wider text-[9px] sm:text-[10px] px-1 h-5 sm:h-6">
                                    Registrado
                                </Chip>
                            )}
                        </div>
                      </CardHeader>
                      <CardBody className="p-4 sm:p-5">
                        <div className="flex flex-col gap-1">
                            <InfoRow label="Cliente Titular" value={puntoActual?.cliente_nombre} icon={HiUser} colorClass="text-blue-600 dark:text-blue-400" />
                            <InfoRow label="Dirección Física" value={puntoActual?.cliente_direccion} icon={HiLocationMarker} colorClass="text-purple-600 dark:text-purple-400" valueClass="truncate max-w-[180px] sm:max-w-[250px]" />
                            <InfoRow label="Número Teléfono" value={puntoActual?.cliente_telefono} icon={HiPhone} colorClass="text-emerald-600 dark:text-emerald-400" />
                            <InfoRow label="Serie de Medidor" value={puntoActual?.numero_serie} icon={HiHashtag} colorClass="text-orange-600 dark:text-orange-400" valueClass="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded" />
                            <InfoRow label="Ubicación Medidor" value={puntoActual?.ubicacion} icon={HiMap} colorClass="text-indigo-600 dark:text-indigo-400" />
                            <InfoRow label="Fecha Lectura" value={new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })} icon={HiCalendar} colorClass="text-teal-600 dark:text-teal-400" valueClass="capitalize" />
                        </div>
                      </CardBody>
                    </Card>

                    {/* Área de Lectura (Formulario) */}
                    <div className="flex-1 flex flex-col justify-end mt-2 sm:mt-4">
                        {isLecturaCompletada && !modoRectificar[puntoActual?.medidor_id] ? (
                            <Card className="bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-200 dark:border-emerald-800/50 shadow-none rounded-2xl animate-in zoom-in-95 duration-300">
                                <CardBody className="flex flex-col gap-4 p-4 sm:p-6">
                                    {/* Encabezado */}
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 sm:p-2.5 bg-emerald-500 text-white rounded-full shadow-md shadow-emerald-500/30">
                                            <HiCheck className="text-lg sm:text-xl" />
                                        </div>
                                        <h4 className="text-lg sm:text-xl font-black text-emerald-800 dark:text-emerald-400 tracking-tight">Lectura Guardada</h4>
                                    </div>

                                    {/* Detalles numéricos */}
                                    {lecturasRegistradas[puntoActual?.medidor_id] ? (
                                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                            <div className="flex flex-col items-center bg-white dark:bg-zinc-900 rounded-xl p-2 sm:p-3 border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-zinc-500 mb-1 uppercase tracking-wider text-center">Mes Anterior</span>
                                                <span className="text-base sm:text-lg font-black text-slate-800 dark:text-zinc-100">
                                                    {lecturasRegistradas[puntoActual.medidor_id].lectura_anterior !== null
                                                        ? `${Number(lecturasRegistradas[puntoActual.medidor_id].lectura_anterior).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                                                        : '0.00'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center bg-white dark:bg-zinc-900 rounded-xl p-2 sm:p-3 border border-emerald-100 dark:border-emerald-900/30 shadow-sm ring-1 ring-emerald-500/20">
                                                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-500 mb-1 uppercase tracking-wider text-center">Mes Actual</span>
                                                <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400">
                                                    {Number(lecturasRegistradas[puntoActual.medidor_id].lectura_actual).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 sm:p-3 border border-blue-200 dark:border-blue-900/30 shadow-sm">
                                                <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider text-center">Consumo m³</span>
                                                <span className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-300">
                                                    +{Number(lecturasRegistradas[puntoActual.medidor_id].consumo_m3 ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            {lecturasRegistradas[puntoActual.medidor_id].vuelta_cero && (
                                                <div className="col-span-3 text-center text-[10px] sm:text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider bg-orange-100 dark:bg-orange-900/30 py-1.5 rounded-lg mt-1">
                                                    ⚠ Vuelta a cero aplicada
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Lectura de sesión anterior
                                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                            <div className="flex flex-col items-center bg-white dark:bg-zinc-900 rounded-xl p-2 sm:p-3 border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-zinc-500 mb-1 uppercase tracking-wider text-center">Mes Anterior</span>
                                                <span className="text-base sm:text-lg font-black text-slate-800 dark:text-zinc-100">
                                                    {puntoActual?.ultima_lectura_anterior !== null && puntoActual?.ultima_lectura_anterior !== undefined
                                                        ? `${Number(puntoActual.ultima_lectura_anterior).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                                                        : '0.00'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center bg-white dark:bg-zinc-900 rounded-xl p-2 sm:p-3 border border-emerald-100 dark:border-emerald-900/30 shadow-sm ring-1 ring-emerald-500/20">
                                                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-500 mb-1 uppercase tracking-wider text-center">Mes Actual</span>
                                                <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400">
                                                    {puntoActual?.lectura_anterior_disponible !== null && puntoActual?.lectura_anterior_disponible !== undefined
                                                        ? `${Number(puntoActual.lectura_anterior_disponible).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                                                        : '0.00'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 sm:p-3 border border-blue-200 dark:border-blue-900/30 shadow-sm">
                                                <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider text-center">Consumo m³</span>
                                                <span className="text-base sm:text-lg font-black text-blue-700 dark:text-blue-300">
                                                    {puntoActual?.lectura_anterior_disponible !== null && puntoActual?.ultima_lectura_anterior !== null
                                                        ? `+${Math.max(0, Number(puntoActual.lectura_anterior_disponible) - Number(puntoActual.ultima_lectura_anterior)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                                                        : '0.00'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Botón rectificar */}
                                    <div className="pt-2 border-t border-emerald-200/50 dark:border-emerald-900/30">
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="warning"
                                            className="w-full font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                                            startContent={<HiPencil className="text-lg" />}
                                            onPress={() => {
                                                const med = puntoActual.medidor_id;
                                                setModoRectificar(prev => ({ ...prev, [med]: true }));
                                                const lectActual = lecturasRegistradas[med]?.lectura_actual ?? puntoActual.lectura_anterior_disponible;
                                                if (lectActual !== undefined && lectActual !== null) {
                                                    setLecturas(prev => ({ ...prev, [med]: String(lectActual) }));
                                                }
                                            }}
                                        >
                                            Editar / Rectificar Lectura
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {modoRectificar[puntoActual?.medidor_id] && (
                                    <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700/50 rounded-xl p-3 animate-in slide-in-from-top-2">
                                        <div className="flex items-center gap-2">
                                            <HiPencil className="text-orange-600 dark:text-orange-400 text-lg" />
                                            <span className="text-xs sm:text-sm font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider">Modo Edición Activado</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="default"
                                            className="bg-white dark:bg-zinc-800 font-bold shadow-sm"
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
                  {/* CAMBIO AQUI: w-full y min-h para que en móvil no se aplaste, y lg:h-full para escritorio */}
                  <div className="w-full min-h-[350px] sm:min-h-[400px] lg:h-full lg:min-h-0 pb-2">
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

              <ModalFooter className="px-4 sm:px-6 py-3 sm:py-4 flex w-full justify-between items-center bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 rounded-b-xl z-20">
                    <Button 
                        variant="flat" 
                        color="default"
                        className="font-bold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 shadow-sm px-4 sm:px-6"
                        isDisabled={currentIndex === 0} 
                        onPress={handlePrev}
                        startContent={<HiArrowLeft className="text-lg" />}
                    >
                        <span className="hidden sm:inline">Anterior</span>
                    </Button>

                    <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 hidden sm:block">
                            Secuencia de Ruta
                        </span>
                        <div className="flex gap-1.5 self-center">
                            {Array.from({ length: Math.min(total, 7) }).map((_, i) => {
                                let idx = i;
                                if (total > 7 && currentIndex > 3) idx = currentIndex - 3 + i;
                                if (idx >= total) return null;
                                
                                const isCurrent = idx === currentIndex;
                                const isSaved = lecturasGuardadas.has(ruta.puntos[idx]?.numero_serie);
                                
                                return (
                                    <div key={idx} className={`h-2 rounded-full transition-all duration-300 ${
                                        isCurrent ? 'w-6 bg-blue-500 shadow-sm shadow-blue-500/50' :
                                        isSaved ? 'w-2 bg-emerald-400' : 'w-2 bg-slate-200 dark:bg-zinc-700'
                                    }`} />
                                );
                            })}
                        </div>
                    </div>

                    {currentIndex < total - 1 ? (
                        <Button 
                            color="primary" 
                            className="font-bold shadow-md shadow-blue-500/30 px-4 sm:px-6"
                            onPress={handleNext}
                            endContent={<HiArrowRight className="text-lg" />}
                        >
                            <span className="hidden sm:inline">Siguiente</span>
                        </Button>
                    ) : (
                        <Button 
                            color="success" 
                            className="font-bold text-white shadow-md shadow-emerald-500/30 px-4 sm:px-6"
                            onPress={handleFinalizarRuta}
                            isDisabled={lecturasGuardadas.size !== total}
                            endContent={<HiCheck className="text-lg" />}
                        >
                            <span className="hidden sm:inline">Terminar Ruta</span>
                        </Button>
                    )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
