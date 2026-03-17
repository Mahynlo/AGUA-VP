import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Badge,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Input,
  User,
  Pagination,
  Spinner,
  Skeleton
} from "@nextui-org/react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import { HiEye, HiCreditCard, HiCalendar, HiCurrencyDollar } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useTabFacturas } from "../../../hooks/useTabFacturas";
import { usePagos } from "../../../context/PagosContext";
import SelectorPeriodoAvanzado from "../../ui/SelectorPeriodoAvanzado";
import { formatearPeriodo } from "../../../utils/periodoUtils";
import ModalDetalleFactura from "./ModalDetalleFactura";
import ModalPago from "./ModalPago";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { HiDownload } from "react-icons/hi";
import { exportData } from "../../../utils/exportUtils";
import { useFeedback } from "../../../context/FeedbackContext";

const TabFacturas = () => {
  const navigate = useNavigate();

  // Usar el hook personalizado (patrón de Clientes)
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
    estadisticas,
    handleSearch,
    handleEstadoFilterChange,
    handlePeriodoChange,
    handleRowsPerPageChange,
    setCurrentPage,
    getStatusColor,
    actualizarFacturas
  } = useTabFacturas();

  const { registrarPago } = usePagos();
  const { setSuccess, setError } = useFeedback();

  // Estados para modales
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

  // Componente de skeleton loading
  const LoadingSkeleton = () => (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded" />
          <Skeleton className="h-10 w-24 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );

  // Solo mostrar skeleton en la carga inicial
  if (initialLoading) {
    return <LoadingSkeleton />;
  }

  // Obtener etiqueta del período seleccionado
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

    // Los errores se propagan al catch de ModalPago que muestra el estado de error
    await registrarPago(pagoData);
    await actualizarFacturas();
    // El modal maneja su propio cierre desde el estado 'exito'
  };

  // Mostrar loading skeleton si es la carga inicial
  if (initialLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Facturas</h1>
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
                  const success = await exportData(facturas, `Facturas_${new Date().toISOString().split('T')[0]}`, 'csv');
                  if (success) setSuccess("Archivo CSV generado exitosamente");
                }}
              >
                Exportar CSV
              </DropdownItem>
              <DropdownItem
                key="excel"
                startContent={<span className="text-xl">📊</span>}
                onPress={async () => {
                  const success = await exportData(facturas, `Facturas_${new Date().toISOString().split('T')[0]}`, 'xlsx');
                  if (success) setSuccess("Archivo Excel generado exitosamente");
                }}
              >
                Exportar Excel (.xlsx)
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Button
            color="primary"
            onClick={() => actualizarFacturas()}
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
                  placeholder="Buscar por cliente o ID de factura..."
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
            <SelectorPeriodoAvanzado
              value={filtroPeriodo}
              onChange={handlePeriodoChange}
              label="Período"
              placeholder="Buscar y seleccionar período"
              startYear={2020}
              size="sm"
              isDisabled={loading}
            />

            {/* Filtro por estado */}
            <Select
              label="Estado"
              placeholder="Todos los estados"
              selectedKeys={filtroEstado !== "All" ? [filtroEstado] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] || "All";
                handleEstadoFilterChange(value);
              }}
            >
              <SelectItem key="All" value="All">Todos los estados</SelectItem>
              {estados.map(estado => (
                <SelectItem key={estado} value={estado}>{estado}</SelectItem>
              ))}
            </Select>

            {/* Selector de filas por página */}
            <Select
              label="Por página"
              selectedKeys={[rowsPerPage.toString()]}
              onSelectionChange={(keys) => {
                handleRowsPerPageChange(Array.from(keys)[0]);
              }}
            >
              <SelectItem key="5" value="5">5</SelectItem>
              <SelectItem key="10" value="10">10</SelectItem>
              <SelectItem key="15" value="15">15</SelectItem>
              <SelectItem key="20" value="20">20</SelectItem>
            </Select>
          </div>

          {/* Información de resultados */}
          <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Mostrando {paginatedData.length} de {totalItems} facturas
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Tabla de facturas */}
      <Card>
        <CardBody className="p-0">
          <Table
            aria-label="Tabla de facturas"
            classNames={{
              wrapper: "min-h-[400px]",
            }}
          >
            <TableHeader>
              <TableColumn>FACTURA</TableColumn>
              <TableColumn>CLIENTE</TableColumn>
              <TableColumn>CONSUMO</TableColumn>
              <TableColumn>MONTO</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn align="center">ACCIONES</TableColumn>
            </TableHeader>
            <TableBody emptyContent={
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {facturas.length === 0 ? "No hay facturas disponibles para este período" : "No hay facturas que coincidan con los filtros seleccionados"}
                </p>
              </div>
            }>
              {paginatedData.map((factura) => (
                <TableRow key={factura.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">#{factura.id}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(factura.fecha_emision).toLocaleDateString('es-MX')}
                      </div>
                      <div className="text-xs text-gray-400">
                        Vence: {new Date(factura.fecha_vencimiento).toLocaleDateString('es-MX')}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <User
                      name={factura.cliente_nombre}
                      description={factura.direccion_cliente}
                      avatarProps={{
                        name: factura.cliente_nombre?.charAt(0) || "C",
                        size: "sm",
                        className: "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{factura.consumo_m3} m³</div>
                      <div className="text-xs text-gray-500">
                        ${factura.costo_por_m3} / m³
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-bold text-lg">${factura.total?.toLocaleString()}</div>
                      {factura.saldo_pendiente > 0 && (
                        <div className="text-sm text-red-600">
                          Pendiente: ${factura.saldo_pendiente?.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="sm"
                      color={getStatusColor(factura.estado)}
                      variant="flat"
                    >
                      {factura.estado}
                    </Chip>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="primary"
                        onClick={() => handleVerDetalle(factura)}
                      >
                        <HiEye className="w-4 h-4" />
                      </Button>


                      {/* Solo mostrar botón de pago si NO está en convenio */}
                      {factura.saldo_pendiente > 0 && !factura.convenio_id && factura.estado !== 'En Convenio' && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="success"
                          onClick={() => handlePagar(factura)}
                        >
                          <HiCreditCard className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center">
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
      />
    </div>
  );
};

export default TabFacturas;

