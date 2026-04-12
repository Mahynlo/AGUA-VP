import { useState, useEffect } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody,
  CardFooter,
  Chip,
  Progress,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/react";
import { 
  HiDotsVertical, 
  HiEye, 
  HiPencil, 
  HiMap, 
  HiCalendar, 
  HiCheckCircle, 
  HiExclamation, 
  HiCurrencyDollar 
} from "react-icons/hi";

import CarruselLecturasModal from "./CarruselLecturasModal";
import ModalEditarRuta from "./ModalEditarRuta";
import ModalDetalleRuta from "./ModalDetalleRuta";
import { useRutas } from "../../../context/RutasContext";
import { useFeedback } from "../../../context/FeedbackContext";
import { useAuth } from "../../../context/AuthContext";
import { nowHermosilloDateStr } from "../../../utils/diasHabiles";

const getResultadoFacturacionStorageKey = (rutaId, periodo) => `facturacion_resultado_${rutaId}_${periodo}`;

export default function RutaCard({ ruta }) {
  const { obtenerInfoRuta } = useRutas();
  const { setError, setSuccess } = useFeedback();
  const { user } = useAuth();
  
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalRecalculoOpen, setModalRecalculoOpen] = useState(false);
  const [modalGenerarOpen, setModalGenerarOpen] = useState(false);
  const [modalResultadoOpen, setModalResultadoOpen] = useState(false);
  const [missingMetersCount, setMissingMetersCount] = useState(0);
  const [isGenerando, setIsGenerando] = useState(false);
  const [facturasGeneradas, setFacturasGeneradas] = useState(false);
  const [motivoRecalculo, setMotivoRecalculo] = useState("Ajuste por rectificación de lecturas");
  const [ultimoResultadoFacturacion, setUltimoResultadoFacturacion] = useState(null);

  useEffect(() => {
    // Cada período debe recuperar su último resultado guardado si existe.
    try {
      const storageKey = getResultadoFacturacionStorageKey(ruta.id, ruta.periodo_mostrado);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.periodo === ruta.periodo_mostrado) {
          setUltimoResultadoFacturacion(parsed);
        } else {
          setUltimoResultadoFacturacion(null);
        }
      } else {
        setUltimoResultadoFacturacion(null);
      }
    } catch {
      setUltimoResultadoFacturacion(null);
    }

    setFacturasGeneradas(false);
    setModalGenerarOpen(false);
    setModalRecalculoOpen(false);
    setModalResultadoOpen(false);
  }, [ruta.id, ruta.periodo_mostrado]);

  const porcentajeCompletado = ruta.total_puntos > 0
    ? (ruta.completadas / ruta.total_puntos) * 100
    : 0;

  const handleGenerarFacturas = async () => {
    if (isGenerando || porcentajeCompletado < 100 || facturasGeneradas) return;
    setModalGenerarOpen(true);
  };

  const ejecutarGenerarFacturas = async () => {
    if (isGenerando) return;
    setIsGenerando(true);
    try {
      const token = localStorage.getItem('token');
      const hoy = nowHermosilloDateStr();
      const result = await window.api.generarFacturasRuta(
        { ruta_id: ruta.id, periodo: ruta.periodo_mostrado, fecha_emision: hoy, recalcular: false },
        token
      );
      if (result.success) {
        const n = result.data?.facturas_generadas ?? 0;
        const resultado = result.data || null;
        setUltimoResultadoFacturacion(resultado);
        setModalGenerarOpen(false);
        if (resultado) {
          try {
            const storageKey = getResultadoFacturacionStorageKey(ruta.id, ruta.periodo_mostrado);
            localStorage.setItem(storageKey, JSON.stringify({ ...resultado, _saved_at: new Date().toISOString() }));
          } catch {}
        }
        setModalResultadoOpen(true);
        if (n === 0) {
          setSuccess('Todas las lecturas de esta ruta ya estaban facturadas.', 'Facturación');
        } else {
          setSuccess(`${n} factura${n !== 1 ? 's' : ''} generada${n !== 1 ? 's' : ''} correctamente.`, 'Facturación');
          setFacturasGeneradas(true);
        }
      } else {
        setError(result.message || 'Error al generar facturas', 'Facturación');
      }
    } catch (err) {
      setError('Error inesperado al generar facturas', 'Facturación');
    } finally {
      setIsGenerando(false);
    }
  };

  const handleRecalcularFacturas = async () => {
    if (isGenerando || porcentajeCompletado < 100) return;
    setModalRecalculoOpen(true);
  };

  const ejecutarRecalculoFacturas = async () => {
    if (isGenerando) return;

    setIsGenerando(true);
    try {
      const token = localStorage.getItem('token');
      const hoy = nowHermosilloDateStr();
      const result = await window.api.generarFacturasRuta(
        {
          ruta_id: ruta.id,
          periodo: ruta.periodo_mostrado,
          fecha_emision: hoy,
          recalcular: true,
          motivo_recalculo: motivoRecalculo.trim()
        },
        token
      );

      if (!result.success) {
        setError(result.message || 'Error al recalcular facturas', 'Facturación');
        return;
      }

      setModalRecalculoOpen(false);
      const resultado = result.data || null;
      setUltimoResultadoFacturacion(resultado);
      if (resultado) {
        try {
          const storageKey = getResultadoFacturacionStorageKey(ruta.id, ruta.periodo_mostrado);
          localStorage.setItem(storageKey, JSON.stringify({ ...resultado, _saved_at: new Date().toISOString() }));
        } catch {}
      }
      setModalResultadoOpen(true);

      const generadas = result.data?.facturas_generadas ?? 0;
      const recalculadas = result.data?.facturas_recalculadas ?? 0;
      const fallidas = result.data?.facturas_fallidas ?? 0;

      setSuccess(
        `Recálculo completado. Generadas: ${generadas}, Recalculadas: ${recalculadas}, Fallidas: ${fallidas}.`,
        'Facturación'
      );
      if (generadas > 0 || recalculadas > 0) {
        setFacturasGeneradas(true);
      }
    } catch (err) {
      setError('Error inesperado al recalcular facturas', 'Facturación');
    } finally {
      setIsGenerando(false);
    }
  };

  const detallesFacturacion = ultimoResultadoFacturacion?.detalles || [];
  const totalGeneradas = ultimoResultadoFacturacion?.facturas_generadas ?? 0;
  const totalRecalculadas = ultimoResultadoFacturacion?.facturas_recalculadas ?? 0;
  const totalFallidas = ultimoResultadoFacturacion?.facturas_fallidas ?? 0;
  const tieneFacturacionEnPeriodo = Number(ruta?.facturas_generadas_periodo || 0) > 0 || !!ruta?.tiene_facturacion_periodo;
  const puedeRecalcularPeriodo = porcentajeCompletado >= 100 && tieneFacturacionEnPeriodo;
  const tieneResultadoPeriodoActual = !!ultimoResultadoFacturacion && ultimoResultadoFacturacion?.periodo === ruta.periodo_mostrado;
  const puedeGenerarPrimeraFacturacion = porcentajeCompletado >= 100 && !tieneFacturacionEnPeriodo;
  const esResultadoRecalculo = !!ultimoResultadoFacturacion?.recalculo_activado || totalRecalculadas > 0;
  const etiquetaTipoProceso = esResultadoRecalculo ? 'Recálculo' : 'Primera Facturación';
  const savedAtLabel = ultimoResultadoFacturacion?._saved_at
    ? new Date(ultimoResultadoFacturacion._saved_at).toLocaleString('es-MX')
    : null;
  const estadoFacturacionLabel = !tieneFacturacionEnPeriodo
    ? 'Sin Facturación'
    : esResultadoRecalculo
      ? 'Con Recalculo'
      : 'Facturada';
  const estadoFacturacionChipClass = !tieneFacturacionEnPeriodo
    ? 'bg-slate-500/90 text-white'
    : esResultadoRecalculo
      ? 'bg-blue-500/90 text-white'
      : 'bg-emerald-500/95 text-white';

  // Verificar integridad (medidores sin asignar) al montar
  useEffect(() => {
    let isMounted = true;
    const checkIntegrity = async () => {
      if (!ruta.id) return;
      try {
        if (ruta.total_puntos > 0) {
          const detailedRuta = await obtenerInfoRuta(ruta.id);
          if (isMounted && detailedRuta && detailedRuta.puntos) {
            const sinCliente = detailedRuta.puntos.filter(p => !p.cliente_id).length;
            if (sinCliente > 0) {
              setMissingMetersCount(sinCliente);
            }
          }
        }
      } catch (error) {
        console.error("Error checking route integrity:", error);
      }
    };

    checkIntegrity();
    return () => { isMounted = false; };
  }, [ruta.id, ruta.total_puntos, obtenerInfoRuta]);

  return (
    <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-zinc-950 rounded-[2rem] overflow-hidden flex flex-col h-full ring-1 ring-slate-200 dark:ring-zinc-800/80 group">
      
      {/* ── 1. HEADER (IMAGEN + DROPDOWN + CHIPS) ── */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden bg-slate-100 dark:bg-zinc-900">
        <img
          src={ruta.imagen}
          alt={ruta.nombre}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Gradiente Oscuro para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10" />

        {/* Dropdown de Opciones (Top Right) */}
        <div className="absolute top-4 right-4 z-20">
          <Dropdown placement="bottom-end" classNames={{ content: "min-w-[180px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl" }}>
            <DropdownTrigger>
              <Button
                isIconOnly
                variant="flat"
                size="sm"
                className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-slate-700 dark:text-zinc-200 shadow-sm hover:scale-105 transition-transform"
              >
                <HiDotsVertical className="w-4 h-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Opciones de ruta" itemClasses={{ base: "rounded-xl" }}>
              <DropdownItem
                key="view"
                startContent={<HiEye className="w-4 h-4 text-blue-500" />}
                onClick={() => setModalDetalleOpen(true)}
                className="font-medium text-slate-700 dark:text-zinc-300"
              >
                Ver Detalles
              </DropdownItem>
              <DropdownItem
                key="edit"
                startContent={<HiPencil className="w-4 h-4 text-emerald-500" />}
                onClick={() => setModalEditarOpen(true)}
                className="font-medium text-slate-700 dark:text-zinc-300"
              >
                Editar Ruta
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Chips de Estado (Bottom Left) */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 z-20">
          <Chip
            size="sm"
            variant="solid"
            className={`border border-white/10 font-bold tracking-wide text-[10px] uppercase shadow-md ${
              porcentajeCompletado === 100 
                ? "bg-emerald-500/95 text-white backdrop-blur-md" 
                : "bg-blue-500/95 text-white backdrop-blur-md"
            }`}
            startContent={porcentajeCompletado === 100 && <HiCheckCircle className="w-3.5 h-3.5 ml-1" />}
          >
            {porcentajeCompletado === 100 ? "Completada" : "En progreso"}
          </Chip>

          {missingMetersCount > 0 && (
            <Chip
              size="sm"
              variant="flat"
              className="bg-red-500/90 text-white backdrop-blur-md border border-red-400/50 font-bold tracking-wide text-[10px] uppercase shadow-md"
              startContent={<HiExclamation className="w-4 h-4 ml-1" />}
            >
              {missingMetersCount} Sin Asignar
            </Chip>
          )}
        </div>
      </div>

      {/* ── 2. CUERPO DE LA TARJETA ── */}
      <CardBody className="px-5 sm:px-6 py-5 flex-1 flex flex-col gap-4">
        
        {/* Título y Descripción */}
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-tight mb-1 line-clamp-1">
            {ruta.nombre}
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {ruta.descripcion}
          </p>
        </div>

        {/* Barra de Progreso */}
        <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800 mt-auto">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
              Progreso de Lectura
            </span>
            <span className="text-xs font-black text-slate-700 dark:text-zinc-300">
              {ruta.completadas} <span className="text-slate-400 dark:text-zinc-500 font-medium">/ {ruta.total_puntos}</span>
            </span>
          </div>
          
          <Progress
            value={porcentajeCompletado}
            size="sm"
            classNames={{
              base: "w-full",
              track: "bg-slate-200 dark:bg-zinc-700 drop-shadow-sm",
              indicator: porcentajeCompletado === 100 ? "bg-emerald-500" : "bg-blue-500"
            }}
          />
          
          <div className="flex justify-between items-center mt-2">
            <span className={`text-[10px] font-bold ${porcentajeCompletado === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {porcentajeCompletado.toFixed(1)}% COMPLETADO
            </span>
            {missingMetersCount > 0 && (
              <span className="text-[10px] font-bold text-red-500 flex items-center gap-1 animate-pulse">
                <HiExclamation className="w-3 h-3" /> REVISAR INVENTARIO
              </span>
            )}
          </div>
        </div>

        {/* Info Extra (Metadatos) */}
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-1">
          <div className="flex items-center gap-1.5">
            <HiCalendar className="w-3.5 h-3.5" />
            <span>{ruta.periodo_mostrado}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HiMap className="w-3.5 h-3.5" />
            <span>Ruta #{ruta.id}</span>
          </div>
        </div>

        {/* Estado de Facturación del período */}
        <div className="px-1 pt-1">
          <Chip
            size="sm"
            className={`font-bold tracking-wide text-[10px] uppercase shadow-sm ${estadoFacturacionChipClass}`}
          >
            {estadoFacturacionLabel}
          </Chip>
        </div>
      </CardBody>

      {/* ── 3. FOOTER Y BOTONES DE ACCIÓN ── */}
      <CardFooter className="px-5 sm:px-6 pb-6 pt-0 flex flex-col gap-3">
        
        {/* Componente Carrusel (Asume que renderiza su propio botón que se adaptará al width) */}
        <div className="w-full">
            <CarruselLecturasModal rutaId={ruta.id} periodoMostrado={ruta.periodo_mostrado} />
        </div>

        {/* Botón Principal: Generar Facturas */}
        <Button
          isDisabled={!puedeGenerarPrimeraFacturacion || isGenerando}
          isLoading={isGenerando}
          className={`w-full h-11 font-bold shadow-md transition-all duration-300 ${
              puedeGenerarPrimeraFacturacion
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30" // Listo para generar
                : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 shadow-none border border-slate-200 dark:border-zinc-700" // Pendiente o ya generado
          }`}
          startContent={!isGenerando && (!puedeGenerarPrimeraFacturacion && tieneFacturacionEnPeriodo ? <HiCheckCircle className="text-lg" /> : <HiCurrencyDollar className="text-lg" />)}
          onPress={handleGenerarFacturas}
        >
          {!puedeGenerarPrimeraFacturacion && tieneFacturacionEnPeriodo
            ? 'Primera Facturación Ya Generada'
            : porcentajeCompletado < 100
              ? `Faltan ${ruta.total_puntos - ruta.completadas} Lecturas`
              : 'Generar Facturas de Ruta'
          }
        </Button>

        <Button
          isDisabled={!puedeRecalcularPeriodo || isGenerando}
          variant="bordered"
          className="w-full h-11 font-bold border-amber-400 text-amber-700 dark:text-amber-300 dark:border-amber-700"
          onPress={handleRecalcularFacturas}
        >
          Recalcular Facturación
        </Button>

        {!tieneFacturacionEnPeriodo && porcentajeCompletado >= 100 && (
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 text-center px-2">
            Aún no existe una primera facturación para este período; primero genera facturas.
          </p>
        )}

        <Button
          variant="flat"
          className="w-full h-10 font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200"
          onPress={() => setModalResultadoOpen(true)}
        >
          Ver Último Resultado de Facturación
        </Button>
      </CardFooter>

      {/* Modales */}
      <ModalEditarRuta
        isOpen={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        ruta={ruta}
      />
      <ModalDetalleRuta
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        ruta={ruta}
      />

      <Modal
        isOpen={modalGenerarOpen}
        onOpenChange={setModalGenerarOpen}
        size="2xl"
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-lg font-black text-slate-800 dark:text-zinc-100">Generar Facturas de Ruta</span>
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Ruta {ruta.nombre} · Periodo {ruta.periodo_mostrado}
                </span>
              </ModalHeader>
              <ModalBody className="space-y-4">
                <div className="rounded-xl border border-emerald-300/70 bg-emerald-50 dark:bg-emerald-900/20 p-3">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Se generará la primera facturación para las lecturas pendientes de esta ruta.
                  </p>
                </div>

                <div className="rounded-xl border border-amber-300/70 bg-amber-50 dark:bg-amber-900/20 p-3">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    Después de facturar, las lecturas quedarán cerradas para ese ciclo de facturación.
                  </p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
                    Si necesitas ajustar montos posteriormente, usa la opción de Recalcular Facturación.
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Cancelar</Button>
                <Button
                  className="bg-emerald-600 text-white font-bold"
                  isLoading={isGenerando}
                  onPress={ejecutarGenerarFacturas}
                >
                  Confirmar Generación
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={modalRecalculoOpen}
        onOpenChange={setModalRecalculoOpen}
        size="2xl"
        placement="center"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-lg font-black text-slate-800 dark:text-zinc-100">Recalcular Facturación</span>
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Ruta {ruta.nombre} · Periodo {ruta.periodo_mostrado}
                </span>
              </ModalHeader>
              <ModalBody className="space-y-4">
                <div className="rounded-xl border border-amber-300/70 bg-amber-50 dark:bg-amber-900/20 p-3">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    Se recalcularán únicamente facturas sin pagos registrados.
                  </p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
                    Las facturas con pagos se conservarán y aparecerán en el resultado como fallidas por seguridad contable.
                  </p>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-slate-600 dark:text-zinc-300 mb-2">
                    Motivo del recálculo
                  </label>
                  <textarea
                    value={motivoRecalculo}
                    onChange={(e) => setMotivoRecalculo(e.target.value)}
                    rows={3}
                    placeholder="Describe por qué necesitas recalcular esta facturación"
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  className="bg-amber-600 text-white font-bold"
                  isLoading={isGenerando}
                  onPress={ejecutarRecalculoFacturas}
                >
                  Confirmar Recalculo
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={modalResultadoOpen}
        onOpenChange={setModalResultadoOpen}
        size="4xl"
        placement="center"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-lg font-black text-slate-800 dark:text-zinc-100">Resultado de Facturación</span>
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Ruta {ruta.nombre} · Periodo {ruta.periodo_mostrado}
                </span>
              </ModalHeader>
              <ModalBody className="space-y-4">
                {!ultimoResultadoFacturacion ? (
                  <div className="rounded-xl border border-slate-200 dark:border-zinc-700 p-4 text-sm text-slate-600 dark:text-zinc-300">
                    {tieneFacturacionEnPeriodo
                      ? 'Ya existe facturación en este período, pero aún no hay un resultado guardado en esta sesión.'
                      : 'No hay un resultado reciente para mostrar. Aún no se ha realizado facturación en este período.'}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip
                        size="sm"
                        className={esResultadoRecalculo
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}
                      >
                        {etiquetaTipoProceso}
                      </Chip>
                      {savedAtLabel && (
                        <span className="text-xs text-slate-500 dark:text-zinc-400">
                          Última ejecución: {savedAtLabel}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 p-3 bg-emerald-50 dark:bg-emerald-900/20">
                        <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300">Generadas</p>
                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{totalGeneradas}</p>
                      </div>
                      <div className="rounded-xl border border-blue-200 dark:border-blue-800 p-3 bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-[11px] uppercase tracking-wider font-bold text-blue-700 dark:text-blue-300">Recalculadas</p>
                        <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{totalRecalculadas}</p>
                      </div>
                      <div className="rounded-xl border border-red-200 dark:border-red-800 p-3 bg-red-50 dark:bg-red-900/20">
                        <p className="text-[11px] uppercase tracking-wider font-bold text-red-700 dark:text-red-300">Fallidas</p>
                        <p className="text-2xl font-black text-red-700 dark:text-red-300">{totalFallidas}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden">
                      <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100 dark:bg-zinc-800 sticky top-0 z-10">
                            <tr>
                              <th className="text-left px-3 py-2 font-bold text-slate-600 dark:text-zinc-300">Cliente</th>
                              <th className="text-left px-3 py-2 font-bold text-slate-600 dark:text-zinc-300">Medidor</th>
                              <th className="text-left px-3 py-2 font-bold text-slate-600 dark:text-zinc-300">Factura</th>
                              <th className="text-left px-3 py-2 font-bold text-slate-600 dark:text-zinc-300">Totales</th>
                              <th className="text-left px-3 py-2 font-bold text-slate-600 dark:text-zinc-300">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detallesFacturacion.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-3 py-6 text-center text-slate-500 dark:text-zinc-400">
                                  No se devolvieron detalles para este proceso.
                                </td>
                              </tr>
                            ) : (
                              detallesFacturacion.map((item, idx) => (
                                <tr key={idx} className="border-t border-slate-100 dark:border-zinc-800">
                                  <td className="px-3 py-2 text-slate-700 dark:text-zinc-200">
                                    {item.cliente_nombre || 'Sin cliente'}
                                  </td>
                                  <td className="px-3 py-2 text-slate-700 dark:text-zinc-200 font-mono">
                                    {item.medidor_numero || 'S/N'}
                                  </td>
                                  <td className="px-3 py-2 text-slate-700 dark:text-zinc-200">
                                    {item.factura_id ? `#${item.factura_id}` : 'Nueva'}
                                  </td>
                                  <td className="px-3 py-2 text-slate-700 dark:text-zinc-200">
                                    {item.total_nuevo !== undefined ? (
                                      <span>
                                        ${Number(item.total_anterior || 0).toFixed(2)} {'->'} ${Number(item.total_nuevo || 0).toFixed(2)}
                                      </span>
                                    ) : (
                                      <span>${Number(item.total || 0).toFixed(2)}</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {item.estado === 'fallida' ? (
                                      <Chip size="sm" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Fallida</Chip>
                                    ) : item.estado === 'recalculada' ? (
                                      <Chip size="sm" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Recalculada</Chip>
                                    ) : (
                                      <Chip size="sm" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Generada</Chip>
                                    )}
                                    {item.error && (
                                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 max-w-[280px]">{item.error}</p>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Cerrar</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Card>
  );
}

