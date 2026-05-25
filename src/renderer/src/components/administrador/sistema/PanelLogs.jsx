import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { HiRefresh, HiTrash, HiSearch, HiX } from "react-icons/hi";
import { useFeedback } from "../../../context/FeedbackContext";

const NIVELES = [
  { key: "all",   label: "Todos",   bg: "bg-slate-100 dark:bg-zinc-800",   active: "bg-slate-700 dark:bg-zinc-200 text-white dark:text-zinc-900" },
  { key: "info",  label: "Info",    bg: "bg-blue-500/10",                  active: "bg-blue-600 text-white" },
  { key: "warn",  label: "Warning", bg: "bg-yellow-500/10",                active: "bg-yellow-500 text-white" },
  { key: "error", label: "Error",   bg: "bg-red-500/10",                   active: "bg-red-600 text-white" },
  { key: "debug", label: "Debug",   bg: "bg-purple-500/10",                active: "bg-purple-600 text-white" },
];

const COLORES_NIVEL = {
  info:  "text-blue-400",
  warn:  "text-yellow-400",
  error: "text-red-400",
  debug: "text-purple-400",
};

const BADGE_NIVEL = {
  info:  "bg-blue-500/15 text-blue-400",
  warn:  "bg-yellow-500/15 text-yellow-400",
  error: "bg-red-500/15 text-red-400",
  debug: "bg-purple-500/15 text-purple-400",
};

export default function PanelLogs() {
  const { setError } = useFeedback();
  const [logsRaw, setLogsRaw] = useState([]);
  const [filtroNivel, setFiltroNivel] = useState("all");
  const [filtroFuente, setFiltroFuente] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [confirmLimpiar, setConfirmLimpiar] = useState(false);
  const terminalRef = useRef(null);
  const cleanupRef = useRef(null);

  const cargarLogs = useCallback(async () => {
    try {
      setCargando(true);
      const result = await window.api.system.getLogs({ limit: 200 });
      if (result?.success) setLogsRaw(result.logs || []);
    } catch (err) {
      console.error("Error cargando logs:", err);
      setError("No se pudieron cargar los logs del sistema", "Logs");
    } finally {
      setCargando(false);
    }
  }, [setError]);

  useEffect(() => { cargarLogs(); }, [cargarLogs]);

  useEffect(() => {
    const cleanup = window.api.system.onLogEntry((entry) => {
      setLogsRaw((prev) => {
        const siguiente = [...prev, entry];
        if (siguiente.length > 500) siguiente.shift();
        return siguiente;
      });
    });
    cleanupRef.current = cleanup;
    return () => { if (cleanupRef.current) cleanupRef.current(); };
  }, []);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logsRaw, autoScroll]);

  const stats = useMemo(() => ({
    total: logsRaw.length,
    byLevel: {
      info:  logsRaw.filter((l) => l.level === "info").length,
      warn:  logsRaw.filter((l) => l.level === "warn").length,
      error: logsRaw.filter((l) => l.level === "error").length,
      debug: logsRaw.filter((l) => l.level === "debug").length,
    },
  }), [logsRaw]);

  const logsFiltrados = useMemo(() => {
    return logsRaw.filter((l) => {
      if (filtroNivel !== "all" && l.level !== filtroNivel) return false;
      if (filtroFuente && l.source && !l.source.toLowerCase().includes(filtroFuente.toLowerCase())) return false;
      if (busqueda && !l.message?.toLowerCase().includes(busqueda.toLowerCase())) return false;
      return true;
    });
  }, [logsRaw, filtroNivel, filtroFuente, busqueda]);

  const limpiarLogs = async () => {
    try {
      await window.api.system.clearLogs();
      setLogsRaw([]);
      setConfirmLimpiar(false);
    } catch (err) {
      console.error("Error limpiando logs:", err);
      setError("No se pudieron limpiar los logs", "Logs");
      setConfirmLimpiar(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString("es-MX", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
  };

  return (
    <div className="space-y-4">

      {/* ── BADGES DE STATS ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Total",    value: stats.total,          cls: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300" },
          { label: "Info",     value: stats.byLevel.info,   cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
          { label: "Warnings", value: stats.byLevel.warn,   cls: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
          { label: "Errores",  value: stats.byLevel.error,  cls: "bg-red-500/10 text-red-600 dark:text-red-400" },
          { label: "Debug",    value: stats.byLevel.debug,  cls: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
        ].map(({ label, value, cls }) => (
          <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cls}`}>
            {label}: {value}
          </span>
        ))}
      </div>

      {/* ── BARRA DE FILTROS ── */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
        {/* Filtros de nivel */}
        <div className="flex gap-1 flex-wrap">
          {NIVELES.map((n) => (
            <button
              key={n.key}
              type="button"
              onClick={() => setFiltroNivel(n.key)}
              className={`px-3 h-7 rounded-lg text-xs font-bold transition-colors ${
                filtroNivel === n.key
                  ? n.active
                  : `${n.bg} text-slate-600 dark:text-zinc-300 hover:opacity-80`
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-zinc-700 hidden sm:block" />

        {/* Búsqueda */}
        <div className="relative flex items-center">
          <HiSearch className="absolute left-3 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar en logs..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-8 pr-7 h-8 w-44 rounded-xl text-xs font-medium bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
              <HiX className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Fuente */}
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Fuente (api, auth...)"
            value={filtroFuente}
            onChange={(e) => setFiltroFuente(e.target.value)}
            className="pl-3 pr-7 h-8 w-36 rounded-xl text-xs font-medium bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
          {filtroFuente && (
            <button onClick={() => setFiltroFuente("")} className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
              <HiX className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Controles derecha */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Toggle auto-scroll */}
          <button
            type="button"
            onClick={() => setAutoScroll((v) => !v)}
            className={`flex items-center gap-2 px-3 h-8 rounded-xl text-xs font-bold transition-colors ${
              autoScroll
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
            }`}
          >
            <div className={`w-7 h-4 rounded-full relative transition-colors ${autoScroll ? "bg-blue-500" : "bg-slate-300 dark:bg-zinc-600"}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${autoScroll ? "translate-x-3.5" : "translate-x-0.5"}`} />
            </div>
            Auto-scroll
          </button>

          {/* Recargar */}
          <button
            type="button"
            title="Recargar logs"
            onClick={cargarLogs}
            disabled={cargando}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 disabled:opacity-50 transition-colors"
          >
            <HiRefresh className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`} />
          </button>

          {/* Limpiar con confirmación inline */}
          {confirmLimpiar ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-red-500">¿Confirmar?</span>
              <button onClick={limpiarLogs} className="px-2.5 h-7 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">
                Sí
              </button>
              <button onClick={() => setConfirmLimpiar(false)} className="px-2.5 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              title="Limpiar todos los logs"
              onClick={() => setConfirmLimpiar(true)}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors"
            >
              <HiTrash className="w-3.5 h-3.5" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── TERMINAL ── */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl overflow-hidden">
        {/* Barra de título estilo terminal */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Agua VP — Logs del Sistema ({logsFiltrados.length} entradas)
          </span>
        </div>

        {/* Líneas de log */}
        <div
          ref={terminalRef}
          className="font-mono text-xs leading-5 p-4 overflow-auto"
          style={{ maxHeight: "450px", minHeight: "300px" }}
        >
          {logsFiltrados.length === 0 ? (
            <p className="text-zinc-500 text-center py-10">
              {cargando ? "Cargando logs..." : "No hay logs que mostrar"}
            </p>
          ) : (
            logsFiltrados.map((log, i) => (
              <div key={log.id || i} className="flex gap-2 hover:bg-zinc-800/40 px-1 py-px rounded group">
                <span className="text-zinc-600 select-none shrink-0 group-hover:text-zinc-500">
                  {formatTime(log.timestamp)}
                </span>
                <span className={`shrink-0 uppercase font-bold w-12 text-center px-1 rounded text-[10px] ${BADGE_NIVEL[log.level] || "bg-zinc-800 text-zinc-400"}`}>
                  {log.level}
                </span>
                {log.source && (
                  <span className="text-cyan-400 shrink-0">[{log.source}]</span>
                )}
                <span className="text-zinc-200 break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
