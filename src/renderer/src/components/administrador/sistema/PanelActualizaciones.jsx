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
import { useFeedback } from "../../../context/FeedbackContext";
import { formatBytes } from "../../../utils/formatSystem";

export default function PanelActualizaciones() {
  const { setError } = useFeedback();
  const [status, setStatus] = useState(null);
  const [novedadMostrada, setNovedadMostrada] = useState(false);
  const [cargando, setCargando] = useState(true);
  const cleanupRef = useRef(null);

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
    cleanupRef.current = cleanup;
    return () => {
      if (cleanupRef.current) cleanupRef.current();
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
    setStatus((prev) => ({ ...prev, downloading: true }));
    try {
      await window.api.system.downloadUpdate();
    } catch (err) {
      setError("Error al descargar la actualización", "Actualizaciones");
      setStatus((prev) => ({ ...prev, downloading: false }));
    }
  };

  const instalar = async () => {
    try {
      await window.api.system.installUpdate();
    } catch (err) {
      setError("Error al instalar la actualización", "Actualizaciones");
    }
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
      {novedadMostrada && !status?.updateAvailable && (
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
