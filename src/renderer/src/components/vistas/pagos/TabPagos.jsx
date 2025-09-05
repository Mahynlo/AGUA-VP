import { useState, useEffect } from "react";
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
  Pagination,
  Skeleton,
  Divider
} from "@nextui-org/react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import { HiEye, HiCreditCard, HiCalendar, HiCurrencyDollar, HiCash, HiRefresh } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { usePagos } from "../../../context/PagosContext";
import ModalDetallePago from "./ModalDetallePago";

const TabPagos = () => {
  const navigate = useNavigate();
  const { 
    pagos, 
    resumen,
    loading, 
    initialLoading,
    error,
    fetchPagos
  } = usePagos();
  
  // Estados locales para filtros y paginación
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroMetodo, setFiltroMetodo] = useState("all");
  const [filtroPeriodo, setFiltroPeriodo] = useState("2025-08"); // Período actual por defecto
  const [pagina, setPagina] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  
  // Estados para modales
  const [modalDetalle, setModalDetalle] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);

  // Cargar pagos al montar el componente
  useEffect(() => {
    console.log("🔄 TabPagos montado, iniciando fetch de pagos para período:", filtroPeriodo);
    fetchPagos(filtroPeriodo);
  }, []);

  // Log de cambios en los datos
  useEffect(() => {
    console.log("📊 Datos de pagos actualizados:", {
      pagosLength: pagos?.length || 0,
      resumen: resumen,
      loading: loading,
      initialLoading: initialLoading,
      error: error,
      periodoActual: filtroPeriodo
    });
  }, [pagos, resumen, loading, initialLoading, error, filtroPeriodo]);

  // Generar opciones de períodos (últimos 12 meses como en TabFacturas)
  const generarOpcionesPeriodos = () => {
    const opciones = [];
    const fechaActual = new Date();
    
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
      const año = fecha.getFullYear();
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const periodo = `${año}-${mes}`;
      
      const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      opciones.push({
        value: periodo,
        label: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)
      });
    }
    
    return opciones;
  };

  const opcionesPeriodos = generarOpcionesPeriodos();

  // Función para cambiar período y hacer fetch
  const handleCambioPeriodo = async (nuevoPeriodo) => {
    console.log("�️ Cambiando período a:", nuevoPeriodo);
    setFiltroPeriodo(nuevoPeriodo);
    setPagina(1);
    await fetchPagos(nuevoPeriodo);
  };

  // Función para detectar múltiples pagos por factura
  const obtenerInfoPagosPorFactura = (facturaId) => {
    const pagosDeFactura = pagos?.filter(pago => pago.factura_id === facturaId) || [];
    return {
      total: pagosDeFactura.length,
      montoTotal: pagosDeFactura.reduce((sum, pago) => sum + (pago.monto || 0), 0),
      pagosOrdenados: pagosDeFactura.sort((a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion))
    };
  };

  // Filtrar pagos (sin filtro de período porque ya se hace en el fetch)
  const pagosFiltrados = pagos?.filter(pago => {
    const matchTexto = !filtroTexto || 
      pago.id.toString().includes(filtroTexto) ||
      pago.factura_id.toString().includes(filtroTexto) ||
      pago.metodo_pago.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      pago.comentario?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      pago.cliente_nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      pago.medidor_numero_serie?.toLowerCase().includes(filtroTexto.toLowerCase());
    
    const matchMetodo = filtroMetodo === "all" || pago.metodo_pago === filtroMetodo;
    
    return matchTexto && matchMetodo;
  }) || [];

  // Debug: Log para verificar filtros (simplificado)
  useEffect(() => {
    console.log("🔍 Estado de filtros:", {
      filtroTexto,
      filtroMetodo,
      filtroPeriodo,
      totalPagos: pagos?.length || 0,
      pagosFiltrados: pagosFiltrados.length
    });
  }, [filtroTexto, filtroMetodo, filtroPeriodo, pagos, pagosFiltrados]);

  // Paginación
  const totalPaginas = Math.ceil(pagosFiltrados.length / itemsPorPagina);
  const indiceInicio = (pagina - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const pagosPaginados = pagosFiltrados.slice(indiceInicio, indiceFin);

  // Función para obtener el color del chip según el método de pago
  const getMetodoColor = (metodo) => {
    const colors = {
      'Efectivo': 'success',
      'Transferencia': 'primary',
      'Tarjeta': 'secondary',
      'Cheque': 'warning'
    };
    return colors[metodo] || 'default';
  };

  // Función para formatear fecha
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Función para formatear fecha y hora
  const formatFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para ver detalles del pago
  const verDetalle = (pago) => {
    setPagoSeleccionado(pago);
    setModalDetalle(true);
  };

  // Función para actualizar datos
  const handleActualizar = async () => {
    await fetchPagos();
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="text-center p-8">
            <p className="text-danger text-lg mb-4">
              Error al cargar los pagos: {error.message || error}
            </p>
            <Button 
              color="primary" 
              onClick={handleActualizar}
              className="mt-4"
            >
              Reintentar
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Historial de Pagos
        </h1>
        <div className="flex gap-2">
          <Button
            color="primary"
            onClick={handleActualizar}
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

      {/* Estadísticas rápidas */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardBody className="text-center p-6">
              <div className="flex items-center justify-center mb-2">
                <HiCurrencyDollar className="w-6 h-6 mr-2" />
                <p className="text-2xl font-bold">${(resumen.total_pagado || 0).toLocaleString()}</p>
              </div>
              <p className="text-sm opacity-90">Total Pagado</p>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardBody className="text-center p-6">
              <div className="flex items-center justify-center mb-2">
                <HiCash className="w-6 h-6 mr-2" />
                <p className="text-2xl font-bold">{resumen.cantidad_pagos || 0}</p>
              </div>
              <p className="text-sm opacity-90">Total Pagos</p>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardBody className="text-center p-6">
              <div className="flex items-center justify-center mb-2">
                <HiCalendar className="w-6 h-6 mr-2" />
                <p className="text-2xl font-bold">${(resumen.promedio_pago || 0).toLocaleString()}</p>
              </div>
              <p className="text-sm opacity-90">Promedio por Pago</p>
            </CardBody>
          </Card>
        </div>
      )}

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
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="border border-gray-300 text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
                {filtroTexto && (
                  <button
                    onClick={() => setFiltroTexto("")}
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
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                if (value) {
                  handleCambioPeriodo(value);
                }
              }}
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
              selectedKeys={filtroMetodo !== "all" ? [filtroMetodo] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                setFiltroMetodo(value || "all");
                setPagina(1);
              }}
            >
              <SelectItem key="all">Todos los métodos</SelectItem>
              <SelectItem key="Efectivo">Efectivo</SelectItem>
              <SelectItem key="Transferencia">Transferencia</SelectItem>
              <SelectItem key="Tarjeta">Tarjeta</SelectItem>
              <SelectItem key="Cheque">Cheque</SelectItem>
            </Select>
            
            {/* Selector de filas por página */}
            <Select
              label="Por página"
              selectedKeys={[itemsPorPagina.toString()]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                setItemsPorPagina(parseInt(value));
                setPagina(1);
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
              Mostrando {pagosPaginados.length} de {pagosFiltrados.length} pagos
              {pagosFiltrados.length !== (pagos?.length || 0) && ` (filtrado de ${pagos?.length || 0} total)`}
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Tabla de Pagos con estilo exacto de TabFacturas */}
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
                  {pagos?.length === 0 ? (
                    <>No hay pagos para el período {opcionesPeriodos.find(o => o.value === filtroPeriodo)?.label || filtroPeriodo}</>
                  ) : (
                    <>No hay pagos que coincidan con los filtros seleccionados</>
                  )}
                </p>
              </div>
            }>
              {pagosPaginados.map((pago) => {
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
                          {new Date(pago.fecha_pago).toLocaleDateString('es-ES')}
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

      {/* Paginación - solo si hay más de una página */}
      {totalPaginas > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPaginas}
            page={pagina}
            onChange={setPagina}
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
