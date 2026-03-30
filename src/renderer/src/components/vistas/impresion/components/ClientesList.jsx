import React, { useState } from "react";
import { Card, CardBody, CardHeader, Chip, Checkbox, Button } from "@nextui-org/react";
import { HiUsers, HiSearch, HiX, HiLocationMarker } from "react-icons/hi";
import { IoWaterOutline } from "react-icons/io5";
import SelectorPeriodoAvanzado from "../../../ui/SelectorPeriodoAvanzado";

/**
 * Componente para lista de clientes con checkboxes
 * Integrates Period Selection and Search with Premium UI styling.
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

  const clientesFiltrados = clientes.filter(c =>
    c.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.direccion_cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todosSeleccionados = clientes.length > 0 && clientesSeleccionados.size === clientes.length;

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-col h-full min-h-[600px]">
      
      {/* ── HEADER: Título, Filtros y Selección ── */}
      <CardHeader className="flex flex-col gap-5 pt-6 px-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">

        {/* Fila 1: Título y Selección Masiva */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
              <HiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                Selección de Clientes para Impresión
              </h3>
              <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                Facturas a Imprimir
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Chip size="sm" variant="flat" color="primary" className="font-bold text-[10px] uppercase tracking-wider px-1">
              {clientesSeleccionados.size} / {clientes.length}
            </Chip>
            <Button
              size="sm"
              color={todosSeleccionados ? "default" : "primary"}
              variant={todosSeleccionados ? "flat" : "solid"}
              onPress={onToggleTodos}
              className={`font-bold ${todosSeleccionados ? 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300' : 'shadow-md shadow-blue-500/30 text-white'}`}
            >
              {todosSeleccionados ? 'Deseleccionar' : 'Seleccionar Todos'}
            </Button>
          </div>
        </div>

        {/* Fila 2: Inputs de Búsqueda y Periodo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          
          {/* Buscador */}
          <div className="md:col-span-2 relative w-full flex items-center">
            <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
              <HiSearch className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-50 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                title="Limpiar búsqueda"
              >
                <HiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selector de Periodo */}
          <SelectorPeriodoAvanzado
            value={periodoSeleccionado}
            onChange={onCambioPeriodo}
            label="Período"
            placeholder="Seleccionar período"
            startYear={2020}
            size="sm"
            isDisabled={loading}
            className="w-full h-11" 
          />
        </div>
      </CardHeader>

      {/* ── BODY: Lista de Tarjetas ── */}
      <CardBody className="p-4 bg-slate-50/30 dark:bg-black/10">
        <div className="max-h-[500px] overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
          
          {/* Estado de Carga o Vacío */}
          {clientesFiltrados.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <HiUsers className="text-3xl text-slate-400 dark:text-zinc-500" />
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">
                {clientes.length === 0 ? "Selecciona un periodo válido" : "Sin coincidencias"}
              </p>
              <p className="text-xs font-medium text-slate-500 mt-1">
                {clientes.length === 0 ? "No hay facturas generadas para el periodo seleccionado." : "Intenta buscar con otras palabras."}
              </p>
            </div>
          ) : (
            
            /* Lista de Tarjetas de Clientes */
            clientesFiltrados.map((factura) => {
              const isSelected = clientesSeleccionados.has(factura.id);

              return (
                <div
                  key={factura.id}
                  onClick={() => onToggleCliente(factura.id)}
                  className={`
                    w-full transition-all duration-200 cursor-pointer rounded-xl border p-3.5
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                      : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-zinc-600 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-4">
                    
                    {/* Left: Checkbox + Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <Checkbox
                        isSelected={isSelected}
                        onChange={() => onToggleCliente(factura.id)}
                        color="primary"
                        size="md"
                        className="shrink-0 pointer-events-none" 
                        /* pointer-events-none ensures clicking the checkbox wrapper just fires the card's onClick */
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 dark:text-zinc-100 mb-0.5 truncate">
                          {factura.cliente_nombre}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                          <span className="flex items-center gap-1 truncate max-w-[200px]" title={factura.direccion_cliente}>
                            <HiLocationMarker className="shrink-0 text-slate-400" /> 
                            <span className="truncate">{factura.direccion_cliente}</span>
                          </span>
                          <span className="text-slate-300 dark:text-zinc-700 hidden sm:inline">•</span>
                          <span className="flex items-center gap-1 shrink-0">
                            <IoWaterOutline className="shrink-0 text-blue-400" /> 
                            {factura.consumo_m3} m³
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Chips de Montos */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Chip color="success" variant="flat" size="sm" className="font-black text-emerald-700 dark:text-emerald-400 px-1 bg-emerald-50 dark:bg-emerald-900/20">
                        ${factura.total?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </Chip>
                      
                      {factura.saldo_pendiente > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                          Adeudo: ${factura.saldo_pendiente?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default ClientesList;