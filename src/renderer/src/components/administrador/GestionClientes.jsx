import { useState, useEffect } from "react";
import { 
  Card, 
  CardBody, 
  Button, 
  Input, 
  Select, 
  SelectItem, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  Tab
} from "@nextui-org/react";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";
import { AgregarClienteIcon, EditIcon, EliminarClienteIcon } from "../../IconsApp/IconsClientes";
import { useNavigate } from "react-router-dom";

const GestionClientes = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroCiudad, setFiltroCiudad] = useState("todas");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);

  // Datos de ejemplo
  const clientesEjemplo = [
    {
      id: 1,
      nombre: "Juan Pérez García",
      direccion: "Calle Principal #123",
      ciudad: "Villa Pesqueira",
      telefono: "662-123-4567",
      correo: "juan.perez@email.com",
      medidor: "MP-001",
      estado: "Activo",
      fechaRegistro: "2024-01-15",
      consumoPromedio: 45.2,
      facturasPendientes: 1,
      saldoPendiente: 850.00,
      ultimoPago: "2025-01-10"
    },
    {
      id: 2,
      nombre: "María González López",
      direccion: "Av. Reforma #456",
      ciudad: "Mazatán",
      telefono: "662-987-6543",
      correo: "maria.gonzalez@email.com",
      medidor: "MP-002",
      estado: "Activo",
      fechaRegistro: "2024-03-20",
      consumoPromedio: 38.7,
      facturasPendientes: 0,
      saldoPendiente: 0.00,
      ultimoPago: "2025-01-18"
    },
    {
      id: 3,
      nombre: "Carlos Rodríguez",
      direccion: "Colonia Centro #789",
      ciudad: "Villa Pesqueira",
      telefono: "662-555-1234",
      correo: "",
      medidor: "MP-003",
      estado: "Suspendido",
      fechaRegistro: "2023-11-10",
      consumoPromedio: 52.1,
      facturasPendientes: 3,
      saldoPendiente: 2450.00,
      ultimoPago: "2024-11-15"
    }
  ];

  const ciudades = [...new Set(clientesEjemplo.map(c => c.ciudad))];

  useEffect(() => {
    setClientes(clientesEjemplo);
    setClientesFiltrados(clientesEjemplo);
  }, []);

  useEffect(() => {
    let filtrados = clientes;

    // Filtro por búsqueda
    if (busqueda) {
      filtrados = filtrados.filter(cliente =>
        cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        cliente.medidor.toLowerCase().includes(busqueda.toLowerCase()) ||
        cliente.direccion.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    // Filtro por estado
    if (filtroEstado !== "todos") {
      filtrados = filtrados.filter(cliente => 
        cliente.estado.toLowerCase() === filtroEstado
      );
    }

    // Filtro por ciudad
    if (filtroCiudad !== "todas") {
      filtrados = filtrados.filter(cliente => cliente.ciudad === filtroCiudad);
    }

    setClientesFiltrados(filtrados);
  }, [busqueda, filtroEstado, filtroCiudad, clientes]);

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Activo": return "success";
      case "Suspendido": return "danger";
      case "Inactivo": return "warning";
      default: return "default";
    }
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  };

  const handleVerDetalle = (cliente) => {
    setClienteSeleccionado(cliente);
    setModalDetalle(true);
  };

  const handleEditar = (cliente) => {
    setClienteSeleccionado(cliente);
    setModalEditar(true);
  };

  const handleEliminar = (cliente) => {
    if (confirm(`¿Está seguro de eliminar al cliente ${cliente.nombre}?`)) {
      setClientes(clientes.filter(c => c.id !== cliente.id));
    }
  };

  const handleExportar = () => {
    // Implementar exportación a Excel/CSV
    alert("Funcionalidad de exportación - Por implementar");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Clientes</h1>
        <div className="flex gap-2">
          <Button color="primary" onClick={handleExportar}>
            Exportar
          </Button>
          <Button color="gray" onClick={() => navigate(-1)}>
            <FlechaReturnIcon className="w-6 h-6" />
            <span className="ml-2">Volver</span>
          </Button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Buscar cliente"
              placeholder="Nombre, medidor o dirección..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              clearable
            />
            
            <Select
              label="Estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <SelectItem key="todos" value="todos">Todos los estados</SelectItem>
              <SelectItem key="activo" value="activo">Activo</SelectItem>
              <SelectItem key="suspendido" value="suspendido">Suspendido</SelectItem>
              <SelectItem key="inactivo" value="inactivo">Inactivo</SelectItem>
            </Select>
            
            <Select
              label="Ciudad"
              value={filtroCiudad}
              onChange={(e) => setFiltroCiudad(e.target.value)}
            >
              <SelectItem key="todas" value="todas">Todas las ciudades</SelectItem>
              {ciudades.map(ciudad => (
                <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
              ))}
            </Select>

            <div className="flex items-end">
              <Button color="primary" className="w-full">
                <AgregarClienteIcon className="w-5 h-5" />
                <span className="ml-2">Nuevo Cliente</span>
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-blue-600">{clientesFiltrados.length}</p>
            <p className="text-sm text-gray-600">Clientes mostrados</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {clientesFiltrados.filter(c => c.estado === "Activo").length}
            </p>
            <p className="text-sm text-gray-600">Activos</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {clientesFiltrados.filter(c => c.estado === "Suspendido").length}
            </p>
            <p className="text-sm text-gray-600">Suspendidos</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {formatearMoneda(clientesFiltrados.reduce((total, c) => total + c.saldoPendiente, 0))}
            </p>
            <p className="text-sm text-gray-600">Saldo total</p>
          </CardBody>
        </Card>
      </div>

      {/* Tabla de clientes */}
      <Card>
        <CardBody>
          <Table aria-label="Lista de clientes">
            <TableHeader>
              <TableColumn>CLIENTE</TableColumn>
              <TableColumn>MEDIDOR</TableColumn>
              <TableColumn>CIUDAD</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>SALDO</TableColumn>
              <TableColumn>CONSUMO PROM.</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody>
              {clientesFiltrados.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{cliente.nombre}</p>
                      <p className="text-sm text-gray-500">{cliente.direccion}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                      {cliente.medidor}
                    </span>
                  </TableCell>
                  <TableCell>{cliente.ciudad}</TableCell>
                  <TableCell>
                    <Chip color={getEstadoColor(cliente.estado)} variant="flat">
                      {cliente.estado}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className={cliente.saldoPendiente > 0 ? "text-red-600 font-bold" : "text-green-600"}>
                      {formatearMoneda(cliente.saldoPendiente)}
                    </span>
                  </TableCell>
                  <TableCell>{cliente.consumoPromedio} m³</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="bordered"
                        onClick={() => handleVerDetalle(cliente)}
                      >
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        color="primary"
                        variant="bordered"
                        onClick={() => handleEditar(cliente)}
                      >
                        <EditIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="bordered"
                        onClick={() => handleEliminar(cliente)}
                      >
                        <EliminarClienteIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {clientesFiltrados.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron clientes con los filtros aplicados</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de detalle del cliente */}
      <Modal isOpen={modalDetalle} onClose={() => setModalDetalle(false)} size="2xl">
        <ModalContent>
          <ModalHeader>
            <h3>Detalle del Cliente - {clienteSeleccionado?.nombre}</h3>
          </ModalHeader>
          <ModalBody>
            {clienteSeleccionado && (
              <Tabs aria-label="Información del cliente">
                <Tab key="general" title="Información General">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold">Nombre:</span>
                      <p>{clienteSeleccionado.nombre}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Medidor:</span>
                      <p>{clienteSeleccionado.medidor}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Dirección:</span>
                      <p>{clienteSeleccionado.direccion}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Ciudad:</span>
                      <p>{clienteSeleccionado.ciudad}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Teléfono:</span>
                      <p>{clienteSeleccionado.telefono}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Correo:</span>
                      <p>{clienteSeleccionado.correo || "No proporcionado"}</p>
                    </div>
                  </div>
                </Tab>
                <Tab key="consumo" title="Consumo">
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">{clienteSeleccionado.consumoPromedio} m³</p>
                      <p className="text-sm text-gray-600">Consumo promedio mensual</p>
                    </div>
                    {/* Aquí se podría agregar gráfico de consumo histórico */}
                  </div>
                </Tab>
                <Tab key="pagos" title="Pagos">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{formatearMoneda(clienteSeleccionado.saldoPendiente)}</p>
                        <p className="text-sm text-gray-600">Saldo pendiente</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">{clienteSeleccionado.facturasPendientes}</p>
                        <p className="text-sm text-gray-600">Facturas pendientes</p>
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold">Último pago:</span>
                      <p>{clienteSeleccionado.ultimoPago}</p>
                    </div>
                  </div>
                </Tab>
              </Tabs>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setModalDetalle(false)}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de edición */}
      <Modal isOpen={modalEditar} onClose={() => setModalEditar(false)}>
        <ModalContent>
          <ModalHeader>
            <h3>Editar Cliente</h3>
          </ModalHeader>
          <ModalBody>
            <p>Formulario de edición - Por implementar</p>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setModalEditar(false)}>
              Cancelar
            </Button>
            <Button color="primary">
              Guardar Cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default GestionClientes;
