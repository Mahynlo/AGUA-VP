import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  Button, 
  Chip,
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/react";
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
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1 block">Buscar cliente</label>
              <input
                placeholder="Nombre, medidor o dirección..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1 block">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1 block">Ciudad</label>
              <select
                value={filtroCiudad}
                onChange={(e) => setFiltroCiudad(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
              >
                <option value="todas">Todas las ciudades</option>
                {ciudades.map(ciudad => (
                  <option key={ciudad} value={ciudad}>{ciudad}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button color="primary" className="w-full h-10 font-bold">
                <AgregarClienteIcon className="w-5 h-5" />
                <span className="ml-2">Nuevo Cliente</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="text-center p-4">
            <p className="text-2xl font-bold text-blue-600">{clientesFiltrados.length}</p>
            <p className="text-sm text-gray-600">Clientes mostrados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center p-4">
            <p className="text-2xl font-bold text-green-600">
              {clientesFiltrados.filter(c => c.estado === "Activo").length}
            </p>
            <p className="text-sm text-gray-600">Activos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center p-4">
            <p className="text-2xl font-bold text-red-600">
              {clientesFiltrados.filter(c => c.estado === "Suspendido").length}
            </p>
            <p className="text-sm text-gray-600">Suspendidos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center p-4">
            <p className="text-2xl font-bold text-orange-600">
              {formatearMoneda(clientesFiltrados.reduce((total, c) => total + c.saldoPendiente, 0))}
            </p>
            <p className="text-sm text-gray-600">Saldo total</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de clientes */}
      <Card>
        <CardContent className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-zinc-800 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-3 px-4">CLIENTE</th>
                  <th className="py-3 px-4">MEDIDOR</th>
                  <th className="py-3 px-4">CIUDAD</th>
                  <th className="py-3 px-4">ESTADO</th>
                  <th className="py-3 px-4">SALDO</th>
                  <th className="py-3 px-4">CONSUMO PROM.</th>
                  <th className="py-3 px-4">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold">{cliente.nombre}</p>
                        <p className="text-xs text-gray-500">{cliente.direccion}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs">
                        {cliente.medidor}
                      </span>
                    </td>
                    <td className="py-3 px-4">{cliente.ciudad}</td>
                    <td className="py-3 px-4">
                      <Chip color={getEstadoColor(cliente.estado)} variant="ghost">
                        {cliente.estado}
                      </Chip>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cliente.saldoPendiente > 0 ? "text-red-600 font-bold" : "text-green-600"}>
                        {formatearMoneda(cliente.saldoPendiente)}
                      </span>
                    </td>
                    <td className="py-3 px-4">{cliente.consumoPromedio} m³</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerDetalle(cliente)}
                        >
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          color="primary"
                          variant="outline"
                          onClick={() => handleEditar(cliente)}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          variant="outline"
                          onClick={() => handleEliminar(cliente)}
                        >
                          <EliminarClienteIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {clientesFiltrados.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron clientes con los filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle del cliente */}
      <Modal isOpen={modalDetalle}>
        <ModalBackdrop className="fixed inset-0 bg-slate-900/80 dark:bg-black/80 z-[99999] flex items-center justify-center p-4">
          <ModalContainer size="lg" placement="center">
            <ModalDialog className="bg-white dark:bg-zinc-950 shadow-2xl rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden max-w-2xl w-full">
              <ModalHeader className="p-5 border-b border-slate-100 dark:border-zinc-800 font-bold text-lg">
                <h3>Detalle del Cliente - {clienteSeleccionado?.nombre}</h3>
              </ModalHeader>
              <ModalBody className="p-6">
                {clienteSeleccionado && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold text-xs text-slate-400">Nombre:</span>
                        <p className="font-medium text-slate-800 dark:text-zinc-100">{clienteSeleccionado.nombre}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-400">Medidor:</span>
                        <p className="font-medium text-slate-800 dark:text-zinc-100">{clienteSeleccionado.medidor}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-400">Dirección:</span>
                        <p className="font-medium text-slate-800 dark:text-zinc-100">{clienteSeleccionado.direccion}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-400">Ciudad:</span>
                        <p className="font-medium text-slate-800 dark:text-zinc-100">{clienteSeleccionado.ciudad}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-400">Teléfono:</span>
                        <p className="font-medium text-slate-800 dark:text-zinc-100">{clienteSeleccionado.telefono}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-400">Correo:</span>
                        <p className="font-medium text-slate-800 dark:text-zinc-100">{clienteSeleccionado.correo || "No proporcionado"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-red-600">{formatearMoneda(clienteSeleccionado.saldoPendiente)}</p>
                        <p className="text-xs text-gray-600 dark:text-zinc-400">Saldo pendiente</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-yellow-600">{clienteSeleccionado.facturasPendientes}</p>
                        <p className="text-xs text-gray-600 dark:text-zinc-400">Facturas pendientes</p>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="p-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
                <Button onClick={() => setModalDetalle(false)} variant="outline">
                  Cerrar
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>

      {/* Modal de edición */}
      <Modal isOpen={modalEditar}>
        <ModalBackdrop className="fixed inset-0 bg-slate-900/80 dark:bg-black/80 z-[99999] flex items-center justify-center p-4">
          <ModalContainer size="md" placement="center">
            <ModalDialog className="bg-white dark:bg-zinc-950 shadow-2xl rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden max-w-md w-full">
              <ModalHeader className="p-5 border-b border-slate-100 dark:border-zinc-800 font-bold text-lg">
                <h3>Editar Cliente</h3>
              </ModalHeader>
              <ModalBody className="p-6">
                <p className="text-sm text-slate-500">Formulario de edición - Por implementar</p>
              </ModalBody>
              <ModalFooter className="p-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
                <Button onClick={() => setModalEditar(false)} variant="outline">
                  Cancelar
                </Button>
                <Button color="primary" onClick={() => setModalEditar(false)}>
                  Guardar Cambios
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>
    </div>
  );
};

export default GestionClientes;
