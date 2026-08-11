/**
 * Sección de información personal del formulario de cliente
 */

import React, { useState, useEffect } from "react";
import { Card, CardBody } from "@nextui-org/react";
import { HiUser, HiMail, HiPhone, HiHashtag } from "react-icons/hi";
import { CustomInput } from "../../../ui/FormComponents";
import { useClientes } from "../../../../context/ClientesContext";

export const SeccionPersonal = ({
  formData,
  erroresCampos,
  mostrarErrores,
  onChange,
  limpiarError
}) => {
  const { allClientes } = useClientes();
  const [predioOcupado, setPredioOcupado] = useState(false);
  const [clienteOcupador, setClienteOcupador] = useState(null);

  // Validar si el predio ya existe cada vez que cambie
  useEffect(() => {
    if (!formData.numero_predio || formData.numero_predio.trim() === '') {
      setPredioOcupado(false);
      setClienteOcupador(null);
      return;
    }

    const normalizePredio = (p) => {
      if (!p) return "";
      let cleaned = p.toUpperCase().replace(/\s/g, '');
      const match = cleaned.match(/^(NG|MP|AD)-?0*(\d+)$/);
      if (match) return `${match[1]}-${match[2]}`;
      return cleaned;
    };

    // Buscamos si existe en otro cliente diferente al actual normalizando ambos
    const num = normalizePredio(formData.numero_predio);
    const ocupadoPor = allClientes.find(c => 
      normalizePredio(c.numero_predio) === num && 
      (!formData.id || String(c.id) !== String(formData.id))
    );

    if (ocupadoPor) {
      setPredioOcupado(true);
      setClienteOcupador(ocupadoPor);
    } else {
      setPredioOcupado(false);
      setClienteOcupador(null);
    }
  }, [formData.numero_predio, formData.id, allClientes]);

  const handlePredioChange = (value) => {
    // Convierte todo a mayúsculas y quita espacios
    let val = value.toUpperCase().replace(/\s/g, '');
    
    // Para el auto-formato: quitamos guiones temporales para evaluar
    const rawVal = val.replace(/-/g, '');
    
    // Solo agregamos el guion de forma forzada si empieza con prefijo y TIENE números.
    // También normalizamos quitando ceros a la izquierda (ej: NG02 -> NG-2).
    const match = rawVal.match(/^(NG|MP|AD)(\d+)$/);
    if (match) {
        let numStr = match[2].replace(/^0+/, '');
        if (numStr === '') numStr = '0';
        val = `${match[1]}-${numStr}`;
    }
    
    onChange('numero_predio', val);
    limpiarError('numero_predio');
  };

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
              placeholder="Ej. NG-123, MP-45, AD-01"
              value={formData.numero_predio || ""}
              onChange={(e) => handlePredioChange(e.target.value)}
              icon={<HiHashtag className="w-5 h-5 text-blue-600" />}
              isInvalid={predioOcupado || (mostrarErrores && !!erroresCampos.numero_predio)}
              errorMessage={
                predioOcupado 
                  ? `⚠️ Predio en uso por: ${clienteOcupador?.nombre}` 
                  : (erroresCampos.numero_predio || "")
              }
            />
          </div>

          {/* Nombre Completo */}
          <CustomInput
            label="Nombre Completo"
            placeholder="Ingresa el nombre completo"
            value={formData.nombre || ""}
            onChange={(e) => {
              onChange('nombre', e.target.value);
              limpiarError('nombre');
            }}
            required
            icon={<HiUser className="w-5 h-5 text-blue-600" />}
            isInvalid={mostrarErrores && !!erroresCampos.nombre}
            errorMessage={erroresCampos.nombre || "El nombre es requerido"}
          />

          {/* Correo Electrónico */}
          <CustomInput
            label="Correo Electrónico"
            type="email"
            placeholder="ejemplo@correo.com"
            value={formData.correo || ""}
            onChange={(e) => {
              onChange('correo', e.target.value);
              limpiarError('correo');
            }}
            required
            icon={<HiMail className="w-5 h-5 text-blue-600" />}
            isInvalid={mostrarErrores && !!erroresCampos.correo}
            errorMessage={erroresCampos.correo || "El correo electrónico es requerido"}
          />

          {/* Teléfono */}
          <div className="md:col-span-2">
            <CustomInput
              label="Teléfono"
              type="tel"
              placeholder="(662) 1456-7890"
              value={formData.telefono || ""}
              onChange={(e) => {
                onChange('telefono', e.target.value);
                limpiarError('telefono');
              }}
              required
              icon={<HiPhone className="w-5 h-5 text-blue-600" />}
              isInvalid={mostrarErrores && !!erroresCampos.telefono}
              errorMessage={erroresCampos.telefono || "El teléfono es requerido"}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default SeccionPersonal;
