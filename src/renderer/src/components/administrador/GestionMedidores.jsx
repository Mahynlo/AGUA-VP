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
  ModalFooter
} from "@nextui-org/react";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";
import { EditIcon } from "../../IconsApp/IconsClientes";
import { useNavigate } from "react-router-dom";

const GestionMedidores = () => {
  const navigate = useNavigate();
  const [medidores, setMedidores] = useState([]);
  const [medidoresFiltrados, setMedidoresFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroCliente, setFiltroCliente] = useState("todos");
  const [medidorSeleccionado, setMedidorSeleccionado] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(false);

  // Datos de ejemplo
  const medidoresEjemplo = [
    {
      id: 1,
      numero: "MP-001",
      marca: "Itron",
      modelo: "Aquadis+",
      cliente: "Juan Pérez García",
      ubicacion: "Calle Principal #123",
      coordenadas: { lat: 29.0729, lng: -110.9559 },
      estado: "Activo",
      fechaInstalacion: "2024-01-15",
      ultimaLectura: "2025-01-20",
      lecturaActual: 1250.5,
      observaciones: ""
    },
    {
      id: 2,
      numero: "MP-002",
      marca: "Sensus",
      modelo: "iPerl",
      cliente: "María González López",
      ubicacion: "Av. Reforma #456",
      coordenadas: { lat: 29.0735, lng: -110.9565 },
      estado: "Activo",
      fechaInstalacion: "2024-03-20",
      ultimaLectura: "2025-01-18",
      lecturaActual: 980.2,
      observaciones: ""
    },
    {
      id: 3,
      numero: "MP-003",
      marca: "Itron",
      modelo: "Cyble Sensor",
      cliente: "Carlos Rodríguez",
      ubicacion: "Colonia Centro #789",
      coordenadas: { lat: 29.0741, lng: -110.9571 },
      estado: "Dañado",
      fechaInstalacion: "2023-11-10",
      ultimaLectura: "2024-12-15",
      lecturaActual: 1850.7,
      observaciones: "Requiere reemplazo - cristal roto"
    },
    {
      id: 4,
      numero: "MP-004",
      marca: "Neptune",
      modelo: "T-10",
      cliente: null,
      ubicacion: "Bodega - Sin asignar",
      coordenadas: null,
      estado: "Sin asignar",
      fechaInstalacion: null,
      ultimaLectura: null,
      lecturaActual: 0,
      observaciones: "Medidor nuevo en inventario"
    }
  ];

  const clientes = [...new Set(medidoresEjemplo.filter(m => m.cliente).map(m => m.cliente))];

  useEffect(() => {
    setMedidores(medidoresEjemplo);
    setMedidoresFiltrados(medidoresEjemplo);
  }, []);

  useEffect(() => {
    let filtrados = medidores;

    // Filtro por búsqueda
    if (busqueda) {
      filtrados = filtrados.filter(medidor =>
        medidor.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
        medidor.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
        (medidor.cliente && medidor.cliente.toLowerCase().includes(busqueda.toLowerCase())) ||
        medidor.ubicacion.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    // Filtro por estado
    if (filtroEstado !== "todos") {
      filtrados = filtrados.filter(medidor => 
        medidor.estado.toLowerCase() === filtroEstado
      );
    }

    // Filtro por cliente
    if (filtroCliente !== "todos") {
      filtrados = filtrados.filter(medidor => medidor.cliente === filtroCliente);
    }

    setMedidoresFiltrados(filtrados);
  }, [busqueda, filtroEstado, filtroCliente, medidores]);

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Activo": return "success";
      case "Dañado": return "danger";
      case "Reemplazado": return "warning";
      case "Sin asignar": return "default";
      default: return "default";
    }
  };

  const handleVerDetalle = (medidor) => {
    setMedidorSeleccionado(medidor);
    setModalDetalle(true);
  };

  const handleVerEnMapa = (medidor) => {
    if (medidor.coordenadas) {
      // Implementar navegación al mapa con coordenadas
      alert(`Ver en mapa: ${medidor.coordenadas.lat}, ${medidor.coordenadas.lng}`);
    } else {
      alert("Este medidor no tiene coordenadas registradas");
    }
  };

  const calcularDiasSinLectura = (ultimaLectura) => {
    if (!ultimaLectura) return null;
    const hoy = new Date();
    const fechaLectura = new Date(ultimaLectura);
    const diferencia = Math.floor((hoy - fechaLectura) / (1000 * 60 * 60 * 24));
    return diferencia;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Medidores</h1>
        <div className="flex gap-2">
          <Button color="primary">
            Nuevo Medidor
          </Button>
          <Button color="gray" onClick={() => navigate(-1)}>
            <FlechaReturnIcon className="w-6 h-6" />
            <span className="ml-2">Volver</span>
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-blue-600">{medidoresFiltrados.length}</p>
            <p className="text-sm text-gray-600">Total medidores</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {medidoresFiltrados.filter(m => m.estado === "Activo").length}
            </p>
            <p className="text-sm text-gray-600">Activos</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {medidoresFiltrados.filter(m => m.estado === "Dañado").length}
            </p>
            <p className="text-sm text-gray-600">Dañados</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {medidoresFiltrados.filter(m => m.estado === "Sin asignar").length}
            </p>
            <p className="text-sm text-gray-600">Sin asignar</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {medidoresFiltrados.filter(m => {
                const dias = calcularDiasSinLectura(m.ultimaLectura);
                return dias !== null && dias > 30;
              }).length}
            </p>
            <p className="text-sm text-gray-600">Sin lectura +30d</p>
          </CardBody>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Buscar medidor"
              placeholder="Número, marca, cliente..."
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
              <SelectItem key="dañado" value="dañado">Dañado</SelectItem>
              <SelectItem key="reemplazado" value="reemplazado">Reemplazado</SelectItem>
              <SelectItem key="sin asignar" value="sin asignar">Sin asignar</SelectItem>
            </Select>
            
            <Select
              label="Cliente"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
            >
              <SelectItem key="todos" value="todos">Todos los clientes</SelectItem>
              {clientes.map(cliente => (
                <SelectItem key={cliente} value={cliente}>{cliente}</SelectItem>
              ))}
            </Select>

            <div className="flex items-end">
              <Button color="secondary" className="w-full">
                Ver en Mapa
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabla de medidores */}
      <Card>
        <CardBody>
          <Table aria-label="Lista de medidores">
            <TableHeader>
              <TableColumn>MEDIDOR</TableColumn>
              <TableColumn>CLIENTE</TableColumn>
              <TableColumn>UBICACIÓN</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>ÚLTIMA LECTURA</TableColumn>
              <TableColumn>LECTURA ACTUAL</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody>
              {medidoresFiltrados.map((medidor) => {
                const diasSinLectura = calcularDiasSinLectura(medidor.ultimaLectura);
                return (
                  <TableRow key={medidor.id}>
                    <TableCell>
                      <div>
                        <p className="font-bold">{medidor.numero}</p>
                        <p className="text-sm text-gray-500">{medidor.marca} {medidor.modelo}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {medidor.cliente ? (
                        <span>{medidor.cliente}</span>
                      ) : (
                        <span className="text-gray-400 italic">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{medidor.ubicacion}</span>
                    </TableCell>
                    <TableCell>
                      <Chip color={getEstadoColor(medidor.estado)} variant="flat">
                        {medidor.estado}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {medidor.ultimaLectura ? (
                        <div>
                          <p>{medidor.ultimaLectura}</p>
                          {diasSinLectura !== null && (
                            <p className={`text-xs ${diasSinLectura > 30 ? 'text-red-500' : 'text-gray-500'}`}>
                              Hace {diasSinLectura} días
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin lecturas</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold">{medidor.lecturaActual.toFixed(1)} m³</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="bordered"
                          onClick={() => handleVerDetalle(medidor)}
                        >
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          color="primary"
                          variant="bordered"
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        {medidor.coordenadas && (
                          <Button
                            size="sm"
                            color="secondary"
                            variant="bordered"
                            onClick={() => handleVerEnMapa(medidor)}
                          >
                            Mapa
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {medidoresFiltrados.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron medidores con los filtros aplicados</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de detalle del medidor */}
      <Modal isOpen={modalDetalle} onClose={() => setModalDetalle(false)} size="lg">
        <ModalContent>
          <ModalHeader>
            <h3>Detalle del Medidor - {medidorSeleccionado?.numero}</h3>
          </ModalHeader>
          <ModalBody>
            {medidorSeleccionado && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold">Número:</span>
                    <p>{medidorSeleccionado.numero}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Marca/Modelo:</span>
                    <p>{medidorSeleccionado.marca} {medidorSeleccionado.modelo}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Cliente:</span>
                    <p>{medidorSeleccionado.cliente || "Sin asignar"}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Estado:</span>
                    <Chip color={getEstadoColor(medidorSeleccionado.estado)} variant="flat">
                      {medidorSeleccionado.estado}
                    </Chip>
                  </div>
                  <div>
                    <span className="font-semibold">Ubicación:</span>
                    <p>{medidorSeleccionado.ubicacion}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Coordenadas:</span>
                    <p>
                      {medidorSeleccionado.coordenadas ? 
                        `${medidorSeleccionado.coordenadas.lat}, ${medidorSeleccionado.coordenadas.lng}` : 
                        "No registradas"
                      }
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold">Fecha instalación:</span>
                    <p>{medidorSeleccionado.fechaInstalacion || "No registrada"}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Última lectura:</span>
                    <p>{medidorSeleccionado.ultimaLectura || "Sin lecturas"}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Lectura actual:</span>
                    <p className="font-bold text-blue-600">{medidorSeleccionado.lecturaActual.toFixed(1)} m³</p>
                  </div>
                </div>
                
                {medidorSeleccionado.observaciones && (
                  <div>
                    <span className="font-semibold">Observaciones:</span>
                    <p className="text-sm bg-gray-100 p-2 rounded">{medidorSeleccionado.observaciones}</p>
                  </div>
                )}
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
    </div>
  );
};

export default GestionMedidores;
