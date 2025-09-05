import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Card,
  CardBody,
  Chip,
  Progress
} from "@nextui-org/react";
import { HiSpeakerphone, HiRefresh, HiCheck, HiX } from "react-icons/hi";

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

  const handleAnuncioChange = (value) => {
    console.log('Cambiando texto a:', value, 'Longitud:', value.length);
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
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <HiSpeakerphone className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Configurar Anuncio del Recibo</h3>
                  <p className="text-sm text-gray-500 font-normal">
                    Este mensaje aparecerá en todos los recibos impresos
                  </p>
                </div>
              </div>
            </ModalHeader>
            
            <ModalBody className="space-y-4">
              {/* Vista previa del mensaje */}
              <Card>
                <CardBody className="bg-blue-50 dark:bg-blue-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <HiSpeakerphone className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Vista previa en el recibo:
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 italic border-l-3 border-blue-400 pl-3">
                    {anuncio || "Mensaje vacío..."}
                  </p>
                </CardBody>
              </Card>

              {/* Editor de texto */}
              <div className="space-y-3">
                <Textarea
                  label="Mensaje del anuncio"
                  placeholder="Escriba aquí el mensaje que aparecerá en los recibos..."
                  value={anuncio}
                  onValueChange={handleAnuncioChange}
                  minRows={4}
                  maxRows={6}
                  description={`Caracteres disponibles: ${caracteresRestantes}`}
                  className="w-full"
                  variant="bordered"
                />
                
                {/* Barra de progreso para caracteres */}
                <div className="space-y-2">
                  <Progress
                    value={(MAX_CARACTERES - caracteresRestantes) / MAX_CARACTERES * 100}
                    color={caracteresRestantes < 20 ? "danger" : caracteresRestantes < 50 ? "warning" : "success"}
                    className="w-full"
                    size="sm"
                  />
                  <div className="flex justify-between items-center">
                    <Chip 
                      size="sm" 
                      color={caracteresRestantes < 20 ? "danger" : caracteresRestantes < 50 ? "warning" : "success"}
                      variant="flat"
                    >
                      {MAX_CARACTERES - caracteresRestantes} / {MAX_CARACTERES} caracteres
                    </Chip>
                    {caracteresRestantes < 20 && (
                      <span className="text-xs text-danger">¡Pocos caracteres restantes!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Opción de restaurar mensaje por defecto */}
              <Card>
                <CardBody className="bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Mensaje por defecto:</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {MENSAJE_POR_DEFECTO}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="bordered"
                      onPress={handleRestaurarDefecto}
                      startContent={<HiRefresh />}
                      isDisabled={isLoading}
                    >
                      Restaurar
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </ModalBody>
            
            <ModalFooter>
              <div className="flex gap-2 w-full">
                <Button 
                  variant="light" 
                  onPress={handleCancelar}
                  isDisabled={isLoading}
                  startContent={<HiX />}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  color="warning" 
                  onPress={handleGuardar}
                  isLoading={isLoading}
                  startContent={!isLoading && <HiCheck />}
                  className="flex-1"
                  isDisabled={!hasChanges}
                >
                  {isLoading ? "Guardando..." : "Guardar Anuncio"}
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModalAnuncioRecibo;
