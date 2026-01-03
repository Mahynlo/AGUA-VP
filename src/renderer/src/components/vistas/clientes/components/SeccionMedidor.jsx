/**
 * Sección de asignación de medidor (solo para edición)
 */

import React from "react";
import { Card, CardBody } from "@nextui-org/react";
import { HiCog } from "react-icons/hi";
import BuscarMedidor from "../BuscarMedidor";

export const SeccionMedidor = ({ 
  clienteId, 
  medidorAsignado, 
  onLiberarMedidor, 
  onMedidorSeleccionado 
}) => {
  return (
    <Card className="border border-orange-200 dark:border-orange-800 mt-2 h-[600px]">
      <CardBody className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <HiCog className="w-5 h-5 text-orange-600" />
          Gestión de Medidor
        </h3>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Asigna o modifica el medidor asociado a este cliente.
        </label>
        
        <BuscarMedidor
          clienteId={clienteId}
          medidorAsignado={medidorAsignado}
          onLiberarMedidor={onLiberarMedidor}
          onMedidorSeleccionado={onMedidorSeleccionado}
        />
      </CardBody>
    </Card>
  );
};

export default SeccionMedidor;
