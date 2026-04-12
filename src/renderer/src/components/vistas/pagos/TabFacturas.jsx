import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
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
  DropdownItem
} from "@nextui-org/react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import { HiEye, HiCreditCard, HiDownload, HiX, HiFilter, HiDocumentText, HiRefresh, HiCalculator } from "react-icons/hi";
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
    getStatusColor,
    actualizarFacturas
  } = useTabFacturas();

  const { registrarPago } = usePagos();
  const { setSuccess } = useFeedback();

  // Estados para modales
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [modalPagoRapido, setModalPagoRapido] = useState(false);

  // Componente de skeleton loading premium
  const LoadingSkeleton = () => (
    <div className="space-y-6 w-full">
      <Card className="border-none shadow-sm rounded-2xl">
        <CardBody className="p-6 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-10 w-48 rounded-xl" />
            <div className="flex gap-2">
                <Skeleton className="h-10 w-32 rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-none shadow-sm rounded-2xl">
        <CardBody className="p-0">
            <Skeleton className="h-12 w-full rounded-none border-b border-gray-100" />
            {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-none border-b border-gray-50" />
            ))}
        </CardBody>
      </Card>
    </div>
  );

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

  const selectClassNames = {
    trigger: "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors h-11",
    value: "font-medium text-slate-700 dark:text-zinc-200 text-sm"
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      
      {/* ── SECCIÓN 1: FILTROS Y ACCIONES ── */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
              <HiDocumentText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                    Facturas y Cobros
                </h3>
                {loading && !initialLoading && (
                    <Spinner size="sm" color="primary" className="w-4 h-4 ml-1" />
                )}
              </div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                Periodo actual: <span className="text-blue-600 dark:text-blue-400 font-black">{periodoLabel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <Button 
                color="default" 
                variant="flat" 
                onPress={() => navigate(-1)}
                className="bg-slate-100 dark:bg-zinc-800 font-bold text-slate-600 dark:text-zinc-300"
                startContent={<FlechaReturnIcon className="w-5 h-5" />}
                isIconOnly
                title="Volver"
            />
            
            <Button
                color="primary"
                variant="flat"
                className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold"
                onPress={() => actualizarFacturas()}
                startContent={!loading && <HiRefresh className="text-lg" />}
                isLoading={loading}
            >
              Recargar
            </Button>

            <Dropdown>
              <DropdownTrigger>
                <Button
                  color="success"
                  className="font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 shadow-sm"
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

            <Button
              color="success"
              variant="flat"
              className="font-bold bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
              startContent={<HiCalculator className="text-lg" />}
              onPress={() => setModalPagoRapido(true)}
              title="Modo rapido: marca los que NO pagaron y aplica al resto"
            >
              Modo rapido
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-6 bg-slate-50/50 dark:bg-black/10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            
            {/* Buscador */}
            <div className="lg:col-span-4 relative w-full flex items-center">
              <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                <SearchIcon className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar cliente o N° Factura..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm h-11"
              />
              {search && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro por período */}
            <div className="lg:col-span-4">
                <SelectorPeriodoAvanzado
                    value={filtroPeriodo}
                    onChange={handlePeriodoChange}
                    placeholder="Buscar y seleccionar período"
                    startYear={2020}
                    size="sm"
                    isDisabled={loading}
                    className="w-full h-11"
                />
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
                    variant="bordered"
                    classNames={selectClassNames}
                >
                    <SelectItem key="All" value="All">Todos</SelectItem>
                    {estados.map(estado => (
                        <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                </Select>
            </div>

            <div className="lg:col-span-1 flex justify-end">
                {hasActiveFilters ? (
                    <Button 
                        variant="flat" 
                        color="default"
                        onPress={clearFilters}
                        className="w-full font-bold text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm h-11 min-w-0"
                        isIconOnly
                        title="Limpiar filtros"
                    >
                        <HiFilter className="text-slate-400 text-lg" />
                    </Button>
                ) : (
                    <div className="w-full h-11"></div> 
                )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── SECCIÓN 2: TABLA DE DATOS ── */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
        {/* Cabecera interna de tabla */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4">
            <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">
                Mostrando <span className="text-blue-600 dark:text-blue-400">{paginatedData.length}</span> de <span className="text-slate-800 dark:text-zinc-200">{totalItems}</span> facturas
            </span>

            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
                    Filas por página:
                </span>
                <Select
                    size="sm"
                    aria-label="Por página"
                    className="w-24"
                    variant="bordered"
                    selectedKeys={[rowsPerPage.toString()]}
                    onSelectionChange={(keys) => {
                        handleRowsPerPageChange(Array.from(keys)[0]);
                    }}
                    classNames={{
                        trigger: "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 shadow-sm rounded-lg",
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

        <CardBody className="p-0">
          <Table
            aria-label="Tabla de facturas"
            removeWrapper
            classNames={{
                base: "min-h-[400px]",
                table: "min-w-full",
                thead: "bg-slate-50 dark:bg-zinc-800/50",
                th: "bg-transparent text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px] py-3 border-b border-slate-200 dark:border-zinc-700",
                td: "py-3 border-b border-slate-100 dark:border-zinc-800/50",
                tr: "hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors cursor-default"
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
            <TableBody emptyContent={
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400 dark:text-zinc-500">
                <HiDocumentText className="w-12 h-12 opacity-20 mb-2" />
                <p className="font-bold">
                  {facturas.length === 0 ? "No hay facturas en este período" : "Sin coincidencias"}
                </p>
              </div>
            }>
              {paginatedData.map((factura) => (
                <TableRow key={factura.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-slate-800 dark:text-zinc-100">
                        <span className="text-slate-400 font-normal mr-0.5">#</span>{factura.id}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500">
                        Emisión: {formatFechaLocal(factura.fecha_emision, {day: '2-digit', month:'short', year:'numeric'})}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Vence: {formatFechaLocal(factura.fecha_vencimiento, {day: '2-digit', month:'2-digit', year:'numeric'})}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <User
                      name={<span className="font-bold text-sm text-slate-800 dark:text-zinc-100">{factura.cliente_nombre}</span>}
                      description={<span className="font-medium text-[11px] text-slate-500 max-w-[150px] truncate block">{factura.direccion_cliente}</span>}
                      avatarProps={{
                        name: factura.cliente_nombre?.charAt(0) || "C",
                        size: "sm",
                        className: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold"
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-slate-700 dark:text-zinc-200">
                          {factura.consumo_m3} <span className="text-xs text-slate-400">m³</span>
                      </div>
                      <div className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded w-fit">
                        ${factura.costo_por_m3} / m³
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                          ${factura.total?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </div>
                      {factura.saldo_pendiente > 0 && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                          Resta: ${factura.saldo_pendiente?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="sm"
                      color={getStatusColor(factura.estado)}
                      variant="flat"
                      className="font-bold text-[10px] uppercase tracking-wider px-1 h-6"
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
                        className="bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 dark:bg-zinc-800 dark:hover:bg-blue-900/30 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
                        onClick={() => handleVerDetalle(factura)}
                        title="Ver Detalle"
                      >
                        <HiEye className="w-4 h-4" />
                      </Button>

                      {/* Mostrar pago para factura normal y para flujo integrado de convenio */}
                      {factura.saldo_pendiente > 0 && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          className={
                            factura.estado === 'En Convenio' || factura.convenio_id
                              ? "bg-blue-50 hover:bg-blue-200 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/50 dark:text-blue-400 transition-colors"
                              : "bg-emerald-50 hover:bg-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/50 dark:text-emerald-400 transition-colors"
                          }
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

          {/* Paginación Inferior */}
          {totalPages > 1 && (
            <div className="flex justify-center p-4 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                color="primary"
                variant="light"
                classNames={{
                    cursor: "bg-blue-600 text-white font-bold shadow-md",
                }}
              />
            </div>
          )}
        </CardBody>
      </Card>

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

