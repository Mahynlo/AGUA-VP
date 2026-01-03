/**
 * Sección de dirección del formulario de cliente
 */

import React from "react";
import { Card, CardBody, Select, SelectItem } from "@nextui-org/react";
import { HiLocationMarker } from "react-icons/hi";

const pueblos = [
  { key: "Nacori Grande", label: "Nacori Grande" },
  { key: "Matape", label: "Matape" },
  { key: "Adivino", label: "Adivino" },
];

export const SeccionDireccion = ({ 
  formData, 
  erroresCampos, 
  mostrarErrores, 
  onChange, 
  limpiarError 
}) => {
  return (
    <Card className="border border-green-200 dark:border-green-800 mt-2">
      <CardBody className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <HiLocationMarker className="w-5 h-5 text-green-600" />
          Dirección de Residencia
        </h3>

        {/* Pueblo */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pueblo*
          </label>
          <Select
            aria-label="Ciudad"
            placeholder="Selecciona un pueblo"
            selectedKeys={formData.ciudad ? [formData.ciudad] : []}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0];
              onChange('ciudad', selectedKey || "");
              limpiarError('ciudad');
            }}
            color="primary"
            variant="bordered"
            size="md"
            isRequired
            className="w-full"
            startContent={<HiLocationMarker className="text-gray-400 text-lg" />}
            isInvalid={mostrarErrores && erroresCampos.ciudad}
            errorMessage={mostrarErrores && erroresCampos.ciudad && "La ciudad es requerida"}
          >
            {pueblos.map((pueblo) => (
              <SelectItem key={pueblo.key}>{pueblo.label}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Dirección Completa */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Ingresa la dirección completa del cliente, incluyendo calle, número, colonia, referencias, etc.
          </label>
          <textarea
            label="Dirección Completa"
            placeholder="Ingresa la dirección completa del cliente..."
            value={formData.direccion}
            onChange={(e) => {
              onChange('direccion', e.target.value);
              limpiarError('direccion');
            }}
            required
            rows="3"
            className={`border ${
              mostrarErrores && erroresCampos.direccion 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-blue-600 focus:border-blue-500'
            } text-gray-600 rounded-xl pl-4 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white resize-none`}
          />
          {mostrarErrores && erroresCampos.direccion && (
            <p className="text-sm text-red-500 mt-1">La dirección es requerida</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default SeccionDireccion;
