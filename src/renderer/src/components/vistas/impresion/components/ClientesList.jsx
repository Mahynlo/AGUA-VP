import React, { useState } from "react";
import { Card, CardBody, CardHeader, Chip, Checkbox, Button, Spinner } from "@nextui-org/react";
import { HiUsers, HiSearch, HiX, HiLocationMarker } from "react-icons/hi";
import { IoWaterOutline } from "react-icons/io5";
import SelectorPeriodoAvanzado from "../../../ui/SelectorPeriodoAvanzado";
import { normalizarTexto } from "../../../../utils/textUtils";
import { useRutas } from "../../../../context/RutasContext";

/**
 * Componente para lista de clientes con checkboxes
 * Integrates Period Selection and Search with Unified UI styling.
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
  const { periodosInfo, siguientePeriodo, ultimoPeriodoRegistrado } = useRutas();
  const [searchTerm, setSearchTerm] = useState("");

  const clientesFiltrados = (clientes || []).filter((c) => {
    const term = normalizarTexto(searchTerm);
    return (
      normalizarTexto(c.cliente_nombre || "").includes(term) ||
      normalizarTexto(c.direccion_cliente || "").includes(term) ||
      normalizarTexto(c.numero_predio || "").includes(term)
    );
  });

  const totalClientes = clientes?.length || 0;
  const todosSeleccionados = totalClientes > 0 && clientesSeleccionados.size === totalClientes;

  return (
    <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-sm flex flex-col h-full min-h-[600px]">
      
      {/* ── HEADER: Título, Filtros y Selección ── */}
      <CardHeader className="flex flex-col gap-5 pt-6 px-6 pb-5 border-b border-slate-100 dark:border-zinc-800/80">

        {/* Fila 1: Título y Selección Masiva */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
              <HiUsers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                Selección de Clientes para Impresión
              </h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                Facturas del período
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <Chip
              size="sm"
              variant="flat"
              className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-black text-xs px-2 h-7 rounded-lg"
            >
              {clientesSeleccionados.size} / {totalClientes}
            </Chip>
            <Button
              size="sm"
              onPress={onToggleTodos}
              isDisabled={totalClientes === 0 || loading}
              className={`font-bold h-8 text-xs rounded-xl transition-all ${
                todosSeleccionados
                  ? "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              }`}
            >
              {todosSeleccionados ? "Deseleccionar Todos" : "Seleccionar Todos"}
            </Button>
          </div>
        </div>

        {/* Fila 2: Selector de Período */}
        <div className="w-full flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">
            Ciclo / Período de Facturación
          </label>
          <div className="w-full h-12">
            <SelectorPeriodoAvanzado
              value={periodoSeleccionado}
              onChange={onCambioPeriodo}
              placeholder="Seleccionar período"
              startYear={2020}
              isDisabled={loading}
              className="w-full h-full"
              periodosInfo={periodosInfo}
              siguientePeriodo={siguientePeriodo}
              ultimoPeriodoRegistrado={ultimoPeriodoRegistrado}
            />
          </div>
        </div>

        {/* Fila 3: Buscador */}
        <div className="w-full flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">
            Buscar Cliente o Predio
          </label>
          <div className="relative w-full flex items-center">
            <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
              <HiSearch className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre, número de predio o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-11 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-none h-[52px] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors p-1"
                title="Limpiar búsqueda"
              >
                <HiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* ── BODY: Lista de Tarjetas ── */}
      <CardBody className="p-4 bg-slate-50/40 dark:bg-black/20 flex-1">
        <div className="max-h-[560px] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          
          {/* Estado de Carga */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Spinner size="md" color="primary" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 animate-pulse">
                Cargando facturas del período...
              </p>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            /* Estado Vacío */
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center mb-3 text-slate-400 dark:text-zinc-500">
                <HiUsers className="text-2xl" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                {totalClientes === 0 ? "Sin facturas en este período" : "Sin coincidencias"}
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1 max-w-xs">
                {totalClientes === 0
                  ? "Selecciona un ciclo de facturación diferente para cargar los recibos correspondientes."
                  : "No se encontraron clientes con el término de búsqueda ingresado."}
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
                    w-full transition-all duration-200 cursor-pointer rounded-2xl border p-4
                    ${isSelected
                      ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm ring-1 ring-indigo-500/20"
                      : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-indigo-300 dark:hover:border-zinc-700 hover:shadow-sm"
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-4">
                    
                    {/* Left: Checkbox + Avatar + Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Checkbox
                        isSelected={isSelected}
                        onChange={() => onToggleCliente(factura.id)}
                        color="primary"
                        size="md"
                        className="shrink-0 pointer-events-none"
                      />

                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/40 font-black text-sm flex items-center justify-center shrink-0">
                        {factura.cliente_nombre?.charAt(0)?.toUpperCase() || "C"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-sm text-slate-800 dark:text-zinc-100 truncate">
                            {factura.cliente_nombre}
                          </p>
                          {factura.numero_predio && (
                            <span className="font-mono font-bold text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-1.5 py-0.5 rounded shrink-0">
                              #{factura.numero_predio}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                          {factura.direccion_cliente && (
                            <span className="flex items-center gap-1 truncate max-w-[220px]" title={factura.direccion_cliente}>
                              <HiLocationMarker className="shrink-0 text-slate-400" />
                              <span className="truncate">{factura.direccion_cliente}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                            <IoWaterOutline className="shrink-0" />
                            {factura.consumo_m3 ?? 0} m³
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Chips de Montos */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="font-black text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                        ${factura.total?.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      
                      {factura.saldo_pendiente > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Adeudo: ${factura.saldo_pendiente?.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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