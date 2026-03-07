import { useState, useEffect } from "react";
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
  Pagination,
  Skeleton,
} from "@nextui-org/react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import { HiEye, HiCurrencyDollar, HiCash, HiCalendar, HiDownload } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useTabPagos } from "../../../hooks/useTabPagos";
import ModalDetallePago from "./ModalDetallePago";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { exportData } from "../../../utils/exportUtils";
import { useFeedback } from "../../../context/FeedbackContext";

// Componente LoadingSkeleton en línea (mismo patrón que Clientes/Facturas)
const LoadingSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="rounded-lg">
      <div className="h-24 rounded-lg bg-default-300"></div>
    </Skeleton>
    <div className="space-y-3">
      <Skeleton className="w-3/5 rounded-lg">
        <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
      </Skeleton>
      <Skeleton className="w-4/5 rounded-lg">
        <div className="h-3 w-4/5 rounded-lg bg-default-200"></div>
      </Skeleton>
      <Skeleton className="w-2/5 rounded-lg">
        <div className="h-3 w-2/5 rounded-lg bg-default-300"></div>
      </Skeleton>
    </div>
  </div>
);

const TabPagos = () => {
  const navigate = useNavigate();

  // Usar el hook personalizado (patrón consistente)
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
    resumen,
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

  // Generar opciones de períodos (últimos 12 meses)
  const generarOpcionesPeriodos = () => {
    const opciones = [];
    const fechaActual = new Date();

    for (let i = 0; i < 12; i++) {
      const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
      const año = fecha.getFullYear();
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const periodo = `${año}-${mes}`;

      const nombreMes = fecha.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
      opciones.push({
        value: periodo,
        label: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)
      });
    }
    return opciones;
  };

  const opcionesPeriodos = generarOpcionesPeriodos();

  // Obtener etiqueta del período seleccionado
  const periodoLabel = opcionesPeriodos.find(p => p.value === filtroPeriodo)?.label || filtroPeriodo;

  // Función para detectar múltiples pagos por factura
  const obtenerInfoPagosPorFactura = (facturaId) => {
    const pagosDeFactura = pagos?.filter(pago => pago.factura_id === facturaId) || [];
    return {
      total: pagosDeFactura.length,
      montoTotal: pagosDeFactura.reduce((sum, pago) => sum + (pago.monto || 0), 0),
      pagosOrdenados: pagosDeFactura.sort((a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion))
    };
  };

  // Función para formatear fecha
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Función para ver detalles del pago
  const verDetalle = (pago) => {
    setPagoSeleccionado(pago);
    setModalDetalle(true);
  };

  if (initialLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Pagos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Periodo: <span className="font-semibold text-primary">{periodoLabel}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Dropdown>
            <DropdownTrigger>
              <Button
                color="success"
                className="text-white"
                startContent={<HiDownload className="text-lg" />}
              >
                Exportar
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Opciones de exportación">
              <DropdownItem
                key="csv"
                startContent={<span className="text-xl">📄</span>}
                onPress={async () => {
                  const success = await exportData(paginatedData, `Pagos_${new Date().toISOString().split('T')[0]}`, 'csv');
                  if (success) setSuccess("Archivo CSV generado exitosamente");
                }}
              >
                Exportar CSV
              </DropdownItem>
              <DropdownItem
                key="excel"
                startContent={<span className="text-xl">📊</span>}
                onPress={async () => {
                  const success = await exportData(paginatedData, `Pagos_${new Date().toISOString().split('T')[0]}`, 'xlsx');
                  if (success) setSuccess("Archivo Excel generado exitosamente");
                }}
              >
                Exportar Excel (.xlsx)
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Button
            color="primary"
            onClick={() => actualizarPagos()}
            isLoading={loading}
          >
            {loading ? "Cargando..." : "Recargar Datos"}
          </Button>
          <Button color="default" variant="bordered" onClick={() => navigate(-1)}>
            <FlechaReturnIcon className="w-6 h-6" />
            <span className="ml-2">Volver</span>
          </Button>
        </div>
      </div>

      {/* Filtros y controles - KPIs movidos a PagosVista */}

      {/* Filtros y controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Filtros y Búsqueda</h3>
            {loading && !initialLoading && (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div className="lg:col-span-2">
              <div className="relative w-full flex">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <SearchIcon className="inline-block mr-2" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por ID, factura, cliente, medidor..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="border border-gray-300 text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
                {search && (
                  <button
                    onClick={() => handleSearch("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filtro por período */}
            <Select
              label="Período"
              placeholder="Seleccionar período"
              selectedKeys={filtroPeriodo ? [filtroPeriodo] : []}
              onChange={handlePeriodoChange}
              className="w-full"
              variant="bordered"
              startContent={<HiCalendar className="w-4 h-4 text-gray-500" />}
            >
              {opcionesPeriodos.map((opcion) => (
                <SelectItem
                  key={opcion.value}
                  value={opcion.value}
                  textValue={opcion.label}
                >
                  {opcion.label}
                </SelectItem>
              ))}
            </Select>

            {/* Filtro por método de pago */}
            <Select
              label="Método de pago"
              placeholder="Todos los métodos"
              selectedKeys={filtroMetodo !== "All" ? [filtroMetodo] : ["All"]}
              onSelectionChange={handleMetodoFilterChange}
            >
              <SelectItem key="All">Todos los métodos</SelectItem>
              <SelectItem key="Efectivo">Efectivo</SelectItem>
              <SelectItem key="Transferencia">Transferencia</SelectItem>
              <SelectItem key="Tarjeta">Tarjeta</SelectItem>
              <SelectItem key="Cheque">Cheque</SelectItem>
            </Select>

            {/* Selector de filas por página */}
            <Select
              label="Por página"
              selectedKeys={[rowsPerPage.toString()]}
              onChange={handleRowsPerPageChange}
            >
              <SelectItem key="5" value="5">5</SelectItem>
              <SelectItem key="10" value="10">10</SelectItem>
              <SelectItem key="15" value="15">15</SelectItem>
              <SelectItem key="20" value="20">20</SelectItem>
              <SelectItem key="50" value="50">50</SelectItem>
            </Select>
          </div>

          {/* Información de resultados */}
          <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Mostrando {paginatedData.length} resultados de {totalItems} encontrados
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Tabla de Pagos */}
      <Card>
        <CardBody className="p-0">
          <Table
            aria-label="Tabla de pagos"
            classNames={{
              wrapper: "min-h-[400px]",
            }}
          >
            <TableHeader>
              <TableColumn>ID PAGO</TableColumn>
              <TableColumn>NÚMERO</TableColumn>
              <TableColumn>CLIENTE</TableColumn>
              <TableColumn>FECHA</TableColumn>
              <TableColumn>FACTURA</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>MONTO PAGADO</TableColumn>
              <TableColumn>MONTO ENTREGADO</TableColumn>
              <TableColumn>CAMBIO</TableColumn>
              <TableColumn>MÉTODO</TableColumn>
              <TableColumn align="center">ACCIONES</TableColumn>
            </TableHeader>

            <TableBody emptyContent={
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {paginatedData.length === 0 && !loading ? (
                    <>No hay pagos que coincidan con los filtros seleccionados</>
                  ) : (
                    <>Cargando datos...</>
                  )}
                </p>
              </div>
            }>
              {paginatedData.map((pago) => {
                const infoPagosFactura = obtenerInfoPagosPorFactura(pago.factura_id);
                const esPagoMultiple = infoPagosFactura.total > 1;
                const indicePago = infoPagosFactura.pagosOrdenados.findIndex(p => p.id === pago.id) + 1;

                return (
                  <TableRow key={pago.id}>
                    <TableCell>
                      <div className="font-medium">#{pago.id}</div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{indicePago}/{infoPagosFactura.total}</div>
                        {esPagoMultiple && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Múltiple
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{pago.cliente_nombre}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {pago.medidor_numero_serie}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{formatFecha(pago.fecha_pago)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(pago.fecha_pago).toLocaleDateString('es-MX')}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">#{pago.factura_id}</div>
                        {esPagoMultiple && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Total: ${infoPagosFactura.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="sm"
                        color={pago.estado_factura === 'Pagado' ? 'success' : 'warning'}
                        variant="flat"
                      >
                        {pago.estado_factura}
                      </Chip>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-bold text-lg">${pago.monto?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">${pago.cantidad_entregada?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className={`font-medium ${pago.cambio > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          ${pago.cambio?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                        </div>
                        {pago.cambio > 0 && (
                          <div className="text-xs text-orange-500 dark:text-orange-400">
                            Con cambio
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="sm"
                        color={getMetodoColor(pago.metodo_pago)}
                        variant="flat"
                      >
                        {pago.metodo_pago}
                      </Chip>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="primary"
                          onClick={() => verDetalle(pago)}
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
        </CardBody>
      </Card>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center py-4">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
            showShadow
            color="primary"
          />
        </div>
      )}

      {/* Modal de Detalle */}
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
