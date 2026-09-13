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
          <CardContent className="text-center p-4">
            <p className="text-2xl font-bold text-blue-600">{medidoresFiltrados.length}</p>
            <p className="text-sm text-gray-600">Total medidores</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center p-4">
            <p className="text-2xl font-bold text-green-600">
              {medidoresFiltrados.filter(m => m.estado === "Activo").length}
            </p>
            <p className="text-sm text-gray-600">Activos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center p-4">
            <p className="text-2xl font-bold text-red-600">
              {medidoresFiltrados.filter(m => m.estado === "Dañado").length}
            </p>
            <p className="text-sm text-gray-600">Dañados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center p-4">
            <p className="text-2xl font-bold text-gray-600">
              {medidoresFiltrados.filter(m => m.estado === "Sin asignar").length}
            </p>
            <p className="text-sm text-gray-600">Sin asignar</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center p-4">
            <p className="text-2xl font-bold text-orange-600">
              {medidoresFiltrados.filter(m => {
                const dias = calcularDiasSinLectura(m.ultimaLectura);
                return dias !== null && dias > 30;
              }).length}
            </p>
            <p className="text-sm text-gray-600">Sin lectura +30d</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1 block">Buscar medidor</label>
              <input
                placeholder="Número, marca, cliente..."
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
                <option value="dañado">Dañado</option>
                <option value="reemplazado">Reemplazado</option>
                <option value="sin asignar">Sin asignar</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1 block">Cliente</label>
              <select
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100"
              >
                <option value="todos">Todos los clientes</option>
                {clientes.map(cliente => (
                  <option key={cliente} value={cliente}>{cliente}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button color="secondary" className="w-full h-10 font-bold">
                Ver en Mapa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de medidores */}
      <Card>
        <CardContent className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-zinc-800 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-3 px-4">MEDIDOR</th>
                  <th className="py-3 px-4">CLIENTE</th>
                  <th className="py-3 px-4">UBICACIÓN</th>
                  <th className="py-3 px-4">ESTADO</th>
                  <th className="py-3 px-4">ÚLTIMA LECTURA</th>
                  <th className="py-3 px-4">LECTURA ACTUAL</th>
                  <th className="py-3 px-4">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {medidoresFiltrados.map((medidor) => {
                  const diasSinLectura = calcularDiasSinLectura(medidor.ultimaLectura);
                  return (
                    <tr key={medidor.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold">{medidor.numero}</p>
                          <p className="text-xs text-gray-500">{medidor.marca} {medidor.modelo}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {medidor.cliente ? (
                          <span>{medidor.cliente}</span>
                        ) : (
                          <span className="text-gray-400 italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{medidor.ubicacion}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Chip color={getEstadoColor(medidor.estado)} variant="ghost">
                          {medidor.estado}
                        </Chip>
                      </td>
                      <td className="py-3 px-4">
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
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold">{medidor.lecturaActual.toFixed(1)} m³</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerDetalle(medidor)}
                          >
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            color="primary"
                            variant="outline"
                          >
                            <EditIcon className="w-4 h-4" />
                          </Button>
                          {medidor.coordenadas && (
                            <Button
                              size="sm"
                              color="secondary"
                              variant="outline"
                              onClick={() => handleVerEnMapa(medidor)}
                            >
                              Mapa
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {medidoresFiltrados.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron medidores con los filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle del medidor */}
      <Modal isOpen={modalDetalle}>
        <ModalBackdrop className="fixed inset-0 bg-slate-900/80 dark:bg-black/80 z-[99999] flex items-center justify-center p-4">
          <ModalContainer size="lg" placement="center">
            <ModalDialog className="bg-white dark:bg-zinc-950 shadow-2xl rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden max-w-lg w-full">
              <ModalHeader className="p-5 border-b border-slate-100 dark:border-zinc-800 font-bold text-lg">
                <h3>Detalle del Medidor - {medidorSeleccionado?.numero}</h3>
              </ModalHeader>
              <ModalBody className="p-6">
                {medidorSeleccionado && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold text-xs text-slate-400">Número:</span>
                        <p className="font-bold text-slate-800 dark:text-zinc-100">{medidorSeleccionado.numero}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-400">Marca/Modelo:</span>
                        <p className="text-slate-800 dark:text-zinc-100">{medidorSeleccionado.marca} {medidorSeleccionado.modelo}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-400">Cliente:</span>
                        <p className="text-slate-800 dark:text-zinc-100">{medidorSeleccionado.cliente || "Sin asignar"}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-400">Estado:</span>
                        <div>
                          <Chip color={getEstadoColor(medidorSeleccionado.estado)} variant="ghost">
                            {medidorSeleccionado.estado}
                          </Chip>
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-400">Ubicación:</span>
                        <p className="text-slate-800 dark:text-zinc-100">{medidorSeleccionado.ubicacion}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-400">Coordenadas:</span>
                        <p className="text-slate-800 dark:text-zinc-100 text-xs font-mono">
                          {medidorSeleccionado.coordenadas ? 
                            `${medidorSeleccionado.coordenadas.lat}, ${medidorSeleccionado.coordenadas.lng}` : 
                            "No registradas"
                          }
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-400">Fecha instalación:</span>
                        <p className="text-slate-800 dark:text-zinc-100">{medidorSeleccionado.fechaInstalacion || "No registrada"}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-400">Última lectura:</span>
                        <p className="text-slate-800 dark:text-zinc-100">{medidorSeleccionado.ultimaLectura || "Sin lecturas"}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-400">Lectura actual:</span>
                        <p className="font-bold text-blue-600">{medidorSeleccionado.lecturaActual.toFixed(1)} m³</p>
                      </div>
                    </div>
                    
                    {medidorSeleccionado.observaciones && (
                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                        <span className="font-semibold text-xs text-slate-400">Observaciones:</span>
                        <p className="text-sm bg-gray-50 dark:bg-zinc-900 p-2 rounded-xl mt-1">{medidorSeleccionado.observaciones}</p>
                      </div>
                    )}
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
    </div>
  );
};

export default GestionMedidores;
