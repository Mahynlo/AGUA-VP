/**
 * Sección de dirección del formulario de cliente
 */

import React from "react";
import { Select, SelectItem } from "@nextui-org/react";
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
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 p-6 space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/70 dark:border-zinc-800/70">
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
          <HiLocationMarker className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-wider leading-none">
            Dirección de Residencia
          </h3>
          <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
            Pueblo y domicilio completo del cliente
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Pueblo */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Pueblo <span className="text-red-500">*</span>
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
      </div>
    </div>
  );
};

export default SeccionDireccion;
