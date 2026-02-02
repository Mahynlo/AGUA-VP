import { useState, useEffect, useMemo } from "react";
import {
  Input,
  Button,
  Chip,
  Select,
  SelectItem,
  Card,
  CardBody,
  Tooltip,
  User,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination
} from "@nextui-org/react";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";
import { HiShieldCheck, HiSearch, HiTrash, HiCheck, HiUser } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import ModalRegistrarUsuario from "./ModalRegistroUsuario";
import ModalSesionesUsuario from "./ModalSesionesUsuario";
import { useUsuarios } from "../../context/UsuariosContext";
import { useAuth } from "../../context/AuthContext";
import { CustomInput } from "../ui/FormComponents";

const GestionUsuarios = () => {
  const navigate = useNavigate();
  const { usuarios, loading, fetchUsuarios, deleteUser, reactivateUser } = useUsuarios();
  const { user: currentUser } = useAuth(); // Para no auto-eliminarse

  // Estados para modal de sesiones
  const [selectedUserForSessions, setSelectedUserForSessions] = useState(null);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  // Paginación
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Carga inicial
  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Filtrado y búsqueda del lado del cliente (Client-side filtering for robust UX)
  const filteredUsers = useMemo(() => {
    return usuarios.filter(user => {
      const matchesSearch = busqueda === "" ||
        user.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        user.username?.toLowerCase().includes(busqueda.toLowerCase()) ||
        user.correo?.toLowerCase().includes(busqueda.toLowerCase());

      const matchesEstado = filtroEstado === "todos" || user.estado_usuario === filtroEstado;
      const matchesRol = filtroRol === "todos" || user.rol === filtroRol;

      return matchesSearch && matchesEstado && matchesRol;
    });
  }, [usuarios, busqueda, filtroEstado, filtroRol]);

  // Paginación
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredUsers.slice(start, end);
  }, [page, filteredUsers, rowsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  // Resetear página al filtrar
  useEffect(() => {
    setPage(1);
  }, [busqueda, filtroEstado, filtroRol, rowsPerPage]);


  const getRolColor = (rol) => {
    switch (rol) {
      case "superadmin": return "secondary";
      case "administrador": return "danger";
      case "operador": return "primary";
      default: return "default";
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Activo": return "success";
      case "Inactivo": return "warning";
      case "Suspendido": return "warning";
      case "Eliminado": return "danger";
      default: return "default";
    }
  };

  const handleEliminar = async (usuario) => {
    if (!confirm(`¿Estás seguro de desactivar al usuario ${usuario.username}?`)) return;
    try {
      await deleteUser(usuario.id, "Desactivación desde panel");
    } catch (error) {
      // Error handled by context feedback
    }
  };

  const handleReactivar = async (usuario) => {
    if (!confirm(`¿Reactivar al usuario ${usuario.username}?`)) return;
    try {
      await reactivateUser(usuario.id);
    } catch (error) {
      // Error handled by context feedback
    }
  };

  const handleOpenSessions = (usuario) => {
    setSelectedUserForSessions(usuario);
    setIsSessionsModalOpen(true);
  };

  // Estadísticas calculadas
  const estadisticas = useMemo(() => ({
    total: usuarios.length,
    activos: usuarios.filter(u => u.estado_usuario === 'Activo').length,
    admins: usuarios.filter(u => ['administrador', 'superadmin'].includes(u.rol)).length,
    operadores: usuarios.filter(u => u.rol === 'operador').length
  }), [usuarios]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
        <div className="flex gap-2">
          {/* Placeholder para exportar, si se requiere */}
          <Button color="default" variant="light" onClick={() => navigate(-1)}>
            <FlechaReturnIcon className="w-6 h-6 mr-2" />
            Volver
          </Button>
        </div>
      </div>

      {/* Filtros y Acciones */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <CustomInput
              label="Buscar usuario"
              placeholder="Nombre, username o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              icon={<HiSearch className="w-5 h-5 text-gray-400" />}
              className="md:col-span-1"
            />

            <Select
              label="Estado"
              selectedKeys={[filtroEstado]}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <SelectItem key="todos" value="todos">Todos los estados</SelectItem>
              <SelectItem key="Activo" value="Activo">Activos</SelectItem>
              <SelectItem key="Inactivo" value="Inactivo">Inactivos</SelectItem>
              <SelectItem key="Eliminado" value="Eliminado">Eliminados</SelectItem>
            </Select>

            <Select
              label="Rol"
              selectedKeys={[filtroRol]}
              onChange={(e) => setFiltroRol(e.target.value)}
            >
              <SelectItem key="todos" value="todos">Todos los roles</SelectItem>
              <SelectItem key="administrador" value="administrador">Administrador</SelectItem>
              <SelectItem key="operador" value="operador">Operador</SelectItem>
            </Select>

            <div className="flex items-end">
              <ModalRegistrarUsuario />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <span>Mostrando {items.length} de {filteredUsers.length} usuarios</span>
            <Select
              className="w-32"
              size="sm"
              label="Filas"
              selectedKeys={[rowsPerPage.toString()]}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              <SelectItem key="5" value="5">5 por pág.</SelectItem>
              <SelectItem key="10" value="10">10 por pág.</SelectItem>
              <SelectItem key="15" value="15">15 por pág.</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardBody className="text-center p-4">
            <p className="text-3xl font-bold">{estadisticas.total}</p>
            <p className="text-blue-100 uppercase text-xs font-semibold">Total Usuarios</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardBody className="text-center p-4">
            <p className="text-3xl font-bold">{estadisticas.activos}</p>
            <p className="text-green-100 uppercase text-xs font-semibold">Activos</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardBody className="text-center p-4">
            <p className="text-3xl font-bold">{estadisticas.admins}</p>
            <p className="text-red-100 uppercase text-xs font-semibold">Admin / Super</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardBody className="text-center p-4">
            <p className="text-3xl font-bold">{estadisticas.operadores}</p>
            <p className="text-purple-100 uppercase text-xs font-semibold">Operadores</p>
          </CardBody>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardBody>
          <Table aria-label="Tabla de usuarios" >
            <TableHeader>
              <TableColumn>USUARIO</TableColumn>
              <TableColumn>ROL</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>ÚLTIMO ACCESO</TableColumn>
              <TableColumn align="center">ACCIONES</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No se encontraron usuarios" isLoading={loading}>
              {items.map((usuario) => {
                const isSelf = currentUser?.id == usuario.id;
                return (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <User
                        name={usuario.nombre + (isSelf ? " (Tú)" : "")}
                        description={<div className="flex flex-col"><span className="text-xs">@{usuario.username}</span><span className="text-tiny text-gray-400">{usuario.correo}</span></div>}
                        avatarProps={{
                          src: `https://ui-avatars.com/api/?name=${usuario.nombre}&background=random`,
                          size: "sm"
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip color={getRolColor(usuario.rol)} size="sm" variant="flat" className="capitalize">
                        {usuario.rol}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Chip color={getEstadoColor(usuario.estado_usuario)} size="sm" variant="dot" className="border-none gap-1 capitalize">
                          {usuario.estado_usuario}
                        </Chip>
                        {usuario.estado_usuario === 'Eliminado' && (
                          <span className="text-[10px] text-red-500">{usuario.razon_eliminacion}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {usuario.ultimo_acceso ? new Date(usuario.ultimo_acceso).toLocaleString() : 'Nunca'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Tooltip content="Ver sesiones activas">
                          <Button isIconOnly size="sm" color="primary" variant="light" onPress={() => handleOpenSessions(usuario)}>
                            <HiShieldCheck className="w-5 h-5" />
                          </Button>
                        </Tooltip>

                        {usuario.estado_usuario === 'Eliminado' || usuario.estado_usuario === 'Inactivo' ? (
                          <Tooltip content="Reactivar usuario" color="success">
                            <Button isIconOnly size="sm" color="success" variant="light" onPress={() => handleReactivar(usuario)}>
                              <HiCheck className="w-5 h-5" />
                            </Button>
                          </Tooltip>
                        ) : (
                          <Tooltip content={isSelf ? "No puedes eliminarte a ti mismo" : "Desactivar usuario"} color="danger">
                            <Button isIconOnly size="sm" color="danger" variant="light" isDisabled={isSelf} onPress={() => !isSelf && handleEliminar(usuario)}>
                              <HiTrash className="w-5 h-5" />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                total={totalPages}
                page={page}
                onChange={setPage}
                color="primary"
                showControls
              />
            </div>
          )}
        </CardBody>
      </Card>

      <ModalSesionesUsuario
        isOpen={isSessionsModalOpen}
        onClose={() => setIsSessionsModalOpen(false)}
        usuario={selectedUserForSessions}
      />
    </div>
  );
};

export default GestionUsuarios;
