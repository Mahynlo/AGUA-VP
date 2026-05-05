import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Select,
  SelectItem,
  Tooltip,
  User,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Card,
  CardHeader,
  CardBody,
  Spinner
} from "@nextui-org/react";
import { 
  HiShieldCheck, 
  HiSearch, 
  HiTrash, 
  HiCheck, 
  HiUserGroup, 
  HiX, 
  HiFilter,
  HiBan,
  HiArrowLeft
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import ModalRegistrarUsuario from "./ModalRegistroUsuario";
import ModalSesionesUsuario from "./ModalSesionesUsuario";
import ModalPermisosUsuario from "./ModalPermisosUsuario";
import { useUsuarios } from "../../context/UsuariosContext";
import { useAuth } from "../../context/AuthContext";

// Componente LoadingSkeleton premium
const LoadingSkeleton = () => (
  <div className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10 animate-in fade-in flex flex-col gap-8">
    <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800/50 pb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl animate-pulse bg-slate-200/50 dark:bg-zinc-800/50" />
        <div className="space-y-2">
          <div className="h-6 w-48 animate-pulse bg-slate-200/50 dark:bg-zinc-800/50 rounded-md" />
          <div className="h-3 w-32 animate-pulse bg-slate-200/50 dark:bg-zinc-800/50 rounded-md" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 w-full animate-pulse bg-slate-200/50 dark:bg-zinc-800/50 rounded-2xl" />
      ))}
    </div>
    <div className="space-y-4 mt-4">
      <div className="h-14 w-full animate-pulse bg-slate-200/50 dark:bg-zinc-800/50 rounded-xl" />
      <div className="h-64 w-full animate-pulse bg-slate-200/50 dark:bg-zinc-800/50 rounded-xl" />
    </div>
  </div>
);

const GestionUsuarios = () => {
  const navigate = useNavigate();
  const { usuarios, loading, fetchUsuarios, deleteUser, reactivateUser } = useUsuarios();
  const { user: currentUser } = useAuth();

  // Estados para modales
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

  // Filtrado
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

  useEffect(() => {
    setPage(1);
  }, [busqueda, filtroEstado, filtroRol, rowsPerPage]);

  // Regla de los Tintes: Roles
  const getRolBadge = (rol) => {
    switch (rol?.toLowerCase()) {
      case "superadmin": return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      case "administrador": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "operador": return "bg-sky-500/10 text-sky-600 dark:text-sky-400";
      default: return "bg-slate-500/10 text-slate-600 dark:text-slate-400";
    }
  };

  // Regla de los Tintes: Estados
  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "Activo": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "Inactivo": 
      case "Suspendido": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "Eliminado": return "bg-red-500/10 text-red-600 dark:text-red-400";
      default: return "bg-slate-500/10 text-slate-600 dark:text-slate-400";
    }
  };

  const handleEliminar = async (usuario) => {
    if (!confirm(`¿Estás seguro de desactivar al usuario ${usuario.username}?`)) return;
    try {
      await deleteUser(usuario.id, "Desactivación desde panel");
    } catch (error) {}
  };

  const handleReactivar = async (usuario) => {
    if (!confirm(`¿Reactivar al usuario ${usuario.username}?`)) return;
    try {
      await reactivateUser(usuario.id);
    } catch (error) {}
  };

  const handleOpenSessions = (usuario) => {
    setSelectedUserForSessions(usuario);
    setIsSessionsModalOpen(true);
  };

  const handleOpenPermissions = (usuario) => {
    setSelectedUserForPermissions(usuario);
    setIsPermissionsModalOpen(true);
  };

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

  // Clases estandarizadas para selects (Basado en TabClientes)
  const selectClassNames = {
    trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none h-[52px]",
    value: "font-medium text-slate-700 dark:text-zinc-200 text-sm"
  };

  // Control de carga inicial (Skeleton)
  if (loading && !usuarios.length) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10 space-y-6 animate-in fade-in duration-500">
      
      {/* ── SECCIÓN 1: HEADER Y KPIs ── */}
      <Card className="border-none shadow-none bg-transparent rounded-2xl border border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl shrink-0">
              <HiUserGroup className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                  Gestión de Usuarios
                </h3>
                {loading && usuarios.length > 0 && (
                  <Spinner size="sm" color="default" className="w-4 h-4 ml-1" />
                )}
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                Administración de accesos y roles del sistema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="flat"
              onPress={() => navigate(-1)}
              className="bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 font-bold rounded-xl h-[44px] px-4 min-w-0 flex-1 sm:flex-none shadow-sm"
              startContent={<HiArrowLeft className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div className="flex-1 sm:flex-none">
              <ModalRegistrarUsuario />
            </div>
          </div>
        </CardHeader>

        <CardBody className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tarjetas KPI */}
            <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 w-full">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Total Usuarios</span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"><HiUserGroup className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.total}</p>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 w-full">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Activos</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><HiCheck className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.activos}</p>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 w-full">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Admin / Super</span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400"><HiShieldCheck className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.admins}</p>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 w-full">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Operadores</span>
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400"><HiUserGroup className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.operadores}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── SECCIÓN 2: FILTROS Y TABLA ── */}
      <Card className="border-none shadow-none bg-transparent rounded-2xl border border-slate-200 dark:border-zinc-800">
        
        {/* Controles de Filtrado */}
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 rounded-t-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            
            {/* Buscador */}
            <div className="lg:col-span-6 relative w-full flex items-center">
              <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                <HiSearch className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar por nombre, usuario o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-10 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-300 shadow-none h-[52px]"
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
            <div className="lg:col-span-2">
              <Select
                placeholder="Todos los roles"
                selectedKeys={[filtroRol]}
                onChange={(e) => setFiltroRol(e.target.value)}
                variant="flat"
                aria-label="Filtrar por Rol"
                classNames={selectClassNames}
              >
                <SelectItem key="todos" value="todos">Todos los roles</SelectItem>
                <SelectItem key="administrador" value="administrador">Administrador</SelectItem>
                <SelectItem key="operador" value="operador">Operador</SelectItem>
              </Select>
            </div>

            {/* Filtro Estado */}
            <div className="lg:col-span-2">
              <Select
                placeholder="Todos los estados"
                selectedKeys={[filtroEstado]}
                onChange={(e) => setFiltroEstado(e.target.value)}
                variant="flat"
                aria-label="Filtrar por Estado"
                classNames={selectClassNames}
              >
                <SelectItem key="todos" value="todos">Todos los estados</SelectItem>
                <SelectItem key="Activo" value="Activo">Activos</SelectItem>
                <SelectItem key="Inactivo" value="Inactivo">Inactivos</SelectItem>
                <SelectItem key="Eliminado" value="Eliminado">Eliminados</SelectItem>
              </Select>
            </div>

            {/* Botón Limpiar Filtros */}
            <div className="lg:col-span-2 flex justify-end">
              {hasActiveFilters ? (
                <Button 
                  variant="flat" 
                  onPress={clearFilters}
                  className="w-full font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-transparent shadow-none h-[52px] rounded-xl"
                  startContent={<HiFilter className="text-lg" />}
                >
                  Limpiar
                </Button>
              ) : (
                <div className="w-full h-[52px]"></div> // Espaciador
              )}
            </div>
          </div>
        </div>

        {/* Info Paginación Superior (Sub-Header) */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 bg-slate-50/40 dark:bg-zinc-900/30">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            Mostrando <span className="text-slate-700 dark:text-zinc-200">{items.length}</span> de <span className="text-slate-700 dark:text-zinc-200">{filteredUsers.length}</span> usuarios
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 hidden sm:block">
              Filas por página:
            </span>
            <Select
              size="sm"
              aria-label="Por página"
              className="w-24"
              variant="flat"
              selectedKeys={[rowsPerPage.toString()]}
              onSelectionChange={(keys) => {
                setRowsPerPage(Number(Array.from(keys)[0]));
                setPage(1);
              }}
              classNames={{
                trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-none h-[40px]",
                value: "font-bold text-slate-700 dark:text-zinc-300"
              }}
            >
              <SelectItem key="5" value="5">5</SelectItem>
              <SelectItem key="10" value="10">10</SelectItem>
              <SelectItem key="15" value="15">15</SelectItem>
              <SelectItem key="50" value="50">50</SelectItem>
            </Select>
          </div>
        </div>

        {/* Tabla */}
        <CardBody className="p-0 bg-white dark:bg-zinc-950">
          <div className="w-full overflow-x-auto">
            <Table 
              aria-label="Tabla de usuarios" 
              removeWrapper
              classNames={{
                base: "min-h-[400px]",
                table: "min-w-full",
                th: "bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 py-4 px-6",
                td: "text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-4 px-6",
                tr: "hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors cursor-default"
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
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400 dark:text-zinc-500">
                    <HiUserGroup className="w-12 h-12 opacity-20 mb-2" />
                    <p className="font-bold">No se encontraron usuarios</p>
                  </div>
                } 
              >
                {items.map((usuario) => {
                  const isSelf = currentUser?.id == usuario.id;
                  return (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <User
                          name={<span className={`font-bold text-sm ${isSelf ? 'text-purple-600 dark:text-purple-400' : 'text-slate-800 dark:text-zinc-100'}`}>{usuario.nombre} {isSelf && "(Tú)"}</span>}
                          description={
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">@{usuario.username}</span>
                              <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">{usuario.correo}</span>
                            </div>
                          }
                          avatarProps={{
                            src: `https://ui-avatars.com/api/?name=${usuario.nombre}&background=random`,
                            size: "sm",
                            className: "border border-slate-200 dark:border-zinc-800 shadow-sm shrink-0"
                          }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${getRolBadge(usuario.rol)}`}>
                          {usuario.rol}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${getEstadoBadge(usuario.estado_usuario)}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                            {usuario.estado_usuario}
                          </span>
                          {usuario.estado_usuario === 'Eliminado' && (
                            <span className="text-[9px] font-bold text-red-500/80 uppercase tracking-widest pl-1 truncate max-w-[150px]" title={usuario.razon_eliminacion}>
                              Motivo: {usuario.razon_eliminacion}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                          {usuario.ultimo_acceso ? new Date(usuario.ultimo_acceso).toLocaleString('es-MX', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'}) : <span className="italic opacity-60">Nunca</span>}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip content="Gestionar permisos" classNames={{content: "font-bold text-[10px] uppercase tracking-widest text-slate-500"}}>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              className="bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
                              onPress={() => handleOpenPermissions(usuario)}
                            >
                              <HiShieldCheck className="w-4 h-4" />
                            </Button>
                          </Tooltip>

                          <Tooltip content="Ver sesiones activas" classNames={{content: "font-bold text-[10px] uppercase tracking-widest text-slate-500"}}>
                            <Button 
                              isIconOnly 
                              size="sm" 
                              variant="flat" 
                              className="bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20 rounded-lg transition-colors"
                              onPress={() => handleOpenSessions(usuario)}
                            >
                              <HiShieldCheck className="w-4 h-4" />
                            </Button>
                          </Tooltip>

                          {usuario.estado_usuario === 'Eliminado' || usuario.estado_usuario === 'Inactivo' ? (
                            <Tooltip content="Reactivar usuario" classNames={{content: "font-bold text-[10px] uppercase tracking-widest text-emerald-600 bg-emerald-50"}}>
                              <Button 
                                  isIconOnly 
                                  size="sm" 
                                  variant="flat" 
                                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                                  onPress={() => handleReactivar(usuario)}
                              >
                                <HiCheck className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          ) : (
                            <Tooltip content={isSelf ? "No puedes desactivarte" : "Desactivar usuario"} classNames={{content: "font-bold text-[10px] uppercase tracking-widest text-red-600 bg-red-50"}}>
                              <Button 
                                  isIconOnly 
                                  size="sm" 
                                  variant="flat" 
                                  className={isSelf ? "bg-slate-100 text-slate-300 dark:bg-zinc-800/50 dark:text-zinc-600 rounded-lg" : "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"}
                                  isDisabled={isSelf} 
                                  onPress={() => !isSelf && handleEliminar(usuario)}
                              >
                                <HiBan className="w-4 h-4" />
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
          </div>

          {/* Paginación Inferior */}
          {totalPages > 1 && (
            <div className="flex justify-center p-4 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/50">
              <Pagination
                total={totalPages}
                page={page}
                onChange={setPage}
                showControls
                color="default"
                variant="flat"
                classNames={{
                  cursor: "bg-slate-800 text-white dark:bg-zinc-200 dark:text-slate-900 font-bold shadow-sm",
                }}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modales */}
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
