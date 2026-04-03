/**
 * PanelLogs — Visor de logs en tiempo real estilo terminal
 *
 * Características:
 *  - Streaming en tiempo real desde LogManager
 *  - Filtros por nivel (info, warn, error, debug) — aplicados localmente
 *  - Filtro por fuente (api, auth, backup, update, etc.) — aplicado localmente
 *  - Búsqueda de texto — aplicada localmente
 *  - Auto-scroll con toggle
 *  - Limpiar logs
 *  - Stats calculadas del array local (se actualizan en tiempo real)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Card, CardBody, CardHeader,
  Button, Input, Chip, Switch,
  Tooltip, Divider
} from "@nextui-org/react";
import { HiRefresh, HiTrash } from "react-icons/hi";
import { useFeedback } from "../../../context/FeedbackContext";

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

export default function PanelLogs() {
  const { setError } = useFeedback();
  // logsRaw: fuente de verdad — todos los logs cargados + los de streaming
  const [logsRaw, setLogsRaw] = useState([]);
  const [filtroNivel, setFiltroNivel] = useState("all");
  const [filtroFuente, setFiltroFuente] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [confirmLimpiar, setConfirmLimpiar] = useState(false);
  const terminalRef = useRef(null);
  const cleanupRef = useRef(null);

  // Cargar logs iniciales sin filtros — el filtrado es local
  const cargarLogs = useCallback(async () => {
    try {
      setCargando(true);
      const result = await window.api.system.getLogs({ limit: 200 });
      if (result?.success) {
        setLogsRaw(result.logs || []);
      }
    } catch (err) {
      console.error("Error cargando logs:", err);
      setError("No se pudieron cargar los logs del sistema", "Logs");
    } finally {
      setCargando(false);
    }
  }, [setError]);

  useEffect(() => {
    cargarLogs();
  }, [cargarLogs]);

  // Suscribirse a logs en tiempo real
  useEffect(() => {
    const cleanup = window.api.system.onLogEntry((entry) => {
      setLogsRaw((prev) => {
        const siguiente = [...prev, entry];
        // Mantener máximo 500 en el visor
        if (siguiente.length > 500) siguiente.shift();
        return siguiente;
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
  }, [logsRaw, autoScroll]);

  // Stats calculadas localmente — siempre sincronizadas con logsRaw
  const stats = useMemo(() => ({
    total: logsRaw.length,
    byLevel: {
      info: logsRaw.filter((l) => l.level === "info").length,
      warn: logsRaw.filter((l) => l.level === "warn").length,
      error: logsRaw.filter((l) => l.level === "error").length,
      debug: logsRaw.filter((l) => l.level === "debug").length,
    },
  }), [logsRaw]);

  // Filtrado local — no hace IPC calls
  const logsFiltrados = useMemo(() => {
    return logsRaw.filter((l) => {
      if (filtroNivel !== "all" && l.level !== filtroNivel) return false;
      if (filtroFuente && l.source && !l.source.toLowerCase().includes(filtroFuente.toLowerCase())) return false;
      if (busqueda && !l.message?.toLowerCase().includes(busqueda.toLowerCase())) return false;
      return true;
    });
  }, [logsRaw, filtroNivel, filtroFuente, busqueda]);

  // Limpiar logs con confirmación inline
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
      {/* Estadísticas rápidas — calculadas del array local */}
      <div className="flex flex-wrap gap-2">
        <Chip size="sm" variant="flat" color="default">
          Total: {stats.total}
        </Chip>
        <Chip size="sm" variant="flat" color="primary">
          Info: {stats.byLevel.info}
        </Chip>
        <Chip size="sm" variant="flat" color="warning">
          Warnings: {stats.byLevel.warn}
        </Chip>
        <Chip size="sm" variant="flat" color="danger">
          Errors: {stats.byLevel.error}
        </Chip>
        <Chip size="sm" variant="flat" color="secondary">
          Debug: {stats.byLevel.debug}
        </Chip>
      </div>

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
              <Button
                size="sm"
                variant="flat"
                onPress={cargarLogs}
                isLoading={cargando}
                isIconOnly
              >
                <HiRefresh className="w-4 h-4" />
              </Button>
            </Tooltip>

            {confirmLimpiar ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-red-500 font-medium">¿Confirmar?</span>
                <Button size="sm" color="danger" onPress={limpiarLogs}>
                  Sí
                </Button>
                <Button size="sm" variant="flat" onPress={() => setConfirmLimpiar(false)}>
                  No
                </Button>
              </div>
            ) : (
              <Tooltip content="Limpiar todos los logs">
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  startContent={<HiTrash className="w-4 h-4" />}
                  onPress={() => setConfirmLimpiar(true)}
                >
                  Limpiar
                </Button>
              </Tooltip>
            )}
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
