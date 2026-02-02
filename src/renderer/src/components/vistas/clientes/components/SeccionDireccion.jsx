/**
 * Sección de dirección del formulario de cliente
 */

import React from "react";
import { Card, CardBody, Select, SelectItem } from "@nextui-org/react";
import { HiLocationMarker } from "react-icons/hi";
import { CustomTextarea } from "../../../ui/FormComponents";

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
        <CustomTextarea
          label="Dirección Completa"
          placeholder="Ingresa la dirección completa del cliente..."
          value={formData.direccion}
          onChange={(e) => {
            onChange('direccion', e.target.value);
            limpiarError('direccion');
          }}
          required
          minRows={3}
          isInvalid={mostrarErrores && !!erroresCampos.direccion}
          errorMessage="La dirección es requerida"
        />
      </CardBody>
    </Card>
  );
};

export default SeccionDireccion;
