import React, { useState } from "react";
import { Button, Card, CardBody, CardHeader } from "@nextui-org/react";
import { HiSpeakerphone, HiScale } from "react-icons/hi";
import ModalAnuncioRecibo from "./ModalAnuncioRecibo";
import ModalEquivalenciaConsumo from "./ModalEquivalenciaConsumo";
import useAnuncioRecibo from "../../../hooks/useAnuncioRecibo";

const TabConfiguracion = () => {
  const [modalAnuncioAbierto, setModalAnuncioAbierto] = useState(false);
  const [modalEquivalenciaAbierto, setModalEquivalenciaAbierto] = useState(false);
  
  // Hook personalizado para el anuncio
  const { anuncio, actualizarAnuncio } = useAnuncioRecibo();

  // Funciones para manejar el modal de anuncio
  const handleAbrirModalAnuncio = () => {
    setModalAnuncioAbierto(true);
  };

  const handleCerrarModalAnuncio = () => {
    setModalAnuncioAbierto(false);
  };

  const handleGuardarAnuncio = (nuevoAnuncio) => {
    actualizarAnuncio(nuevoAnuncio);
  };

  // Funciones para manejar el modal de equivalencias
  const handleAbrirModalEquivalencia = () => {
    setModalEquivalenciaAbierto(true);
  };

  const handleCerrarModalEquivalencia = () => {
    setModalEquivalenciaAbierto(false);
  };

  return (
    <div className="space-y-6">
      {/* Sección de configuración del anuncio */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <HiSpeakerphone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuración de Anuncio
            </h3>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mensaje actual en los recibos
              </label>
              <Card>
                <CardBody className="bg-gray-50 dark:bg-gray-800 min-h-[120px]">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {anuncio || "No hay mensaje configurado"}
                  </p>
                </CardBody>
              </Card>
            </div>
            
            <div className="flex items-end">
              <Button 
                onPress={handleAbrirModalAnuncio}
                color="warning"
                className="w-full"
                startContent={<HiSpeakerphone />}
                size="lg"
              >
                Configurar Anuncio
              </Button>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-lg">
                <HiSpeakerphone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
                  Información sobre el anuncio
                </h4>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  Este mensaje aparecerá en todos los recibos impresos. Es ideal para comunicar información importante, promociones, avisos de mantenimiento o recordatorios de pago.
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Sección de configuración de equivalencias de consumo */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <HiScale className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuración de Equivalencias de Consumo
            </h3>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frases de equivalencia automática
              </label>
              <Card>
                <CardBody className="bg-gray-50 dark:bg-gray-800 min-h-[120px]">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Se muestran automáticamente en los recibos según el consumo del cliente 
                    (ej: "Equivale a unas 50 duchas de 10 minutos")
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">0-15 m³: Frases de uso eficiente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">16-30 m³: Frases de uso moderado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">30+ m³: Frases de uso alto</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
            
            <div className="flex items-end">
              <Button 
                onPress={handleAbrirModalEquivalencia}
                color="success"
                className="w-full"
                startContent={<HiScale />}
                size="lg"
              >
                Configurar Equivalencias
              </Button>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg">
                <HiScale className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                  Acerca de las equivalencias
                </h4>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Las equivalencias ayudan a los clientes a entender su consumo de agua comparándolo con actividades cotidianas. 
                  Esto promueve la conciencia del uso del agua y puede fomentar hábitos más sostenibles.
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Modal para configurar anuncio */}
      <ModalAnuncioRecibo 
        isOpen={modalAnuncioAbierto}
        onClose={handleCerrarModalAnuncio}
        onSave={handleGuardarAnuncio}
      />

      {/* Modal para configurar equivalencias */}
      <ModalEquivalenciaConsumo 
        isOpen={modalEquivalenciaAbierto}
        onClose={handleCerrarModalEquivalencia}
      />
    </div>
  );
};

export default TabConfiguracion;
