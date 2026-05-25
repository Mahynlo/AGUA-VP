import { useState, useEffect, useCallback } from "react";
import { HiRefresh, HiExclamationCircle, HiDatabase, HiTable, HiShieldCheck, HiKey } from "react-icons/hi";
import { useFeedback } from "../../../context/FeedbackContext";
import { formatSize, formatDateFromTimestamp } from "../../../utils/formatSystem";

const InfoRow = ({ label, value, mono = false }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-zinc-800/60 last:border-0">
    <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">{label}</span>
    <span className={`text-sm font-semibold text-slate-700 dark:text-zinc-200 max-w-[60%] truncate text-right ${mono ? "font-mono text-xs" : ""}`}>
      {value}
    </span>
  </div>
);

const StatCard = ({ label, value, color = "blue", icon: Icon }) => {
  const colors = {
    blue:    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    red:     "bg-red-500/10 text-red-600 dark:text-red-400",
    yellow:  "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  };
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm text-center">
      {Icon && <Icon className={`w-5 h-5 ${colors[color]}`} />}
      <p className={`text-2xl font-black leading-none ${colors[color]}`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">{label}</p>
    </div>
  );
};

const SUB_TABS = [
  { key: "info",        label: "Información" },
  { key: "migraciones", label: (migrations) => `Migraciones (${migrations.length})` },
];

export default function PanelBaseDatos() {
  const { setError } = useFeedback();
  const [dbInfo, setDbInfo] = useState(null);
  const [migrations, setMigrations] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [subTab, setSubTab] = useState("info");

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga(null);
      const [infoResult, migResult] = await Promise.all([
        window.api.system.getDatabaseInfo(),
        window.api.system.getMigrations(),
      ]);
      if (infoResult?.success) setDbInfo(infoResult.info);
      if (migResult?.success) setMigrations(migResult.migrations || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error cargando info BD:", err);
      setErrorCarga("No se pudo cargar la información de la base de datos.");
      setError("Error al cargar información de la base de datos", "Base de Datos");
    } finally {
      setCargando(false);
    }
  }, [setError]);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 60000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  if (cargando && !dbInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-300/50 border-t-slate-600 dark:border-zinc-700/50 dark:border-t-zinc-400 animate-spin" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
          Cargando información de la base de datos...
        </span>
      </div>
    );
  }

  const fkOk = (dbInfo?.foreignKeyCheck?.length ?? 0) === 0;

  return (
    <div className="space-y-5 w-full">

      {/* Banner de error */}
      {errorCarga && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-200 dark:border-red-900/40 text-sm text-red-700 dark:text-red-300">
          <HiExclamationCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{errorCarga}</span>
        </div>
      )}

      {/* ── SUB-TABS ── */}
      <div className="flex gap-0 border-b border-slate-200 dark:border-zinc-800">
        {SUB_TABS.map(({ key, label }) => {
          const title = typeof label === "function" ? label(migrations) : label;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSubTab(key)}
              className={`px-4 h-10 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none ${
                subTab === key
                  ? "border-slate-800 dark:border-zinc-200 text-slate-800 dark:text-zinc-100 font-bold"
                  : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300"
              }`}
            >
              {title}
            </button>
          );
        })}
      </div>

      {/* ── TAB: INFORMACIÓN ── */}
      {subTab === "info" && (
        <div className="space-y-5">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Tamaño DB"
              value={formatSize(dbInfo?.size)}
              color="blue"
              icon={HiDatabase}
            />
            <StatCard
              label="Tablas"
              value={dbInfo?.tables?.length || 0}
              color="blue"
              icon={HiTable}
            />
            <StatCard
              label="Integridad"
              value={dbInfo?.integrityCheck === "ok" ? "✓ OK" : "✗ Error"}
              color={dbInfo?.integrityCheck === "ok" ? "emerald" : "red"}
              icon={HiShieldCheck}
            />
            <StatCard
              label="Foreign Keys"
              value={fkOk ? "✓ OK" : `${dbInfo?.foreignKeyCheck?.length} errores`}
              color={fkOk ? "emerald" : "yellow"}
              icon={HiKey}
            />
          </div>

          {/* Detalles técnicos */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800/60">
              <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-200">Detalles Técnicos</h3>
            </div>
            <div className="px-6 py-2">
              <InfoRow label="Ruta" value={dbInfo?.path || "—"} mono />
              <InfoRow
                label="Última modificación"
                value={dbInfo?.lastModified ? new Date(dbInfo.lastModified).toLocaleString("es-MX") : "—"}
              />
              <InfoRow label="WAL Size" value={formatSize(dbInfo?.walSize)} />
            </div>
          </div>

          {/* Tabla de tablas con botón actualizar */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800/60">
              <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                Tablas ({dbInfo?.tables?.length || 0})
              </h3>
              <div className="flex items-center gap-3">
                {lastUpdated && (
                  <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                    Actualizado: {lastUpdated.toLocaleTimeString("es-MX", { hour12: false })}
                  </span>
                )}
                <button
                  type="button"
                  onClick={cargarDatos}
                  disabled={cargando}
                  className="inline-flex items-center gap-1.5 font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 disabled:opacity-50 rounded-xl px-4 h-8 transition-colors"
                >
                  <HiRefresh className={`w-3.5 h-3.5 ${cargando ? "animate-spin" : ""}`} />
                  Actualizar
                </button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800">
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Tabla</th>
                  <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Registros</th>
                </tr>
              </thead>
              <tbody>
                {(dbInfo?.tables || []).map((t) => (
                  <tr key={t.name} className="border-b border-slate-50 dark:border-zinc-800/40 last:border-0 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-2.5">
                      <span className="font-mono text-sm font-semibold text-slate-700 dark:text-zinc-200">{t.name}</span>
                    </td>
                    <td className="px-6 py-2.5 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                        {t.count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: MIGRACIONES ── */}
      {subTab === "migraciones" && (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          {migrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
              <p className="font-bold text-slate-700 dark:text-zinc-300">Sin registros de migraciones</p>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">No se encontraron migraciones aplicadas.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800">
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">#</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Hash</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Fecha de creación</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Estado</th>
                </tr>
              </thead>
              <tbody>
                {migrations.map((m, i) => (
                  <tr key={m.id || i} className="border-b border-slate-50 dark:border-zinc-800/40 last:border-0 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-3">
                      <span className="text-slate-500 dark:text-zinc-400 font-mono text-xs">{i + 1}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-mono text-xs text-slate-600 dark:text-zinc-300">
                        {m.hash?.substring(0, 16)}...
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-medium text-slate-600 dark:text-zinc-300">{formatDateFromTimestamp(m.created_at)}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        ✓ Aplicada
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
