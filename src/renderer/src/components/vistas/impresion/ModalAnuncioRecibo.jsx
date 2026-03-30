import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Progress
} from "@nextui-org/react";
import { HiSpeakerphone, HiRefresh, HiCheck, HiPencilAlt, HiInformationCircle } from "react-icons/hi";

// Componente de Textarea Personalizado (Premium UI)
const CustomTextarea = ({ label, value, onChange, icon, color = "blue", description, minRows = 3, maxLength }) => {
    const focusColors = {
        blue: "focus:ring-blue-500 focus:border-blue-500",
        orange: "focus:ring-orange-500 focus:border-orange-500",
        green: "focus:ring-green-500 focus:border-green-500",
    };

    return (
        <div className="w-full">
            {label && (
                <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">
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
                    className={`
                        w-full pl-10 pr-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 resize-none
                        bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100
                        border border-slate-200 dark:border-zinc-700
                        hover:bg-slate-100 dark:hover:bg-zinc-800
                        focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-zinc-900
                        placeholder-slate-400 dark:placeholder-zinc-500 shadow-sm
                        ${focusColors[color] || focusColors.blue}
                    `}
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
      backdrop="blur"
      placement="center"
      isDismissable={!isLoading}
      hideCloseButton={isLoading}
      classNames={{
        base: "bg-white dark:bg-zinc-900 shadow-2xl",
        backdrop: "bg-zinc-900/50 backdrop-blur-sm",
        header: "border-b border-slate-100 dark:border-zinc-800",
        footer: "border-t border-slate-100 dark:border-zinc-800",
        closeButton: "hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 text-slate-400 dark:text-zinc-500 transition-colors z-50",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 pt-6 px-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-2xl shrink-0">
                  <HiSpeakerphone className="w-7 h-7" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                    Aviso en Recibos
                  </h2>
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-1">
                    Este mensaje se imprimirá en todos los tickets
                  </p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-6 py-6 px-4 sm:px-6">
              
              {/* Vista previa del mensaje */}
              <div className="bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200/60 dark:border-orange-900/30 rounded-2xl p-5 relative overflow-hidden">
                {/* Elemento decorativo para simular un recibo/nota */}
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-400 dark:bg-orange-600"></div>
                
                <h4 className="text-[11px] font-bold text-orange-700/60 dark:text-orange-500/60 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <HiInformationCircle className="w-4 h-4" /> Vista Previa
                </h4>
                <p className={`text-sm font-medium italic leading-relaxed ${anuncio ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-400 dark:text-zinc-500'}`}>
                  "{anuncio || "El anuncio aparecerá aquí..."}"
                </p>
              </div>

              {/* Editor de texto */}
              <div className="space-y-4 bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl">
                <CustomTextarea
                  label="Mensaje del anuncio"
                  value={anuncio}
                  onChange={handleAnuncioChange}
                  icon={<HiPencilAlt className="w-5 h-5 text-orange-500" />}
                  color="orange"
                  maxLength={MAX_CARACTERES}
                  minRows={4}
                />

                {/* Barra de progreso para caracteres */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                        Caracteres Disponibles
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        caracteresRestantes < 20 
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" 
                            : "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300"
                    }`}>
                      {caracteresRestantes} / {MAX_CARACTERES}
                    </span>
                  </div>
                  <Progress
                    value={((MAX_CARACTERES - caracteresRestantes) / MAX_CARACTERES) * 100}
                    color={caracteresRestantes < 20 ? "danger" : caracteresRestantes < 50 ? "warning" : "success"}
                    className="h-1.5"
                    classNames={{
                        track: "bg-slate-200 dark:bg-zinc-700",
                        indicator: "rounded-full"
                    }}
                    aria-label="Caracteres usados"
                  />
                </div>
              </div>

              {/* Opción de restaurar mensaje por defecto */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Mensaje por defecto
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 truncate pr-4">
                    {MENSAJE_POR_DEFECTO}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="flat"
                  color="default"
                  onPress={handleRestaurarDefecto}
                  startContent={<HiRefresh className="w-3.5 h-3.5" />}
                  isDisabled={isLoading || anuncio === MENSAJE_POR_DEFECTO}
                  className="shrink-0 font-bold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700"
                >
                  Restaurar
                </Button>
              </div>
            </ModalBody>

            <ModalFooter className="px-6 py-4 flex justify-between items-center">
              <Button
                variant="light"
                color="default"
                onPress={handleCancelar}
                isDisabled={isLoading}
                className="font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Cancelar
              </Button>
              <Button
                onPress={handleGuardar}
                isLoading={isLoading}
                startContent={!isLoading && <HiCheck className="w-5 h-5" />}
                isDisabled={!hasChanges}
                className="font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30"
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
