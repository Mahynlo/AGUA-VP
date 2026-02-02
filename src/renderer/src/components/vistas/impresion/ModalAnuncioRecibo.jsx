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
  Chip,
  Progress
} from "@nextui-org/react";
import { HiSpeakerphone, HiRefresh, HiCheck, HiX, HiPencilAlt } from "react-icons/hi";

// Componente de Textarea Personalizado (Estilo CustomInput)
const CustomTextarea = ({ label, value, onChange, icon, color = "blue", description, minRows = 3 }) => (
  <div>
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
      {label}
    </label>
    <div className="relative w-full flex items-start">
      <span className={`absolute left-2 top-3 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-1 pr-2 z-10`}>
        {icon}
      </span>
      <textarea
        value={value}
        onChange={onChange}
        rows={minRows}
        className={`border border-gray-300 focus:ring-${color}-600 focus:border-${color}-500 text-gray-600 rounded-xl pl-12 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all resize-none`}
      />
    </div>
    {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
  </div>
);

const ModalAnuncioRecibo = ({ isOpen, onClose, onSave }) => {
  const [anuncio, setAnuncio] = useState('');
  const [caracteresRestantes, setCaracteresRestantes] = useState(150);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const MENSAJE_POR_DEFECTO = "Cuidemos el agua para las futuras generaciones. Reporte cualquier fuga o problema en su medidor al teléfono de la oficina municipal.";
  const MAX_CARACTERES = 150;

  useEffect(() => {
    if (isOpen) {
      // Cargar anuncio guardado o usar el por defecto
      const anuncioGuardado = localStorage.getItem('anuncio_recibo');
      const mensajeInicial = anuncioGuardado || MENSAJE_POR_DEFECTO;
      setAnuncio(mensajeInicial);
      setCaracteresRestantes(MAX_CARACTERES - mensajeInicial.length);
      setHasChanges(false);
    }
  }, [isOpen]);

  const handleAnuncioChange = (e) => {
    const value = e.target.value;
    // console.log('Cambiando texto a:', value, 'Longitud:', value.length);
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
    // Restaurar al valor guardado
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
        backdrop: "bg-gradient-to-t mt-18 from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
        closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white"
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 rounded-full">
                  <HiSpeakerphone className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-800 dark:text-white">
                    Configurar Anuncio del Recibo
                  </span>
                  <span className="text-sm font-normal text-gray-500">
                    Este mensaje aparecerá en todos los recibos impresos
                  </span>
                </div>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-6 py-6">
              {/* Vista previa del mensaje */}
              <Card className="shadow-none border border-blue-100 dark:border-blue-900/30">
                <CardBody className="bg-blue-50/50 dark:bg-blue-900/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <HiSpeakerphone className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Vista previa en el recibo:
                    </span>
                  </div>
                  <p className="text-sm font-mono text-blue-700 dark:text-blue-300 italic border-l-4 border-blue-400 pl-3 py-1">
                    {anuncio || "Mensaje vacío..."}
                  </p>
                </CardBody>
              </Card>

              {/* Editor de texto */}
              <div className="space-y-3">
                <CustomTextarea
                  label="Mensaje del anuncio"
                  value={anuncio}
                  onChange={handleAnuncioChange}
                  icon={<HiPencilAlt className="w-5 h-5 text-gray-400" />}
                  color="orange"
                  description={`Escriba el mensaje que desea mostrar. Máximo ${MAX_CARACTERES} caracteres.`}
                  minRows={4}
                />

                {/* Barra de progreso para caracteres */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1 px-1">
                    <span>Progreso de caracteres</span>
                    <span className={caracteresRestantes < 20 ? "text-red-500 font-bold" : ""}>
                      {MAX_CARACTERES - caracteresRestantes} / {MAX_CARACTERES}
                    </span>
                  </div>
                  <Progress
                    value={(MAX_CARACTERES - caracteresRestantes) / MAX_CARACTERES * 100}
                    color={caracteresRestantes < 20 ? "danger" : caracteresRestantes < 50 ? "warning" : "success"}
                    className="h-2"
                    aria-label="Caracteres usados"
                  />
                </div>
              </div>

              {/* Opción de restaurar mensaje por defecto */}
              <Card className="shadow-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <CardBody className="p-3">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Mensaje por defecto</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {MENSAJE_POR_DEFECTO}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="flat"
                      color="default"
                      onPress={handleRestaurarDefecto}
                      startContent={<HiRefresh className="w-3 h-3" />}
                      isDisabled={isLoading}
                      className="min-w-fit"
                    >
                      Restaurar
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </ModalBody>

            <ModalFooter className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <Button
                color="danger"
                variant="light"
                onPress={handleCancelar}
                isDisabled={isLoading}
                radius="lg"
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={handleGuardar}
                isLoading={isLoading}
                startContent={!isLoading && <HiCheck className="w-4 h-4" />}
                isDisabled={!hasChanges}
                radius="lg"
                className="bg-orange-600 text-white shadow-lg shadow-orange-500/30"
              >
                {isLoading ? "Guardando..." : "Guardar Anuncio"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModalAnuncioRecibo;
