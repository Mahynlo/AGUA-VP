import { useState } from "react";
import { Input, Button, Chip, Select, SelectItem } from "@nextui-org/react";
import ModalRegistrarUsuario from "./ModalRegistroUsuario";
const usuariosMock = [
  { id: 1, username: "juan123", rol: "operador", conectado: true, correo: "juan@example.com" },
  { id: 2, username: "maria456", rol: "admin", conectado: false, correo: "maria@example.com" },
  { id: 3, username: "pedro789", rol: "lector", conectado: true, correo: "pedro@example.com" },
];

export default function Administrador() {
  const [filtroConectado, setFiltroConectado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const usuariosFiltrados = usuariosMock.filter((usuario) => {
    if (filtroConectado === "conectados") return usuario.conectado;
    if (filtroConectado === "desconectados") return !usuario.conectado;
    return true;
  }).filter((usuario) =>
    usuario.username.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Panel de Administración
      </h1>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Input
          label="Buscar usuario"
          placeholder="Nombre de usuario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="max-w-sm"
        />

        <Select
          label="Filtrar por conexión"
          selectedKeys={[filtroConectado]}
          onChange={(e) => setFiltroConectado(e.target.value)}
          className="max-w-xs"
        >
          <SelectItem key="todos" value="todos">Todos</SelectItem>
          <SelectItem key="conectados" value="conectados">Conectados</SelectItem>
          <SelectItem key="desconectados" value="desconectados">Desconectados</SelectItem>
        </Select>

        <ModalRegistrarUsuario />
      </div>

      {/* Tabla de usuarios */}
      <div className="overflow-auto rounded-lg shadow-md bg-white dark:bg-gray-800">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white">
            <tr>
              <th className="px-4 py-2 text-left">Usuario</th>
              <th className="px-4 py-2 text-left">Correo</th>
              <th className="px-4 py-2 text-left">Rol</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length > 0 ? (
              usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id} className="border-t dark:border-gray-600">
                  <td className="px-4 py-2">{usuario.username}</td>
                  <td className="px-4 py-2">{usuario.correo}</td>
                  <td className="px-4 py-2 capitalize">{usuario.rol}</td>
                  <td className="px-4 py-2">
                    <Chip
                      color={usuario.conectado ? "success" : "danger"}
                      variant="flat"
                    >
                      {usuario.conectado ? "Conectado" : "Desconectado"}
                    </Chip>
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    <Button size="sm" color="warning" variant="ghost">
                      Cerrar sesión
                    </Button>
                    <Button size="sm" color="primary" variant="solid">
                      Cambiar contraseña
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-gray-500 dark:text-gray-300">
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
