import { useState } from "react";
import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Pagination,
  Skeleton,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip
} from "@nextui-org/react";
import { 
  HiEye, 
  HiCurrencyDollar, 
  HiDownload, 
  HiX, 
  HiFilter, 
  HiRefresh, 
  HiCash,
  HiSearch,
  HiArrowLeft
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useTabPagos } from "../../../hooks/useTabPagos";
import SelectorPeriodoAvanzado from "../../ui/SelectorPeriodoAvanzado";
import { formatearPeriodo } from "../../../utils/periodoUtils";
import ModalDetallePago from "./ModalDetallePago";
import { exportData } from "../../../utils/exportUtils";
import { useFeedback } from "../../../context/FeedbackContext";

// Componente LoadingSkeleton Premium (Token 8)
const LoadingSkeleton = () => (
  <div className="w-full animate-in fade-in flex flex-col gap-6">
    <div className="flex justify-between items-center pb-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-11 w-24 rounded-xl" />
        <Skeleton className="h-11 w-32 rounded-xl" />
      </div>
    </div>
    <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[52px] w-full rounded-xl" />
          <Skeleton className="h-[52px] w-full rounded-xl" />
          <Skeleton className="h-[52px] w-full rounded-xl" />
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-950">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 w-full border-b border-slate-100 dark:border-zinc-800/50 flex items-center px-6 gap-4">
             <div className="space-y-2 flex-1">
               <Skeleton className="h-4 w-1/4 rounded-md" />
               <Skeleton className="h-3 w-1/3 rounded-md" />
             </div>
             <Skeleton className="h-10 w-32 rounded-xl shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TabPagos = () => {
  const navigate = useNavigate();

  const {
    pagos,
    paginatedData,
    loading,
    initialLoading,
    search,
    filtroMetodo,
    filtroPeriodo,
    currentPage,
    rowsPerPage,
    totalPages,
    totalItems,
    handleSearch,
    handleMetodoFilterChange,
    handlePeriodoChange,
    handleRowsPerPageChange,
    setCurrentPage,
    getMetodoColor,
    actualizarPagos
  } = useTabPagos();

  const { setSuccess } = useFeedback();

  // Estados para modales
  const [modalDetalle, setModalDetalle] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);

  // Funciones de utilidad
  const periodoLabel = formatearPeriodo(filtroPeriodo);

  const obtenerInfoPagosPorFactura = (facturaId) => {
    const pagosDeFactura = pagos?.filter(pago => pago.factura_id === facturaId) || [];
    return {
      total: pagosDeFactura.length,
      montoTotal: pagosDeFactura.reduce((sum, pago) => sum + (pago.monto || 0), 0),
      pagosOrdenados: pagosDeFactura.sort((a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion))
    };
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const verDetalle = (pago) => {
    setPagoSeleccionado(pago);
    setModalDetalle(true);
  };

  if (initialLoading) {
    return <LoadingSkeleton />;
  }

  // Detectar si hay filtros activos para el botón de limpiar
  const hasActiveFilters = search || filtroMetodo !== "All" || filtroPeriodo !== new Date().toISOString().slice(0, 7);

  const clearFilters = () => {
    handleSearch("");
    handleMetodoFilterChange("All");
  };

  // Clases estandarizadas para Inputs Invisibles
  const selectClassNames = {
    trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none h-[52px] focus:ring-2 focus:ring-emerald-500/20 focus:outline-none",
    value: "font-medium text-slate-700 dark:text-zinc-200 text-sm"
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* ── 1. HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 dark:bg-emerald-900/30 rounded-2xl shrink-0">
            <HiCurrencyDollar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                  Historial de Pagos
              </h3>
              {loading && !initialLoading && (
                  <Spinner size="sm" color="success" className="w-4 h-4 ml-1" />
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
              Periodo actual: <span className="text-emerald-600 dark:text-emerald-400 font-black">{periodoLabel}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <Button 
              variant="flat" 
              onPress={() => navigate(-1)}
              className="bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 font-bold rounded-xl h-11 px-4 min-w-0 shadow-sm"
              startContent={<HiArrowLeft className="w-4 h-4" />}
              title="Volver"
          >
            <span className="hidden sm:inline">Volver</span>
          </Button>
          
          <Button
              variant="flat"
              className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl h-11 px-5 shadow-sm"
              onPress={() => actualizarPagos()}
              startContent={!loading && <HiRefresh className="text-lg" />}
              isLoading={loading}
          >
            Recargar
          </Button>

          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="flat"
                className="font-bold bg-emerald-500/10 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-xl h-11 px-5 shadow-sm"
                startContent={<HiDownload className="text-lg" />}
              >
                Exportar
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Opciones de exportación" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl">
              <DropdownItem
                key="csv"
                startContent={<span className="text-xl">📄</span>}
                className="hover:bg-slate-50 dark:hover:bg-zinc-800"
                onPress={async () => {
                  const success = await exportData(paginatedData, `Pagos_${new Date().toISOString().split('T')[0]}`, 'csv');
                  if (success) setSuccess("Archivo CSV generado exitosamente");
                }}
              >
                <span className="font-semibold text-slate-700 dark:text-zinc-200">Exportar CSV (Página actual)</span>
              </DropdownItem>
              <DropdownItem
                key="excel"
                startContent={<span className="text-xl">📊</span>}
                className="hover:bg-slate-50 dark:hover:bg-zinc-800"
                onPress={async () => {
                  const success = await exportData(paginatedData, `Pagos_${new Date().toISOString().split('T')[0]}`, 'xlsx');
                  if (success) setSuccess("Archivo Excel generado exitosamente");
                }}
              >
                <span className="font-semibold text-slate-700 dark:text-zinc-200">Exportar Excel (.xlsx)</span>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* ── 2. CONTENEDOR PRINCIPAL: Filtros y Tabla ── */}
      <div className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-transparent rounded-2xl overflow-hidden flex flex-col">
        
        {/* Filtros */}
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            
            {/* Buscador */}
            <div className="lg:col-span-5 relative w-full flex items-center">
              <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                <HiSearch className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar ID, factura, cliente o medidor..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-none h-[52px]"
              />
              {search && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro por período */}
            <div className="lg:col-span-3">
              <div className="w-full h-[52px] flex items-center">
                <SelectorPeriodoAvanzado
                    value={filtroPeriodo}
                    onChange={handlePeriodoChange}
                    placeholder="Buscar y seleccionar período"
                    startYear={2020}
                    isDisabled={loading}
                    className="w-full h-full"
                />
              </div>
            </div>

            {/* Filtro por Método de Pago */}
            <div className="lg:col-span-3">
                <Select
                    placeholder="Todos los métodos"
                    selectedKeys={filtroMetodo !== "All" ? [filtroMetodo] : ["All"]}
                    onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] || "All";
                        handleMetodoFilterChange(value);
                    }}
                    aria-label="Filtrar por método"
                    variant="flat"
                    classNames={selectClassNames}
                >
                    <SelectItem key="All" value="All">Todos los métodos</SelectItem>
                    <SelectItem key="Efectivo" value="Efectivo">Efectivo</SelectItem>
                    <SelectItem key="Transferencia" value="Transferencia">Transferencia</SelectItem>
                    <SelectItem key="Tarjeta" value="Tarjeta">Tarjeta</SelectItem>
                    <SelectItem key="Cheque" value="Cheque">Cheque</SelectItem>
                </Select>
            </div>

            {/* Botón Limpiar Filtros */}
            <div className="lg:col-span-1 flex justify-end">
                {hasActiveFilters ? (
                    <Button 
                        variant="flat" 
                        onPress={clearFilters}
                        className="w-full font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-transparent shadow-none h-[52px] rounded-xl min-w-0"
                        isIconOnly
                        title="Limpiar filtros"
                    >
                        <HiFilter className="text-lg" />
                    </Button>
                ) : (
                    <div className="w-full h-[52px]"></div> 
                )}
            </div>
          </div>
        </div>

        {/* Sub-Header Paginación */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 bg-slate-50/40 dark:bg-zinc-900/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Mostrando <span className="text-emerald-600 dark:text-emerald-400">{paginatedData.length}</span> de <span className="text-slate-700 dark:text-zinc-200">{totalItems}</span> transacciones
            </span>

            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 hidden sm:block">
                    Filas por página:
                </span>
                <Select
                    size="sm"
                    aria-label="Por página"
                    className="w-24"
                    variant="flat"
                    selectedKeys={[rowsPerPage.toString()]}
                    onSelectionChange={(keys) => {
                        handleRowsPerPageChange(Array.from(keys)[0]);
                    }}
                    classNames={{
                        trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-none h-[36px]",
                        value: "font-bold text-slate-700 dark:text-zinc-300"
                    }}
                >
                    <SelectItem key="5" value="5">5</SelectItem>
                    <SelectItem key="10" value="10">10</SelectItem>
                    <SelectItem key="15" value="15">15</SelectItem>
                    <SelectItem key="20" value="20">20</SelectItem>
                    <SelectItem key="50" value="50">50</SelectItem>
                </Select>
            </div>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-zinc-950 flex flex-col w-full overflow-x-auto">
          <Table
            aria-label="Tabla de historial de pagos"
            removeWrapper
            classNames={{
                base: "min-h-[400px]",
                table: "min-w-full",
                th: "bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 py-4 px-6",
                td: "py-4 px-6 border-b border-slate-100 dark:border-zinc-800/50",
                tr: "hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors cursor-default"
            }}
          >
            <TableHeader>
              <TableColumn>DOCUMENTO</TableColumn>
              <TableColumn>ORDEN</TableColumn>
              <TableColumn>CLIENTE Y EQUIPO</TableColumn>
              <TableColumn>FECHA</TableColumn>
              <TableColumn>PAGADO / TOTAL</TableColumn>
              <TableColumn>RECIBIDO</TableColumn>
              <TableColumn>CAMBIO</TableColumn>
              <TableColumn>MÉTODO</TableColumn>
              <TableColumn align="end">ACCIONES</TableColumn>
            </TableHeader>
            <TableBody 
              emptyContent={
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400 dark:text-zinc-500">
                  <HiCash className="w-12 h-12 opacity-20 mb-3" />
                  <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">
                    {pagos.length === 0 && !loading ? "No hay pagos en este período" : "Sin coincidencias"}
                  </p>
                </div>
              }
            >
              {paginatedData.map((pago) => {
                const infoPagosFactura = obtenerInfoPagosPorFactura(pago.factura_id);
                const esPagoMultiple = infoPagosFactura.total > 1;
                const indicePago = infoPagosFactura.pagosOrdenados.findIndex(p => p.id === pago.id) + 1;

                return (
                  <TableRow key={pago.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-black text-sm text-slate-800 dark:text-zinc-100">
                          <span className="text-slate-400 font-normal mr-0.5">#P-</span>{pago.id}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded w-fit">
                          Fact: #{pago.factura_id}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded-lg shadow-sm">
                            {indicePago}<span className="text-slate-400">/{infoPagosFactura.total}</span>
                        </span>
                        {esPagoMultiple && (
                            <Chip size="sm" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[9px] uppercase tracking-widest px-1 h-5">Múltiple</Chip>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-slate-800 dark:text-zinc-100 truncate max-w-[200px]">
                            {pago.cliente_nombre}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500">
                            Medidor: <span className="font-mono text-slate-600 dark:text-zinc-400">{pago.medidor_numero_serie}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-slate-700 dark:text-zinc-200">
                            {formatFecha(pago.fecha_pago)}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                            Registro: {new Date(pago.fecha_creacion || pago.fecha_pago).toLocaleDateString('es-MX', {day: '2-digit', month: '2-digit', year:'2-digit'})}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-black text-lg text-emerald-600 dark:text-emerald-400 tracking-tight">
                            ${pago.monto?.toLocaleString("es-MX", { minimumFractionDigits: 2 }) || '0.00'}
                        </div>
                        {esPagoMultiple && (
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Total Factura: ${infoPagosFactura.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                        <div className="font-bold text-sm text-slate-700 dark:text-zinc-300">
                            ${pago.cantidad_entregada?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                        </div>
                    </TableCell>

                    <TableCell>
                        <div className="space-y-1">
                            <div className={`font-bold text-sm ${pago.cambio > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 dark:text-zinc-600'}`}>
                                ${pago.cambio?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                            </div>
                            {pago.cambio > 0 && (
                                <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded uppercase tracking-widest">
                                    Con Cambio
                                </span>
                            )}
                        </div>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="sm"
                        color={getMetodoColor(pago.metodo_pago)}
                        variant="flat"
                        className="font-bold text-[10px] uppercase tracking-widest px-1 h-6"
                      >
                        {pago.metodo_pago}
                      </Chip>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400 transition-colors rounded-lg"
                          onClick={() => verDetalle(pago)}
                          title="Ver Detalle del Pago"
                        >
                          <HiEye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Paginación Inferior */}
        {totalPages > 1 && (
          <div className="flex justify-center p-4 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/60 dark:bg-zinc-900/40">
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={setCurrentPage}
              showControls
              color="default"
              variant="flat"
              classNames={{
                  cursor: "bg-emerald-600 text-white font-bold shadow-md",
              }}
            />
          </div>
        )}
      </div>

      {/* Modales */}
      <ModalDetallePago
        isOpen={modalDetalle}
        onClose={() => setModalDetalle(false)}
        pago={pagoSeleccionado}
        obtenerInfoPagosPorFactura={obtenerInfoPagosPorFactura}
        getMetodoColor={getMetodoColor}
      />
    </div>
  );
};

export default TabPagos;