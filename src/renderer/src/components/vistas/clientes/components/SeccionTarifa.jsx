import React, { useMemo } from "react";
import { Card, CardBody, Select, SelectItem } from "@nextui-org/react";
import { HiCurrencyDollar, HiCog, HiInformationCircle } from "react-icons/hi";
import { useTarifas } from "../../../../context/TarifasContext";

export const SeccionTarifa = ({ 
  formData, 
  erroresCampos, 
  mostrarErrores, 
  onChange, 
  limpiarError,
  modo = 'crear',
  tarifaIdOriginal // <--- NUEVA PROP: El ID real de la base de datos
}) => {
  const { tarifas, loading } = useTarifas();
  const esEdicion = modo === 'editar';

  // 1. Buscamos la info de la tarifa ORIGINAL (Fija, de la BD)
  const infoTarifaOriginal = useMemo(() => {
    if (!tarifas || !tarifaIdOriginal) return null;
    return tarifas.find(t => t.id?.toString() === tarifaIdOriginal?.toString());
  }, [tarifas, tarifaIdOriginal]);

  return (
    <Card className="border border-purple-200 dark:border-purple-800 mt-2">
      <CardBody className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <HiCog className="w-5 h-5 text-purple-600" />
          Tarifa del Cliente
        </h3>
        
        {/* 2. Mostramos la tarjeta de información basada en la tarifa ORIGINAL */}
        {esEdicion && infoTarifaOriginal && (
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg border border-purple-200 dark:border-purple-800 mb-2">
                <div className="flex items-start gap-2">
                    <HiInformationCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            Tarifa Actual:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            {infoTarifaOriginal.nombre} - {infoTarifaOriginal.descripcion}
                        </p>
                    </div>
                </div>
            </div>
        )}

        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {esEdicion 
            ? "Selecciona una nueva tarifa (Si deseas cambiarla):" 
            : "Selecciona la tarifa que se aplicará a este cliente:"}
        </label>

        <Select
          aria-label="Tarifa"
          // El placeholder muestra el nombre de la tarifa original para referencia rápida
          placeholder={esEdicion && infoTarifaOriginal 
            ? `Mantener actual (${infoTarifaOriginal.nombre})` 
            : "Selecciona una tarifa"}
          
          // El Select sigue controlando el formData
          selectedKeys={formData.tarifaSeleccionada ? [formData.tarifaSeleccionada.toString()] : []}
          onSelectionChange={(keys) => {
            const selectedKey = Array.from(keys)[0];
            onChange('tarifaSeleccionada', selectedKey || "");
            limpiarError('tarifa');
          }}
          color="secondary"
          variant="bordered"
          size="md"
          isRequired={!esEdicion} 
          isLoading={loading}
          isDisabled={loading || !tarifas || tarifas.length === 0}
          className="w-full"
          startContent={<HiCurrencyDollar className="text-gray-400 text-lg" />}
          isInvalid={mostrarErrores && erroresCampos.tarifa}
          errorMessage={mostrarErrores && erroresCampos.tarifa && "La tarifa es requerida"}
        >
          {!loading && tarifas && Array.isArray(tarifas) && tarifas.length > 0 ? (
            tarifas.map((tarifa) => {
              const tarifaId = tarifa.id?.toString();
              return (
                <SelectItem 
                  key={tarifaId} 
                  textValue={`${tarifa.nombre}`}
                >
                  <div className="flex flex-col">
                    <span className="text-small font-bold">{tarifa.nombre}</span>
                    <span className="text-tiny text-default-500">{tarifa.descripcion}</span>
                  </div>
                </SelectItem>
              );
            })
          ) : (
            <SelectItem key="no-data" isDisabled>
               {loading ? "Cargando..." : "No hay tarifas"}
            </SelectItem>
          )}
        </Select>

        {esEdicion && (
          <div className="px-1">
             <p className="text-xs text-gray-500 dark:text-gray-400">
                * Si dejas este campo vacío, se mantendrá la tarifa <strong>{infoTarifaOriginal?.nombre || "actual"}</strong>.
             </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default SeccionTarifa;