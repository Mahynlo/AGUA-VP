import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip, Button } from "@nextui-org/react";
import { HiRefresh, HiLightningBolt, HiDownload } from "react-icons/hi";

export default function BotonActualizacionesNavbar() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // Cargar estado inicial
    const cargarEstado = async () => {
      try {
        if (window.api?.system?.getUpdateStatus) {
          const res = await window.api.system.getUpdateStatus();
          if (res?.success) setStatus(res);
        }
      } catch (err) {
        console.error("Error al obtener estado de actualización:", err);
      }
    };
    cargarEstado();

    // Escuchar eventos en vivo desde Electron
    let cleanup = null;
    if (window.api?.system?.onUpdateProgress) {
      cleanup = window.api.system.onUpdateProgress((data) => {
        switch (data.event) {
          case "update-available":
            setStatus((prev) => ({
              ...prev,
              updateAvailable: true,
              updateInfo: data.info,
              checking: false
            }));
            break;
          case "update-not-available":
            setStatus((prev) => ({
              ...prev,
              updateAvailable: false,
              checking: false
            }));
            break;
          case "update-downloaded":
            setStatus((prev) => ({
              ...prev,
              updateDownloaded: true,
              downloading: false
            }));
            break;
          case "download-progress":
            setStatus((prev) => ({
              ...prev,
              downloading: true,
              downloadProgress: data.progress
            }));
            break;
          case "error":
            setStatus((prev) => ({
              ...prev,
              checking: false,
              downloading: false,
              error: data.error
            }));
            break;
          default:
            break;
        }
      });
    }

    // Escuchar simulador de pruebas en desarrollo
    const handleTestEvent = (e) => {
      if (e.detail) {
        setStatus((prev) => ({
          ...prev,
          updateAvailable: true,
          updateInfo: e.detail,
          updateDownloaded: false,
          downloading: false
        }));
      }
    };

    const handleTestDownloaded = () => {
      setStatus((prev) => ({
        ...prev,
        updateDownloaded: true,
        downloading: false
      }));
    };

    const handleTestReset = () => {
      setStatus((prev) => ({
        ...prev,
        updateAvailable: false,
        updateDownloaded: false,
        downloading: false,
        updateInfo: null
      }));
    };

    document.addEventListener("test-update-modal", handleTestEvent);
    document.addEventListener("test-update-downloaded", handleTestDownloaded);
    document.addEventListener("test-update-reset", handleTestReset);

    return () => {
      if (cleanup) cleanup();
      document.removeEventListener("test-update-modal", handleTestEvent);
      document.removeEventListener("test-update-downloaded", handleTestDownloaded);
      document.removeEventListener("test-update-reset", handleTestReset);
    };
  }, []);

  const handleClick = () => {
    navigate("/actualizaciones");
  };

  const updateAvailable = status?.updateAvailable;
  const updateDownloaded = status?.updateDownloaded;
  const downloading = status?.downloading;

  let tooltipContent = "Centro de Actualizaciones";
  if (updateDownloaded) {
    tooltipContent = "¡Actualización lista para instalar! Haz clic aquí";
  } else if (downloading) {
    const pct = Math.round(status?.downloadProgress?.percent || 0);
    tooltipContent = `Descargando actualización (${pct}%)...`;
  } else if (updateAvailable) {
    const ver = status?.updateInfo?.version ? `v${status.updateInfo.version}` : "";
    tooltipContent = `¡Nueva versión ${ver} disponible! Haz clic para actualizar`;
  }

  return (
    <Tooltip content={tooltipContent} delay={500} color={updateAvailable || updateDownloaded ? "warning" : "foreground"}>
      <div className="relative inline-flex items-center">
        <Button
          onPress={handleClick}
          radius="full"
          variant="light"
          className={`relative text-white/90 hover:text-white transition-all ${
            updateAvailable || updateDownloaded
              ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 ring-2 ring-amber-400/50 animate-pulse"
              : ""
          }`}
          isIconOnly
          aria-label="Centro de Actualizaciones"
        >
          {updateDownloaded ? (
            <HiLightningBolt className="w-5 h-5 text-emerald-300" />
          ) : downloading ? (
            <HiDownload className="w-5 h-5 animate-bounce text-blue-300" />
          ) : (
            <HiRefresh className={`w-5 h-5 ${status?.checking ? "animate-spin" : ""}`} />
          )}
        </Button>

        {/* Punto / Badge de alerta si hay actualización */}
        {updateAvailable && !updateDownloaded && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border-2 border-blue-600"></span>
          </span>
        )}

        {/* Punto verde si está lista para reiniciar */}
        {updateDownloaded && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-blue-600"></span>
          </span>
        )}
      </div>
    </Tooltip>
  );
}
