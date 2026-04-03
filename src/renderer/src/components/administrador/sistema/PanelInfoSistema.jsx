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
import { HiRefresh, HiExclamationCircle } from "react-icons/hi";
import { useFeedback } from "../../../context/FeedbackContext";
import { formatSize, formatUptime } from "../../../utils/formatSystem";

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
      <div className="flex justify-center py-12">
        <Spinner label="Cargando información del sistema..." />
      </div>
    );
  }

  const running = serverStatus?.running;

  return (
    <div className="space-y-4">
      {/* Banner de error */}
      {errorCarga && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
          <HiExclamationCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorCarga}</span>
        </div>
      )}

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
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Actualizado: {lastUpdated.toLocaleTimeString("es-MX", { hour12: false })}
              </span>
            )}
            <Button
              size="sm"
              variant="flat"
              onPress={cargarInfo}
              isLoading={cargando}
              startContent={!cargando && <HiRefresh className="w-4 h-4" />}
            >
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardBody className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Puerto:</span>
            <span className="font-mono">{serverStatus?.port || "—"}</span>
          </div>
          <Divider />
          <div className="flex justify-between">
            <span className="text-gray-500">URL:</span>
            <span className="font-mono">http://localhost:{serverStatus?.port || "—"}</span>
          </div>
          <Divider />
          <div className="flex justify-between">
            <span className="text-gray-500">PID:</span>
            <span className="font-mono">{serverStatus?.pid || "—"}</span>
          </div>
          <Divider />
          <div className="flex justify-between">
            <span className="text-gray-500">Plataforma:</span>
            <span>{serverStatus?.platform || "—"}</span>
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
