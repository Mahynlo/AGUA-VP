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
  User,
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
  HiCreditCard, 
  HiDownload, 
  HiX, 
  HiFilter, 
  HiDocumentText, 
  HiRefresh, 
  HiCalculator,
  HiSearch,
  HiArrowLeft
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useTabFacturas } from "../../../hooks/useTabFacturas";
import { usePagos } from "../../../context/PagosContext";
import SelectorPeriodoAvanzado from "../../ui/SelectorPeriodoAvanzado";
import { formatearPeriodo } from "../../../utils/periodoUtils";
import ModalDetalleFactura from "./ModalDetalleFactura";
import ModalPago from "./ModalPago";
import ModalPagoRapido from "./ModalPagoRapido";
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-[52px] w-full rounded-xl" />
          <Skeleton className="h-[52px] w-full rounded-xl" />
          <Skeleton className="h-[52px] w-full rounded-xl" />
          <Skeleton className="h-[52px] w-full rounded-xl" />
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-950">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 w-full border-b border-slate-100 dark:border-zinc-800/50 flex items-center px-6 gap-4">
             <Skeleton className="h-10 w-10 rounded-full shrink-0" />
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

const TabFacturas = () => {
  const navigate = useNavigate();

  const {
    facturas,
    paginatedData,
    loading,
    initialLoading,
    search,
    filtroEstado,
    filtroPeriodo,
    estados,
    currentPage,
    rowsPerPage,
    totalPages,
    totalItems,
    handleSearch,
    handleEstadoFilterChange,
    handlePeriodoChange,
    handleRowsPerPageChange,
    setCurrentPage,
    actualizarFacturas
  } = useTabFacturas();

  const { registrarPago } = usePagos();
  const { setSuccess } = useFeedback();

  // Estados para modales
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [modalPagoRapido, setModalPagoRapido] = useState(false);

  if (initialLoading) {
    return <LoadingSkeleton />;
  }

  const formatFechaLocal = (valor, options) => {
    if (!valor) return "N/A";
    const match = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = match
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : new Date(valor);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString('es-MX', options);
  };

  const periodoLabel = formatearPeriodo(filtroPeriodo);

  const handleVerDetalle = (factura) => {
    setFacturaSeleccionada(factura);
    setModalDetalle(true);
  };

  const handlePagar = (factura) => {
    setFacturaSeleccionada(factura);
    setModalPago(true);
  };

  const handleConfirmarPago = async (datoPago) => {
    if (!facturaSeleccionada) {
      throw new Error("No hay factura seleccionada");
    }

    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

    const pagoData = {
      factura_id: facturaSeleccionada.id,
      fecha_pago: datoPago.fecha_pago,
      cantidad_entregada: parseFloat(datoPago.cantidad_entregada),
      metodo_pago: datoPago.metodo_pago,
      comentario: datoPago.comentario || null,
      modificado_por: usuario.id || 1
    };

    await registrarPago(pagoData);
    await actualizarFacturas();
  };

  const hasActiveFilters = search || filtroEstado !== "All" || filtroPeriodo !== new Date().toISOString().slice(0, 7);

  const clearFilters = () => {
      handleSearch("");
      handleEstadoFilterChange("All");
      // Resetea el periodo al actual si es necesario (depende de tu hook)
  };

  // Regla de Tintes Local para Estados
  const getEstadoBadge = (estado) => {
    const estadoLower = String(estado || "").toLowerCase();
    if (estadoLower.includes("pagad")) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    if (estadoLower.includes("vencid")) return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
    if (estadoLower.includes("convenio")) return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    if (estadoLower.includes("pendient")) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    return "bg-slate-500/10 text-slate-600 dark:text-slate-400";
  };

  // Clases estandarizadas para Inputs Invisibles
  const selectClassNames = {
    trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none h-[52px]",
    value: "font-medium text-slate-700 dark:text-zinc-200 text-sm"
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* ── 1. HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 dark:bg-blue-900/30 rounded-2xl shrink-0">
            <HiDocumentText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                  Facturas y Cobros
              </h3>
              {loading && !initialLoading && (
                  <Spinner size="sm" color="primary" className="w-4 h-4 ml-1" />
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
              Periodo actual: <span className="text-blue-600 dark:text-blue-400 font-black">{periodoLabel}</span>
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
              onPress={() => actualizarFacturas()}
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
                  const success = await exportData(facturas, `Facturas_${new Date().toISOString().split('T')[0]}`, 'csv');
                  if (success) setSuccess("Archivo CSV generado exitosamente");
                }}
              >
                <span className="font-semibold text-slate-700 dark:text-zinc-200">Exportar CSV</span>
              </DropdownItem>
              <DropdownItem
                key="excel"
                startContent={<span className="text-xl">📊</span>}
                className="hover:bg-slate-50 dark:hover:bg-zinc-800"
                onPress={async () => {
                  const success = await exportData(facturas, `Facturas_${new Date().toISOString().split('T')[0]}`, 'xlsx');
                  if (success) setSuccess("Archivo Excel generado exitosamente");
                }}
              >
                <span className="font-semibold text-slate-700 dark:text-zinc-200">Exportar Excel (.xlsx)</span>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Botón Maestro */}
          <Button
            className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl h-11 px-6 shadow-sm transition-transform active:scale-95"
            startContent={<HiCalculator className="text-lg" />}
            onPress={() => setModalPagoRapido(true)}
            title="Modo rapido: marca los que NO pagaron y aplica al resto"
          >
            Modo Rápido
          </Button>
        </div>
      </div>

      {/* ── 2. CONTENEDOR PRINCIPAL: Filtros y Tabla ── */}
      <div className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-transparent rounded-2xl overflow-hidden flex flex-col">
        
        {/* Filtros */}
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            
            {/* Buscador */}
            <div className="lg:col-span-4 relative w-full flex items-center">
              <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                <HiSearch className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar cliente o N° Factura..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none h-[52px]"
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

            {/* Filtro por período (Selector Avanzado) */}
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

            {/* Filtro por estado */}
            <div className="lg:col-span-3">
                <Select
                    placeholder="Todos los estados"
                    selectedKeys={filtroEstado !== "All" ? [filtroEstado] : []}
                    onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] || "All";
                        handleEstadoFilterChange(value);
                    }}
                    aria-label="Filtrar por estado"
                    variant="flat"
                    classNames={selectClassNames}
                >
                    <SelectItem key="All" value="All">Todos</SelectItem>
                    {estados.map(estado => (
                        <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                </Select>
            </div>

            {/* Botón Limpiar */}
            <div className="lg:col-span-2 flex justify-end">
                {hasActiveFilters ? (
                    <Button 
                        variant="flat" 
                        color="default"
                        onPress={clearFilters}
                        className="w-full font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-transparent shadow-none h-[52px] rounded-xl"
                        startContent={<HiFilter className="text-lg" />}
                    >
                        Limpiar
                    </Button>
                ) : (
                    <div className="w-full h-[52px]"></div> 
                )}
            </div>
          </div>
        </div>

        {/* Sub-Header de Paginación */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 bg-slate-50/40 dark:bg-zinc-900/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Mostrando <span className="text-blue-600 dark:text-blue-400">{paginatedData.length}</span> de <span className="text-slate-700 dark:text-zinc-200">{totalItems}</span> facturas
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

        {/* Lista de Facturas (Tabla) */}
        <div className="bg-white dark:bg-zinc-950 flex flex-col w-full overflow-x-auto">
          <Table
            aria-label="Tabla de facturas"
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
              <TableColumn>TITULAR</TableColumn>
              <TableColumn>CONSUMO</TableColumn>
              <TableColumn>BALANCE</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn align="end">ACCIONES</TableColumn>
            </TableHeader>
            <TableBody 
              emptyContent={
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400 dark:text-zinc-500">
                  <HiDocumentText className="w-12 h-12 opacity-20 mb-3" />
                  <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">
                    {facturas.length === 0 && !loading ? "No hay facturas en este período" : "Sin coincidencias"}
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 mt-1 max-w-[250px] text-center">
                      Intenta cambiar los filtros o recarga la vista.
                  </p>
                </div>
              }
            >
              {paginatedData.map((factura) => (
                <TableRow key={factura.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-black text-sm text-slate-800 dark:text-zinc-100">
                        <span className="text-slate-400 font-normal mr-0.5">#</span>{factura.id}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                        Emisión: {formatFechaLocal(factura.fecha_emision, {day: '2-digit', month:'short', year:'numeric'})}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                        Vence: {formatFechaLocal(factura.fecha_vencimiento, {day: '2-digit', month:'2-digit', year:'numeric'})}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <User
                      name={<span className="font-bold text-sm text-slate-800 dark:text-zinc-100">{factura.cliente_nombre}</span>}
                      description={<span className="font-medium text-[11px] text-slate-500 max-w-[200px] truncate block">{factura.direccion_cliente}</span>}
                      avatarProps={{
                        name: factura.cliente_nombre?.charAt(0) || "C",
                        size: "sm",
                        className: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold border border-slate-200 dark:border-zinc-700 shadow-sm"
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1.5">
                      <div className="font-bold text-sm text-slate-700 dark:text-zinc-200">
                          {factura.consumo_m3} <span className="text-[10px] uppercase tracking-widest text-slate-400">m³</span>
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md w-fit">
                        ${factura.costo_por_m3} / m³
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1.5">
                      <div className="font-black text-lg text-emerald-600 dark:text-emerald-400 tracking-tight">
                          ${factura.total?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </div>
                      {factura.saldo_pendiente > 0 && (
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                          Resta: ${factura.saldo_pendiente?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      className={`font-bold text-[10px] uppercase tracking-widest px-1 h-6 ${getEstadoBadge(factura.estado)}`}
                    >
                      {factura.estado}
                    </Chip>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400 transition-colors rounded-lg"
                        onClick={() => handleVerDetalle(factura)}
                        title="Ver Detalle"
                      >
                        <HiEye className="w-4 h-4" />
                      </Button>

                      {/* Botón Cobrar Dinámico */}
                      {factura.saldo_pendiente > 0 && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          className={`rounded-lg transition-colors ${
                            factura.estado === 'En Convenio' || factura.convenio_id
                              ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400"
                          }`}
                          onClick={() => handlePagar(factura)}
                          title={
                            factura.estado === 'En Convenio' || factura.convenio_id
                              ? "Cobro Integrado Convenio"
                              : "Registrar Pago"
                          }
                        >
                          {factura.estado === 'En Convenio' || factura.convenio_id
                            ? <HiCalculator className="w-4 h-4" />
                            : <HiCreditCard className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
                  cursor: "bg-slate-800 text-white dark:bg-zinc-200 dark:text-slate-900 font-bold shadow-sm",
              }}
            />
          </div>
        )}
      </div>

      {/* Modales */}
      <ModalDetalleFactura
        isOpen={modalDetalle}
        onClose={() => setModalDetalle(false)}
        factura={facturaSeleccionada}
      />

      <ModalPago
        isOpen={modalPago}
        onClose={() => {
          setModalPago(false);
          setFacturaSeleccionada(null);
        }}
        factura={facturaSeleccionada}
        onConfirmarPago={handleConfirmarPago}
        onPagoRegistrado={actualizarFacturas}
      />

      <ModalPagoRapido
        isOpen={modalPagoRapido}
        onClose={() => setModalPagoRapido(false)}
        periodo={filtroPeriodo}
        onPagoRegistrado={actualizarFacturas}
      />
    </div>
  );
};

export default TabFacturas;


