import React from "react";
import { Card, CardBody, CardHeader, Select, SelectItem } from "@nextui-org/react";
import { HiCog, HiUsers } from "react-icons/hi";
import { generarOpcionesPeriodos } from "../../../../utils/reciboUtils";

/**
 * Componente para selección de período de facturación
 */
const PeriodoSelector = ({ 
  periodoSeleccionado, 
  onCambioPeriodo, 
  cantidadClientes, 
  loading 
}) => {
  const opcionesPeriodos = generarOpcionesPeriodos();

  return (
    <Card className="shadow-lg border-2 border-blue-100 dark:border-blue-900">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <div className="flex items-center gap-3 w-full">
          <div className="p-3 bg-blue-600 rounded-xl shadow-md">
            <HiCog className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Configuración de Período
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selecciona el mes para generar recibos
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              📅 Período de Facturación
            </label>
            <Select
              label="Seleccionar período"
              placeholder="Elige el mes a imprimir"
              selectedKeys={periodoSeleccionado ? [periodoSeleccionado] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                onCambioPeriodo(selected);
              }}
              className="w-full"
              size="lg"
              classNames={{
                trigger: "h-14 border-2 border-gray-300 hover:border-blue-500 dark:border-gray-600 dark:hover:border-blue-500"
              }}
            >
              {opcionesPeriodos.map((opcion) => (
                <SelectItem key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          
          <div className="flex items-end">
            <Card className="w-full shadow-md hover:shadow-lg transition-shadow border-2 border-blue-200 dark:border-blue-800">
              <CardBody className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-xl shadow-md">
                    <HiUsers className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">
                      {loading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        cantidadClientes
                      )}
                    </p>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                      Clientes Disponibles
                    </p>
                    <p className="text-xs text-blue-500 dark:text-blue-400">
                      Con facturas y lecturas
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default PeriodoSelector;
