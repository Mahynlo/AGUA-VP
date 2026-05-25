import { useState, useEffect, useRef } from "react";
import {
  HiRefresh, HiDownload, HiLightningBolt, HiCheckCircle,
  HiExclamationCircle, HiInformationCircle, HiStar, HiCalendar,
  HiChip
} from "react-icons/hi";
import { useFeedback } from "../../../context/FeedbackContext";
import { formatBytes } from "../../../utils/formatSystem";
import { MarkdownRenderer } from "../../vistas/ayuda/MarkdownRenderer";

export default function PanelActualizaciones() {
  const { setError } = useFeedback();
  const [status, setStatus] = useState(null);
  const [novedadMostrada, setNovedadMostrada] = useState(false);
  const [cargando, setCargando] = useState(true);
  const cleanupRef = useRef(null);

  // Cargar estado inicial
  useEffect(() => {
    const cargar = async () => {
      try {
        const result = await window.api.system.getUpdateStatus();
        if (result?.success) setStatus(result);
      } catch (err) {
        console.error("Error cargando estado de actualizaciones:", err);
        setError("No se pudo cargar el estado de actualizaciones", "Actualizaciones");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [setError]);

  // Suscribirse a eventos de actualización
  useEffect(() => {
    const cleanup = window.api.system.onUpdateProgress((data) => {
      switch (data.event) {
        case "update-available":
          setStatus((prev) => ({ ...prev, updateAvailable: true, updateInfo: data.info, checking: false }));
          setNovedadMostrada(false);
          break;
        case "update-not-available":
          setStatus((prev) => ({ ...prev, updateAvailable: false, checking: false }));
          setNovedadMostrada(true);
          break;
        case "update-downloaded":
          setStatus((prev) => ({ ...prev, updateDownloaded: true, downloading: false }));
          break;
        case "download-progress":
          setStatus((prev) => ({ ...prev, downloading: true, downloadProgress: data.progress }));
          break;
        case "error":
          setStatus((prev) => ({ ...prev, checking: false, downloading: false, error: data.error }));
          setError(data.error || "Error en el proceso de actualización", "Actualizaciones");
          break;
        default:
          break;
      }
    });
    cleanupRef.current = cleanup;
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [setError]);

  const verificar = async () => {
    setNovedadMostrada(false);
    setStatus((prev) => ({ ...prev, checking: true, error: null }));
    try {
      await window.api.system.checkForUpdates();
    } catch (err) {
      setError("Error al verificar actualizaciones", "Actualizaciones");
      setStatus((prev) => ({ ...prev, checking: false }));
    }
  };

  const descargar = async () => {
    setStatus((prev) => ({ ...prev, downloading: true }));
    try {
      await window.api.system.downloadUpdate();
    } catch (err) {
      setError("Error al descargar la actualización", "Actualizaciones");
      setStatus((prev) => ({ ...prev, downloading: false }));
    }
  };

  const instalar = async () => {
    try {
      await window.api.system.installUpdate();
    } catch (err) {
      setError("Error al instalar la actualización", "Actualizaciones");
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
          Cargando estado de actualizaciones...
        </span>
      </div>
    );
  }

  const pct = status?.downloadProgress?.percent ?? 0;

  return (
    <div className="space-y-4 w-full">

      {/* ── VERSIÓN ACTUAL ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl shrink-0">
            <HiChip className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-0.5">
              Versión actual
            </p>
            <p className="text-3xl font-black text-blue-600 dark:text-blue-400 leading-none tracking-tight">
              v{status?.currentVersion || "—"}
            </p>
          </div>
        </div>
        {status?.lastCheck && (
          <div className="flex items-center gap-2 text-right sm:text-right">
            <HiCalendar className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Última verificación
              </p>
              <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300">
                {new Date(status.lastCheck).toLocaleString("es-MX")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTONES DE ACCIÓN ── */}
      <div className="flex flex-wrap gap-3">
        {!status?.updateAvailable && !status?.updateDownloaded && (
          <button
            type="button"
            onClick={verificar}
            disabled={status?.checking}
            className="inline-flex items-center gap-2 font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 rounded-xl px-6 h-11 text-sm shadow-sm transition-all active:scale-95"
          >
            <HiRefresh className={`w-4 h-4 ${status?.checking ? "animate-spin" : ""}`} />
            {status?.checking ? "Verificando..." : "Verificar Actualizaciones"}
          </button>
        )}

        {status?.updateAvailable && !status?.updateDownloaded && !status?.downloading && (
          <button
            type="button"
            onClick={descargar}
            className="inline-flex items-center gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-11 text-sm shadow-sm transition-all active:scale-95"
          >
            <HiDownload className="w-4 h-4" />
            Descargar v{status?.updateInfo?.version}
          </button>
        )}

        {status?.updateDownloaded && (
          <button
            type="button"
            onClick={instalar}
            className="inline-flex items-center gap-2 font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 h-11 text-sm shadow-sm transition-all active:scale-95"
          >
            <HiLightningBolt className="w-4 h-4" />
            Instalar y Reiniciar
          </button>
        )}
      </div>

      {/* ── ERROR ── */}
      {status?.error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <HiExclamationCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Error</p>
            <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-0.5">{status.error}</p>
          </div>
        </div>
      )}

      {/* ── PROGRESO DE DESCARGA ── */}
      {status?.downloading && status?.downloadProgress && (
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">Descargando actualización...</p>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400">{Math.round(pct)}%</span>
          </div>
          {/* Barra de progreso nativa */}
          <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-zinc-400">
            <span>
              {formatBytes(status.downloadProgress.transferred)} / {formatBytes(status.downloadProgress.total)}
            </span>
            <span>{formatBytes(status.downloadProgress.bytesPerSecond)}/s</span>
          </div>
        </div>
      )}

      {/* ── ACTUALIZACIÓN DISPONIBLE: NOTAS DE VERSIÓN ── */}
      {status?.updateInfo && status?.updateAvailable && (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/50 shadow-sm overflow-hidden">
          {/* Cabecera */}
          <div className="flex items-center justify-between px-6 py-4 bg-blue-500/5 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-3">
              <HiStar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-black text-slate-800 dark:text-zinc-100 tracking-tight">
                Nueva versión disponible
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-xs font-bold">
                v{status.updateInfo.version}
              </span>
            </div>
            {status.updateInfo.releaseDate && (
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                {new Date(status.updateInfo.releaseDate).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
          </div>

          {/* Notas de versión en Markdown */}
          <div className="px-6 py-5 max-h-[420px] overflow-y-auto">
            {status.updateInfo.releaseNotes ? (
              <MarkdownRenderer content={
                typeof status.updateInfo.releaseNotes === "string"
                  ? status.updateInfo.releaseNotes
                  : status.updateInfo.releaseNotes.map?.((n) => n.note || "").join("\n\n") || ""
              } />
            ) : (
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 italic">
                Sin notas de versión
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── ACTUALIZACIÓN DESCARGADA ── */}
      {status?.updateDownloaded && (
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-orange-500/10 border border-orange-200 dark:border-orange-900/40">
          <HiLightningBolt className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-orange-700 dark:text-orange-400">Lista para instalar</p>
            <p className="text-sm font-medium text-orange-600/80 dark:text-orange-400/80 mt-0.5">
              La actualización está descargada. Se creará un <strong>backup automático</strong> de la base de datos antes de reiniciar.
            </p>
          </div>
        </div>
      )}

      {/* ── AL DÍA ── */}
      {novedadMostrada && !status?.updateAvailable && (
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/40">
          <HiCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Aplicación al día</p>
            <p className="text-sm font-medium text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
              No hay nuevas versiones disponibles.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
