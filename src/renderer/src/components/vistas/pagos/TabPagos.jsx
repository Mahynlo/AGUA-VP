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
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Pagination,
  Skeleton,
  Divider
} from "@nextui-org/react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import { HiEye, HiCreditCard, HiCalendar, HiCurrencyDollar, HiCash, HiRefresh } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { usePagos } from "../../../context/PagosContext";

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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {filtroTexto && (
                  <button
                    onClick={() => setFiltroTexto("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800"
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
            
            {/* Filas por página */}
            <Select
              label="Filas por página"
              selectedKeys={[itemsPorPagina.toString()]}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                setItemsPorPagina(parseInt(value));
                setPagina(1);
              }}
            >
              <SelectItem key="10">10</SelectItem>
              <SelectItem key="25">25</SelectItem>
              <SelectItem key="50">50</SelectItem>
              <SelectItem key="100">100</SelectItem>
            </Select>
          </div>
          
          {/* Información sobre período seleccionado */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <HiCalendar className="w-4 h-4" />
                Mostrando datos de: {opcionesPeriodos.find(o => o.value === filtroPeriodo)?.label || filtroPeriodo}
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {pagos?.length || 0} pagos encontrados
              </span>
            </div>
            
            {/* Botón para limpiar filtros */}
            {(filtroTexto || filtroMetodo !== "all") && (
              <Button
                size="sm"
                variant="flat"
                color="warning"
                onPress={() => {
                  setFiltroTexto("");
                  setFiltroMetodo("all");
                  setPagina(1);
                }}
              >
                Limpiar Filtros
              </Button>
            )}
          </div>
          
          {/* Información sobre filtros activos */}
          {(filtroTexto || filtroMetodo !== "all") && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filtroTexto && (
                <Chip 
                  size="sm" 
                  color="primary" 
                  variant="flat"
                  onClose={() => setFiltroTexto("")}
                >
                  Texto: "{filtroTexto}"
                </Chip>
              )}
              {filtroMetodo !== "all" && (
                <Chip 
                  size="sm" 
                  color="secondary" 
                  variant="flat"
                  onClose={() => setFiltroMetodo("all")}
                >
                  Método: {filtroMetodo}
                </Chip>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tabla de Pagos con estilo de TabFacturas */}
      <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/80 to-purple-50/80">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Lista de Pagos
            </h2>
            <Badge content={pagosFiltrados.length} color="primary" className="bg-gradient-to-r from-blue-500 to-purple-500">
              <span className="text-sm text-gray-600">Total</span>
            </Badge>
          </div>
        </div>
        
        <div className="p-6">
          {initialLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : pagosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <HiCash className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              {pagos?.length === 0 ? (
                <>
                  <p className="text-gray-500 text-lg">No hay pagos registrados</p>
                  <p className="text-gray-400 text-sm">
                    No hay pagos para el período {opcionesPeriodos.find(o => o.value === filtroPeriodo)?.label || filtroPeriodo}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-500 text-lg">No se encontraron pagos</p>
                  <p className="text-gray-400 text-sm">
                    {(filtroTexto || filtroMetodo !== "all") 
                      ? 'Prueba ajustando los filtros de búsqueda'
                      : 'No hay pagos que coincidan con los criterios'
                    }
                  </p>
                </>
              )}
            </div>
          ) : (
            <Table 
              aria-label="Tabla de pagos registrados"
              className="min-h-[400px]"
              classNames={{
                wrapper: "shadow-none bg-transparent p-0",
                table: "min-h-[300px]",
                th: "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-gray-700 font-semibold text-sm border-b border-gray-200/50",
                td: "border-b border-gray-100/50 text-gray-600",
                tbody: "divide-y divide-gray-100/50"
              }}
              bottomContent={
                totalPaginas > 1 ? (
                  <div className="flex w-full justify-between items-center p-4 bg-gradient-to-r from-gray-50/80 to-blue-50/80 border-t border-gray-200/50">
                    <div className="flex items-center gap-2">
                      <span className="text-small text-gray-600">Filas por página:</span>
                      <Select
                        size="sm"
                        className="w-20"
                        selectedKeys={[String(itemsPorPagina)]}
                        onSelectionChange={(keys) => {
                          const newSize = Number(Array.from(keys)[0]);
                          setItemsPorPagina(newSize);
                          setPagina(1);
                        }}
                      >
                        <SelectItem key="5" value="5">5</SelectItem>
                        <SelectItem key="10" value="10">10</SelectItem>
                        <SelectItem key="15" value="15">15</SelectItem>
                        <SelectItem key="20" value="20">20</SelectItem>
                      </Select>
                    </div>
                    <Pagination
                      isCompact
                      showControls
                      showShadow
                      page={pagina}
                      total={totalPaginas}
                      onChange={setPagina}
                      classNames={{
                        wrapper: "gap-0 overflow-visible h-8 bg-white/80 backdrop-blur-md rounded-lg border border-gray-200/50",
                        item: "w-8 h-8 text-small rounded-none bg-transparent",
                        cursor: "bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg"
                      }}
                    />
                    <div className="text-small text-gray-600">
                      {pagosFiltrados.length === 0 ? (
                        "No hay pagos"
                      ) : (
                        `${(pagina - 1) * itemsPorPagina + 1}-${Math.min(pagina * itemsPorPagina, pagosFiltrados.length)} de ${pagosFiltrados.length} pagos`
                      )}
                    </div>
                  </div>
                ) : null
              }
            >
              <TableHeader>
                <TableColumn>PAGO</TableColumn>
                <TableColumn>CLIENTE</TableColumn>
                <TableColumn>FACTURA</TableColumn>
                <TableColumn>FECHA</TableColumn>
                <TableColumn>MONTO</TableColumn>
                <TableColumn>ENTREGADO</TableColumn>
                <TableColumn>CAMBIO</TableColumn>
                <TableColumn>MÉTODO</TableColumn>
                <TableColumn>ACCIONES</TableColumn>
              </TableHeader>
              
              <TableBody>
                {pagosPaginados.map((pago) => {
                  const infoPagosFactura = obtenerInfoPagosPorFactura(pago.factura_id);
                  const esPagoMultiple = infoPagosFactura.total > 1;
                  const indicePago = infoPagosFactura.pagosOrdenados.findIndex(p => p.id === pago.id) + 1;
                  
                  return (
                    <TableRow key={pago.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Chip
                            size="sm"
                            variant="flat"
                            className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 font-mono text-xs"
                          >
                            #{pago.id}
                          </Chip>
                          {esPagoMultiple && (
                            <Chip
                              size="sm"
                              variant="flat"
                              className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 text-xs"
                            >
                              {indicePago}/{infoPagosFactura.total}
                            </Chip>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{pago.cliente_nombre}</p>
                          <p className="text-xs text-gray-500">{pago.medidor_numero_serie}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">#{pago.factura_id}</span>
                          <div className="flex flex-col gap-1">
                            <Chip 
                              size="sm" 
                              color={pago.estado_factura === 'Pagado' ? 'success' : 'warning'}
                              variant="flat"
                              className="font-medium"
                            >
                              {pago.estado_factura}
                            </Chip>
                            {esPagoMultiple && (
                              <span className="text-xs text-gray-500">
                                Total: ${infoPagosFactura.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {formatFecha(pago.fecha_pago)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-bold text-green-600">
                          ${pago.monto?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-semibold text-blue-600">
                          ${pago.cantidad_entregada?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className={`font-semibold ${pago.cambio > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                          ${pago.cambio?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          color={getMetodoColor(pago.metodo_pago)}
                          variant="flat"
                          size="sm"
                          className="font-medium"
                        >
                          {pago.metodo_pago}
                        </Chip>
                      </TableCell>
                      
                      <TableCell>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => verDetalle(pago)}
                          className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <HiEye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Modal de Detalle */}
      <Modal 
        isOpen={modalDetalle} 
        onClose={() => setModalDetalle(false)}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <h3>Detalle del Pago #{pagoSeleccionado?.id}</h3>
          </ModalHeader>
          
          <ModalBody>
            {pagoSeleccionado && (
              <div className="space-y-6">
                {/* Información del Pago */}
                <Card>
                  <CardHeader>
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                      <HiCurrencyDollar className="w-5 h-5" />
                      Información del Pago
                    </h4>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-default-500">ID del Pago</p>
                        <p className="font-semibold">#{pagoSeleccionado.id}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-default-500">Fecha de Pago</p>
                        <p className="font-semibold">{formatFecha(pagoSeleccionado.fecha_pago)}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-default-500">Método de Pago</p>
                        <Chip 
                          color={getMetodoColor(pagoSeleccionado.metodo_pago)}
                          variant="flat"
                        >
                          {pagoSeleccionado.metodo_pago}
                        </Chip>
                      </div>
                      
                      <div>
                        <p className="text-sm text-default-500">Monto Aplicado</p>
                        <p className="font-semibold text-success text-lg">
                          ${pagoSeleccionado.monto?.toLocaleString() || '0'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-default-500">Cantidad Entregada</p>
                        <p className="font-semibold text-lg">
                          ${pagoSeleccionado.cantidad_entregada?.toLocaleString() || '0'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-default-500">Cambio</p>
                        <p className={`font-semibold text-lg ${pagoSeleccionado.cambio > 0 ? 'text-warning' : 'text-default-400'}`}>
                          ${pagoSeleccionado.cambio?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                    
                    {pagoSeleccionado.comentario && (
                      <div className="mt-4">
                        <p className="text-sm text-default-500">Comentario</p>
                        <p className="text-sm bg-default-50 p-3 rounded-lg border">
                          {pagoSeleccionado.comentario}
                        </p>
                      </div>
                    )}
                  </CardBody>
                </Card>

                {/* Información de Múltiples Pagos (si aplica) */}
                {(() => {
                  const infoPagosFactura = obtenerInfoPagosPorFactura(pagoSeleccionado.factura_id);
                  if (infoPagosFactura.total > 1) {
                    return (
                      <Card>
                        <CardHeader>
                          <h4 className="text-lg font-semibold flex items-center gap-2">
                            <HiCash className="w-5 h-5" />
                            Pagos Múltiples de esta Factura ({infoPagosFactura.total} pagos)
                          </h4>
                        </CardHeader>
                        <CardBody>
                          <div className="space-y-3">
                            {infoPagosFactura.pagosOrdenados.map((pago, index) => (
                              <div 
                                key={pago.id} 
                                className={`p-3 rounded-lg border-l-4 ${
                                  pago.id === pagoSeleccionado.id 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-300 bg-gray-50'
                                }`}
                              >
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <p className="text-gray-500">Pago #{index + 1}</p>
                                    <p className="font-semibold">#{pago.id}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Fecha</p>
                                    <p className="font-semibold">{formatFecha(pago.fecha_pago)}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Monto</p>
                                    <p className="font-semibold text-green-600">
                                      ${pago.monto?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Método</p>
                                    <Chip size="sm" color={getMetodoColor(pago.metodo_pago)} variant="flat">
                                      {pago.metodo_pago}
                                    </Chip>
                                  </div>
                                </div>
                                {pago.comentario && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-500">Comentario:</p>
                                    <p className="text-sm italic">{pago.comentario}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-green-700">Total Pagado:</span>
                                <span className="font-bold text-green-700 text-lg">
                                  ${infoPagosFactura.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  }
                  return null;
                })()}

                {/* Información del Cliente */}
                <Card>
                  <CardHeader>
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                      <HiCash className="w-5 h-5" />
                      Información del Cliente
                    </h4>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-default-500">Nombre</p>
                        <p className="font-semibold">{pagoSeleccionado.cliente_nombre}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-default-500">Dirección</p>
                        <p className="font-semibold">{pagoSeleccionado.direccion_cliente}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-default-500">Medidor</p>
                        <p className="font-semibold font-mono">{pagoSeleccionado.medidor_numero_serie}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-default-500">Consumo</p>
                        <p className="font-semibold">{pagoSeleccionado.consumo_m3} m³</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Información de la Factura */}
                <Card>
                  <CardHeader>
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                      <HiCreditCard className="w-5 h-5" />
                      Información de la Factura
                    </h4>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-default-500">Factura #</p>
                        <p className="font-semibold font-mono">#{pagoSeleccionado.factura_id}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-default-500">Estado</p>
                        <Chip 
                          color={pagoSeleccionado.estado_factura === 'Pagado' ? 'success' : 'warning'}
                          variant="flat"
                        >
                          {pagoSeleccionado.estado_factura}
                        </Chip>
                      </div>
                      
                      <div>
                        <p className="text-sm text-default-500">Período Facturado</p>
                        <p className="font-semibold">{pagoSeleccionado.periodo_facturado}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-default-500">Total Factura</p>
                        <p className="font-semibold">
                          ${pagoSeleccionado.total_factura?.toLocaleString() || '0'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-default-500">Saldo Pendiente</p>
                        <p className={`font-semibold ${pagoSeleccionado.saldo_pendiente_factura > 0 ? 'text-danger' : 'text-success'}`}>
                          ${pagoSeleccionado.saldo_pendiente_factura?.toLocaleString() || '0'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-default-500">Fecha Emisión</p>
                        <p className="font-semibold">{formatFecha(pagoSeleccionado.fecha_emision_factura)}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Información de Registro */}
                <Card>
                  <CardHeader>
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                      <HiCalendar className="w-5 h-5" />
                      Información de Registro
                    </h4>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-default-500">Registrado por</p>
                        <p className="font-semibold">{pagoSeleccionado.modificado_por_nombre}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-default-500">Fecha de Registro</p>
                        <p className="font-semibold">
                          {formatFechaHora(pagoSeleccionado.fecha_creacion)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-default-500">Fecha de Lectura</p>
                        <p className="font-semibold">{formatFecha(pagoSeleccionado.fecha_lectura)}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button 
              color="danger" 
              variant="light" 
              onPress={() => setModalDetalle(false)}
            >
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default TabPagos;
