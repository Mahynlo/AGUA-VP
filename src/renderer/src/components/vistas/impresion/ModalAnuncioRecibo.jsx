import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Progress
} from "@nextui-org/react";
import { HiSpeakerphone, HiRefresh, HiCheck, HiPencilAlt, HiInformationCircle } from "react-icons/hi";

// Componente de Textarea Personalizado (Premium UI adaptado a Token 4)
const CustomTextarea = ({ label, value, onChange, icon, description, minRows = 3, maxLength }) => {
    return (
        <div className="w-full">
            {label && (
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}
            <div className="relative w-full flex items-start">
                <span className="absolute left-3 top-3.5 text-slate-400 dark:text-zinc-500 flex items-center justify-center">
                    {icon}
                </span>
                <textarea
                    value={value}
                    onChange={onChange}
                    rows={minRows}
                    maxLength={maxLength}
                    placeholder="Escribe el anuncio aquí..."
                    className="w-full pl-10 pr-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 resize-none bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-100 shadow-none"
                />
            </div>
            {description && <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5 ml-1">{description}</p>}
        </div>
    );
};

const ModalAnuncioRecibo = ({ isOpen, onClose, onSave }) => {
  const [anuncio, setAnuncio] = useState('');
  const [caracteresRestantes, setCaracteresRestantes] = useState(150);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const MENSAJE_POR_DEFECTO = "Cuidemos el agua para las futuras generaciones. Reporte cualquier fuga o problema en su medidor al teléfono de la oficina municipal.";
  const MAX_CARACTERES = 150;

  useEffect(() => {
    if (isOpen) {
      const anuncioGuardado = localStorage.getItem('anuncio_recibo');
      const mensajeInicial = anuncioGuardado || MENSAJE_POR_DEFECTO;
      setAnuncio(mensajeInicial);
      setCaracteresRestantes(MAX_CARACTERES - mensajeInicial.length);
      setHasChanges(false);
    }
  }, [isOpen]);

  const handleAnuncioChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_CARACTERES) {
      setAnuncio(value);
      setCaracteresRestantes(MAX_CARACTERES - value.length);
      setHasChanges(true);
    }
  };

  const handleGuardar = async () => {
    setIsLoading(true);
    try {
      const anuncioFinal = anuncio.trim() || MENSAJE_POR_DEFECTO;
      localStorage.setItem('anuncio_recibo', anuncioFinal);
      onSave(anuncioFinal);
      setHasChanges(false);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestaurarDefecto = () => {
    setAnuncio(MENSAJE_POR_DEFECTO);
    setCaracteresRestantes(MAX_CARACTERES - MENSAJE_POR_DEFECTO.length);
    setHasChanges(true);
  };

  const handleCancelar = () => {
    const anuncioGuardado = localStorage.getItem('anuncio_recibo');
    const mensajeInicial = anuncioGuardado || MENSAJE_POR_DEFECTO;
    setAnuncio(mensajeInicial);
    setCaracteresRestantes(MAX_CARACTERES - mensajeInicial.length);
    setHasChanges(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      size="2xl"
      placement="center"
      isDismissable={!isLoading}
      hideCloseButton={isLoading}
      /* Token 2: Modal Premium SaaS */
      classNames={{
        backdrop: "bg-slate-900/40 backdrop-blur-sm",
        base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl",
        header: "border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8",
        body: "px-8 py-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent",
        footer: "border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8",
        closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 p-2 top-4 right-4"
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              <div className="flex items-center gap-4">
                {/* Regla de tintes */}
                <div className="p-3 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl shrink-0">
                  <HiSpeakerphone className="w-6 h-6" />
                </div>
                <div className="flex flex-col gap-0.5">
                  {/* Token 3: Textos principales */}
                  <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                    Aviso en Recibos
                  </h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                    Este mensaje se imprimirá en todos los tickets
                  </p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody>
              
              {/* Vista previa del mensaje (Regla de Tintes) */}
              <div className="bg-orange-500/10 rounded-2xl p-5 relative overflow-hidden flex flex-col gap-2">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                
                <h4 className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                  <HiInformationCircle className="w-4 h-4" /> Vista Previa
                </h4>
                <p className={`text-sm font-medium italic leading-relaxed pl-1 ${anuncio ? 'text-orange-900 dark:text-orange-100' : 'text-orange-700/60 dark:text-orange-300/60'}`}>
                  "{anuncio || "El anuncio aparecerá aquí..."}"
                </p>
              </div>

              {/* Editor de texto */}
              <div className="mt-2">
                <CustomTextarea
                  label="Mensaje del anuncio"
                  value={anuncio}
                  onChange={handleAnuncioChange}
                  icon={<HiPencilAlt className="w-5 h-5 text-slate-400" />}
                  maxLength={MAX_CARACTERES}
                  minRows={4}
                />

                {/* Barra de progreso para caracteres */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                        Caracteres Disponibles
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        caracteresRestantes < 20 
                            ? "bg-red-500/10 text-red-600 dark:text-red-400" 
                            : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                    }`}>
                      {caracteresRestantes} / {MAX_CARACTERES}
                    </span>
                  </div>
                  <Progress
                    value={((MAX_CARACTERES - caracteresRestantes) / MAX_CARACTERES) * 100}
                    color={caracteresRestantes < 20 ? "danger" : caracteresRestantes < 50 ? "warning" : "default"}
                    className="h-1.5 px-1"
                    classNames={{
                        track: "bg-slate-100 dark:bg-zinc-800",
                        indicator: "rounded-full bg-slate-800 dark:bg-zinc-200"
                    }}
                    aria-label="Caracteres usados"
                  />
                </div>
              </div>

              {/* Opción de restaurar mensaje por defecto */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <div className="flex-1 min-w-0 px-1">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
                    Mensaje por defecto
                  </h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 truncate pr-4">
                    {MENSAJE_POR_DEFECTO}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleRestaurarDefecto}
                  startContent={<HiRefresh className="w-3.5 h-3.5" />}
                  isDisabled={isLoading || anuncio === MENSAJE_POR_DEFECTO}
                  className="shrink-0 font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-xl"
                >
                  Restaurar
                </Button>
              </div>
            </ModalBody>

            <ModalFooter className="flex justify-end gap-3">
              <Button
                variant="light"
                onPress={handleCancelar}
                isDisabled={isLoading}
                className="font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-6"
              >
                Cancelar
              </Button>
              {/* Token 4: Botón Primario */}
              <Button
                onPress={handleGuardar}
                isLoading={isLoading}
                startContent={!isLoading && <HiCheck className="text-lg" />}
                isDisabled={!hasChanges}
                className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 shadow-sm"
              >
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModalAnuncioRecibo;
