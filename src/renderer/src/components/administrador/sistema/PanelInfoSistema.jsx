import { useState, useEffect, useCallback } from "react";
import { HiRefresh, HiExclamationCircle, HiServer, HiChip, HiClock, HiDatabase, HiShieldCheck } from "react-icons/hi";
import { useFeedback } from "../../../context/FeedbackContext";
import { formatSize, formatUptime } from "../../../utils/formatSystem";

const InfoRow = ({ label, value, mono = false }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-zinc-800/60 last:border-0">
    <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">{label}</span>
    <span className={`text-sm font-semibold text-slate-700 dark:text-zinc-200 ${mono ? "font-mono" : ""}`}>
      {value}
    </span>
  </div>
);

const StatCard = ({ label, value, sub, color = "blue" }) => {
  const colors = {
    blue:    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    red:     "bg-red-500/10 text-red-600 dark:text-red-400",
    slate:   "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  };
  return (
    <div className="flex flex-col items-center justify-center gap-1 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm text-center">
      <p className={`text-2xl font-black leading-none ${colors[color]}`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mt-1">{label}</p>
      {sub && <p className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">{sub}</p>}
    </div>
  );
};

export default function PanelInfoSistema() {
  const { setError } = useFeedback();
  const [serverStatus, setServerStatus] = useState(null);
  const [dbInfo, setDbInfo] = useState(null);
  const [appVersion, setAppVersion] = useState("—");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const cargarInfo = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga(null);
      const [statusResult, dbResult, versionResult] = await Promise.all([
        window.api.system.getServerStatus(),
        window.api.system.getDatabaseInfo(),
        window.api.getAppVersion(),
      ]);

      if (statusResult?.success) setServerStatus(statusResult);
      if (dbResult?.success) setDbInfo(dbResult.info);
      if (versionResult) setAppVersion(versionResult);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error cargando info:", err);
      setErrorCarga("No se pudo cargar la información del sistema.");
      setError("Error al cargar información del sistema", "Sistema");
    } finally {
      setCargando(false);
    }
  }, [setError]);

  useEffect(() => {
    cargarInfo();
    const interval = setInterval(cargarInfo, 30000);
    return () => clearInterval(interval);
  }, [cargarInfo]);

  if (cargando && !serverStatus) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-300/50 border-t-slate-600 dark:border-zinc-700/50 dark:border-t-zinc-400 animate-spin" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
          Cargando información del sistema...
        </span>
      </div>
    );
  }

  const running = serverStatus?.running;

  return (
    <div className="space-y-5 w-full">

      {/* Banner de error */}
      {errorCarga && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-200 dark:border-red-900/40 text-sm text-red-700 dark:text-red-300">
          <HiExclamationCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{errorCarga}</span>
        </div>
      )}

      {/* ── STATS RÁPIDAS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Servidor API"
          value={running ? "En ejecución" : "Detenido"}
          color={running ? "emerald" : "red"}
        />
        <StatCard
          label="Versión de la App"
          value={`v${appVersion || "—"}`}
          color="blue"
        />
        <StatCard
          label="Tiempo Activo"
          value={formatUptime(serverStatus?.uptime)}
          color="slate"
        />
      </div>

      {/* ── DETALLES DEL SERVIDOR ── */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <HiServer className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-200">Detalles del Servidor</h3>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                Actualizado: {lastUpdated.toLocaleTimeString("es-MX", { hour12: false })}
              </span>
            )}
            <button
              type="button"
              onClick={cargarInfo}
              disabled={cargando}
              className="inline-flex items-center gap-1.5 font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 disabled:opacity-50 rounded-xl px-4 h-8 transition-colors"
            >
              <HiRefresh className={`w-3.5 h-3.5 ${cargando ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>
        </div>
        <div className="px-6 py-2">
          <InfoRow label="Puerto" value={serverStatus?.port || "—"} mono />
          <InfoRow label="URL" value={`http://localhost:${serverStatus?.port || "—"}`} mono />
          <InfoRow label="PID" value={serverStatus?.pid || "—"} mono />
          <InfoRow label="Plataforma" value={serverStatus?.platform || "—"} />
        </div>
      </div>

      {/* ── BASE DE DATOS ── */}
      {dbInfo && (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 dark:border-zinc-800/60">
            <HiDatabase className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-200">Base de Datos</h3>
          </div>
          <div className="px-6 py-2">
            <InfoRow label="Tamaño" value={formatSize(dbInfo.size)} />
            <InfoRow label="Tablas" value={dbInfo.tables?.length || 0} />
            <InfoRow
              label="Total registros"
              value={(dbInfo.tables?.reduce((sum, t) => sum + (t.count || 0), 0) || 0).toLocaleString("es-MX")}
            />
            <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-zinc-800/60">
              <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">Integridad</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                dbInfo.integrityCheck === "ok"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}>
                <HiShieldCheck className="w-3.5 h-3.5" />
                {dbInfo.integrityCheck === "ok" ? "OK" : "Error"}
              </span>
            </div>
            <InfoRow label="Ruta" value={dbInfo.path || "—"} mono />
          </div>
        </div>
      )}
    </div>
  );
}
