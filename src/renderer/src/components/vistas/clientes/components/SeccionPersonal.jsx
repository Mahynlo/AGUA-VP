/**
 * Sección de información personal del formulario de cliente
 */

import React from "react";
import { Card, CardBody } from "@nextui-org/react";
import { HiUser, HiMail, HiPhone, HiHashtag } from "react-icons/hi";
import { CustomInput } from "../../../ui/FormComponents";

export const SeccionPersonal = ({
  formData,
  erroresCampos,
  mostrarErrores,
  onChange,
  limpiarError
}) => {
  return (
    <Card className="border border-green-200 dark:border-green-800">
      <CardBody className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <HiUser className="w-5 h-5 text-blue-600" />
          Información Personal
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {/* Número de Predio */}
          <div className="md:col-span-2">
            <CustomInput
              label="Número de Predio"
              placeholder="Ej. A-01, 123, MZ-5-LT-2"
              value={formData.numero_predio}
              onChange={(e) => {
                onChange('numero_predio', e.target.value);
                limpiarError('numero_predio');
              }}
              icon={<HiHashtag className="w-5 h-5 text-blue-600" />}
            />
          </div>

          {/* Nombre Completo */}
          <CustomInput
            label="Nombre Completo"
            placeholder="Ingresa el nombre completo"
            value={formData.nombre}
            onChange={(e) => {
              onChange('nombre', e.target.value);
              limpiarError('nombre');
            }}
            required
            icon={<HiUser className="w-5 h-5 text-blue-600" />}
            isInvalid={mostrarErrores && !!erroresCampos.nombre}
            errorMessage="El nombre es requerido"
          />

          {/* Correo Electrónico */}
          <CustomInput
            label="Correo Electrónico"
            type="email"
            placeholder="ejemplo@correo.com"
            value={formData.correo}
            onChange={(e) => {
              onChange('correo', e.target.value);
              limpiarError('correo');
            }}
            required
            icon={<HiMail className="w-5 h-5 text-blue-600" />}
            isInvalid={mostrarErrores && !!erroresCampos.correo}
            errorMessage="El correo electrónico es requerido"
          />

          {/* Teléfono */}
          <div className="md:col-span-2">
            <CustomInput
              label="Teléfono"
              type="tel"
              placeholder="(662) 1456-7890"
              value={formData.telefono}
              onChange={(e) => {
                onChange('telefono', e.target.value);
                limpiarError('telefono');
              }}
              required
              icon={<HiPhone className="w-5 h-5 text-blue-600" />}
              isInvalid={mostrarErrores && !!erroresCampos.telefono}
              errorMessage="El teléfono es requerido"
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default SeccionPersonal;
