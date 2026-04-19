import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Chip,
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
  Tooltip,
  User,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Skeleton
} from "@nextui-org/react";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";
import { HiShieldCheck, HiSearch, HiTrash, HiCheck, HiUserGroup, HiX, HiFilter } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import ModalRegistrarUsuario from "./ModalRegistroUsuario";
import ModalSesionesUsuario from "./ModalSesionesUsuario";
import ModalPermisosUsuario from "./ModalPermisosUsuario";
import { useUsuarios } from "../../context/UsuariosContext";
import { useAuth } from "../../context/AuthContext";

// Componente LoadingSkeleton premium
const LoadingSkeleton = () => (
  <div className="space-y-6 w-full animate-in fade-in">
    <Card className="border border-slate-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-950 rounded-2xl">
      <CardBody className="p-6 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <div className="flex gap-2">
              <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </CardBody>
    </Card>
    <Card className="border border-slate-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-950 rounded-2xl">
      <CardBody className="p-0">
          <Skeleton className="h-12 w-full rounded-none border-b border-slate-100 dark:border-zinc-800" />
          {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-none border-b border-slate-100/70 dark:border-zinc-800/50" />
          ))}
      </CardBody>
    </Card>
  </div>
);

const GestionUsuarios = () => {
  const navigate = useNavigate();
  const { usuarios, loading, fetchUsuarios, deleteUser, reactivateUser } = useUsuarios();
  const { user: currentUser } = useAuth(); // Para no auto-eliminarse

  // Estados para modal de sesiones
  const [selectedUserForSessions, setSelectedUserForSessions] = useState(null);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

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

  // Filtrado y búsqueda del lado del cliente
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

  const handleOpenPermissions = (usuario) => {
    setSelectedUserForPermissions(usuario);
    setIsPermissionsModalOpen(true);
  };

  // Estadísticas calculadas
  const estadisticas = useMemo(() => ({
    total: usuarios.length,
    activos: usuarios.filter(u => u.estado_usuario === 'Activo').length,
    admins: usuarios.filter(u => ['administrador', 'superadmin'].includes(u.rol)).length,
    operadores: usuarios.filter(u => u.rol === 'operador').length
  }), [usuarios]);

  const hasActiveFilters = busqueda !== "" || filtroEstado !== "todos" || filtroRol !== "todos";

  const clearFilters = () => {
    setBusqueda("");
    setFiltroEstado("todos");
    setFiltroRol("todos");
    setPage(1);
  };

  const selectClassNames = {
    trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 shadow-none rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 h-11",
    value: "font-medium text-slate-700 dark:text-zinc-200 text-sm"
  };

  if (loading && !usuarios.length) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      
      {/* ── 1. HEADER Y KPIs ── */}
      <Card className="border-none shadow-none bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800">
        
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 rounded-xl">
              <HiUserGroup className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                Gestión de Usuarios
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                Administración de accesos y roles del sistema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              color="default"
              variant="flat"
              onPress={() => navigate(-1)}
              className="bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 font-bold text-slate-600 dark:text-zinc-300"
              startContent={<FlechaReturnIcon className="w-5 h-5" />}
              isIconOnly
              title="Volver"
            />
            <div className="flex-1 sm:flex-none">
              <ModalRegistrarUsuario />
            </div>
          </div>
        </CardHeader>

        <CardBody className="p-6 bg-slate-50/40 dark:bg-zinc-950/40 flex flex-col gap-6">
          
          {/* Estadísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-none flex items-center gap-4">
              <div className="p-2.5 bg-slate-500/10 rounded-xl text-slate-600 dark:text-zinc-400 shrink-0">
                <HiUserGroup className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Total Usuarios</p>
                <p className="text-xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.total}</p>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-900/40 p-4 rounded-2xl shadow-none flex items-center gap-4">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                <HiCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-widest mb-0.5">Activos</p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 leading-none">{estadisticas.activos}</p>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-200/70 dark:border-red-900/40 p-4 rounded-2xl shadow-none flex items-center gap-4">
              <div className="p-2.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                <HiShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-red-600/70 dark:text-red-500/70 uppercase tracking-widest mb-0.5">Admin / Super</p>
                <p className="text-xl font-black text-red-700 dark:text-red-400 leading-none">{estadisticas.admins}</p>
              </div>
            </div>

            <div className="bg-sky-500/10 border border-sky-200/70 dark:border-sky-900/40 p-4 rounded-2xl shadow-none flex items-center gap-4">
              <div className="p-2.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl shrink-0">
                <HiUserGroup className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-sky-700/70 dark:text-sky-400/80 uppercase tracking-widest mb-0.5">Operadores</p>
                <p className="text-xl font-black text-sky-700 dark:text-sky-300 leading-none">{estadisticas.operadores}</p>
              </div>
            </div>

          </div>

          <div className="w-full h-px bg-slate-200 dark:bg-zinc-800"></div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
            
            {/* Buscador */}
            <div className="lg:col-span-2 relative w-full flex items-center">
              <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                <HiSearch className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar por nombre, usuario o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-300 shadow-none h-11"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro Rol */}
            <Select
              placeholder="Todos los roles"
              selectedKeys={[filtroRol]}
              onChange={(e) => setFiltroRol(e.target.value)}
              variant="bordered"
              aria-label="Filtrar por Rol"
              classNames={selectClassNames}
            >
              <SelectItem key="todos" value="todos">Todos los roles</SelectItem>
              <SelectItem key="administrador" value="administrador">Administrador</SelectItem>
              <SelectItem key="operador" value="operador">Operador</SelectItem>
            </Select>

            {/* Filtro Estado */}
            <Select
              placeholder="Todos los estados"
              selectedKeys={[filtroEstado]}
              onChange={(e) => setFiltroEstado(e.target.value)}
              variant="bordered"
              aria-label="Filtrar por Estado"
              classNames={selectClassNames}
            >
              <SelectItem key="todos" value="todos">Todos los estados</SelectItem>
              <SelectItem key="Activo" value="Activo">Activos</SelectItem>
              <SelectItem key="Inactivo" value="Inactivo">Inactivos</SelectItem>
              <SelectItem key="Eliminado" value="Eliminado">Eliminados</SelectItem>
            </Select>

            {/* Botón Limpiar */}
            <div className="flex justify-end">
                {hasActiveFilters ? (
                    <Button 
                        variant="flat" 
                        color="default"
                        onPress={clearFilters}
                        className="w-full font-bold text-slate-600 dark:text-zinc-300 bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 shadow-none h-11 min-w-[44px] px-0 shrink-0"
                        title="Limpiar filtros"
                    >
                        <HiFilter className="text-slate-400 text-lg mr-2 lg:mr-0" />
                        <span className="lg:hidden">Limpiar Filtros</span>
                    </Button>
                ) : (
                    <div className="w-full h-11"></div> // Spacer
                )}
            </div>

          </div>
        </CardBody>
      </Card>

      {/* ── 2. TABLA DE USUARIOS ── */}
      <Card className="border-none shadow-none bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800">
        
        {/* Cabecera interna de tabla */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4">
            <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">
              Mostrando <span className="text-sky-700 dark:text-sky-300">{items.length}</span> de <span className="text-slate-800 dark:text-zinc-200">{filteredUsers.length}</span> usuarios
            </span>

            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
                    Filas por página:
                </span>
                <Select
                    size="sm"
                    aria-label="Por página"
                    className="w-24"
                    variant="bordered"
                    selectedKeys={[rowsPerPage.toString()]}
                    onSelectionChange={(keys) => {
                        setRowsPerPage(Number(Array.from(keys)[0]));
                        setPage(1);
                    }}
                    classNames={{
                      trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 shadow-none rounded-lg",
                        value: "font-bold text-slate-700 dark:text-zinc-300"
                    }}
                >
                    <SelectItem key="5" value="5">5</SelectItem>
                    <SelectItem key="10" value="10">10</SelectItem>
                    <SelectItem key="15" value="15">15</SelectItem>
                </Select>
            </div>
        </div>

        <CardBody className="p-0">
          <Table 
            aria-label="Tabla de usuarios" 
            removeWrapper
            classNames={{
                base: "min-h-[400px]",
                table: "min-w-full",
              thead: "bg-slate-50 dark:bg-zinc-900/40",
              th: "bg-transparent text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest text-[10px] py-3 border-b border-slate-200 dark:border-zinc-800",
                td: "py-3 border-b border-slate-100 dark:border-zinc-800/50",
                tr: "hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors cursor-default"
            }}
          >
            <TableHeader>
              <TableColumn>USUARIO</TableColumn>
              <TableColumn>ROL</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>ÚLTIMO ACCESO</TableColumn>
              <TableColumn align="end">ACCIONES</TableColumn>
            </TableHeader>
            <TableBody 
                emptyContent={
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400 dark:text-zinc-500">
                        <HiUserGroup className="w-12 h-12 opacity-20 mb-2" />
                        <p className="font-bold">No se encontraron usuarios</p>
                    </div>
                } 
                isLoading={loading}
            >
              {items.map((usuario) => {
                const isSelf = currentUser?.id == usuario.id;
                return (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <User
                        name={<span className={`font-bold text-sm ${isSelf ? 'text-sky-700 dark:text-sky-300' : 'text-slate-800 dark:text-zinc-100'}`}>{usuario.nombre} {isSelf && "(Tú)"}</span>}
                        description={<div className="flex flex-col gap-0.5 mt-0.5"><span className="text-[11px] font-bold text-slate-500">@{usuario.username}</span><span className="text-[10px] font-medium text-slate-400">{usuario.correo}</span></div>}
                        avatarProps={{
                          src: `https://ui-avatars.com/api/?name=${usuario.nombre}&background=random`,
                          size: "sm",
                          className: "border-2 border-white dark:border-zinc-900 shadow-sm"
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip color={getRolColor(usuario.rol)} size="sm" variant="flat" className="capitalize font-bold text-[10px] tracking-wider px-1">
                        {usuario.rol}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <Chip color={getEstadoColor(usuario.estado_usuario)} size="sm" variant="dot" className="border-none gap-1 capitalize font-bold text-xs h-5">
                          {usuario.estado_usuario}
                        </Chip>
                        {usuario.estado_usuario === 'Eliminado' && (
                          <span className="text-[9px] font-bold text-red-500/80 uppercase tracking-widest pl-4 truncate max-w-[150px]" title={usuario.razon_eliminacion}>{usuario.razon_eliminacion}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                        {usuario.ultimo_acceso ? new Date(usuario.ultimo_acceso).toLocaleString('es-MX', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'}) : <span className="italic opacity-60">Nunca</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Tooltip content="Gestionar permisos" classNames={{content: "font-bold text-xs"}}>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            className="bg-violet-50 hover:bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:hover:bg-violet-900/50 dark:text-violet-300 border border-violet-100 dark:border-violet-900/30 transition-colors"
                            onPress={() => handleOpenPermissions(usuario)}
                          >
                            <HiShieldCheck className="w-4 h-4" />
                          </Button>
                        </Tooltip>

                        <Tooltip content="Ver sesiones activas" classNames={{content: "font-bold text-xs"}}>
                          <Button 
                            isIconOnly 
                            size="sm" 
                            variant="flat" 
                            className="bg-slate-100/70 hover:bg-slate-200 text-slate-600 hover:text-slate-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 border border-slate-200 dark:border-zinc-800 transition-colors"
                            onPress={() => handleOpenSessions(usuario)}
                          >
                            <HiShieldCheck className="w-4 h-4" />
                          </Button>
                        </Tooltip>

                        {usuario.estado_usuario === 'Eliminado' || usuario.estado_usuario === 'Inactivo' ? (
                          <Tooltip content="Reactivar usuario" color="success" classNames={{content: "font-bold text-xs"}}>
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="flat" 
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/50 dark:text-emerald-400 transition-colors"
                                onPress={() => handleReactivar(usuario)}
                            >
                              <HiCheck className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        ) : (
                          <Tooltip content={isSelf ? "No puedes eliminarte a ti mismo" : "Desactivar usuario"} color={isSelf ? "default" : "danger"} classNames={{content: "font-bold text-xs"}}>
                            <Button 
                                isIconOnly 
                                size="sm" 
                                variant="flat" 
                                className={isSelf ? "bg-slate-50 text-slate-300 dark:bg-zinc-800/50 dark:text-zinc-600" : "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/50 dark:text-red-400 transition-colors"}
                                isDisabled={isSelf} 
                                onPress={() => !isSelf && handleEliminar(usuario)}
                            >
                              <HiTrash className="w-4 h-4" />
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
            <div className="flex justify-center p-4 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900">
              <Pagination
                total={totalPages}
                page={page}
                onChange={setPage}
                color="default"
                variant="light"
                showControls
                classNames={{
                    cursor: "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-sm",
                }}
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

      <ModalPermisosUsuario
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        usuario={selectedUserForPermissions}
      />
    </div>
  );
};

export default GestionUsuarios;
