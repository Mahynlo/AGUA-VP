/**
 * Sección de eliminación de cliente (zona de peligro)
 */

import React from "react";
import { Card, CardBody, Button, Checkbox, Tooltip } from "@nextui-org/react";
import { HiTrash } from "react-icons/hi";

export const SeccionEliminar = ({ clienteId, onEliminar }) => {
  const [confirmacion, setConfirmacion] = React.useState(false);

  const handleEliminar = () => {
    if (!confirmacion) {
      alert("Debes confirmar que deseas eliminar este cliente");
      return;
    }
    
    if (confirm("¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.")) {
      onEliminar?.(clienteId);
    }
  };

  return (
    <Card className="border border-red-200 dark:border-red-800 mt-2">
      <CardBody className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <HiTrash className="w-5 h-5 text-red-600" />
          Zona de Peligro
        </h3>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Esta acción eliminará permanentemente el cliente y toda su información asociada.
        </label>
        
        <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <Checkbox 
            checked={confirmacion} 
            onChange={(e) => setConfirmacion(e.target.checked)}
            color="danger"
          >
            Confirmo que deseo eliminar este cliente
          </Checkbox>
          <Tooltip color="danger" content="Eliminar Cliente" delay={1000}>
            <Button 
              color="danger" 
              variant="bordered"
              startContent={<HiTrash className="w-4 h-4" />}
              onPress={handleEliminar}
              isDisabled={!confirmacion}
            >
              Eliminar Cliente
            </Button>
          </Tooltip>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          ⚠️ Esta acción es irreversible. Se eliminará el cliente y toda su información de registro.
        </p>
      </CardBody>
    </Card>
  );
};

export default SeccionEliminar;
