import { useState, useEffect, useMemo } from "react";
import { 
  HiShieldCheck, 
  HiSearch, 
  HiTrash, 
  HiCheck, 
  HiUserGroup, 
  HiX, 
  HiFilter,
  HiArrowLeft,
  HiFolder,
  HiRefresh,
  HiExclamationCircle,
  HiDesktopComputer,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDown
} from "react-icons/hi";
import { Modal as FlowbiteModal, ModalHeader as FlowbiteModalHeader, ModalBody as FlowbiteModalBody, Button as FlowbiteButton } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import ModalRegistrarUsuario from "./ModalRegistroUsuario";
import ModalSesionesUsuario from "./ModalSesionesUsuario";
import ModalPermisosUsuario from "./ModalPermisosUsuario";
import { useUsuarios } from "../../context/UsuariosContext";
import { useAuth } from "../../context/AuthContext";

const premiumConfirmModalTheme = {
  root: {
    show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" }
  },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-md w-full"
  },
  header: {
    base: "hidden",
    close: { base: "hidden", icon: "hidden" }
  },
  body: { base: "pt-10 pb-6 px-6 flex-1 overflow-y-auto bg-transparent" }
};

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
  const { usuarios, loading, fetchUsuarios, deleteUser, reactivateUser, purgeUser } = useUsuarios();
  const { user: currentUser } = useAuth();

  // Estados para modales
  const [selectedUserForSessions, setSelectedUserForSessions] = useState(null);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Estado para confirmación premium
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    color: "amber",
    onConfirm: () => {}
  });

  // Estados para Papelera
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchDeleted, setSearchDeleted] = useState("");
  const [pageDeleted, setPageDeleted] = useState(1);
  const [rowsPerPageDeleted, setRowsPerPageDeleted] = useState(10);

  // Filtros Directorio Activo
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  // Paginación Directorio Activo
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Carga inicial
  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Filtrado Directorio Activo (Excluye 'Eliminado')
  const filteredUsers = useMemo(() => {
    return usuarios.filter(user => {
      if (currentUser?.rol === 'administrador' && user.rol === 'superadmin') {
        return false;
      }

      if (user.estado_usuario === 'Eliminado') {
        return false;
      }

      const matchesSearch = busqueda === "" ||
        user.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        user.username?.toLowerCase().includes(busqueda.toLowerCase()) ||
        user.correo?.toLowerCase().includes(busqueda.toLowerCase());

      const matchesEstado = filtroEstado === "todos" || user.estado_usuario === filtroEstado;
      const matchesRol = filtroRol === "todos" || user.rol === filtroRol;

      return matchesSearch && matchesEstado && matchesRol;
    });
  }, [usuarios, busqueda, filtroEstado, filtroRol, currentUser]);

  // Filtrado Papelera (Solo 'Eliminado')
  const filteredDeletedUsers = useMemo(() => {
    return usuarios.filter(user => {
      if (currentUser?.rol === 'administrador' && user.rol === 'superadmin') {
        return false;
      }

      if (user.estado_usuario !== 'Eliminado') {
        return false;
      }

      const matchesSearch = searchDeleted === "" ||
        user.nombre?.toLowerCase().includes(searchDeleted.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchDeleted.toLowerCase()) ||
        user.correo?.toLowerCase().includes(searchDeleted.toLowerCase());

      return matchesSearch;
    });
  }, [usuarios, searchDeleted, currentUser]);

  // Paginación Papelera
  const itemsDeleted = useMemo(() => {
    const start = (pageDeleted - 1) * rowsPerPageDeleted;
    const end = start + rowsPerPageDeleted;
    return filteredDeletedUsers.slice(start, end);
  }, [pageDeleted, filteredDeletedUsers, rowsPerPageDeleted]);

  const totalPagesDeleted = Math.ceil(filteredDeletedUsers.length / rowsPerPageDeleted) || 1;

  useEffect(() => {
    setPageDeleted(1);
  }, [searchDeleted, rowsPerPageDeleted]);

  const handlePurge = (usuario) => {
    setConfirmModal({
      isOpen: true,
      title: "¿Eliminar definitivamente al usuario?",
      message: `¿Estás seguro de eliminar DEFINITIVAMENTE al usuario @${usuario.username}? Esta acción no se puede deshacer y borrará físicamente su cuenta de la base de datos.`,
      color: "failure",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await purgeUser(usuario.id);
        } catch (error) {
          console.error("Error al eliminar definitivamente al usuario:", error);
        }
      }
    });
  };

  // Paginación
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredUsers.slice(start, end);
  }, [page, filteredUsers, rowsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;

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

  const handleEliminar = (usuario) => {
    setConfirmModal({
      isOpen: true,
      title: "¿Desactivar usuario?",
      message: `¿Estás seguro de desactivar al usuario @${usuario.username}? El usuario ya no podrá acceder al sistema hasta que sea reactivado.`,
      color: "failure",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteUser(usuario.id, "Desactivación desde panel");
        } catch (error) {
          console.error("Error al desactivar usuario:", error);
        }
      }
    });
  };

  const handleReactivar = (usuario) => {
    setConfirmModal({
      isOpen: true,
      title: "¿Reactivar usuario?",
      message: `¿Deseas reactivar al usuario @${usuario.username}? Esto restaurará su acceso al sistema de inmediato.`,
      color: "success",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await reactivateUser(usuario.id);
        } catch (error) {
          console.error("Error al reactivar usuario:", error);
        }
      }
    });
  };

  const handleOpenSessions = (usuario) => {
    setSelectedUserForSessions(usuario);
    setIsSessionsModalOpen(true);
  };

  const handleOpenPermissions = (usuario) => {
    setSelectedUserForPermissions(usuario);
    setIsPermissionsModalOpen(true);
  };

  const estadisticas = useMemo(() => {
    const visibleUsers = usuarios.filter(u => {
      if (currentUser?.rol === 'administrador' && u.rol === 'superadmin') return false;
      return true;
    });
    return {
      total: visibleUsers.length,
      activos: visibleUsers.filter(u => u.estado_usuario === 'Activo').length,
      admins: visibleUsers.filter(u => ['administrador', 'superadmin'].includes(u.rol)).length,
      operadores: visibleUsers.filter(u => u.rol === 'operador').length
    };
  }, [usuarios, currentUser]);

  const hasActiveFilters = busqueda !== "" || filtroEstado !== "todos" || filtroRol !== "todos";

  const clearFilters = () => {
    setBusqueda("");
    setFiltroEstado("todos");
    setFiltroRol("todos");
    setPage(1);
  };

  // Control de carga inicial (Skeleton)
  if (loading && !usuarios.length) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10 space-y-6 animate-in fade-in duration-500">
      
      {/* ── SECCIÓN 1: HEADER Y KPIs ── */}
      <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
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
                  <div className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin ml-1" />
                )}
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                Administración de accesos y roles del sistema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => navigate(-1)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold rounded-xl h-[44px] px-4 min-w-0 flex-1 sm:flex-none shadow-sm flex items-center justify-center gap-2 transition-colors text-xs"
            >
              <HiArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            <div className="flex-1 sm:flex-none">
              <ModalRegistrarUsuario />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 dark:bg-zinc-900/30">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tarjetas KPI */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 w-full shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Total Usuarios</span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"><HiUserGroup className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.total}</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 w-full shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Activos</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><HiCheck className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.activos}</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 w-full shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Admin / Super</span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400"><HiShieldCheck className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.admins}</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1 w-full shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Operadores</span>
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400"><HiUserGroup className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.operadores}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación (Directorio / Papelera) */}
      <div className="flex gap-6 border-b border-slate-200 dark:border-zinc-800 px-2 mt-4">
        <button
          onClick={() => setShowDeleted(false)}
          className={`pb-4 text-sm font-bold border-b-2 transition-all ${!showDeleted ? "border-purple-500 text-purple-600 dark:text-purple-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300"}`}
        >
          Directorio Activo
        </button>
        <button
          onClick={() => setShowDeleted(true)}
          className={`pb-4 text-sm font-bold border-b-2 transition-all ${showDeleted ? "border-purple-500 text-purple-600 dark:text-purple-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300"} flex items-center gap-2`}
        >
          <HiFolder className="w-4 h-4" /> Papelera
        </button>
      </div>

      {/* ── SECCIÓN 2: FILTROS Y TABLA ── */}
      <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
        
        {!showDeleted ? (
          <>
            {/* Controles de Filtrado - Directorio Activo */}
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-950">
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
                    className="w-full pl-10 pr-10 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-none h-[52px]"
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
                <div className="lg:col-span-2 relative">
                  <select
                    value={filtroRol}
                    onChange={(e) => setFiltroRol(e.target.value)}
                    aria-label="Filtrar por Rol"
                    className="w-full h-[52px] pl-3 pr-8 text-xs font-semibold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none cursor-pointer"
                  >
                    <option value="todos">Todos los roles</option>
                    {currentUser?.rol === 'superadmin' && (
                      <option value="superadmin">Superadmin</option>
                    )}
                    <option value="administrador">Administrador</option>
                    <option value="operador">Operador</option>
                  </select>
                  <HiChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Filtro Estado */}
                <div className="lg:col-span-2 relative">
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    aria-label="Filtrar por Estado"
                    className="w-full h-[52px] pl-3 pr-8 text-xs font-semibold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none cursor-pointer"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="Activo">Activos</option>
                    <option value="Inactivo">Inactivos</option>
                  </select>
                  <HiChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Botón Limpiar Filtros */}
                <div className="lg:col-span-2 flex justify-end">
                  {hasActiveFilters ? (
                    <button 
                      onClick={clearFilters}
                      className="w-full font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-transparent shadow-none h-[52px] rounded-xl flex items-center justify-center gap-2 transition-colors text-xs"
                    >
                      <HiFilter className="text-lg" />
                      <span>Limpiar</span>
                    </button>
                  ) : (
                    <div className="w-full h-[52px]"></div>
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
                <div className="relative">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    aria-label="Por página"
                    className="h-9 pl-3 pr-7 text-xs font-bold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 appearance-none cursor-pointer"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="50">50</option>
                  </select>
                  <HiChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Tabla Directorio Activo */}
            <div className="w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800">
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 py-4 px-6">USUARIO</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 py-4 px-6">ROL</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 py-4 px-6">ESTADO</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 py-4 px-6">ÚLTIMO ACCESO</th>
                    <th className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 py-4 px-6">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-zinc-500">
                          <HiUserGroup className="w-12 h-12 opacity-20 mb-2" />
                          <p className="font-bold text-sm">No se encontraron usuarios</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((usuario) => {
                      const isSelf = currentUser?.id == usuario.id;
                      return (
                        <tr key={usuario.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-black text-xs flex items-center justify-center border border-purple-200/50 dark:border-purple-800/40 shadow-sm shrink-0">
                                {(usuario.nombre || "U").charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className={`font-bold text-sm leading-tight ${isSelf ? 'text-purple-600 dark:text-purple-400' : 'text-slate-800 dark:text-zinc-100'}`}>
                                  {usuario.nombre} {isSelf && "(Tú)"}
                                </span>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">@{usuario.username}</span>
                                  <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">{usuario.correo}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${getRolBadge(usuario.rol)}`}>
                              {usuario.rol}
                            </span>
                          </td>
                          
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 ${getEstadoBadge(usuario.estado_usuario)}`}>
                              <div className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                              {usuario.estado_usuario}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                              {usuario.ultimo_acceso ? new Date(usuario.ultimo_acceso).toLocaleString('es-MX', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'}) : <span className="italic opacity-60">Nunca</span>}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                title="Gestionar permisos"
                                onClick={() => handleOpenPermissions(usuario)}
                                className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
                              >
                                <HiShieldCheck className="w-4 h-4" />
                              </button>

                              <button
                                title="Ver sesiones activas"
                                onClick={() => handleOpenSessions(usuario)}
                                className="p-2 bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20 rounded-lg transition-colors"
                              >
                                <HiDesktopComputer className="w-4 h-4" />
                              </button>

                              <button
                                title={isSelf ? "No puedes desactivarte" : "Desactivar usuario"}
                                disabled={isSelf}
                                onClick={() => !isSelf && handleEliminar(usuario)}
                                className={isSelf ? "p-2 bg-slate-100 text-slate-300 dark:bg-zinc-800/50 dark:text-zinc-600 rounded-lg cursor-not-allowed" : "p-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"}
                              >
                                <HiTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación Inferior */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/50">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  Página {page} de {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-40 transition-colors"
                  >
                    <HiChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .map((p, idx, arr) => (
                        <div key={p} className="flex items-center">
                          {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-slate-400 text-xs">...</span>}
                          <button
                            onClick={() => setPage(p)}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                              page === p
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            {p}
                          </button>
                        </div>
                      ))}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-40 transition-colors"
                  >
                    <HiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Controles de Filtrado - Papelera */}
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-950">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
                
                {/* Info y botón de actualización */}
                <div className="lg:col-span-6 flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                    Mostrando <span className="text-red-500 font-extrabold">{itemsDeleted.length}</span> de <span className="font-extrabold">{filteredDeletedUsers.length}</span> usuarios desactivados
                  </span>
                  <button 
                    onClick={fetchUsuarios}
                    className="text-left text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1.5 outline-none"
                    disabled={loading}
                  >
                    <HiRefresh className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    Actualizar papelera
                  </button>
                </div>

                {/* Buscador de papelera */}
                <div className="lg:col-span-6 relative w-full flex items-center">
                  <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                    <HiSearch className="w-5 h-5" />
                  </span>
                  <input
                    placeholder="Buscar en papelera..."
                    value={searchDeleted}
                    onChange={(e) => setSearchDeleted(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 shadow-none h-[52px]"
                  />
                  {searchDeleted && (
                    <button
                      onClick={() => setSearchDeleted("")}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                    >
                      <HiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Info Paginación Superior Papelera */}
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 bg-slate-50/40 dark:bg-zinc-900/30">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Mostrando <span className="text-slate-700 dark:text-zinc-200">{itemsDeleted.length}</span> de <span className="text-slate-700 dark:text-zinc-200">{filteredDeletedUsers.length}</span> usuarios en papelera
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 hidden sm:block">
                  Filas por página:
                </span>
                <div className="relative">
                  <select
                    value={rowsPerPageDeleted}
                    onChange={(e) => {
                      setRowsPerPageDeleted(Number(e.target.value));
                      setPageDeleted(1);
                    }}
                    aria-label="Por página papelera"
                    className="h-9 pl-3 pr-7 text-xs font-bold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 appearance-none cursor-pointer"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="50">50</option>
                  </select>
                  <HiChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Tabla de Papelera */}
            <div className="w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800">
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 py-4 px-6">USUARIO</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 py-4 px-6">FECHA ELIMINACIÓN</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 py-4 px-6">MOTIVO DE ELIMINACIÓN</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 py-4 px-6">ELIMINADO POR</th>
                    <th className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 py-4 px-6">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                  {itemsDeleted.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-zinc-500">
                          <HiFolder className="w-12 h-12 opacity-20 mb-2" />
                          <p className="font-bold text-sm">La papelera está vacía</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    itemsDeleted.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-black text-xs flex items-center justify-center border border-slate-300/50 dark:border-zinc-700/40 shadow-sm shrink-0">
                              {(usuario.nombre || "U").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm leading-tight text-slate-800 dark:text-zinc-100">{usuario.nombre}</span>
                              <div className="flex flex-col gap-0.5 mt-0.5">
                                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">@{usuario.username}</span>
                                <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">{usuario.correo}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                            {usuario.fecha_eliminacion ? new Date(usuario.fecha_eliminacion).toLocaleString('es-MX', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'}) : <span className="italic opacity-60">No registrada</span>}
                          </span>
                        </td>
                        
                        <td className="py-4 px-6">
                          <span className="text-xs font-bold text-red-500/80 uppercase tracking-widest max-w-[200px] truncate block" title={usuario.razon_eliminacion}>
                            {usuario.razon_eliminacion || "Sin motivo registrado"}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">
                            {usuario.eliminador_username ? `@${usuario.eliminador_username}` : <span className="italic opacity-60">Desconocido</span>}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              title="Restaurar usuario"
                              onClick={() => handleReactivar(usuario)}
                              className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                            >
                              <HiCheck className="w-4 h-4" />
                            </button>

                            <button
                              title="Eliminar definitivamente"
                              onClick={() => handlePurge(usuario)}
                              className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <HiTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación Inferior Papelera */}
            {totalPagesDeleted > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/50">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  Página {pageDeleted} de {totalPagesDeleted}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPageDeleted(p => Math.max(p - 1, 1))}
                    disabled={pageDeleted === 1}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-40 transition-colors"
                  >
                    <HiChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPagesDeleted }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPagesDeleted || Math.abs(p - pageDeleted) <= 1)
                      .map((p, idx, arr) => (
                        <div key={p} className="flex items-center">
                          {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-slate-400 text-xs">...</span>}
                          <button
                            onClick={() => setPageDeleted(p)}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                              pageDeleted === p
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            {p}
                          </button>
                        </div>
                      ))}
                  </div>
                  <button
                    onClick={() => setPageDeleted(p => Math.min(p + 1, totalPagesDeleted))}
                    disabled={pageDeleted === totalPagesDeleted}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-40 transition-colors"
                  >
                    <HiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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

      {/* Modal de Confirmación Premium */}
      <FlowbiteModal
        show={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        size="md"
        popup
        theme={premiumConfirmModalTheme}
      >
        <FlowbiteModalHeader />
        <FlowbiteModalBody>
          <div className="text-center p-2">
            <HiExclamationCircle className={`mx-auto mb-4 h-14 w-14 ${confirmModal.color === "success" ? "text-emerald-500" : "text-red-500"}`} />
            <h3 className="mb-4 text-base font-black text-slate-800 dark:text-zinc-100">
              {confirmModal.title}
            </h3>
            <p className="mb-6 text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-center gap-3">
              <FlowbiteButton
                color={confirmModal.color === "success" ? "success" : "failure"}
                onClick={confirmModal.onConfirm}
                className="font-bold"
              >
                Sí, confirmar
              </FlowbiteButton>
              <FlowbiteButton
                color="gray"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="font-bold text-slate-500"
              >
                Cancelar
              </FlowbiteButton>
            </div>
          </div>
        </FlowbiteModalBody>
      </FlowbiteModal>
    </div>
  );
};

export default GestionUsuarios;
