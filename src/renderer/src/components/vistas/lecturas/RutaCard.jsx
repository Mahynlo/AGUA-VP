import { useState, useEffect } from "react";
import { Modal, Button } from "flowbite-react";
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
import { usePermissions } from "../../../context/PermissionsContext";
import { nowHermosilloDateStr } from "../../../utils/diasHabiles";

const premiumModalTheme = {
    root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" } },
    content: {
        base: "relative h-full w-full p-4 md:h-auto",
        inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-lg dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800"
    },
    header: {
        base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-t-2xl",
        close: { base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
    },
    body: { base: "p-8 flex-1 overflow-y-auto" },
    footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-b-2xl" }
};

const getResultadoFacturacionStorageKey = (rutaId, periodo) => `facturacion_resultado_${rutaId}_${periodo}`;

export default function RutaCard({ ruta }) {
  const { obtenerInfoRuta } = useRutas();
  const { setError, setSuccess } = useFeedback();
  const { user } = useAuth();
  const { can } = usePermissions();
  const canModificarRutas = can("rutas.modificar");

  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  const handleOpenEditarRuta = () => {
    if (!canModificarRutas) {
      setError("No tienes permisos para modificar rutas.", "Rutas");
      return;
    }
    setModalEditarOpen(true);
  };

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

  // Regla de Tintes para Chip de Estado
  const estadoFacturacionChipClass = !tieneFacturacionEnPeriodo
    ? 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
    : esResultadoRecalculo
      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';

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
    <div className="flex flex-col bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 relative h-full">

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
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-zinc-900/90 text-slate-700 dark:text-zinc-200 shadow-sm hover:scale-105 transition-transform rounded-xl"
            >
              <HiDotsVertical className="w-4 h-4" />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute z-20 right-0 mt-2 w-[180px] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
                  <button
                    onClick={() => { setModalDetalleOpen(true); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800 text-sm font-medium text-slate-700 dark:text-zinc-300 text-left"
                  >
                    <HiEye className="w-4 h-4 text-blue-500" /> Ver Detalles
                  </button>
                  <button
                    onClick={() => { handleOpenEditarRuta(); setDropdownOpen(false); }}
                    disabled={!canModificarRutas}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800 text-sm font-medium text-slate-700 dark:text-zinc-300 text-left disabled:opacity-50"
                  >
                    <HiPencil className="w-4 h-4 text-emerald-500" /> Editar Ruta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chips de Estado (Bottom Left) sobre imagen */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 z-20">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold tracking-widest text-[10px] uppercase shadow-md border border-white/10 ${
            porcentajeCompletado === 100
              ? "bg-emerald-500/90 text-white"
              : "bg-blue-500/90 text-white"
          }`}>
            {porcentajeCompletado === 100 && <HiCheckCircle className="w-3.5 h-3.5" />}
            {porcentajeCompletado === 100 ? "Completada" : "En progreso"}
          </div>

          {missingMetersCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/90 text-white border border-red-400/50 font-bold tracking-widest text-[10px] uppercase shadow-md animate-pulse">
              <HiExclamation className="w-3.5 h-3.5" />
              {missingMetersCount} Sin Asignar
            </div>
          )}
        </div>
      </div>

      {/* ── 2. CUERPO DE LA TARJETA ── */}
      <div className="p-6 flex-1 flex flex-col gap-6">

        {/* Título y Descripción */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-tight line-clamp-1">
            {ruta.nombre}
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {ruta.descripcion}
          </p>
        </div>

        {/* Barra de Progreso */}
        <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-slate-100 dark:border-zinc-800/80 flex flex-col gap-3 mt-auto">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
              Progreso de Lectura
            </span>
            <span className="text-sm font-black text-slate-700 dark:text-zinc-200">
              {ruta.completadas} <span className="text-slate-400 dark:text-zinc-500 font-bold">/ {ruta.total_puntos}</span>
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden" style={{ height: '6px' }}>
            <div
              className={`h-full rounded-full transition-all ${porcentajeCompletado === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${porcentajeCompletado}%` }}
            />
          </div>

          <div className="flex justify-between items-center">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${porcentajeCompletado === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {porcentajeCompletado.toFixed(1)}% COMPLETADO
            </span>
          </div>
        </div>

        {/* Info Extra (Metadatos) y Estado Facturación */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <HiCalendar className="w-3.5 h-3.5" />
                <span>{ruta.periodo_mostrado}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HiMap className="w-3.5 h-3.5" />
                <span>Ruta #{ruta.id}</span>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-md font-bold tracking-widest text-[9px] uppercase ${estadoFacturacionChipClass}`}>
                {estadoFacturacionLabel}
            </span>
        </div>
      </div>

      {/* ── 3. FOOTER Y BOTONES DE ACCIÓN ── */}
      <div className="p-6 pt-0 flex flex-col gap-3">

        {/* Componente Carrusel */}
        <div className="w-full">
            <CarruselLecturasModal rutaId={ruta.id} periodoMostrado={ruta.periodo_mostrado} />
        </div>

        <div className="grid grid-cols-2 gap-3">
            {/* Botón Principal: Generar Facturas */}
            <button
              disabled={!puedeGenerarPrimeraFacturacion || isGenerando}
              onClick={handleGenerarFacturas}
              className={`w-full h-11 font-bold shadow-sm transition-all duration-300 rounded-xl flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                  puedeGenerarPrimeraFacturacion
                      ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950"
                      : "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 shadow-none"
              }`}
            >
              {isGenerando ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                !puedeGenerarPrimeraFacturacion && tieneFacturacionEnPeriodo
                  ? <HiCheckCircle className="text-lg" />
                  : <HiCurrencyDollar className="text-lg" />
              )}
              {!puedeGenerarPrimeraFacturacion && tieneFacturacionEnPeriodo
                  ? 'Facturado'
                  : porcentajeCompletado < 100
                  ? `Faltan ${ruta.total_puntos - ruta.completadas}`
                  : 'Generar'
              }
            </button>

            {/* Botón Secundario: Recalcular */}
            <button
              disabled={!puedeRecalcularPeriodo || isGenerando}
              onClick={handleRecalcularFacturas}
              className={`w-full h-11 font-bold rounded-xl disabled:cursor-not-allowed ${
                  puedeRecalcularPeriodo
                  ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                  : "bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500"
              }`}
            >
              Recalcular
            </button>
        </div>

        {!tieneFacturacionEnPeriodo && porcentajeCompletado >= 100 && (
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest text-center mt-1">
            Requiere primera facturación
          </p>
        )}

        {/* Ver Resultado */}
        <button
          onClick={() => setModalResultadoOpen(true)}
          className="w-full h-10 font-bold bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl mt-1 text-sm"
        >
          Ver Último Resultado
        </button>
      </div>

      {/* ── MODALES ── */}
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

      {/* Modal Generar */}
      <Modal
        show={modalGenerarOpen}
        onClose={() => setModalGenerarOpen(false)}
        size="md"
        theme={premiumModalTheme}
      >
        <Modal.Header>
          <div className="flex flex-col gap-1">
            <span className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">Generar Facturas</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
              Ruta {ruta.nombre} · Periodo {ruta.periodo_mostrado}
            </span>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                Se generará la primera facturación para las lecturas pendientes de esta ruta.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1.5">
                Las lecturas quedarán cerradas para este ciclo.
              </p>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-500/80">
                Si necesitas ajustar montos posteriormente, usa la opción de Recalcular Facturación.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="light" onClick={() => setModalGenerarOpen(false)} className="font-bold text-slate-500">Cancelar</Button>
          <Button
            className="bg-emerald-600 text-white font-bold rounded-xl"
            isProcessing={isGenerando}
            onClick={ejecutarGenerarFacturas}
          >
            Confirmar Generación
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Recalcular */}
      <Modal
        show={modalRecalculoOpen}
        onClose={() => setModalRecalculoOpen(false)}
        size="md"
        theme={premiumModalTheme}
      >
        <Modal.Header>
          <div className="flex flex-col gap-1">
            <span className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">Recalcular Facturación</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
              Ruta {ruta.nombre} · Periodo {ruta.periodo_mostrado}
            </span>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1.5">
                Se recalcularán únicamente facturas sin pagos registrados.
              </p>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-500/80">
                Las facturas con pagos se conservarán y aparecerán en el resultado como fallidas por seguridad contable.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-zinc-400 ml-1">
                Motivo del recálculo
              </label>
              <textarea
                value={motivoRecalculo}
                onChange={(e) => setMotivoRecalculo(e.target.value)}
                rows={3}
                placeholder="Describe por qué necesitas recalcular esta facturación..."
                className="w-full bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none shadow-none"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="light" onClick={() => setModalRecalculoOpen(false)} className="font-bold text-slate-500">
            Cancelar
          </Button>
          <Button
            className="bg-amber-500 text-white font-bold rounded-xl"
            isProcessing={isGenerando}
            onClick={ejecutarRecalculoFacturas}
          >
            Confirmar Recalculo
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Resultado */}
      <Modal
        show={modalResultadoOpen}
        onClose={() => setModalResultadoOpen(false)}
        size="4xl"
        theme={premiumModalTheme}
      >
        <Modal.Header>
          <div className="flex flex-col gap-1">
            <span className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">Resultado de Facturación</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
              Ruta {ruta.nombre} · Periodo {ruta.periodo_mostrado}
            </span>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            {!ultimoResultadoFacturacion ? (
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 p-6 text-center">
                <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">
                  {tieneFacturacionEnPeriodo
                    ? 'Ya existe facturación en este período, pero aún no hay un resultado guardado en esta sesión.'
                    : 'No hay un resultado reciente para mostrar. Aún no se ha realizado facturación en este período.'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`px-2.5 py-1 rounded-md font-bold tracking-widest text-[10px] uppercase ${esResultadoRecalculo ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                    {etiquetaTipoProceso}
                  </div>
                  {savedAtLabel && (
                    <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                      Ejecución: {savedAtLabel}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl p-5 border border-slate-100 dark:border-zinc-800 bg-emerald-500/10 flex flex-col gap-1.5 transition-transform hover:-translate-y-1">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-700 dark:text-emerald-400">Generadas</p>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{totalGeneradas}</p>
                  </div>
                  <div className="rounded-2xl p-5 border border-slate-100 dark:border-zinc-800 bg-blue-500/10 flex flex-col gap-1.5 transition-transform hover:-translate-y-1">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-blue-700 dark:text-blue-400">Recalculadas</p>
                    <p className="text-3xl font-black text-blue-700 dark:text-blue-400">{totalRecalculadas}</p>
                  </div>
                  <div className="rounded-2xl p-5 border border-slate-100 dark:border-zinc-800 bg-red-500/10 flex flex-col gap-1.5 transition-transform hover:-translate-y-1">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-red-700 dark:text-red-400">Fallidas</p>
                    <p className="text-3xl font-black text-red-700 dark:text-red-400">{totalFallidas}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
                  <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-10">
                        <tr>
                          <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Cliente</th>
                          <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Medidor</th>
                          <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Factura</th>
                          <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Totales</th>
                          <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {detallesFacturacion.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-8 text-center text-sm font-bold text-slate-400 dark:text-zinc-500">
                              No se devolvieron detalles para este proceso.
                            </td>
                          </tr>
                        ) : (
                          detallesFacturacion.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors">
                              <td className="px-5 py-4 font-bold text-slate-800 dark:text-zinc-100">
                                {item.cliente_nombre || 'Sin cliente'}
                              </td>
                              <td className="px-5 py-4 font-medium text-slate-500 dark:text-zinc-400 font-mono">
                                {item.medidor_numero || 'S/N'}
                              </td>
                              <td className="px-5 py-4 font-bold text-slate-700 dark:text-zinc-300">
                                {item.factura_id ? `#${item.factura_id}` : 'Nueva'}
                              </td>
                              <td className="px-5 py-4 font-medium text-slate-700 dark:text-zinc-300">
                                {item.total_nuevo !== undefined ? (
                                  <span className="flex items-center gap-2">
                                    <span className="line-through opacity-60">${Number(item.total_anterior || 0).toFixed(2)}</span>
                                    <span className="font-black text-amber-600 dark:text-amber-400">${Number(item.total_nuevo || 0).toFixed(2)}</span>
                                  </span>
                                ) : (
                                  <span className="font-black text-slate-800 dark:text-zinc-100">${Number(item.total || 0).toFixed(2)}</span>
                                )}
                              </td>
                              <td className="px-5 py-4">
                                {item.estado === 'fallida' ? (
                                  <div className="inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-600 dark:text-red-400">Fallida</div>
                                ) : item.estado === 'recalculada' ? (
                                  <div className="inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400">Recalculada</div>
                                ) : (
                                  <div className="inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Generada</div>
                                )}
                                {item.error && (
                                  <p className="text-[10px] font-bold text-red-500/80 mt-1.5 max-w-[200px] leading-tight">{item.error}</p>
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
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="light" onClick={() => setModalResultadoOpen(false)} className="font-bold text-slate-500">Cerrar Visualizador</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
