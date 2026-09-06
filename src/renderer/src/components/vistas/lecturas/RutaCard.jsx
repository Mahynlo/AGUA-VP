import { useState, useEffect, useMemo } from "react";
import { Modal, Button } from "flowbite-react";
import {
  HiDotsVertical,
  HiEye,
  HiPencil,
  HiMap,
  HiCalendar,
  HiCheckCircle,
  HiExclamation,
  HiCurrencyDollar,
  HiRefresh,
  HiClock,
  HiDocumentReport,
  HiLocationMarker
} from "react-icons/hi";

import CarruselLecturasModal from "./CarruselLecturasModal";
import ModalEditarRuta from "./ModalEditarRuta";
import ModalDetalleRuta from "./ModalDetalleRuta";
import { useRutas } from "../../../context/RutasContext";
import { useFeedback } from "../../../context/FeedbackContext";
import { useAuth } from "../../../context/AuthContext";
import { usePermissions } from "../../../context/PermissionsContext";
import { nowHermosilloDateStr } from "../../../utils/diasHabiles";
import { prefijoDominante } from "../../../utils/rutaUtils";

const premiumModalTheme = {
  root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" } },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-3xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-t-3xl",
    close: { base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
  },
  body: { base: "p-8 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-b-3xl" }
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
  const [modalAlertaCobranzaOpen, setModalAlertaCobranzaOpen] = useState(false);
  const [datosAlertaCobranza, setDatosAlertaCobranza] = useState(null);

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

  const faltantes = Math.max(0, (ruta.total_puntos || 0) - (ruta.completadas || 0));

  // Identificación del Sector / Pueblo
  const sectorInfo = useMemo(() => {
    const prefijo = prefijoDominante(ruta.numeros_serie || []);
    const nombreLower = (ruta.nombre || "").toLowerCase();
    
    if (prefijo === "NG" || nombreLower.includes("nacori")) {
      return { 
        nombre: "Nácori Grande", 
        badgeBg: "bg-blue-600/90 text-white border-blue-400/40",
        chipText: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-200 dark:border-blue-900/40"
      };
    }
    if (prefijo === "MP" || nombreLower.includes("matape")) {
      return { 
        nombre: "Matapé", 
        badgeBg: "bg-emerald-600/90 text-white border-emerald-400/40",
        chipText: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/40"
      };
    }
    if (prefijo === "AD" || nombreLower.includes("adivino")) {
      return { 
        nombre: "Adivino", 
        badgeBg: "bg-amber-600/90 text-white border-amber-400/40",
        chipText: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-200 dark:border-amber-900/40"
      };
    }
    return { 
      nombre: `Ruta #${ruta.id || '—'}`, 
      badgeBg: "bg-slate-800/90 text-white border-slate-600/40",
      chipText: "text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700"
    };
  }, [ruta.numeros_serie, ruta.nombre, ruta.id]);

  const handleOpenEditarRuta = () => {
    if (!canModificarRutas) {
      setError("No tienes permisos para modificar rutas.", "Rutas");
      return;
    }
    setModalEditarOpen(true);
  };

  const handleGenerarFacturas = async () => {
    if (isGenerando || porcentajeCompletado < 100 || facturasGeneradas) return;
    setIsGenerando(true);
    try {
      const token = localStorage.getItem('token');
      const resValidacion = await window.api.validarCobranzaPeriodo({ ruta_id: ruta.id, periodo: ruta.periodo_mostrado }, token);
      
      if (resValidacion?.success && resValidacion.data?.alerta) {
        setDatosAlertaCobranza(resValidacion.data);
        setModalAlertaCobranzaOpen(true);
      } else {
        setModalGenerarOpen(true);
      }
    } catch (error) {
      console.error("Error validando cobranza del periodo anterior:", error);
      setModalGenerarOpen(true);
    } finally {
      setIsGenerando(false);
    }
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
    ? 'Sin Facturar'
    : esResultadoRecalculo
      ? 'Recalculada'
      : 'Facturada';

  const estadoFacturacionChipClass = !tieneFacturacionEnPeriodo
    ? 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'
    : esResultadoRecalculo
      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50'
      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50';

  useEffect(() => {
    let isMounted = true;
    const checkIntegrity = async () => {
      if (!ruta.id) return;
      try {
        if (ruta.total_puntos > 0) {
          const detailedRuta = await obtenerInfoRuta(ruta.id, ruta.periodo_mostrado);
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
  }, [ruta.id, ruta.total_puntos, ruta.periodo_mostrado, obtenerInfoRuta]);

  return (
    <div className={`flex flex-col bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm group hover:shadow-md transition-all duration-300 relative h-full ${dropdownOpen ? 'z-30' : 'z-0'}`}>

      {/* ── 1. HEADER (PORTADA + INSIGNIAS + MENÚ RÁPIDO) ── */}
      <div className="relative h-44 w-full shrink-0 bg-slate-100 dark:bg-zinc-900 rounded-t-2xl">
        {/* Imagen de fondo con gradiente encapsulados con overflow-hidden */}
        <div className="absolute inset-0 overflow-hidden rounded-t-2xl">
          <img
            src={ruta.imagen}
            alt={ruta.nombre}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Gradiente de contraste */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/25 z-[1]" />
        </div>

        {/* Fila Superior: Badge Sector + Menú de Opciones */}
        <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-30">
          <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm border ${sectorInfo.badgeBg}`}>
            <span className="flex items-center gap-1">
              <HiLocationMarker className="w-3 h-3" />
              {sectorInfo.nombre}
            </span>
          </div>

          {/* Menú Tres Puntos */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(v => !v)}
              className="w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/80 active:scale-95 text-white rounded-xl transition-all shadow-md"
              title="Opciones de ruta"
            >
              <HiDotsVertical className="w-4 h-4" />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute z-50 right-0 mt-2 w-52 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => { setModalDetalleOpen(true); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-xs font-bold text-slate-700 dark:text-zinc-200 text-left transition-colors"
                  >
                    <HiEye className="w-4 h-4 text-amber-500 shrink-0" /> 
                    <span>Ver Detalles de Ruta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleOpenEditarRuta(); setDropdownOpen(false); }}
                    disabled={!canModificarRutas}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-xs font-bold text-slate-700 dark:text-zinc-200 text-left transition-colors disabled:opacity-50"
                  >
                    <HiPencil className="w-4 h-4 text-emerald-500 shrink-0" /> 
                    <span>Editar Ruta</span>
                  </button>
                  {ultimoResultadoFacturacion && (
                    <button
                      type="button"
                      onClick={() => { setModalResultadoOpen(true); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-xs font-bold text-purple-700 dark:text-purple-300 text-left transition-colors border-t border-slate-100 dark:border-zinc-800"
                    >
                      <HiDocumentReport className="w-4 h-4 text-purple-500 shrink-0" /> 
                      <span>Ver Historial Facturas</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Fila Inferior sobre la imagen: Estado de Avance y Período */}
        <div className="absolute bottom-3 inset-x-3.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-black tracking-wider text-[10px] uppercase shadow-sm border ${
              porcentajeCompletado === 100
                ? "bg-emerald-600/90 text-white border-emerald-400/40"
                : "bg-amber-600/90 text-white border-amber-400/40"
            }`}>
              {porcentajeCompletado === 100 ? (
                <>
                  <HiCheckCircle className="w-3.5 h-3.5" />
                  Completada
                </>
              ) : (
                <>
                  <HiClock className="w-3.5 h-3.5" />
                  {porcentajeCompletado.toFixed(0)}% En Progreso
                </>
              )}
            </div>

            {missingMetersCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-red-600/90 text-white border border-red-400/50 font-black tracking-wider text-[10px] uppercase shadow-sm animate-pulse">
                <HiExclamation className="w-3.5 h-3.5" />
                {missingMetersCount} Sin Asignar
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/50 text-white border border-white/20 font-bold text-[10px] uppercase">
            <HiCalendar className="w-3 h-3 text-slate-300" />
            <span>{ruta.periodo_mostrado}</span>
          </div>
        </div>
      </div>

      {/* ── 2. CUERPO DE LA TARJETA (TÍTULO, DETALLES Y PROGRESO) ── */}
      <div className="p-5 flex-1 flex flex-col gap-4">

        {/* Título y Descripción */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-snug line-clamp-1">
              {ruta.nombre}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 shrink-0 font-mono">
              #{ruta.id}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed min-h-[32px]">
            {ruta.descripcion || "Sin descripción registrada para este sector."}
          </p>
        </div>

        {/* Panel de Métricas y Progreso */}
        <div className="bg-slate-50 dark:bg-zinc-900/60 rounded-2xl p-3.5 border border-slate-100 dark:border-zinc-800/80 flex flex-col gap-2.5 mt-auto">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Medidores Leídos
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-zinc-100">
              {ruta.completadas} <span className="text-slate-400 dark:text-zinc-500 font-semibold">/ {ruta.total_puntos}</span>
            </span>
          </div>

          {/* Barra de Progreso */}
          <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden h-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                porcentajeCompletado === 100 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${porcentajeCompletado}%` }}
            />
          </div>

          {/* Resumen inferior del progreso */}
          <div className="flex justify-between items-center pt-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              porcentajeCompletado === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {porcentajeCompletado.toFixed(1)}% completado
            </span>

            {/* Badge de Facturación */}
            <span className={`px-2 py-0.5 rounded-lg font-black tracking-wider text-[9px] uppercase ${estadoFacturacionChipClass}`}>
              {estadoFacturacionLabel}
            </span>
          </div>
        </div>

      </div>

      {/* ── 3. ACCIONES Y BOTONES (FOOTER) ── */}
      <div className="p-5 pt-0 flex flex-col gap-2.5">

        {/* Acción Primaria: Tomar Lecturas */}
        <div className="w-full">
          <CarruselLecturasModal rutaId={ruta.id} periodoMostrado={ruta.periodo_mostrado} rutaInfo={ruta} />
        </div>

        {/* Acciones de Facturación Contextuales */}
        {porcentajeCompletado === 100 ? (
          tieneFacturacionEnPeriodo ? (
            /* Ya facturado: Botón de Recalcular y Ver Resultado */
            <div className="flex items-center gap-2">
              <button
                disabled={!puedeRecalcularPeriodo || isGenerando}
                onClick={handleRecalcularFacturas}
                className="flex-1 h-10 font-bold text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                title="Recalcular facturas sin pagos"
              >
                <HiRefresh className={`w-3.5 h-3.5 ${isGenerando ? 'animate-spin' : ''}`} />
                Recalcular
              </button>

              <button
                onClick={() => setModalResultadoOpen(true)}
                className="h-10 px-3.5 font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                title="Ver resultado de facturación"
              >
                <HiDocumentReport className="w-3.5 h-3.5 text-slate-500" />
                <span>Historial</span>
              </button>
            </div>
          ) : (
            /* Completado pero sin facturar: Botón Generar Facturación */
            <button
              disabled={!puedeGenerarPrimeraFacturacion || isGenerando}
              onClick={handleGenerarFacturas}
              className="w-full h-10 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              {isGenerando ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <HiCurrencyDollar className="w-4 h-4" />
              )}
              Generar Facturas
            </button>
          )
        ) : (
          /* Lecturas Pendientes: Indicador sutil de faltantes */
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-zinc-900/40 rounded-xl border border-slate-100 dark:border-zinc-800/60 text-slate-500 dark:text-zinc-400 text-[11px] font-medium">
            <span className="flex items-center gap-1.5">
              <HiClock className="w-3.5 h-3.5 text-amber-500" />
              Faltan {faltantes} medidor{faltantes !== 1 ? 'es' : ''}
            </span>
            {ultimoResultadoFacturacion && (
              <button
                onClick={() => setModalResultadoOpen(true)}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline text-[10px] uppercase tracking-wider"
              >
                Ver Factura
              </button>
            )}
          </div>
        )}

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
              Ruta {ruta.nombre} · Período {ruta.periodo_mostrado}
            </span>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                Se generará la primera facturación para las lecturas de esta ruta.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1.5">
                Las lecturas quedarán confirmadas para este ciclo.
              </p>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-500/80">
                Si requieres realizar ajustes posteriores en lecturas, podrás utilizar la función de Recalcular Facturación.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="light" onClick={() => setModalGenerarOpen(false)} className="font-bold text-slate-500">Cancelar</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
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
              Ruta {ruta.nombre} · Período {ruta.periodo_mostrado}
            </span>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-5">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1.5">
                Se recalcularán únicamente facturas sin pagos registrados.
              </p>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-500/80">
                Las facturas con pagos registrados se conservarán intactas para proteger la consistencia contable.
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
                placeholder="Describe el motivo del ajuste en las lecturas..."
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
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl"
            isProcessing={isGenerando}
            onClick={ejecutarRecalculoFacturas}
          >
            Confirmar Recálculo
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Visualizador de Resultados */}
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
              Ruta {ruta.nombre} · Período {ruta.periodo_mostrado}
            </span>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            {!ultimoResultadoFacturacion ? (
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 p-6 text-center">
                <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">
                  {tieneFacturacionEnPeriodo
                    ? 'Ya existe facturación en este período, pero no se generó en esta sesión activa.'
                    : 'No hay un resultado reciente para mostrar. Aún no se ha realizado facturación en este período.'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`px-2.5 py-1 rounded-lg font-bold tracking-widest text-[10px] uppercase ${esResultadoRecalculo ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'}`}>
                    {etiquetaTipoProceso}
                  </div>
                  {savedAtLabel && (
                    <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                      Ejecución: {savedAtLabel}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl p-5 border border-slate-100 dark:border-zinc-800 bg-emerald-500/10 flex flex-col gap-1.5 transition-transform hover:-translate-y-0.5">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-700 dark:text-emerald-400">Generadas</p>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{totalGeneradas}</p>
                  </div>
                  <div className="rounded-2xl p-5 border border-slate-100 dark:border-zinc-800 bg-blue-500/10 flex flex-col gap-1.5 transition-transform hover:-translate-y-0.5">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-blue-700 dark:text-blue-400">Recalculadas</p>
                    <p className="text-3xl font-black text-blue-700 dark:text-blue-400">{totalRecalculadas}</p>
                  </div>
                  <div className="rounded-2xl p-5 border border-slate-100 dark:border-zinc-800 bg-red-500/10 flex flex-col gap-1.5 transition-transform hover:-translate-y-0.5">
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

      {/* Modal Alerta Cobranza */}
      <Modal
        show={modalAlertaCobranzaOpen}
        onClose={() => setModalAlertaCobranzaOpen(false)}
        size="md"
        theme={premiumModalTheme}
      >
        <Modal.Header>
          <div className="flex flex-col gap-1">
            <span className="text-xl font-black tracking-tight text-red-600 dark:text-red-500">Alerta de Precaución</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
              Ruta {ruta.nombre} · Período Anterior {datosAlertaCobranza?.periodoAnterior}
            </span>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
              <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">
                ¡Se detectó un alto índice de facturas sin pagar del período anterior!
              </p>
              <p className="text-xs font-medium text-red-600 dark:text-red-500/80 mb-2">
                Han quedado pendientes <strong>{datosAlertaCobranza?.totalPendientes}</strong> de <strong>{datosAlertaCobranza?.totalFacturas}</strong> facturas (<strong>{datosAlertaCobranza?.porcentajePendiente.toFixed(1)}%</strong>).
              </p>
              <p className="text-xs font-medium text-red-600 dark:text-red-500/80">
                Si generas los recibos ahora, los usuarios podrían acumular el mes sin que se haya procesado su pago previo. ¿Deseas continuar?
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="light" onClick={() => setModalAlertaCobranzaOpen(false)} className="font-bold text-slate-500">
            Cancelar Generación
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
            onClick={() => {
              setModalAlertaCobranzaOpen(false);
              setModalGenerarOpen(true);
            }}
          >
            Continuar de todos modos
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}
