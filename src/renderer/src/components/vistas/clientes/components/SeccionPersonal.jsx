/**
 * Sección de información personal del formulario de cliente
 */

import React from "react";
import { Card, CardBody } from "@nextui-org/react";
import { HiUser, HiMail, HiPhone } from "react-icons/hi";

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
          {/* Nombre Completo */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre Completo*
            </label>
            <div className="relative w-full flex">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                <HiUser className="inline-block mr-1 h-5 w-5 text-blue-600" />
              </span>
              <input
                type="text"
                placeholder="Ingresa el nombre completo"
                value={formData.nombre}
                onChange={(e) => {
                  onChange('nombre', e.target.value);
                  limpiarError('nombre');
                }}
                required
                className={`border ${
                  mostrarErrores && erroresCampos.nombre 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-600 focus:border-blue-500'
                } text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
              />
            </div>
            {mostrarErrores && erroresCampos.nombre && (
              <p className="text-sm text-red-500 mt-1">El nombre es requerido</p>
            )}
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Correo Electrónico*
            </label>
            <div className="relative w-full flex">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                <HiMail className="inline-block mr-1 h-5 w-5 text-blue-600" />
              </span>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={formData.correo}
                onChange={(e) => {
                  onChange('correo', e.target.value);
                  limpiarError('correo');
                }}
                required
                className={`border ${
                  mostrarErrores && erroresCampos.correo 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-600 focus:border-blue-500'
                } text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
              />
            </div>
            {mostrarErrores && erroresCampos.correo && (
              <p className="text-sm text-red-500 mt-1">El correo electrónico es requerido</p>
            )}
          </div>

          {/* Teléfono */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Teléfono*
            </label>
            <div className="relative w-full flex">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                <HiPhone className="inline-block mr-1 h-5 w-5 text-blue-600" />
              </span>
              <input
                type="tel"
                placeholder="(662) 1456-7890"
                value={formData.telefono}
                onChange={(e) => {
                  onChange('telefono', e.target.value);
                  limpiarError('telefono');
                }}
                required
                className={`border ${
                  mostrarErrores && erroresCampos.telefono 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-600 focus:border-blue-500'
                } text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
              />
            </div>
            {mostrarErrores && erroresCampos.telefono && (
              <p className="text-sm text-red-500 mt-1">El teléfono es requerido</p>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default SeccionPersonal;
