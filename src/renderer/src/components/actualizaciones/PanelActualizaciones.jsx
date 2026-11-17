import { useState, useEffect, useRef } from "react";
import {
  HiRefresh, HiDownload, HiLightningBolt, HiCheckCircle,
  HiExclamationCircle, HiBell,
  HiChip, HiShieldCheck, HiDesktopComputer,
  HiClock, HiSparkles, HiInformationCircle,
  HiBookOpen
} from "react-icons/hi";
import { useFeedback } from "../../context/FeedbackContext";
import { formatBytes } from "../../utils/formatSystem";
import { MarkdownRenderer } from "../markdown/MarkdownRenderer";
import { Indicador } from "../ui/VistaModulo";

// Fondos tintados de los iconos de los indicadores (mismo patrón que las vistas de los módulos)
const TINTES = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  slate: "bg-slate-200/70 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
};

// Colores de la tarjeta de estado según la fase (clases completas para que Tailwind las incluya)
const TONOS = {
  emerald: {
    caja: "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border-emerald-500/20",
    icono: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    punto: "bg-emerald-500",
    tinte: TINTES.emerald,
    valor: "text-emerald-600 dark:text-emerald-400"
  },
  blue: {
    caja: "bg-blue-500/[0.04] dark:bg-blue-500/[0.06] border-blue-500/20",
    icono: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    chip: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    punto: "bg-blue-500",
    tinte: TINTES.blue,
    valor: "text-blue-600 dark:text-blue-400"
  },
  amber: {
    caja: "bg-amber-500/[0.05] dark:bg-amber-500/[0.07] border-amber-500/25",
    icono: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    punto: "bg-amber-500",
    tinte: TINTES.amber,
    valor: "text-amber-600 dark:text-amber-400"
  }
};

export default function PanelActualizaciones() {
  const { setError } = useFeedback();
  const [status, setStatus] = useState(null);
  const [cargando, setCargando] = useState(true);
  const cleanupRef = useRef(null);

  const [alertasActivas, setAlertasActivas] = useState(true);

  // Estados del Changelog y selección de versión a visualizar
  const [changelogData, setChangelogData] = useState(null);
  const [cargandoChangelog, setCargandoChangelog] = useState(true);
  const [vistaNotas, setVistaNotas] = useState("actual");

  // Efecto para verificar el estado de las alertas en localStorage
  useEffect(() => {
    const revisarOmitidas = () => {
      const tieneOmitidas = Object.keys(localStorage).some(key => key.startsWith("omitir_alertas_update_v"));
      setAlertasActivas(!tieneOmitidas);
    };
    revisarOmitidas();
    
    // Escuchar cambios de localStorage locales
    window.addEventListener("storage", revisarOmitidas);
    return () => window.removeEventListener("storage", revisarOmitidas);
  }, []);

  const handleToggleAlertas = (e) => {
    const checked = e.target.checked;
    setAlertasActivas(checked);
    if (checked) {
      // Activar alertas: Borrar todas las claves de omisión
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("omitir_alertas_update_v")) {
          localStorage.removeItem(key);
        }
      });
    } else {
      // Desactivar alertas: Guardar omisión para la versión actual o la última detectada
      const versionAOmiter = status?.updateInfo?.version || status?.currentVersion || "global";
      localStorage.setItem(`omitir_alertas_update_v${versionAOmiter}`, "true");
    }
  };

  const simularModalPrueba = () => {
    const detail = { 
      version: "2.1.0-simulada", 
      releaseDate: new Date().toISOString(),
      releaseNotes: `## 🚀 Novedades de la versión 2.1.0\n\n### ✨ Nuevas Funcionalidades\n- **Centro de Actualizaciones Independiente:** Ahora puedes gestionar e instalar actualizaciones sin necesidad de iniciar sesión.\n- **Indicador en Barra Superior:** Notificación con badge interactivo cuando hay nuevas versiones disponibles.\n\n### ⚡ Mejoras y Rendimiento\n- Carga más rápida en el módulo de facturación y lecturas.\n- Respaldo pre-actualización automático e instantáneo.\n\n### 🐛 Correcciones\n- Corrección en la alineación de impresión de recibos.`
    };

    setStatus((prev) => ({
      ...prev,
      updateAvailable: true,
      updateInfo: detail,
      updateDownloaded: false,
      downloading: false,
      checking: false,
      error: null
    }));
    setVistaNotas("nueva");

    const event = new CustomEvent("test-update-modal", { detail });
    document.dispatchEvent(event);
  };

  const restablecerSimulacion = async () => {
    try {
      const result = await window.api.system.getUpdateStatus();
      if (result?.success) {
        setStatus(result);
      } else {
        setStatus({
          updateAvailable: false,
          updateDownloaded: false,
          downloading: false,
          checking: false,
          updateInfo: null,
          downloadProgress: null,
          error: null
        });
      }
    } catch {
      setStatus({
        updateAvailable: false,
        updateDownloaded: false,
        downloading: false,
        checking: false,
        updateInfo: null,
        downloadProgress: null,
        error: null
      });
    }
    setVistaNotas("actual");
    // Notificar al modal y navbar para que cierren/apaguen el badge
    const event = new CustomEvent("test-update-reset");
    document.dispatchEvent(event);
  };

  // Cargar estado inicial y changelog
  useEffect(() => {
    let isMounted = true;
    const cargar = async () => {
      try {
        const result = await window.api.system.getUpdateStatus();
        if (result?.success && isMounted) {
          setStatus(result);
          if (result.updateInfo?.releaseNotes) {
            setVistaNotas("nueva");
          }
        }
      } catch (err) {
        console.error("Error cargando estado de actualizaciones:", err);
        setError("No se pudo cargar el estado de actualizaciones", "Actualizaciones");
      } finally {
        if (isMounted) setCargando(false);
      }

      try {
        if (window.api?.system?.getChangelog) {
          const ch = await window.api.system.getChangelog();
          if (ch?.success && isMounted) {
            setChangelogData(ch);
          }
        }
      } catch (err) {
        console.warn("No se pudo cargar el changelog extendido:", err);
      } finally {
        if (isMounted) setCargandoChangelog(false);
      }
    };
    cargar();
    return () => { isMounted = false; };
  }, [setError]);

  // Suscribirse a eventos de actualización
  useEffect(() => {
    const cleanup = window.api.system.onUpdateProgress((data) => {
      switch (data.event) {
        case "update-available":
          setStatus((prev) => ({ ...prev, updateAvailable: true, updateInfo: data.info, checking: false }));
          setVistaNotas("nueva");
          break;
        case "update-not-available":
          setStatus((prev) => ({ ...prev, updateAvailable: false, checking: false }));
          setVistaNotas("actual");
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

    const handleTestEvent = (e) => {
      if (e.detail) {
        setStatus((prev) => ({
          ...prev,
          updateAvailable: true,
          updateInfo: e.detail,
          updateDownloaded: false,
          downloading: false,
          checking: false,
          error: null
        }));
        setVistaNotas("nueva");
      }
    };

    const handleTestReset = () => {
      setStatus((prev) => ({
        ...prev,
        updateAvailable: false,
        updateDownloaded: false,
        downloading: false,
        checking: false,
        updateInfo: null,
        downloadProgress: null,
        error: null
      }));
      setVistaNotas("actual");
    };

    document.addEventListener("test-update-modal", handleTestEvent);
    document.addEventListener("test-update-reset", handleTestReset);

    cleanupRef.current = cleanup;
    return () => {
      if (cleanupRef.current) cleanupRef.current();
      document.removeEventListener("test-update-modal", handleTestEvent);
      document.removeEventListener("test-update-reset", handleTestReset);
    };
  }, [setError]);

  const verificar = async () => {
    setStatus((prev) => ({ ...prev, checking: true, error: null }));
    try {
      const res = await window.api.system.checkForUpdates();
      if (res && !res.success && res.error) {
        setError(res.error, "Actualizaciones");
        setStatus((prev) => ({ ...prev, checking: false }));
      }
    } catch (err) {
      console.error("Error al verificar actualizaciones:", err);
      setError("Error al verificar actualizaciones", "Actualizaciones");
      setStatus((prev) => ({ ...prev, checking: false }));
    }
  };

  const descargar = async () => {
    if (status?.updateInfo?.version === "2.1.0-simulada") {
      setStatus((prev) => ({ ...prev, downloading: true, error: null }));
      let percent = 0;
      const interval = setInterval(() => {
        percent += 20;
        if (percent >= 100) {
          clearInterval(interval);
          setStatus((prev) => ({
            ...prev,
            downloading: false,
            updateDownloaded: true,
            downloadProgress: { percent: 100, transferred: 45000000, total: 45000000, bytesPerSecond: 3500000 }
          }));
          const event = new CustomEvent("test-update-downloaded");
          document.dispatchEvent(event);
        } else {
          setStatus((prev) => ({
            ...prev,
            downloadProgress: { percent, transferred: (percent / 100) * 45000000, total: 45000000, bytesPerSecond: 3500000 }
          }));
        }
      }, 350);
      return;
    }

    setStatus((prev) => ({ ...prev, downloading: true, error: null }));
    try {
      const res = await window.api.system.downloadUpdate();
      if (res && !res.success) {
        setError(res.error || res.message || "Error al descargar la actualización", "Actualizaciones");
        setStatus((prev) => ({ ...prev, downloading: false }));
      }
    } catch (err) {
      console.error("Error al descargar actualización:", err);
      setError("Error al descargar la actualización", "Actualizaciones");
      setStatus((prev) => ({ ...prev, downloading: false }));
    }
  };

  const instalar = async () => {
    if (status?.updateInfo?.version === "2.1.0-simulada") {
      alert("✅ Simulación completada: En un entorno de producción, la aplicación realizaría un respaldo automático de la base de datos y se reiniciaría para aplicar los cambios.");
      return;
    }
    try {
      const res = await window.api.system.installUpdate();
      if (res && !res.success) {
        setError(res.error || res.message || "Error al instalar la actualización", "Actualizaciones");
      }
    } catch (err) {
      console.error("Error al instalar actualización:", err);
      setError("Error al instalar la actualización", "Actualizaciones");
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 rounded-full border-[3px] border-blue-500/20 border-t-blue-600 animate-spin" />
        <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
          Cargando estado de actualizaciones…
        </span>
      </div>
    );
  }

  const pct = Math.round(status?.downloadProgress?.percent ?? 0);
  const isDownloaded = Boolean(status?.updateDownloaded);
  const isDownloading = Boolean(status?.downloading);
  const isAvailable = Boolean(status?.updateAvailable) && !isDownloaded && !isDownloading;
  const isChecking = Boolean(status?.checking);

  // Lógica para visualización del Changelog / Notas de Versión
  const versionActual = status?.currentVersion || changelogData?.currentVersion || "1.3.0";
  const hayNuevaVersion = Boolean(status?.updateAvailable && status?.updateInfo);
  const releasesList = changelogData?.releases?.length
    ? changelogData.releases
    : (status?.releases || []);

  let vistaEfectiva = vistaNotas;
  if (vistaEfectiva === "nueva" && !hayNuevaVersion) {
    vistaEfectiva = "actual";
  }

  let notasActivas = "";
  let etiquetaVersionActiva = `v${versionActual}`;
  let fechaLanzamientoActiva = null;
  let esPreReleaseActiva = false;
  let tipoBadgeActivo = "actual"; // "nueva" | "actual" | "historica"

  if (vistaEfectiva === "nueva" && hayNuevaVersion) {
    etiquetaVersionActiva = `v${status?.updateInfo?.version || "Nueva"}`;
    fechaLanzamientoActiva = status?.updateInfo?.releaseDate;
    tipoBadgeActivo = "nueva";
    const rawNotes = status?.updateInfo?.releaseNotes;
    if (typeof rawNotes === "string") {
      notasActivas = rawNotes;
    } else if (Array.isArray(rawNotes)) {
      notasActivas = rawNotes.map((n) => (typeof n === "string" ? n : n.note || "")).join("\n\n");
    } else {
      notasActivas = "Sin notas de versión detalladas para esta actualización.";
    }
  } else if (vistaEfectiva === "actual") {
    etiquetaVersionActiva = `v${versionActual}`;
    tipoBadgeActivo = "actual";
    const exacta = (r) => r.version === versionActual || r.tag === `v${versionActual}` || r.tag === versionActual;
    const releaseActual = releasesList.find(exacta) || releasesList.find(
      (r) =>
        r.version === versionActual ||
        r.tag === `v${versionActual}` ||
        r.tag === versionActual ||
        r.version?.startsWith(versionActual) ||
        versionActual.startsWith(r.version)
    );
    if (releaseActual) {
      fechaLanzamientoActiva = releaseActual.releaseDate || releaseActual.publishedAt;
      esPreReleaseActiva = Boolean(releaseActual.isPrerelease);
      notasActivas = releaseActual.notes || releaseActual.body || changelogData?.currentReleaseNotes || status?.currentReleaseNotes || "";
    } else {
      fechaLanzamientoActiva = changelogData?.currentReleaseInfo?.releaseDate || changelogData?.currentReleaseInfo?.publishedAt || null;
      esPreReleaseActiva = Boolean(changelogData?.currentReleaseInfo?.isPrerelease);
      notasActivas = changelogData?.currentReleaseNotes || status?.currentReleaseNotes || changelogData?.fullChangelog || "";
    }
  } else {
    // Versión histórica seleccionada del selector
    const rel = releasesList.find((r) => r.version === vistaEfectiva || r.tag === vistaEfectiva);
    if (rel) {
      etiquetaVersionActiva = rel.tag || `v${rel.version}`;
      fechaLanzamientoActiva = rel.releaseDate || rel.publishedAt;
      esPreReleaseActiva = Boolean(rel.isPrerelease);
      tipoBadgeActivo = "historica";
      notasActivas = rel.notes || rel.body || "";
    } else {
      etiquetaVersionActiva = `v${versionActual}`;
      tipoBadgeActivo = "actual";
      notasActivas = changelogData?.currentReleaseNotes || "";
    }
  }

  // Lista de versiones anteriores para el selector desplegable
  const otrasVersiones = releasesList.filter((r) => {
    const isCurrent =
      r.version === versionActual ||
      r.tag === `v${versionActual}` ||
      r.tag === versionActual;
    const isNew =
      hayNuevaVersion &&
      (r.version === status?.updateInfo?.version || r.tag === `v${status?.updateInfo?.version}`);
    return !isCurrent && !isNew;
  });

  const formatearFechaLanzamiento = (fecha) => {
    if (!fecha) return null;
    if (typeof fecha === "string" && (fecha.includes("/") || fecha.includes(" de "))) {
      return fecha;
    }
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return typeof fecha === "string" ? fecha : null;
      return d.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return typeof fecha === "string" ? fecha : null;
    }
  };

  // ── Presentación ────────────────────────────────────────────────────────────
  // Fase actual de la actualización: decide colores, icono, textos y la acción principal
  const fase = isDownloaded ? "lista" : isDownloading ? "descargando" : isAvailable ? "disponible" : isChecking ? "buscando" : "aldia";
  const versionNueva = status?.updateInfo?.version || "";
  const FASES = {
    aldia: {
      tono: "emerald", icono: HiCheckCircle, etiqueta: "Al día",
      titulo: "Agua-VP está actualizado",
      texto: "Tienes instalada la versión más reciente del sistema."
    },
    buscando: {
      tono: "blue", icono: HiRefresh, animIcono: "animate-spin", etiqueta: "Buscando",
      titulo: "Buscando actualizaciones…",
      texto: "Consultando el repositorio oficial para conocer la última versión publicada."
    },
    disponible: {
      tono: "blue", icono: HiSparkles, etiqueta: "Nueva versión",
      titulo: `Versión v${versionNueva} disponible`,
      texto: "Hay una nueva versión con mejoras y correcciones. Revisa sus novedades abajo antes de descargarla."
    },
    descargando: {
      tono: "blue", icono: HiDownload, animIcono: "animate-bounce", etiqueta: `Descargando ${pct}%`,
      titulo: `Descargando v${versionNueva}`,
      texto: "Puedes seguir usando el sistema con normalidad mientras termina la descarga."
    },
    lista: {
      tono: "amber", icono: HiLightningBolt, etiqueta: "Lista para instalar",
      titulo: "Actualización lista para instalar",
      texto: "Al instalar, Agua-VP respalda la base de datos, se cierra y se abre de nuevo con la versión nueva."
    }
  };
  const f = FASES[fase];
  const t = TONOS[f.tono];
  const IconoFase = f.icono;

  const ultimaBusqueda = status?.lastCheck
    ? new Date(status.lastCheck).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "Sin buscar";

  const progreso = status?.downloadProgress;
  const BOTON_PRIMARIO =
    "w-full md:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-60 disabled:active:scale-100 cursor-pointer disabled:cursor-default";
  const botonSegmento = (activo) =>
    `px-3 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
      activo
        ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm"
        : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
    }`;
  const enHistorial = vistaEfectiva !== "nueva" && vistaEfectiva !== "actual";

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 animate-in fade-in duration-300">

      {/* ── 1. INDICADORES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Indicador icon={HiChip} tint={TINTES.blue} label="Versión instalada" value={`v${versionActual}`} detalle="Versión de Agua-VP en este equipo" />
        <Indicador icon={IconoFase} tint={t.tinte} label="Estado" value={f.etiqueta} valueClass={t.valor} detalle={f.titulo} />
        <Indicador icon={HiClock} tint={TINTES.slate} label="Última búsqueda" value={ultimaBusqueda} detalle={status?.lastCheck ? "Se busca sola al abrir la app" : "Aún no se ha buscado en esta sesión"} />
        <Indicador icon={HiBookOpen} tint={TINTES.indigo} label="Versiones publicadas" value={releasesList.length || "—"} detalle="Versiones con notas en el historial" />
      </div>

      {/* ── 2. ERROR ── */}
      {status?.error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-500/[0.07] border border-rose-500/20">
          <div className="p-2 rounded-lg shrink-0 bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <HiExclamationCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-rose-700 dark:text-rose-400">No se pudo completar la actualización</p>
            <p className="text-sm font-medium text-rose-600/90 dark:text-rose-400/80 mt-0.5 leading-snug break-words">{status.error}</p>
          </div>
        </div>
      )}

      {/* ── 3. ESTADO Y ACCIÓN PRINCIPAL ── */}
      <div className={`rounded-2xl border p-5 sm:p-6 transition-colors ${t.caja}`}>
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className={`p-3.5 rounded-xl shrink-0 self-start md:self-center ${t.icono}`}>
            <IconoFase className={`w-8 h-8 ${f.animIcono || ""}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-md text-[11px] font-bold ${t.chip}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${t.punto} ${fase === "buscando" || fase === "descargando" ? "animate-pulse" : ""}`} />
                {f.etiqueta}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500 tabular-nums">
                Instalada: v{versionActual}
              </span>
            </div>
            <h2 className="mt-1.5 text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
              {f.titulo}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-zinc-400 leading-snug max-w-2xl">
              {f.texto}
            </p>
          </div>

          <div className="shrink-0">
            {fase === "lista" ? (
              <button type="button" onClick={instalar} className={BOTON_PRIMARIO}>
                <HiLightningBolt className="w-5 h-5" />
                Instalar y reiniciar
              </button>
            ) : fase === "descargando" ? (
              <div className="w-full md:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
                Descargando…
              </div>
            ) : fase === "disponible" ? (
              <button type="button" onClick={descargar} className={BOTON_PRIMARIO}>
                <HiDownload className="w-5 h-5" />
                Descargar v{versionNueva}
              </button>
            ) : (
              <button type="button" onClick={verificar} disabled={isChecking} className={BOTON_PRIMARIO}>
                <HiRefresh className={`w-5 h-5 ${isChecking ? "animate-spin" : ""}`} />
                {isChecking ? "Buscando…" : "Buscar actualizaciones"}
              </button>
            )}
          </div>
        </div>

        {/* Progreso de la descarga */}
        {fase === "descargando" && (
          <div className="mt-5 pt-5 border-t border-blue-500/15 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                {progreso ? "Descargando el instalador oficial" : "Preparando la descarga…"}
              </span>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400 tabular-nums">{pct}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-blue-500/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
            {progreso && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-medium text-slate-500 dark:text-zinc-400 tabular-nums">
                <span>Descargado: <b className="font-bold text-slate-700 dark:text-zinc-200">{formatBytes(progreso.transferred)} de {formatBytes(progreso.total)}</b></span>
                <span>Velocidad: <b className="font-bold text-slate-700 dark:text-zinc-200">{formatBytes(progreso.bytesPerSecond)}/s</b></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 4. NOTAS DE LA VERSIÓN + AJUSTES ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* Notas de la versión */}
        <section className="xl:col-span-2 min-w-0 rounded-2xl bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg shrink-0 bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400">
                <HiBookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black tracking-tight text-slate-800 dark:text-zinc-100">Notas de la versión</h3>
                  <span className="inline-flex items-center px-1.5 h-5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold tabular-nums">
                    {etiquetaVersionActiva}
                  </span>
                  {tipoBadgeActivo === "actual" && (
                    <span className="inline-flex items-center px-1.5 h-5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-[11px] font-bold">Instalada</span>
                  )}
                  {tipoBadgeActivo === "nueva" && (
                    <span className="inline-flex items-center px-1.5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">Nueva</span>
                  )}
                  {esPreReleaseActiva && (
                    <span className="inline-flex items-center px-1.5 h-5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold">Beta</span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-400 dark:text-zinc-500 mt-0.5">
                  {formatearFechaLanzamiento(fechaLanzamientoActiva)
                    ? `Publicada el ${formatearFechaLanzamiento(fechaLanzamientoActiva)}`
                    : "Novedades, mejoras y correcciones"}
                </p>
              </div>
            </div>

            {/* Qué versión mostrar */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Con versión nueva se elige entre sus notas y las de la instalada; sin ella, el botón
                  "Instalada" solo aparece para volver desde una versión anterior */}
              {(hayNuevaVersion || enHistorial) && (
                <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  {hayNuevaVersion && (
                    <button type="button" onClick={() => setVistaNotas("nueva")} className={botonSegmento(vistaEfectiva === "nueva")}>
                      Nueva v{versionNueva}
                    </button>
                  )}
                  <button type="button" onClick={() => setVistaNotas("actual")} className={botonSegmento(vistaEfectiva === "actual")}>
                    Instalada
                  </button>
                </div>
              )}

              {otrasVersiones.length > 0 && (
                <select
                  value={enHistorial ? vistaEfectiva : ""}
                  onChange={(e) => {
                    if (e.target.value) setVistaNotas(e.target.value);
                  }}
                  aria-label="Ver notas de una versión anterior"
                  className={`h-10 w-56 max-w-full pl-3 pr-8 rounded-xl text-xs font-semibold border truncate focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer ${
                    enHistorial
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                      : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <option value="" disabled className="text-slate-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">
                    Versiones anteriores…
                  </option>
                  {otrasVersiones.map((rel) => (
                    <option key={rel.version || rel.tag} value={rel.version} className="text-slate-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">
                      {rel.tag || `v${rel.version}`}
                      {(rel.releaseDate || rel.publishedAt) ? ` · ${formatearFechaLanzamiento(rel.releaseDate || rel.publishedAt)}` : ""}
                      {rel.isPrerelease ? " (beta)" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-6 max-h-[560px] overflow-y-auto custom-scrollbar">
            {notasActivas ? (
              <MarkdownRenderer content={notasActivas} />
            ) : cargandoChangelog ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-zinc-500">
                <div className="w-7 h-7 border-2 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-sm font-medium">Cargando notas de la versión…</span>
              </div>
            ) : (
              <div className="py-14 flex flex-col items-center justify-center gap-2 text-center">
                <HiInformationCircle className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">No hay notas publicadas para esta versión.</p>
              </div>
            )}
          </div>
        </section>

        {/* Ajustes e información */}
        <aside className="flex flex-col gap-4 min-w-0">
          <div className="rounded-2xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg shrink-0 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <HiBell className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100">Avisar al iniciar</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                    Mostrar un aviso al abrir la app cuando haya una versión nueva.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 mt-0.5" title={alertasActivas ? "Avisos activados" : "Avisos desactivados"}>
                <input
                  type="checkbox"
                  checked={alertasActivas}
                  onChange={handleToggleAlertas}
                  aria-label="Avisar al iniciar cuando haya una versión nueva"
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-zinc-700 rounded-full peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/40 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
            <span className={`self-start inline-flex items-center gap-1.5 px-2 h-6 rounded-md text-[11px] font-bold ${
              alertasActivas ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-slate-200/70 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
            }`}>
              {alertasActivas ? "Activados" : "Desactivados"}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 p-5 flex items-start gap-3">
            <div className="p-2 rounded-lg shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <HiShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100">Respaldo antes de instalar</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                Antes de instalar una versión nueva, Agua-VP guarda una copia completa de la base de datos (clientes, lecturas, facturas y pagos).
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 p-5 flex items-start gap-3">
            <div className="p-2 rounded-lg shrink-0 bg-slate-200/70 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
              <HiDesktopComputer className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100">Cómo se actualiza</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                La app busca versiones nuevas al abrirse. La descarga solo empieza cuando la pides y la instalación, cuando eliges reiniciar.
              </p>
            </div>
          </div>

          {/* Simulador: solo en desarrollo */}
          {import.meta.env.DEV && (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 p-5 flex flex-col gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Simulador (desarrollo)
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                  Simula la llegada de una versión nueva para probar avisos y pantallas.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={simularModalPrueba}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all active:scale-95 cursor-pointer"
                >
                  Simular v2.1.0
                </button>
                <button
                  type="button"
                  onClick={restablecerSimulacion}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-all active:scale-95 cursor-pointer"
                >
                  Restablecer
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
