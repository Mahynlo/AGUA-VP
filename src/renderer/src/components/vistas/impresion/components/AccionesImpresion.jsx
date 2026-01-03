import React from "react";
import { Card, CardBody, CardHeader, Button } from "@nextui-org/react";
import { HiPrinter, HiEye } from "react-icons/hi";
import EstadisticasImpresion from "./EstadisticasImpresion";

/**
 * Componente para acciones de impresión (vista previa e imprimir)
 */
const AccionesImpresion = ({
  estadisticas,
  onVistaPrevia,
  onImprimir,
  procesandoAccion
}) => {
  const isAnyProcessing = procesandoAccion !== null;

  return (
    <div className="space-y-4">
      {/* Estadísticas de impresión rápidas (Top) */}
      <EstadisticasImpresion estadisticas={estadisticas} />

      {/* Acciones Verticales */}
      <div className="grid grid-cols-1 gap-4">
        {/* Vista Previa */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-2 border-blue-200 dark:border-blue-800 shadow-md">
          <CardBody className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-md">
                <HiEye className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-md font-bold text-gray-900 dark:text-white">
                Vista Previa
              </h4>
            </div>

            <div className="flex flex-col gap-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
              <div className="flex justify-between">
                <span>Recibos:</span>
                <span className="font-bold text-blue-600">{estadisticas.cantidadRecibos}</span>
              </div>
            </div>

            <Button
              size="md"
              color="primary"
              variant="shadow"
              className="w-full font-bold bg-gradient-to-r from-blue-600 to-cyan-600"
              onPress={onVistaPrevia}
              startContent={procesandoAccion !== 'vista-previa' && <HiEye className="w-4 h-4" />}
              isLoading={procesandoAccion === 'vista-previa'}
              isDisabled={isAnyProcessing}
            >
              {procesandoAccion === 'vista-previa' ? 'Generando...' : 'Vista Previa'}
            </Button>
          </CardBody>
        </Card>

        {/* Imprimir Directamente */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-2 border-green-200 dark:border-green-800 shadow-md">
          <CardBody className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-600 rounded-lg shadow-md">
                <HiPrinter className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-md font-bold text-gray-900 dark:text-white">
                Imprimir
              </h4>
            </div>

            <div className="flex flex-col gap-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
              <div className="flex justify-between">
                <span>Hojas estimadas:</span>
                <span className="font-bold text-green-600">{estadisticas.paginasEstimadas}</span>
              </div>
            </div>

            <Button
              size="md"
              color="success"
              variant="shadow"
              className="w-full font-bold bg-gradient-to-r from-green-600 to-emerald-600"
              onPress={onImprimir}
              startContent={procesandoAccion !== 'imprimir' && <HiPrinter className="w-4 h-4" />}
              isLoading={procesandoAccion === 'imprimir'}
              isDisabled={isAnyProcessing}
            >
              {procesandoAccion === 'imprimir' ? 'Enviando...' : 'Imprimir'}
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default AccionesImpresion;
