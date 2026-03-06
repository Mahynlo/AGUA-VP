/**
 * PanelActualizaciones — Gestión de actualizaciones de la aplicación
 *
 * Características:
 *  - Ver versión actual
 *  - Verificar si hay actualización disponible
 *  - Descargar con barra de progreso
 *  - Instalar (crea backup automático)
 *  - Release notes
 */

import { useState, useEffect, useRef } from "react";
import {
  Card, CardBody, CardHeader,
  Button, Chip, Progress, Divider, Spinner
} from "@nextui-org/react";

export default function PanelActualizaciones() {
  const [status, setStatus] = useState(null);
  const [evento, setEvento] = useState(null); // último evento recibido
  const [cargando, setCargando] = useState(true);
  const cleanupRef = useRef(null);

  // Cargar estado inicial
  useEffect(() => {
    const cargar = async () => {
      try {
        const result = await window.api.system.getUpdateStatus();
        if (result.success) setStatus(result);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  // Suscribirse a eventos de actualización
  useEffect(() => {
    const cleanup = window.api.system.onUpdateProgress((data) => {
      setEvento(data);

      // Actualizar estado local según el evento
      if (data.event === "update-available") {
        setStatus((prev) => ({
          ...prev,
          updateAvailable: true,
          updateInfo: data.info,
        }));
      }
      if (data.event === "update-not-available") {
        setStatus((prev) => ({
          ...prev,
          updateAvailable: false,
          checking: false,
        }));
      }
      if (data.event === "update-downloaded") {
        setStatus((prev) => ({
          ...prev,
          updateDownloaded: true,
          downloading: false,
        }));
      }
      if (data.event === "download-progress") {
        setStatus((prev) => ({
          ...prev,
          downloading: true,
          downloadProgress: data.progress,
        }));
      }
      if (data.event === "error") {
        setStatus((prev) => ({
          ...prev,
          checking: false,
          downloading: false,
          error: data.error,
        }));
      }
    });
    cleanupRef.current = cleanup;

    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  // Acciones
  const verificar = async () => {
    setEvento(null);
    setStatus((prev) => ({ ...prev, checking: true, error: null }));
    await window.api.system.checkForUpdates();
  };

  const descargar = async () => {
    setStatus((prev) => ({ ...prev, downloading: true }));
    await window.api.system.downloadUpdate();
  };

  const instalar = async () => {
    await window.api.system.installUpdate();
  };

  // Formatear bytes
  const formatBytes = (b) => {
    if (!b) return "—";
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Cargando estado de actualizaciones..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Versión actual */}
      <Card>
        <CardBody className="flex flex-row items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-500">Versión actual</p>
            <p className="text-2xl font-bold text-primary">
              v{status?.currentVersion || "—"}
            </p>
          </div>
          {status?.lastCheck && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Última verificación</p>
              <p className="text-sm">
                {new Date(status.lastCheck).toLocaleString("es-MX")}
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Acciones principales */}
      <div className="flex gap-3">
        {!status?.updateAvailable && !status?.updateDownloaded && (
          <Button
            color="primary"
            onPress={verificar}
            isLoading={status?.checking}
          >
            {status?.checking ? "Verificando..." : "Verificar Actualizaciones"}
          </Button>
        )}

        {status?.updateAvailable && !status?.updateDownloaded && !status?.downloading && (
          <Button color="success" onPress={descargar}>
            Descargar v{status?.updateInfo?.version}
          </Button>
        )}

        {status?.updateDownloaded && (
          <Button color="warning" onPress={instalar}>
            Instalar y Reiniciar
          </Button>
        )}
      </div>

      {/* Error */}
      {status?.error && (
        <Card className="border-danger border">
          <CardBody>
            <p className="text-sm text-danger font-semibold">Error:</p>
            <p className="text-sm text-danger">{status.error}</p>
          </CardBody>
        </Card>
      )}

      {/* Progreso de descarga */}
      {status?.downloading && status?.downloadProgress && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Descargando actualización...</h3>
          </CardHeader>
          <CardBody className="space-y-2">
            <Progress
              aria-label="Progreso de descarga"
              value={status.downloadProgress.percent || 0}
              color="primary"
              showValueLabel
              className="max-w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {formatBytes(status.downloadProgress.transferred)} / {formatBytes(status.downloadProgress.total)}
              </span>
              <span>
                {formatBytes(status.downloadProgress.bytesPerSecond)}/s
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Info de actualización disponible */}
      {status?.updateInfo && status?.updateAvailable && (
        <Card className="border-primary border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Chip color="primary" variant="solid" size="sm">
                Nueva versión
              </Chip>
              <span className="font-bold">v{status.updateInfo.version}</span>
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            {status.updateInfo.releaseDate && (
              <p className="text-sm text-gray-500">
                Publicada: {new Date(status.updateInfo.releaseDate).toLocaleDateString("es-MX")}
              </p>
            )}
            <Divider />
            <div>
              <p className="text-sm font-semibold mb-1">Notas de versión:</p>
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-[200px] overflow-auto whitespace-pre-wrap">
                {status.updateInfo.releaseNotes || "Sin notas de versión"}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Actualización descargada — lista para instalar */}
      {status?.updateDownloaded && (
        <Card className="border-warning border">
          <CardBody>
            <div className="flex items-center gap-3">
              <Chip color="warning" variant="flat">Descargada</Chip>
              <p className="text-sm">
                La actualización está lista para instalar. Se creará un <strong>backup automático</strong> de la base de datos antes de reiniciar.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Sin actualización disponible */}
      {evento?.event === "update-not-available" && !status?.updateAvailable && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Chip color="success" variant="flat">Al día</Chip>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tu aplicación está actualizada. No hay nuevas versiones disponibles.
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
