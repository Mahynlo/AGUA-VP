import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Modal, Checkbox } from "flowbite-react";
import { HiLightningBolt, HiOutlineChevronRight, HiX } from "react-icons/hi";

export default function ModalActualizacionDisponible() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [noMostrar, setNoMostrar] = useState(false);

  useEffect(() => {
    // 1. Obtener estado inicial al montar
    const verificarEstadoInicial = async () => {
      try {
        if (window.api?.system?.getUpdateStatus) {
          const status = await window.api.system.getUpdateStatus();
          if (status?.success && status.updateAvailable && status.updateInfo) {
            evaluarMostrarModal(status.updateInfo);
          }
        }
      } catch (err) {
        console.error("Error verificando estado inicial de updates:", err);
      }
    };

    // 2. Suscribirse a eventos push en tiempo real de Electron
    let cleanup = null;
    if (window.api?.system?.onUpdateProgress) {
      cleanup = window.api.system.onUpdateProgress((data) => {
        if (data.event === "update-available" && data.info) {
          evaluarMostrarModal(data.info);
        }
      });
    }

    // 3. Suscribirse a eventos de prueba local (Simulador)
    const handleTestEvent = (e) => {
      if (e.detail) {
        setUpdateInfo(e.detail);
        setNoMostrar(false);
        setIsOpen(true);
      }
    };

    const handleTestReset = () => {
      setIsOpen(false);
      setUpdateInfo(null);
    };

    verificarEstadoInicial();
    document.addEventListener("test-update-modal", handleTestEvent);
    document.addEventListener("test-update-reset", handleTestReset);

    return () => {
      if (cleanup) cleanup();
      document.removeEventListener("test-update-modal", handleTestEvent);
      document.removeEventListener("test-update-reset", handleTestReset);
    };
  }, [location.pathname]);

  const evaluarMostrarModal = (info) => {
    const version = info.version;
    const omitido = localStorage.getItem(`omitir_alertas_update_v${version}`) === "true";
    
    // No interrumpir si estamos en pantallas críticas de impresión o ventana de ayuda
    const enRutaAuxiliar = 
      location.pathname === "/ayuda" ||
      location.pathname.includes("/recibo") || 
      location.pathname.includes("/reporte") ||
      location.pathname.includes("/comprobante");

    if (!omitido && !enRutaAuxiliar) {
      setUpdateInfo(info);
      setNoMostrar(false);
      setIsOpen(true);
    }
  };

  const handleCerrar = () => {
    if (noMostrar && updateInfo) {
      localStorage.setItem(`omitir_alertas_update_v${updateInfo.version}`, "true");
    }
    setIsOpen(false);
  };

  const handleIrAActualizar = () => {
    if (noMostrar && updateInfo) {
      localStorage.setItem(`omitir_alertas_update_v${updateInfo.version}`, "true");
    }
    setIsOpen(false);
    navigate("/actualizaciones");
  };

  if (!updateInfo) return null;

  return (
    <Modal 
      show={isOpen} 
      onClose={handleCerrar}
      size="md"
      popup
      theme={{
        root: {
          show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" }
        },
        content: {
          base: "relative h-full w-full p-4 md:h-auto",
          inner: "relative rounded-3xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800"
        }
      }}
    >
      <div className="relative p-6 sm:p-7">
        
        {/* Botón de cierre manual */}
        <button 
          onClick={handleCerrar}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
          title="Cerrar aviso"
        >
          <HiX className="w-5 h-5" />
        </button>

        {/* Cabecera */}
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-4 mb-5">
          <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400">
            <HiLightningBolt className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
              Actualización Disponible
            </h3>
            <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
              Nueva versión: <span className="text-blue-600 dark:text-blue-400 font-extrabold font-mono">v{updateInfo.version}</span>
            </p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="space-y-4 mb-6">
          <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 leading-relaxed">
            Hay una nueva versión de la aplicación disponible con mejoras y optimizaciones. ¿Quieres ver las novedades y realizar la actualización ahora?
          </p>
        </div>

        {/* Checkbox y Botones */}
        <div className="bg-slate-50/50 dark:bg-zinc-900/10 rounded-2xl border border-slate-100 dark:border-zinc-800/50 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="no-notificar-chk"
              checked={noMostrar} 
              onChange={(e) => setNoMostrar(e.target.checked)}
              className="w-4.5 h-4.5 rounded border-slate-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
            />
            <label 
              htmlFor="no-notificar-chk" 
              className="text-xs font-bold text-slate-500 dark:text-zinc-400 select-none cursor-pointer"
            >
              No volver a notificar para la v{updateInfo.version}
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800/50">
            <button 
              onClick={handleCerrar}
              className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-4 h-10 text-xs transition-colors"
            >
              Más tarde
            </button>
            <button 
              onClick={handleIrAActualizar}
              className="font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 h-10 text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Actualizar Ahora</span>
              <HiOutlineChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
