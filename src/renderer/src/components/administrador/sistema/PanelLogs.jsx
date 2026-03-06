/**
 * PanelLogs — Visor de logs en tiempo real estilo terminal
 *
 * Características:
 *  - Streaming en tiempo real desde LogManager
 *  - Filtros por nivel (info, warn, error, debug)
 *  - Filtro por fuente (api, auth, backup, update, etc.)
 *  - Búsqueda de texto
 *  - Auto-scroll con toggle
 *  - Limpiar logs
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card, CardBody, CardHeader,
  Button, Input, Chip, Switch,
  Select, SelectItem, Tooltip,
  Divider
} from "@nextui-org/react";

const NIVELES = [
  { key: "all", label: "Todos", color: "default" },
  { key: "info", label: "Info", color: "primary" },
  { key: "warn", label: "Warning", color: "warning" },
  { key: "error", label: "Error", color: "danger" },
  { key: "debug", label: "Debug", color: "secondary" },
];

const COLORES_NIVEL = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  debug: "text-gray-400",
};

const BADGE_NIVEL = {
  info: "bg-blue-500/20 text-blue-400",
  warn: "bg-yellow-500/20 text-yellow-400",
  error: "bg-red-500/20 text-red-400",
  debug: "bg-gray-500/20 text-gray-400",
};

export default function PanelLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [filtroNivel, setFiltroNivel] = useState("all");
  const [filtroFuente, setFiltroFuente] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [cargando, setCargando] = useState(true);
  const terminalRef = useRef(null);
  const cleanupRef = useRef(null);

  // Cargar logs iniciales
  const cargarLogs = useCallback(async () => {
    try {
      setCargando(true);
      const options = { limit: 200 };
      if (filtroNivel !== "all") options.level = filtroNivel;
      if (filtroFuente) options.source = filtroFuente;
      if (busqueda) options.search = busqueda;

      const result = await window.api.system.getLogs(options);
      if (result.success) {
        setLogs(result.logs || []);
      }

      const statsResult = await window.api.system.getLogStats();
      if (statsResult.success) {
        setStats(statsResult.stats);
      }
    } catch (err) {
      console.error("Error cargando logs:", err);
    } finally {
      setCargando(false);
    }
  }, [filtroNivel, filtroFuente, busqueda]);

  useEffect(() => {
    cargarLogs();
  }, [cargarLogs]);

  // Suscribirse a logs en tiempo real
  useEffect(() => {
    const cleanup = window.api.system.onLogEntry((entry) => {
      setLogs((prev) => {
        const nuevoLogs = [...prev, entry];
        // Mantener máximo 500 en el visor
        if (nuevoLogs.length > 500) nuevoLogs.shift();
        return nuevoLogs;
      });
    });
    cleanupRef.current = cleanup;

    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Limpiar logs
  const limpiarLogs = async () => {
    await window.api.system.clearLogs();
    setLogs([]);
  };

  // Formatear timestamp
  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString("es-MX", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
  };

  // Filtrar logs localmente (para fuente y búsqueda si el streaming trae todo)
  const logsFiltrados = logs.filter((l) => {
    if (filtroNivel !== "all" && l.level !== filtroNivel) return false;
    if (filtroFuente && l.source && !l.source.includes(filtroFuente)) return false;
    if (busqueda && !l.message?.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Estadísticas rápidas */}
      {stats && (
        <div className="flex flex-wrap gap-2">
          <Chip size="sm" variant="flat" color="default">
            Total: {stats.total}
          </Chip>
          <Chip size="sm" variant="flat" color="primary">
            Info: {stats.byLevel?.info || 0}
          </Chip>
          <Chip size="sm" variant="flat" color="warning">
            Warnings: {stats.byLevel?.warn || 0}
          </Chip>
          <Chip size="sm" variant="flat" color="danger">
            Errors: {stats.byLevel?.error || 0}
          </Chip>
          <Chip size="sm" variant="flat" color="secondary">
            Debug: {stats.byLevel?.debug || 0}
          </Chip>
        </div>
      )}

      {/* Barra de filtros */}
      <Card>
        <CardBody className="flex flex-row flex-wrap items-center gap-3 py-2">
          <div className="flex gap-1">
            {NIVELES.map((n) => (
              <Button
                key={n.key}
                size="sm"
                variant={filtroNivel === n.key ? "solid" : "flat"}
                color={n.color}
                onPress={() => setFiltroNivel(n.key)}
              >
                {n.label}
              </Button>
            ))}
          </div>

          <Divider orientation="vertical" className="h-6" />

          <Input
            size="sm"
            placeholder="Buscar en logs..."
            className="max-w-[200px]"
            value={busqueda}
            onValueChange={setBusqueda}
            isClearable
            onClear={() => setBusqueda("")}
          />

          <Input
            size="sm"
            placeholder="Fuente (api, auth...)"
            className="max-w-[150px]"
            value={filtroFuente}
            onValueChange={setFiltroFuente}
            isClearable
            onClear={() => setFiltroFuente("")}
          />

          <div className="flex items-center gap-2 ml-auto">
            <Switch
              size="sm"
              isSelected={autoScroll}
              onValueChange={setAutoScroll}
            >
              <span className="text-xs">Auto-scroll</span>
            </Switch>

            <Tooltip content="Recargar logs">
              <Button size="sm" variant="flat" onPress={cargarLogs} isLoading={cargando}>
                ↻
              </Button>
            </Tooltip>

            <Tooltip content="Limpiar todos los logs">
              <Button size="sm" variant="flat" color="danger" onPress={limpiarLogs}>
                Limpiar
              </Button>
            </Tooltip>
          </div>
        </CardBody>
      </Card>

      {/* Terminal de logs */}
      <Card className="bg-gray-950 border border-gray-700">
        <CardHeader className="pb-1 pt-2 px-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs text-gray-400 ml-2">
              Agua VP — Logs del Sistema ({logsFiltrados.length} entradas)
            </span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div
            ref={terminalRef}
            className="font-mono text-xs leading-5 p-3 overflow-auto"
            style={{ maxHeight: "450px", minHeight: "300px" }}
          >
            {logsFiltrados.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {cargando ? "Cargando logs..." : "No hay logs que mostrar"}
              </p>
            ) : (
              logsFiltrados.map((log, i) => (
                <div key={log.id || i} className="flex gap-2 hover:bg-gray-800/50 px-1 rounded">
                  <span className="text-gray-500 select-none shrink-0">
                    {formatTime(log.timestamp)}
                  </span>
                  <span className={`shrink-0 uppercase font-bold w-12 text-center ${COLORES_NIVEL[log.level] || "text-gray-400"}`}>
                    {log.level}
                  </span>
                  {log.source && (
                    <span className="text-cyan-400 shrink-0">[{log.source}]</span>
                  )}
                  <span className="text-gray-200 break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
