import { useState } from "react";
import { Input, Button, Chip, Select, SelectItem, Card, CardBody } from "@nextui-org/react";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";
import { useNavigate } from "react-router-dom";
import ModalRegistrarUsuario from "./ModalRegistroUsuario";

const usuariosMock = [
  { id: 1, username: "juan123", rol: "operador", conectado: true, correo: "juan@example.com" },
  { id: 2, username: "maria456", rol: "admin", conectado: false, correo: "maria@example.com" },
  { id: 3, username: "pedro789", rol: "lector", conectado: true, correo: "pedro@example.com" },
  { id: 4, username: "ana987", rol: "cajero", conectado: true, correo: "ana@example.com" },
  { id: 5, username: "carlos654", rol: "operador", conectado: false, correo: "carlos@example.com" },
];

const GestionUsuarios = () => {
  const navigate = useNavigate();
  const [filtroConectado, setFiltroConectado] = useState("todos");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const usuariosFiltrados = usuariosMock.filter((usuario) => {
    // Filtro por conexión
    if (filtroConectado === "conectados" && !usuario.conectado) return false;
    if (filtroConectado === "desconectados" && usuario.conectado) return false;
    
    // Filtro por rol
    if (filtroRol !== "todos" && usuario.rol !== filtroRol) return false;
    
    // Filtro por búsqueda
    if (busqueda && !usuario.username.toLowerCase().includes(busqueda.toLowerCase()) &&
        !usuario.correo.toLowerCase().includes(busqueda.toLowerCase())) return false;
    
    return true;
  });

  const getRolColor = (rol) => {
    switch (rol) {
      case "admin": return "danger";
      case "operador": return "primary";
      case "lector": return "warning";
      case "cajero": return "success";
      default: return "default";
    }
  };

  const handleCerrarSesion = (usuario) => {
    if (confirm(`¿Cerrar sesión de ${usuario.username}?`)) {
      // Implementar lógica para cerrar sesión
      alert(`Sesión cerrada para ${usuario.username}`);
    }
  };

  const handleCambiarPassword = (usuario) => {
    // Implementar modal para cambiar contraseña
    alert(`Cambiar contraseña para ${usuario.username}`);
  };

  const estadisticasUsuarios = {
    total: usuariosMock.length,
    conectados: usuariosMock.filter(u => u.conectado).length,
    admins: usuariosMock.filter(u => u.rol === "admin").length,
    operadores: usuariosMock.filter(u => u.rol === "operador").length,
    lectores: usuariosMock.filter(u => u.rol === "lector").length,
    cajeros: usuariosMock.filter(u => u.rol === "cajero").length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
        <Button color="gray" onClick={() => navigate(-1)}>
          <FlechaReturnIcon className="w-6 h-6" />
          <span className="ml-2">Volver</span>
        </Button>
      </div>

      {/* Estadísticas de usuarios */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-blue-600">{estadisticasUsuarios.total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-green-600">{estadisticasUsuarios.conectados}</p>
            <p className="text-sm text-gray-600">Conectados</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-red-600">{estadisticasUsuarios.admins}</p>
            <p className="text-sm text-gray-600">Admins</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-blue-600">{estadisticasUsuarios.operadores}</p>
            <p className="text-sm text-gray-600">Operadores</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{estadisticasUsuarios.lectores}</p>
            <p className="text-sm text-gray-600">Lectores</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-green-600">{estadisticasUsuarios.cajeros}</p>
            <p className="text-sm text-gray-600">Cajeros</p>
          </CardBody>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              label="Buscar usuario"
              placeholder="Nombre de usuario o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="max-w-sm"
              clearable
            />

            <Select
              label="Filtrar por conexión"
              value={filtroConectado}
              onChange={(e) => setFiltroConectado(e.target.value)}
              className="max-w-xs"
            >
              <SelectItem key="todos" value="todos">Todos</SelectItem>
              <SelectItem key="conectados" value="conectados">Conectados</SelectItem>
              <SelectItem key="desconectados" value="desconectados">Desconectados</SelectItem>
            </Select>

            <Select
              label="Filtrar por rol"
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="max-w-xs"
            >
              <SelectItem key="todos" value="todos">Todos los roles</SelectItem>
              <SelectItem key="admin" value="admin">Administrador</SelectItem>
              <SelectItem key="operador" value="operador">Operador</SelectItem>
              <SelectItem key="lector" value="lector">Lector</SelectItem>
              <SelectItem key="cajero" value="cajero">Cajero</SelectItem>
            </Select>

            <ModalRegistrarUsuario />
          </div>
        </CardBody>
      </Card>

      {/* Descripción de roles */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-bold mb-3">Descripción de Roles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Chip color="danger" variant="flat" className="mb-2">Admin</Chip>
              <p className="text-sm">Acceso completo al sistema, gestión de usuarios y configuración.</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Chip color="primary" variant="flat" className="mb-2">Operador</Chip>
              <p className="text-sm">Gestión de clientes, medidores, lecturas y facturación.</p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Chip color="warning" variant="flat" className="mb-2">Lector</Chip>
              <p className="text-sm">Solo captura de lecturas de medidores.</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Chip color="success" variant="flat" className="mb-2">Cajero</Chip>
              <p className="text-sm">Gestión de pagos y facturación, sin acceso a configuración.</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <CardBody>
          <div className="overflow-auto">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Correo</th>
                  <th className="px-4 py-3 text-left">Rol</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id} className="border-t dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{usuario.username}</div>
                      </td>
                      <td className="px-4 py-3">{usuario.correo}</td>
                      <td className="px-4 py-3">
                        <Chip
                          color={getRolColor(usuario.rol)}
                          variant="flat"
                          className="capitalize"
                        >
                          {usuario.rol}
                        </Chip>
                      </td>
                      <td className="px-4 py-3">
                        <Chip
                          color={usuario.conectado ? "success" : "danger"}
                          variant="flat"
                        >
                          {usuario.conectado ? "Conectado" : "Desconectado"}
                        </Chip>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {usuario.conectado && (
                            <Button 
                              size="sm" 
                              color="warning" 
                              variant="bordered"
                              onClick={() => handleCerrarSesion(usuario)}
                            >
                              Cerrar sesión
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            color="primary" 
                            variant="bordered"
                            onClick={() => handleCambiarPassword(usuario)}
                          >
                            Cambiar contraseña
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-300">
                      No se encontraron usuarios con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default GestionUsuarios;
