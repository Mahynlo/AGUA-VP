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
import { useUsuarios } from "../../../context/UsuariosContext";
import { useAuth } from "../../../context/AuthContext";

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

// Estilos compartidos (solo apariencia)
const inputClasses = "w-full h-11 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all";
const selectClasses = "w-full h-11 pl-3 pr-8 text-xs font-bold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none cursor-pointer";
const thClasses = "sticky top-0 z-10 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 py-3 px-5 bg-slate-50 dark:bg-zinc-900 whitespace-nowrap";
const accionBase = "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition-colors";
const formatoFecha = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };

// Tarjeta de indicador compacta
const Kpi = ({ icon: Icon, label, value, tint }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80">
    <div className={`p-2 rounded-lg shrink-0 ${tint}`}><Icon className="w-4 h-4" /></div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 truncate">{label}</p>
      <p className="text-xl font-black text-slate-800 dark:text-zinc-100 leading-tight">{value}</p>
    </div>
  </div>
);

// Selector de filas por página
const FilasPorPagina = ({ value, onChange, label }) => (
  <div className="flex items-center gap-2 shrink-0">
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 hidden sm:block">Filas</span>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className="h-11 pl-3 pr-7 text-xs font-bold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 appearance-none cursor-pointer"
      >
        <option value="5">5</option>
        <option value="10">10</option>
        <option value="15">15</option>
        <option value="50">50</option>
      </select>
      <HiChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

// Pie de tabla: conteo + paginación
const PieTabla = ({ mostrando, total, sustantivo, page, totalPages, setPage }) => (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/40">
    <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
      Mostrando <b className="text-slate-700 dark:text-zinc-200">{mostrando}</b> de <b className="text-slate-700 dark:text-zinc-200">{total}</b> {sustantivo}
      {totalPages > 1 && <span className="text-slate-400 dark:text-zinc-500"> · Página {page} de {totalPages}</span>}
    </span>
    {totalPages > 1 && (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          disabled={page === 1}
          aria-label="Página anterior"
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
          aria-label="Página siguiente"
          className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-40 transition-colors"
        >
          <HiChevronRight className="w-4 h-4" />
        </button>
      </div>
    )}
  </div>
);

// Celda de identidad del usuario (avatar con el tinte de su rol)
const CeldaUsuario = ({ usuario, avatarClass, destacado, sufijo }) => (
  <div className="flex items-center gap-3 min-w-0">
    <div className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${avatarClass}`}>
      {(usuario.nombre || "U").charAt(0).toUpperCase()}
    </div>
    <div className="flex flex-col min-w-0">
      <span className={`font-bold text-sm leading-tight truncate ${destacado ? 'text-purple-600 dark:text-purple-400' : 'text-slate-800 dark:text-zinc-100'}`}>
        {usuario.nombre} {sufijo}
      </span>
      <span className="text-xs text-slate-500 dark:text-zinc-400 truncate">
        <span className="font-bold">@{usuario.username}</span>
        {usuario.correo && <span className="text-slate-400 dark:text-zinc-500"> · {usuario.correo}</span>}
      </span>
    </div>
  </div>
);

// Componente LoadingSkeleton premium
const LoadingSkeleton = () => (
  <div className="w-full bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
    <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100 dark:border-zinc-800/50">
      <div className="w-11 h-11 rounded-xl animate-pulse bg-slate-200/50 dark:bg-zinc-800/50" />
      <div className="space-y-2">
        <div className="h-5 w-48 animate-pulse bg-slate-200/50 dark:bg-zinc-800/50 rounded-md" />
        <div className="h-3 w-32 animate-pulse bg-slate-200/50 dark:bg-zinc-800/50 rounded-md" />
      </div>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-6 bg-slate-50/50 dark:bg-zinc-900/30">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-16 w-full animate-pulse bg-slate-200/50 dark:bg-zinc-800/50 rounded-xl" />
      ))}
    </div>
    <div className="space-y-3 p-6">
      <div className="h-11 w-full animate-pulse bg-slate-200/50 dark:bg-zinc-800/50 rounded-xl" />
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

  // Conteos para las pestañas (solo visual)
  const conteoPestanas = useMemo(() => {
    const visibles = usuarios.filter(u => !(currentUser?.rol === 'administrador' && u.rol === 'superadmin'));
    const papelera = visibles.filter(u => u.estado_usuario === 'Eliminado').length;
    return { directorio: visibles.length - papelera, papelera };
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

  const tabClass = (activa) =>
    `flex items-center gap-2 h-12 text-sm font-bold border-b-2 -mb-px transition-colors ${activa ? "border-purple-500 text-purple-600 dark:text-purple-400" : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"}`;
  const contadorClass = (activa) =>
    `px-2 py-0.5 rounded-md text-[10px] font-black ${activa ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"}`;

  return (
    <div className="w-full bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-500">

      {/* ── ENCABEZADO ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-5 border-b border-slate-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
            <HiUserGroup className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                Gestión de Usuarios
              </h3>
              {loading && usuarios.length > 0 && (
                <div className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              )}
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
              Administración de accesos y roles del sistema
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate(-1)}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold rounded-xl h-11 px-4 flex-1 sm:flex-none flex items-center justify-center gap-2 transition-colors text-xs"
          >
            <HiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>
          <div className="flex-1 sm:flex-none">
            <ModalRegistrarUsuario />
          </div>
        </div>
      </div>

      {/* ── INDICADORES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 py-4 bg-slate-50/50 dark:bg-zinc-900/30 border-b border-slate-100 dark:border-zinc-800/50">
        <Kpi icon={HiUserGroup} label="Total Usuarios" value={estadisticas.total} tint="bg-blue-500/10 text-blue-600 dark:text-blue-400" />
        <Kpi icon={HiCheck} label="Activos" value={estadisticas.activos} tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
        <Kpi icon={HiShieldCheck} label="Admin / Super" value={estadisticas.admins} tint="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
        <Kpi icon={HiUserGroup} label="Operadores" value={estadisticas.operadores} tint="bg-sky-500/10 text-sky-600 dark:text-sky-400" />
      </div>

      {/* ── PESTAÑAS (Directorio / Papelera) ── */}
      <div className="flex gap-6 px-6 border-b border-slate-200 dark:border-zinc-800">
        <button onClick={() => setShowDeleted(false)} className={tabClass(!showDeleted)}>
          <HiUserGroup className="w-4 h-4" /> Directorio Activo
          <span className={contadorClass(!showDeleted)}>{conteoPestanas.directorio}</span>
        </button>
        <button onClick={() => setShowDeleted(true)} className={tabClass(showDeleted)}>
          <HiFolder className="w-4 h-4" /> Papelera
          <span className={contadorClass(showDeleted)}>{conteoPestanas.papelera}</span>
        </button>
      </div>

      {!showDeleted ? (
        <>
          {/* Barra de filtros - Directorio Activo */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50">
            {/* Buscador */}
            <div className="relative flex items-center flex-1 min-w-0">
              <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                <HiSearch className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar por nombre, usuario o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={`${inputClasses} pl-10 pr-10`}
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              {/* Filtro Rol */}
              <div className="relative flex-1 sm:w-44 sm:flex-none">
                <select
                  value={filtroRol}
                  onChange={(e) => setFiltroRol(e.target.value)}
                  aria-label="Filtrar por Rol"
                  className={selectClasses}
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
              <div className="relative flex-1 sm:w-44 sm:flex-none">
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  aria-label="Filtrar por Estado"
                  className={selectClasses}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="Activo">Activos</option>
                  <option value="Inactivo">Inactivos</option>
                </select>
                <HiChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Limpiar filtros (solo cuando hay alguno activo) */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="h-11 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors shrink-0"
                >
                  <HiFilter className="w-4 h-4" />
                  <span>Limpiar</span>
                </button>
              )}

              <FilasPorPagina
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                label="Por página"
              />
            </div>
          </div>

          {/* Tabla Directorio Activo */}
          <div className="w-full overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className={thClasses}>USUARIO</th>
                  <th className={thClasses}>ROL</th>
                  <th className={thClasses}>ESTADO</th>
                  <th className={thClasses}>ÚLTIMO ACCESO</th>
                  <th className={`${thClasses} text-right`}>ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-zinc-500">
                        <HiUserGroup className="w-12 h-12 opacity-20 mb-1" />
                        <p className="font-bold text-sm">No se encontraron usuarios</p>
                        {hasActiveFilters && (
                          <button onClick={clearFilters} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
                            Quitar filtros
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((usuario) => {
                    const isSelf = currentUser?.id == usuario.id;
                    return (
                      <tr key={usuario.id} className={`transition-colors ${isSelf ? "bg-purple-500/[0.03] dark:bg-purple-900/10" : ""} hover:bg-slate-50/70 dark:hover:bg-zinc-900/30`}>
                        <td className="py-3 px-5 max-w-[320px]">
                          <CeldaUsuario
                            usuario={usuario}
                            avatarClass={getRolBadge(usuario.rol)}
                            destacado={isSelf}
                            sufijo={isSelf && "(Tú)"}
                          />
                        </td>

                        <td className="py-3 px-5">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${getRolBadge(usuario.rol)}`}>
                            {usuario.rol}
                          </span>
                        </td>

                        <td className="py-3 px-5">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 whitespace-nowrap ${getEstadoBadge(usuario.estado_usuario)}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                            {usuario.estado_usuario}
                          </span>
                        </td>

                        <td className="py-3 px-5 whitespace-nowrap">
                          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                            {usuario.ultimo_acceso ? new Date(usuario.ultimo_acceso).toLocaleString('es-MX', formatoFecha) : <span className="italic opacity-60">Nunca</span>}
                          </span>
                        </td>

                        <td className="py-3 px-5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              title="Gestionar permisos"
                              onClick={() => handleOpenPermissions(usuario)}
                              className={`${accionBase} bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20`}
                            >
                              <HiShieldCheck className="w-4 h-4" />
                              <span className="hidden xl:inline">Permisos</span>
                            </button>

                            <button
                              title="Ver sesiones activas"
                              onClick={() => handleOpenSessions(usuario)}
                              className={`${accionBase} bg-slate-500/10 text-slate-600 dark:text-slate-300 hover:bg-slate-500/20`}
                            >
                              <HiDesktopComputer className="w-4 h-4" />
                              <span className="hidden xl:inline">Sesiones</span>
                            </button>

                            <button
                              title={isSelf ? "No puedes desactivarte" : "Desactivar usuario"}
                              disabled={isSelf}
                              onClick={() => !isSelf && handleEliminar(usuario)}
                              className={isSelf
                                ? `${accionBase} bg-slate-100 text-slate-300 dark:bg-zinc-800/50 dark:text-zinc-600 cursor-not-allowed`
                                : `${accionBase} bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20`}
                            >
                              <HiTrash className="w-4 h-4" />
                              <span className="hidden xl:inline">Desactivar</span>
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

          <PieTabla
            mostrando={items.length}
            total={filteredUsers.length}
            sustantivo="usuarios"
            page={page}
            totalPages={totalPages}
            setPage={setPage}
          />
        </>
      ) : (
        <>
          {/* Barra de filtros - Papelera */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50">
            <div className="relative flex items-center flex-1 min-w-0">
              <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                <HiSearch className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar en papelera..."
                value={searchDeleted}
                onChange={(e) => setSearchDeleted(e.target.value)}
                className={`${inputClasses} pl-10 pr-10`}
              />
              {searchDeleted && (
                <button
                  onClick={() => setSearchDeleted("")}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsuarios}
                disabled={loading}
                className="h-11 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-60 flex-1 sm:flex-none"
              >
                <HiRefresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Actualizar papelera
              </button>

              <FilasPorPagina
                value={rowsPerPageDeleted}
                onChange={(e) => {
                  setRowsPerPageDeleted(Number(e.target.value));
                  setPageDeleted(1);
                }}
                label="Por página papelera"
              />
            </div>
          </div>

          {/* Aviso de la papelera */}
          <div className="flex items-start gap-2 px-6 py-2.5 border-b border-slate-100 dark:border-zinc-800/50 bg-amber-500/5 text-xs font-medium text-slate-600 dark:text-zinc-300">
            <HiExclamationCircle className="w-4 h-4 mt-px text-amber-500 shrink-0" />
            <span>
              Estos usuarios no pueden entrar al sistema. <b>Restaurar</b> les devuelve el acceso; <b>Eliminar</b> borra la cuenta definitivamente.
            </span>
          </div>

          {/* Tabla de Papelera */}
          <div className="w-full overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className={thClasses}>USUARIO</th>
                  <th className={thClasses}>FECHA ELIMINACIÓN</th>
                  <th className={thClasses}>MOTIVO DE ELIMINACIÓN</th>
                  <th className={thClasses}>ELIMINADO POR</th>
                  <th className={`${thClasses} text-right`}>ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {itemsDeleted.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-zinc-500">
                        <HiFolder className="w-12 h-12 opacity-20 mb-1" />
                        <p className="font-bold text-sm">La papelera está vacía</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  itemsDeleted.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3 px-5 max-w-[320px]">
                        <CeldaUsuario
                          usuario={usuario}
                          avatarClass="bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                        />
                      </td>

                      <td className="py-3 px-5 whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                          {usuario.fecha_eliminacion ? new Date(usuario.fecha_eliminacion).toLocaleString('es-MX', formatoFecha) : <span className="italic opacity-60">No registrada</span>}
                        </span>
                      </td>

                      <td className="py-3 px-5">
                        <span className="text-xs font-semibold text-red-600/90 dark:text-red-400/90 max-w-[240px] truncate block" title={usuario.razon_eliminacion}>
                          {usuario.razon_eliminacion || "Sin motivo registrado"}
                        </span>
                      </td>

                      <td className="py-3 px-5 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">
                          {usuario.eliminador_username ? `@${usuario.eliminador_username}` : <span className="italic opacity-60">Desconocido</span>}
                        </span>
                      </td>

                      <td className="py-3 px-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Restaurar usuario"
                            onClick={() => handleReactivar(usuario)}
                            className={`${accionBase} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20`}
                          >
                            <HiCheck className="w-4 h-4" />
                            <span className="hidden xl:inline">Restaurar</span>
                          </button>

                          <button
                            title="Eliminar definitivamente"
                            onClick={() => handlePurge(usuario)}
                            className={`${accionBase} bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20`}
                          >
                            <HiTrash className="w-4 h-4" />
                            <span className="hidden xl:inline">Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PieTabla
            mostrando={itemsDeleted.length}
            total={filteredDeletedUsers.length}
            sustantivo="usuarios en papelera"
            page={pageDeleted}
            totalPages={totalPagesDeleted}
            setPage={setPageDeleted}
          />
        </>
      )}

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
            <div className={`mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center ${confirmModal.color === "success" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
              <HiExclamationCircle className="h-8 w-8" />
            </div>
            <h3 className="mb-3 text-base font-black text-slate-800 dark:text-zinc-100">
              {confirmModal.title}
            </h3>
            <p className="mb-6 text-sm font-medium text-slate-500 dark:text-zinc-400 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-center gap-3">
              <FlowbiteButton
                color="gray"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="font-bold text-slate-500"
              >
                Cancelar
              </FlowbiteButton>
              <FlowbiteButton
                color={confirmModal.color === "success" ? "success" : "failure"}
                onClick={confirmModal.onConfirm}
                className="font-bold"
              >
                Sí, confirmar
              </FlowbiteButton>
            </div>
          </div>
        </FlowbiteModalBody>
      </FlowbiteModal>
    </div>
  );
};

export default GestionUsuarios;
