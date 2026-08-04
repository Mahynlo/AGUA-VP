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
    <Card className="border border-slate-200 dark:border-zinc-800 mt-2">
      <CardBody className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <HiCog className="w-5 h-5 text-blue-600" />
          Gestión de Medidor
        </h3>
        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
          Asigna o modifica los medidores asociados a este cliente.
        </p>
        
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
