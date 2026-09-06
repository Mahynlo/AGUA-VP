import { useState, useEffect, useRef } from "react";
import {
  HiRefresh, HiDownload, HiLightningBolt, HiCheckCircle,
  HiExclamationCircle, HiStar, HiCalendar,
  HiChip, HiShieldCheck, HiDesktopComputer,
  HiClock, HiSparkles, HiInformationCircle
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

  const [alertasActivas, setAlertasActivas] = useState(true);

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
    setNovedadMostrada(false);

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
    setNovedadMostrada(true);
    // Notificar al modal y navbar para que cierren/apaguen el badge
    const event = new CustomEvent("test-update-reset");
    document.dispatchEvent(event);
  };

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
        setNovedadMostrada(false);
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
      setNovedadMostrada(true);
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

    setStatus((prev) => ({ ...prev, downloading: true }));
    try {
      await window.api.system.downloadUpdate();
    } catch (err) {
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
      await window.api.system.installUpdate();
    } catch (err) {
      setError("Error al instalar la actualización", "Actualizaciones");
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
          Cargando estado de actualizaciones...
        </span>
      </div>
    );
  }

  const pct = Math.round(status?.downloadProgress?.percent ?? 0);
  const isDownloaded = Boolean(status?.updateDownloaded);
  const isDownloading = Boolean(status?.downloading);
  const isAvailable = Boolean(status?.updateAvailable) && !isDownloaded && !isDownloading;
  const isChecking = Boolean(status?.checking);

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">

      {/* ── 1. INFORMACIÓN DEL SISTEMA Y GARANTÍA DE RESPALDO ── */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* KPI 1: Versión Actual */}
          <div className="flex flex-col gap-2.5 p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Versión Instalada</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"><HiChip className="w-4 h-4" /></div>
            </div>
            <p className="text-xl font-black text-slate-800 dark:text-zinc-100 leading-none font-mono">
              v{status?.currentVersion || "1.0.0"}
            </p>
            <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Compilación de escritorio</span>
          </div>

          {/* KPI 2: Canal de Actualización */}
          <div className="flex flex-col gap-2.5 p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Canal de Distribución</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><HiShieldCheck className="w-4 h-4" /></div>
            </div>
            <p className="text-xl font-black text-slate-800 dark:text-zinc-100 leading-none">
              Producción
            </p>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Canal Oficial Seguro</span>
          </div>

          {/* KPI 3: Última Verificación */}
          <div className="flex flex-col gap-2.5 p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Última Búsqueda</span>
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"><HiCalendar className="w-4 h-4" /></div>
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-zinc-100 leading-tight truncate">
              {status?.lastCheck ? new Date(status.lastCheck).toLocaleDateString("es-MX", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Hoy"}
            </p>
            <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1">
              <HiClock className="w-3.5 h-3.5" /> Automática
            </span>
          </div>

          {/* KPI 4: Plataforma & Motor */}
          <div className="flex flex-col gap-2.5 p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Plataforma</span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><HiDesktopComputer className="w-4 h-4" /></div>
            </div>
            <p className="text-xl font-black text-slate-800 dark:text-zinc-100 leading-none">
              Windows x64
            </p>
            <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Electron & SQLite</span>
          </div>

        </div>

        {/* Ficha de Seguridad & Garantía de Respaldo */}
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 shadow-sm">
          <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 mt-0.5">
            <HiShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Garantía de Respaldo Previo Automático
            </h4>
            <p className="text-xs font-medium text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
              Antes de aplicar cualquier actualización o reinicio, Agua-VP genera automáticamente un respaldo completo de tu base de datos SQLite y parámetros del sistema para asegurar la integridad total de tus datos fiscales, clientes y lecturas.
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. NOTIFICACIONES DE ACTUALIZACIÓN (SWITCH) ── */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col gap-0.5 pr-4">
          <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            Notificaciones Emergentes al Iniciar
          </h4>
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 leading-relaxed">
            Avisar en pantalla automáticamente al arrancar la aplicación si se detecta una nueva versión disponible.
          </p>
        </div>
        <div className="shrink-0 flex items-center">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={alertasActivas} 
              onChange={handleToggleAlertas}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-xs font-bold text-slate-700 dark:text-zinc-300 min-w-[70px]">
              {alertasActivas ? "Activadas" : "Desactivadas"}
            </span>
          </label>
        </div>
      </div>

      {/* ── 3. HERRAMIENTAS DE DESARROLLO (SIMULADOR) ── */}
      {import.meta.env.DEV && (
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex flex-col gap-0.5">
            <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Herramientas de Desarrollo (Simulador)
            </h4>
            <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 leading-relaxed">
              Prueba la experiencia de usuario y las alertas visuales simulando la llegada de una nueva actualización.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={restablecerSimulacion}
              className="inline-flex items-center gap-1.5 font-bold bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl px-3.5 h-9 text-xs transition-all active:scale-95"
            >
              Restablecer
            </button>
            <button
              type="button"
              onClick={simularModalPrueba}
              className="inline-flex items-center gap-1.5 font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl px-4 h-9 text-xs transition-all active:scale-95"
            >
              Simular Alerta v2.1.0
            </button>
          </div>
        </div>
      )}

      {/* ── 4. ESTADO Y BOTÓN PARA INSTALAR / DESCARGAR / BUSCAR ACTUALIZACIÓN ── */}
      <div className="space-y-4">
        {/* Error Banner si ocurrió algún fallo */}
        {status?.error && (
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 animate-in fade-in">
            <div className="p-2 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
              <HiExclamationCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-rose-700 dark:text-rose-400">Error durante la actualización</p>
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400/90 mt-1 leading-relaxed">{status.error}</p>
            </div>
          </div>
        )}

        {/* Hero Status Card con Acción */}
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Lado izquierdo: Icono y texto de estado */}
            <div className="flex items-start sm:items-center gap-5">
              <div className={`p-4 sm:p-5 rounded-2xl shrink-0 flex items-center justify-center transition-all ${
                isDownloaded
                  ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-sm"
                  : isDownloading
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 animate-pulse shadow-sm"
                  : isAvailable
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm"
                  : isChecking
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm"
              }`}>
                {isDownloaded ? (
                  <HiLightningBolt className="w-9 h-9" />
                ) : isDownloading ? (
                  <HiDownload className="w-9 h-9 animate-bounce" />
                ) : isAvailable ? (
                  <HiSparkles className="w-9 h-9" />
                ) : isChecking ? (
                  <HiRefresh className="w-9 h-9 animate-spin" />
                ) : (
                  <HiCheckCircle className="w-9 h-9" />
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                    isDownloaded
                      ? "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800"
                      : isDownloading
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800"
                      : isAvailable
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                      : "bg-slate-200/70 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-300 dark:border-zinc-700"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isDownloaded ? "bg-orange-500" : isDownloading ? "bg-blue-500" : isAvailable ? "bg-emerald-500" : "bg-emerald-500"
                    }`} />
                    {isDownloaded
                      ? "Lista para instalar"
                      : isDownloading
                      ? `Descargando (${pct}%)`
                      : isAvailable
                      ? `Nueva versión v${status?.updateInfo?.version}`
                      : isChecking
                      ? "Comprobando..."
                      : "Sistema al día"}
                  </span>

                  <span className="text-xs font-mono font-bold text-slate-400 dark:text-zinc-500">
                    Instalada: v{status?.currentVersion || "1.0.0"}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                  {isDownloaded
                    ? "Actualización descargada y lista"
                    : isDownloading
                    ? `Descargando versión v${status?.updateInfo?.version || ""}`
                    : isAvailable
                    ? `Versión v${status?.updateInfo?.version} disponible`
                    : isChecking
                    ? "Buscando actualizaciones..."
                    : "Agua-VP está actualizado"}
                </h2>

                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-xl leading-relaxed">
                  {isDownloaded
                    ? "La actualización se ha verificado. Haz clic en el botón para reiniciar el sistema y aplicar los cambios con respaldo seguro previo."
                    : isDownloading
                    ? "Se está descargando el paquete oficial. Puedes continuar usando el sistema con normalidad."
                    : isAvailable
                    ? "Se ha detectado una nueva versión con mejoras de rendimiento, correcciones y nuevas funciones."
                    : isChecking
                    ? "Conectando con el repositorio oficial para consultar la última versión disponible."
                    : "Cuentas con la versión más reciente del sistema. Todo tu entorno operativo se encuentra optimizado."}
                </p>
              </div>
            </div>

            {/* Lado derecho: Botón principal de acción */}
            <div className="flex items-center shrink-0">
              {isDownloaded ? (
                <button
                  type="button"
                  onClick={instalar}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 font-black bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 h-12 text-sm shadow-sm transition-all active:scale-95 uppercase tracking-wider"
                >
                  <HiLightningBolt className="w-5 h-5" />
                  Instalar y Reiniciar
                </button>
              ) : isDownloading ? (
                <div className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
                  <span>Descarga en progreso...</span>
                </div>
              ) : isAvailable ? (
                <button
                  type="button"
                  onClick={descargar}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-12 text-sm shadow-sm transition-all active:scale-95 uppercase tracking-wider"
                >
                  <HiDownload className="w-5 h-5" />
                  Descargar v{status?.updateInfo?.version}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={verificar}
                  disabled={isChecking}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 rounded-xl px-6 h-12 text-sm shadow-sm transition-all active:scale-95"
                >
                  <HiRefresh className={`w-5 h-5 ${isChecking ? "animate-spin" : ""}`} />
                  {isChecking ? "Buscando..." : "Buscar Actualizaciones"}
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Progreso de descarga interactivo (cuando está descargando) */}
        {isDownloading && status?.downloadProgress && (
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/50 shadow-sm space-y-5 animate-in fade-in">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                  <HiDownload className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-bounce" />
                  Descarga del paquete de actualización
                </h4>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                  Obteniendo instalador oficial v{status?.updateInfo?.version || ""}
                </p>
              </div>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {pct}%
              </span>
            </div>

            {/* Barra de progreso unificada */}
            <div className="w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-zinc-700">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Transferido</span>
                <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">
                  {formatBytes(status.downloadProgress.transferred)} / {formatBytes(status.downloadProgress.total)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Velocidad</span>
                <span className="font-mono font-bold text-slate-700 dark:text-zinc-200">
                  {formatBytes(status.downloadProgress.bytesPerSecond)}/s
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Estado</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  En progreso
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. DETALLES DE LA VERSIÓN (NOTAS DE LANZAMIENTO / CHANGELOG) ── */}
      {status?.updateInfo?.releaseNotes && (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in">
          
          {/* Header de Notas */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/70 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                <HiStar className="w-4 h-4" />
              </div>
              <span className="font-black text-sm text-slate-800 dark:text-zinc-100 tracking-tight">
                Detalles y Notas de la Versión
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono border border-blue-500/20">
                v{status.updateInfo.version}
              </span>
            </div>

            {status.updateInfo.releaseDate && (
              <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 hidden sm:block">
                Publicado: {new Date(status.updateInfo.releaseDate).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
          </div>

          {/* Cuerpo Markdown */}
          <div className="p-6 max-h-[420px] overflow-y-auto">
            {typeof status.updateInfo.releaseNotes === "string" ? (
              <MarkdownRenderer content={status.updateInfo.releaseNotes} />
            ) : Array.isArray(status.updateInfo.releaseNotes) ? (
              <MarkdownRenderer content={status.updateInfo.releaseNotes.map(n => n.note || "").join("\n\n")} />
            ) : (
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 italic">
                Sin notas de versión detalladas
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
