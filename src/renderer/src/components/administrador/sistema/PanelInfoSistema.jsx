/**
 * PanelInfoSistema — Información general del sistema y estado del servidor
 *
 * Muestra: versión, uptime, rutas, estado del servidor API, uso de disco
 */

import { useState, useEffect, useCallback } from "react";
import {
  Card, CardBody, CardHeader,
  Chip, Spinner, Button, Divider
} from "@nextui-org/react";

export default function PanelInfoSistema() {
  const [serverStatus, setServerStatus] = useState(null);
  const [dbInfo, setDbInfo] = useState(null);
  const [appVersion, setAppVersion] = useState("—");
  const [cargando, setCargando] = useState(true);

  const cargarInfo = useCallback(async () => {
    try {
      setCargando(true);
      const [statusResult, dbResult, versionResult] = await Promise.all([
        window.api.system.getServerStatus(),
        window.api.system.getDatabaseInfo(),
        window.api.getAppVersion(),
      ]);

      if (statusResult.success) setServerStatus(statusResult);
      if (dbResult.success) setDbInfo(dbResult.info);
      if (versionResult) setAppVersion(versionResult);
    } catch (err) {
      console.error("Error cargando info:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarInfo();
    // Refrescar cada 30 segundos
    const interval = setInterval(cargarInfo, 30000);
    return () => clearInterval(interval);
  }, [cargarInfo]);

  const formatUptime = (seconds) => {
    if (!seconds) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Cargando información del sistema..." />
      </div>
    );
  }

  const running = serverStatus?.running;

  return (
    <div className="space-y-4">
      {/* Estado del servidor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardBody className="text-center py-4">
            <Chip
              size="lg"
              color={running ? "success" : "danger"}
              variant="dot"
              className="mb-1"
            >
              {running ? "En ejecución" : "Detenido"}
            </Chip>
            <p className="text-xs text-gray-500 mt-1">Servidor API</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-primary">
              v{appVersion || "—"}
            </p>
            <p className="text-xs text-gray-500">Versión de la App</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-primary">
              {formatUptime(serverStatus?.uptime)}
            </p>
            <p className="text-xs text-gray-500">Tiempo activo</p>
          </CardBody>
        </Card>
      </div>

      {/* Detalles del servidor */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Detalles del Servidor</h3>
          <Button size="sm" variant="flat" onPress={cargarInfo}>
            Actualizar
          </Button>
        </CardHeader>
        <CardBody className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Puerto:</span>
            <span className="font-mono">{serverStatus?.port || "—"}</span>
          </div>
          <Divider />
          <div className="flex justify-between">
            <span className="text-gray-500">URL:</span>
            <span className="font-mono">http://localhost:{serverStatus?.port || "3000"}</span>
          </div>
          <Divider />
          <div className="flex justify-between">
            <span className="text-gray-500">PID:</span>
            <span className="font-mono">{serverStatus?.pid || "—"}</span>
          </div>
          <Divider />
          <div className="flex justify-between">
            <span className="text-gray-500">Plataforma:</span>
            <span>{serverStatus?.platform || "Windows"}</span>
          </div>
        </CardBody>
      </Card>

      {/* Estado de la base de datos */}
      {dbInfo && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Base de Datos</h3>
          </CardHeader>
          <CardBody className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Tamaño:</span>
              <span className="font-bold">{formatSize(dbInfo.size)}</span>
            </div>
            <Divider />
            <div className="flex justify-between">
              <span className="text-gray-500">Tablas:</span>
              <span>{dbInfo.tables?.length || 0}</span>
            </div>
            <Divider />
            <div className="flex justify-between">
              <span className="text-gray-500">Total registros:</span>
              <span>
                {dbInfo.tables?.reduce((sum, t) => sum + (t.count || 0), 0) || 0}
              </span>
            </div>
            <Divider />
            <div className="flex justify-between">
              <span className="text-gray-500">Integridad:</span>
              <Chip
                size="sm"
                color={dbInfo.integrityCheck === "ok" ? "success" : "danger"}
                variant="flat"
              >
                {dbInfo.integrityCheck === "ok" ? "OK" : "Error"}
              </Chip>
            </div>
            <Divider />
            <div className="flex justify-between">
              <span className="text-gray-500">Ruta:</span>
              <span className="font-mono text-xs truncate max-w-[350px]">
                {dbInfo.path || "—"}
              </span>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
