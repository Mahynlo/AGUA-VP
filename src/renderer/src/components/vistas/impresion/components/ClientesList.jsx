import React, { useState } from "react";
import { Card, CardBody, CardHeader, Chip, Checkbox, Button, Select, SelectItem } from "@nextui-org/react";
import { HiUsers, HiSearch } from "react-icons/hi";
import { generarOpcionesPeriodos } from "../../../../utils/reciboUtils";

/**
 * Componente para lista de clientes con checkboxes
 * Integrates Period Selection and Search with 'TabClientes' styling.
 */
const ClientesList = ({
  clientes,
  clientesSeleccionados,
  onToggleCliente,
  onToggleTodos,
  periodoSeleccionado,
  onCambioPeriodo,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const opcionesPeriodos = generarOpcionesPeriodos();

  const clientesFiltrados = clientes.filter(c =>
    c.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.direccion_cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todosSeleccionados = clientes.length > 0 && clientesSeleccionados.size === clientes.length;

  return (
    <Card className="shadow-md border border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-gray-800/50">

        {/* Title and Selection Stats */}
        <div className="flex justify-between items-center w-full">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <HiUsers className="text-blue-500" />
            Selección de Clientes
          </h3>
          <div className="flex gap-2 items-center">
            <Chip size="sm" variant="flat" color="primary">
              {clientesSeleccionados.size} / {clientes.length}
            </Chip>
            <Button
              size="sm"
              color={todosSeleccionados ? "danger" : "primary"}
              variant="flat"
              onPress={onToggleTodos}
              className="font-semibold"
            >
              {todosSeleccionados ? 'Deseleccionar' : 'Todos'}
            </Button>
          </div>
        </div>

        {/* Grid for Inputs: 2cols Search + 1col Filter, matching TabClientes generally */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* Buscador (Estilo TabClientes) */}
          <div className="md:col-span-2 relative w-full flex">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 z-10">
              <HiSearch className="w-5 h-5 inline-block" />
            </span>
            <input
              placeholder="Buscar por nombre o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-all duration-200 h-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Selector de Periodo */}
          <Select
            placeholder="Seleccionar período"
            selectedKeys={periodoSeleccionado ? [periodoSeleccionado] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              if (selected) onCambioPeriodo(selected);
            }}
            className="w-full"
            size="sm"
            classNames={{
              trigger: "h-10 border border-gray-300 rounded-xl bg-white dark:bg-neutral-800"
            }}
            isLoading={loading}
            aria-label="Seleccionar periodo"
          >
            {opcionesPeriodos.map((opcion) => (
              <SelectItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </CardHeader>

      <CardBody className="pt-0 px-2 pb-2">
        <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-purple-200 mt-2">
          {clientesFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p>{clientes.length === 0 ? "Selecciona un periodo" : "No se encontraron clientes coincidentes"}</p>
            </div>
          ) : (
            clientesFiltrados.map((factura) => (
              <Card
                key={factura.id}
                className={`transition-all duration-200 cursor-pointer hover:scale-[1.01] ${clientesSeleccionados.has(factura.id)
                    ? 'border-2 border-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/40 dark:to-purple-900/40 shadow-sm'
                    : 'border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md'
                  }`}
                isPressable
                onPress={() => onToggleCliente(factura.id)}
              >
                <CardBody className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        isSelected={clientesSeleccionados.has(factura.id)}
                        onChange={() => onToggleCliente(factura.id)}
                        color="primary"
                        size="lg"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-base text-gray-900 dark:text-white mb-0.5">
                          {factura.cliente_nombre}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            📍 {factura.direccion_cliente}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center gap-1">
                            💧 {factura.consumo_m3} m³
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col gap-1">
                      <Chip color="success" variant="flat" size="md" className="font-bold">
                        ${factura.total?.toFixed(2)}
                      </Chip>
                      {factura.saldo_pendiente > 0 && (
                        <Chip color="warning" variant="dot" size="sm" className="h-6 text-xs pl-2">
                          Adeudo: ${factura.saldo_pendiente?.toFixed(2)}
                        </Chip>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            )))}
        </div>
      </CardBody>
    </Card>
  );
};

export default ClientesList;
