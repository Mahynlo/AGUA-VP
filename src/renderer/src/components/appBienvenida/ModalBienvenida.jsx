// src/components/appBienvenida/ModalBienvenida.jsx
import { useAuthApp } from '../../context/appAuthContext';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";
import { HiOutlineDesktopComputer, HiCheck, HiExclamationCircle } from "react-icons/hi";
import { useState } from "react";

const ModalBienvenida = () => {
  const { modalAbierto, registrarApp, error } = useAuthApp(); 
  const [isRegistering, setIsRegistering] = useState(false);

  // Si el modal no está abierto, no renderizamos nada
  if (!modalAbierto) return null; 

  const handleRegistrar = async () => {
    setIsRegistering(true);
    try {
      await registrarApp();
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Modal 
      isOpen={modalAbierto} 
      hideCloseButton={true} // Obligamos al usuario a interactuar con el botón
      isDismissable={false} // No se cierra al dar clic afuera
      isKeyboardDismissDisabled={true} // No se cierra con ESC
      placement="center"
      backdrop="opaque"
      classNames={{
        wrapper: "z-[100000] pt-16",
        base: "bg-white dark:bg-zinc-950 shadow-2xl rounded-[2rem] border border-slate-200 dark:border-zinc-800 overflow-hidden",
        backdrop: "bg-slate-900/80 dark:bg-black/80 z-[99999] top-16",
        header: "border-b border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/50 px-6 sm:px-8 py-5 shrink-0",
        body: "py-8 px-6 sm:px-8 bg-slate-50/50 dark:bg-black/10",
        footer: "border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/50 px-6 sm:px-8 py-4",
      }}
    >
      <ModalContent>
        {() => (
          <>
            {/* ── HEADER ── */}
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                  <HiOutlineDesktopComputer className="w-7 h-7" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                    ¡Bienvenido al Sistema!
                  </h2>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                    Configuración Inicial
                  </p>
                </div>
              </div>
            </ModalHeader>

            {/* ── BODY ── */}
            <ModalBody>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-2">
                  <HiOutlineDesktopComputer className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                  Nuevo equipo detectado
                </h3>
                
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 leading-relaxed max-w-sm">
                  Esta es la primera vez que utilizas la aplicación en esta computadora. Para garantizar la seguridad del sistema, necesitamos registrar este equipo antes de continuar.
                </p>
              </div>

              {/* Mensaje de Error Estilizado */}
              {error && (
                <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl">
                  <HiExclamationCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}
            </ModalBody>

            {/* ── FOOTER ── */}
            <ModalFooter className="flex justify-center sm:justify-end">
              <Button
                color="primary"
                onPress={handleRegistrar}
                isLoading={isRegistering}
                startContent={!isRegistering && <HiCheck className="text-lg" />}
                className="w-full sm:w-auto h-12 px-8 font-bold shadow-lg shadow-blue-500/30 text-white rounded-xl"
              >
                {isRegistering ? "Registrando equipo..." : "Registrar y Continuar"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModalBienvenida;

