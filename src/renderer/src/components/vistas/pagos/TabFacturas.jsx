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
  User,
  Pagination,
  Skeleton,
  Textarea
} from "@nextui-org/react";
import { FlechaReturnIcon } from "../../../IconsApp/IconsAppSystem";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import { HiEye, HiCreditCard, HiCalendar, HiCurrencyDollar } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useFacturas } from "../../../context/FacturasContext";
import { usePagos } from "../../../context/PagosContext";

const TabFacturas = () => {
  const navigate = useNavigate();
  const { 
    facturas, 
    loading, 
    initialLoading,
    estadisticas, 
    actualizarFacturas, 
    error,
    filtrarPorPeriodo,
    filtros
  } = useFacturas();
  
  const { registrarPago } = usePagos();
  
  // Estados locales para filtros y paginación
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("All");
  const [filtroPeriodo, setFiltroPeriodo] = useState(filtros.periodo || "2025-08");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para modales
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [procesandoPago, setProcesandoPago] = useState(false);

  // LoadingSkeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-300 rounded w-48 animate-pulse"></div>
        <div className="flex gap-2">
          <div className="h-10 bg-gray-300 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-300 rounded w-24 animate-pulse"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-200 rounded-lg p-6 animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-20 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-300 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  
  const [formPago, setFormPago] = useState({
    monto: "",
    cantidad_entregada: "",
    metodo_pago: "",
    comentario: "",
    fecha_pago: new Date().toISOString().split('T')[0] // Fecha actual por defecto
  });

  // Filtrado de datos
  const filteredData = facturas.filter(factura => {
    const matchesSearch = search === "" || 
      factura.cliente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
      factura.id?.toString().includes(search);
    
    const matchesStatus = filtroEstado === "All" || 
      factura.estado?.toLowerCase() === filtroEstado.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Obtener estados únicos para el filtro
  const estados = [...new Set(facturas.map(factura => factura.estado))].filter(Boolean);

  // Manejar búsqueda
  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // Paginación
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Función para obtener color del estado
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pagado": return "success";
      case "pendiente": return "warning";
      case "vencida": return "danger";
      default: return "default";
    }
  };

  // Generar opciones de períodos (últimos 12 meses)
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

  // Manejar cambio de período
  const handleCambioPeriodo = async (nuevoPeriodo) => {
    setFiltroPeriodo(nuevoPeriodo);
    setCurrentPage(1);
    await filtrarPorPeriodo(nuevoPeriodo);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Pagado": return "success";
      case "Pendiente": return "warning";
      case "Vencida": 
      case "Vencido": return "danger";
      default: return "default";
    }
  };

  const handleVerDetalle = (factura) => {
    setFacturaSeleccionada(factura);
    setModalDetalle(true);
  };

  const handlePagar = (factura) => {
    setFacturaSeleccionada(factura);
    setFormPago({
      monto: factura.saldo_pendiente?.toString() || "",
      cantidad_entregada: factura.saldo_pendiente?.toString() || "",
      metodo_pago: "Efectivo",
      comentario: "",
      fecha_pago: new Date().toISOString().split('T')[0]
    });
    setModalPago(true);
  };

  const handleConfirmarPago = async () => {
    if (!facturaSeleccionada) return;

    try {
      setProcesandoPago(true);
      
      // Obtener usuario actual del localStorage
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      
      // Preparar datos del pago según el formato requerido
      const pagoData = {
        factura_id: facturaSeleccionada.id,
        fecha_pago: formPago.fecha_pago,
        monto: parseFloat(formPago.monto),
        cantidad_entregada: parseFloat(formPago.cantidad_entregada),
        metodo_pago: formPago.metodo_pago,
        comentario: formPago.comentario || "Pago realizado",
        modificado_por: usuario.id || 1 // ID del usuario que realiza el pago
      };

      // Validar datos
      if (!pagoData.monto || pagoData.monto <= 0) {
        alert("Por favor ingrese un monto válido");
        return;
      }

      if (!pagoData.cantidad_entregada || pagoData.cantidad_entregada <= 0) {
        alert("Por favor ingrese una cantidad entregada válida");
        return;
      }

      if (pagoData.cantidad_entregada > facturaSeleccionada.saldo_pendiente) {
        // Solo mostrar advertencia, no bloquear el pago
        const confirmar = confirm(`La cantidad entregada ($${pagoData.cantidad_entregada.toLocaleString()}) es mayor al saldo pendiente ($${facturaSeleccionada.saldo_pendiente.toLocaleString()}). ¿Desea continuar?`);
        if (!confirmar) {
          return;
        }
      }

      if (!pagoData.metodo_pago) {
        alert("Debe seleccionar un método de pago");
        return;
      }

      // Registrar el pago
      const resultado = await registrarPago(pagoData);
      
      if (resultado.success) {
        alert("Pago registrado exitosamente");
        // Actualizar facturas para reflejar el nuevo estado
        await actualizarFacturas();
        // Cerrar modal y limpiar
        setModalPago(false);
        setFacturaSeleccionada(null);
        setFormPago({
          cantidad_entregada: "",
          metodo_pago: "",
          comentario: "",
          fecha_pago: new Date().toISOString().split('T')[0]
        });
      } else {
        alert(`Error al registrar pago: ${resultado.message}`);
      }
    } catch (error) {
      console.error("Error al procesar pago:", error);
      alert("Error al procesar el pago. Intente nuevamente.");
    } finally {
      setProcesandoPago(false);
    }
  };

  // Mostrar loading skeleton si es la carga inicial
  if (initialLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Facturas</h1>
        <div className="flex gap-2">
          <Button 
            color="primary" 
            onClick={() => actualizarFacturas()}
            disabled={loading}
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
      {estadisticas && Object.keys(estadisticas).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardBody className="text-center p-6">
              <div className="flex items-center justify-center mb-2">
                <HiCurrencyDollar className="w-6 h-6 mr-2" />
                <p className="text-2xl font-bold">${estadisticas.total_facturado?.toLocaleString()}</p>
              </div>
              <p className="text-sm opacity-90">Total Facturado</p>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardBody className="text-center p-6">
              <div className="flex items-center justify-center mb-2">
                <HiCurrencyDollar className="w-6 h-6 mr-2" />
                <p className="text-2xl font-bold">${estadisticas.total_pendiente?.toLocaleString()}</p>
              </div>
              <p className="text-sm opacity-90">Total Pendiente</p>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardBody className="text-center p-6">
              <div className="flex items-center justify-center mb-2">
                <HiCalendar className="w-6 h-6 mr-2" />
                <p className="text-2xl font-bold">{estadisticas.facturas_pendientes}</p>
              </div>
              <p className="text-sm opacity-90">Facturas Pendientes</p>
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
                  placeholder="Buscar por cliente o ID de factura..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="border border-gray-300 text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
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
                if (value) handleCambioPeriodo(value);
              }}
              isDisabled={loading}
            >
              {opcionesPeriodos.map((opcion) => (
                <SelectItem key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </SelectItem>
              ))}
            </Select>

            {/* Filtro por estado */}
            <Select
              label="Estado"
              placeholder="Todos los estados"
              selectedKeys={filtroEstado !== "All" ? [filtroEstado] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] || "All";
                setFiltroEstado(value);
                setCurrentPage(1);
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
                setRowsPerPage(Number(Array.from(keys)[0]));
                setCurrentPage(1);
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
              Mostrando {paginatedData.length} de {filteredData.length} facturas
              {filteredData.length !== facturas.length && ` (filtrado de ${facturas.length} total)`}
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
                        {new Date(factura.fecha_emision).toLocaleDateString('es-ES')}
                      </div>
                      <div className="text-xs text-gray-400">
                        Vence: {new Date(factura.fecha_vencimiento).toLocaleDateString('es-ES')}
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
                      
                      {factura.saldo_pendiente > 0 && (
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

      {/* Modal de detalle de factura */}
      <Modal isOpen={modalDetalle} onClose={() => setModalDetalle(false)} size="lg">
        <ModalContent>
          <ModalHeader>
            <h3>Detalle de Factura #{facturaSeleccionada?.id}</h3>
          </ModalHeader>
          <ModalBody>
            {facturaSeleccionada && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold">Cliente:</span>
                    <p>{facturaSeleccionada.cliente_nombre}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Estado:</span>
                    <Badge color={getEstadoColor(facturaSeleccionada.estado)}>
                      {facturaSeleccionada.estado}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-semibold">Fecha de emisión:</span>
                    <p>{new Date(facturaSeleccionada.fecha_emision).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Fecha de vencimiento:</span>
                    <p>{new Date(facturaSeleccionada.fecha_vencimiento).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Consumo:</span>
                    <p>{facturaSeleccionada.consumo_m3} m³</p>
                  </div>
                  <div>
                    <span className="font-semibold">Total a pagar:</span>
                    <p>${facturaSeleccionada.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Saldo pendiente:</span>
                    <p className="text-red-600 font-bold">${facturaSeleccionada.saldo_pendiente.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Dirección:</span>
                    <p>{facturaSeleccionada.direccion_cliente}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Teléfono:</span>
                    <p>{facturaSeleccionada.telefono_cliente}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Tarifa:</span>
                    <p>{facturaSeleccionada.tarifa_nombre}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Ruta:</span>
                    <p>{facturaSeleccionada.ruta?.nombre}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Medidor:</span>
                    <p>{facturaSeleccionada.medidor?.numero_serie}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Periodo:</span>
                    <p>{facturaSeleccionada.mes_facturado}</p>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setModalDetalle(false)}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de pago */}
      <Modal isOpen={modalPago} onClose={() => setModalPago(false)} size="lg">
        <ModalContent>
          <ModalHeader>
            <div>
              <h3>Realizar Pago - Factura #{facturaSeleccionada?.id}</h3>
              <p className="text-sm text-default-500 font-normal mt-1">
                Fecha de pago: {new Date().toLocaleDateString('es-MX', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">Cliente:</span>
                  <p>{facturaSeleccionada?.cliente_nombre}</p>
                </div>
                <div>
                  <span className="font-semibold">Saldo pendiente:</span>
                  <p className="text-red-600 font-bold">${facturaSeleccionada?.saldo_pendiente?.toLocaleString()}</p>
                </div>
              </div>
              
              <Input
                label="Monto a aplicar (Saldo pendiente)"
                type="number"
                value={formPago.monto}
                startContent="$"
                isReadOnly
                description="Este es el saldo pendiente de la factura"
                className="bg-default-50"
              />
              
              <Input
                label="Cantidad entregada por el cliente"
                type="number"
                value={formPago.cantidad_entregada}
                onChange={(e) => setFormPago({...formPago, cantidad_entregada: e.target.value})}
                startContent="$"
                min="0"
                step="0.01"
                isRequired
                description="Puede ser mayor al saldo pendiente (dar cambio)"
              />
              
              <Select
                label="Método de pago"
                placeholder="Seleccionar método"
                selectedKeys={formPago.metodo_pago ? [formPago.metodo_pago] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0];
                  setFormPago({...formPago, metodo_pago: value});
                }}
                isRequired
              >
                <SelectItem key="Efectivo" value="Efectivo">Efectivo</SelectItem>
                <SelectItem key="Transferencia" value="Transferencia">Transferencia</SelectItem>
                <SelectItem key="Tarjeta" value="Tarjeta">Tarjeta</SelectItem>
                <SelectItem key="Cheque" value="Cheque">Cheque</SelectItem>
              </Select>
              
              <Textarea
                label="Comentarios"
                value={formPago.comentario}
                onChange={(e) => setFormPago({...formPago, comentario: e.target.value})}
                placeholder="Notas adicionales sobre el pago (opcional)"
                maxRows={3}
              />
              
              {/* Indicador de cambio */}
              {formPago.cantidad_entregada && facturaSeleccionada && 
               parseFloat(formPago.cantidad_entregada) > facturaSeleccionada.saldo_pendiente && (
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <HiCurrencyDollar className="w-5 h-5 text-warning-600" />
                    <div>
                      <p className="text-sm font-semibold text-warning-700">
                        Cambio a entregar al cliente:
                      </p>
                      <p className="text-lg font-bold text-warning-600">
                        ${(parseFloat(formPago.cantidad_entregada) - facturaSeleccionada.saldo_pendiente).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {procesandoPago && (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Procesando pago...</span>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              onClick={() => setModalPago(false)}
              isDisabled={procesandoPago}
            >
              Cancelar
            </Button>
            <Button 
              color="primary" 
              onClick={handleConfirmarPago}
              isLoading={procesandoPago}
              isDisabled={!formPago.cantidad_entregada || !formPago.metodo_pago || !formPago.comentario}
            >
              {procesandoPago ? "Procesando..." : "Confirmar Pago"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default TabFacturas;
