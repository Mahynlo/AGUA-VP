import React, { useState } from "react";
import {
    HiEye,
    HiTrash,
    HiPhone,
    HiMail,
    HiLocationMarker,
    HiDownload,
    HiUsers,
    HiSearch,
    HiX,
    HiFilter,
    HiPencil,
    HiChevronLeft,
    HiChevronRight,
    HiRefresh,
    HiFolder,
    HiExclamationCircle,
    HiUserCircle
} from "react-icons/hi";
import { Modal, Button } from "flowbite-react";
import RegistrarClientes from "./RegistrarCliente";
import EditarClientes from "./EditarCliente";
import ModalDetalleCliente from "./ModalDetalleCliente";
import { useTabClientes } from "../../../hooks/useTabClientes";
import { useClientes } from "../../../context/ClientesContext";
import { exportData } from "../../../utils/exportUtils";
import { useFeedback } from "../../../context/FeedbackContext";
import { normalizarTexto } from "../../../utils/textUtils";

const premiumConfirmModalTheme = {
  root: {
    show: { on: "flex bg-slate-900/60 dark:bg-black/80 mt-10", off: "hidden" }
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

const normalizarClientesParaExport = (lista) => {
    return lista.map((c, index) => ({
        "No.": index + 1,
        "Nombre": c.nombre || "",
        "Número de Predio": c.numero_predio || "",
        "Ciudad": c.ciudad || "",
        "Dirección": c.direccion || "",
        "Teléfono": c.telefono || "",
        "Correo": c.email || c.correo || "",
        "Tarifa": c.tarifa_nombre || c.tarifa || "Sin Tarifa",
        "Estado": c.estado_cliente || c.estado || "Activo"
    }));
};

// ── SKELETON DE CARGA (animate-pulse nativo) ──────────────────────────────────
const LoadingSkeleton = () => (
    <div className="w-full flex flex-col gap-6">
        <div className="flex justify-between items-center pb-4">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
                <div className="space-y-2">
                    <div className="h-6 w-48 rounded-md bg-slate-200 dark:bg-zinc-800 animate-pulse" />
                    <div className="h-3 w-32 rounded-md bg-slate-200 dark:bg-zinc-800 animate-pulse" />
                </div>
            </div>
            <div className="flex gap-2">
                <div className="h-11 w-24 rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-11 w-32 rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
            </div>
        </div>
        <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="h-[52px] w-full rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse lg:col-span-2" />
                    <div className="h-[52px] w-full rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
                    <div className="h-[52px] w-full rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
                </div>
            </div>
            <div className="bg-white dark:bg-zinc-950">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-20 w-full border-b border-slate-100 dark:border-zinc-800/50 flex items-center px-6 gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-zinc-800 animate-pulse shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="h-4 w-1/4 rounded-md bg-slate-200 dark:bg-zinc-800 animate-pulse" />
                            <div className="h-3 w-1/3 rounded-md bg-slate-200 dark:bg-zinc-800 animate-pulse" />
                        </div>
                        <div className="h-10 w-32 rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ── SPINNER CSS PURO ──────────────────────────────────────────────────────────
function LoadingSpinner({ className = "w-4 h-4" }) {
    return (
        <div className={`${className} border-2 border-slate-300 dark:border-zinc-600 border-t-blue-600 rounded-full animate-spin`} />
    );
}

// ── DROPDOWN DE EXPORTAR ──────────────────────────────────────────────────────
function ExportDropdown({ onExportCSV, onExportExcel }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl h-[52px] px-5 shadow-sm flex items-center gap-2 transition-colors border border-slate-200 dark:border-zinc-800"
            >
                <HiDownload className="text-lg text-blue-600 dark:text-blue-400" />
                Exportar
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-52 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <button
                            onClick={() => { onExportCSV(); setOpen(false); }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left"
                        >
                            <span className="text-xl">📄</span>
                            Exportar CSV
                        </button>
                        <button
                            onClick={() => { onExportExcel(); setOpen(false); }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left"
                        >
                            <span className="text-xl">📊</span>
                            Exportar Excel (.xlsx)
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ── PAGINACIÓN SIMPLE ─────────────────────────────────────────────────────────
function SimplePagination({ currentPage, totalPages, onChange }) {
    if (totalPages <= 1) return null;

    const pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage > 3) pages.push("...");
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push("...");
        pages.push(totalPages);
    }

    const base = "h-9 min-w-[36px] px-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center";
    const active = "bg-blue-600 text-white shadow-sm";
    const inactive = "bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-800";
    const disabled = "opacity-40 cursor-not-allowed";

    return (
        <div className="flex items-center gap-1.5">
            <button
                onClick={() => onChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`${base} ${currentPage === 1 ? `${inactive} ${disabled}` : inactive}`}
                title="Página anterior"
            >
                <HiChevronLeft className="w-4 h-4" />
            </button>
            {pages.map((page, i) =>
                page === "..." ? (
                    <span key={`e${i}`} className="px-1 text-slate-400 text-sm select-none font-bold">…</span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onChange(page)}
                        className={`${base} ${page === currentPage ? active : inactive}`}
                    >
                        {page}
                    </button>
                )
            )}
            <button
                onClick={() => onChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`${base} ${currentPage === totalPages ? `${inactive} ${disabled}` : inactive}`}
                title="Página siguiente"
            >
                <HiChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

// ── BADGE DE ESTADO ──────────────────────────────────────────────────────────
const STATUS_COLORS = {
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40",
    danger:  "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40",
    default: "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700",
};

function StatusBadge({ status, getStatusColor }) {
    const color = STATUS_COLORS[getStatusColor(status)] ?? STATUS_COLORS.default;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${color}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
            {status || "Sin estado"}
        </span>
    );
}

// ── AVATAR + NOMBRE ──────────────────────────────────────────────────────────
function ClienteUser({ nombre, numeroPredio, id }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 shadow-sm flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {nombre?.charAt(0)?.toUpperCase() || "C"}
                </span>
            </div>
            <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-slate-800 dark:text-zinc-100 leading-tight truncate">{nombre}</span>
                <span className="font-medium text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    {numeroPredio ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                            #{numeroPredio}
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500">
                            Sin predio
                        </span>
                    )}
                    <span className="text-slate-300 dark:text-zinc-700">·</span>
                    <span className="text-slate-400 dark:text-zinc-500">ID: {id}</span>
                </span>
            </div>
        </div>
    );
}

// ── ESTILOS COMPARTIDOS ───────────────────────────────────────────────────────
const SELECT_CLS = "w-full h-[52px] pl-4 pr-8 text-sm font-semibold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none appearance-none cursor-pointer";

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export function TabClientes() {
    const {
        filteredData,
        paginatedData,
        initialLoading,
        loading,
        search,
        cityFilter,
        statusFilter,
        ciudades,
        estados,
        currentPage,
        rowsPerPage,
        totalPages,
        totalItems,
        handleSearch,
        handleCityFilterChange,
        handleStatusFilterChange,
        handleOrderByChange,
        handleRowsPerPageChange,
        clearFilters,
        hasActiveFilters,
        setCurrentPage,
        getStatusColor,
        orderBy
    } = useTabClientes();

    const { setSuccess, setError } = useFeedback();
    const { actualizarClientes, allClientes } = useClientes();

    const [selectedCliente, setSelectedCliente] = React.useState(null);
    const [isDetailOpen, setIsDetailOpen] = React.useState(false);
    const [selectedEditId, setSelectedEditId] = React.useState(null);
    const [isEditOpen, setIsEditOpen] = React.useState(false);

    // Estados para Papelera
    const [showDeleted, setShowDeleted] = React.useState(false);
    const [deletedClientes, setDeletedClientes] = React.useState([]);
    const [loadingDeleted, setLoadingDeleted] = React.useState(false);
    const [searchDeleted, setSearchDeleted] = React.useState("");

    // Estado para confirmación premium
    const [confirmModal, setConfirmModal] = React.useState({
        isOpen: false,
        title: "",
        message: "",
        color: "amber",
        onConfirm: () => {}
    });

    // Estado para exportación premium
    const [exportModal, setExportModal] = React.useState({
        isOpen: false,
        format: "csv"
    });

    const handleExecuteExport = async (type) => {
        setExportModal(prev => ({ ...prev, isOpen: false }));
        try {
            let dataToExport = [];
            let prefix = "";
            if (type === "page") {
                dataToExport = paginatedData;
                prefix = "Pagina_";
            } else if (type === "filtered") {
                dataToExport = filteredData;
                prefix = "Filtrados_";
            } else {
                dataToExport = allClientes;
                prefix = "Todos_";
            }

            const normalizedData = normalizarClientesParaExport(dataToExport);
            const format = exportModal.format;
            const filename = `Clientes_${prefix}${new Date().toISOString().split("T")[0]}`;
            
            const ok = await exportData(normalizedData, filename, format);
            if (ok) {
                setSuccess("Clientes exportados correctamente");
            } else {
                setError("Error al exportar clientes", "Exportación");
            }
        } catch (err) {
            console.error("Error al exportar clientes:", err);
            setError("Error al exportar clientes", "Exportación");
        }
    };

    const filteredDeletedClientes = deletedClientes.filter(c => {
        const term = normalizarTexto(searchDeleted);
        return (
            normalizarTexto(c.nombre).includes(term) ||
            normalizarTexto(c.numero_predio).includes(term) ||
            (c.direccion && normalizarTexto(c.direccion).includes(term)) ||
            (c.ciudad && normalizarTexto(c.ciudad).includes(term)) ||
            (c.telefono && normalizarTexto(c.telefono).includes(term))
        );
    });

    const loadDeletedClientes = async () => {
        setLoadingDeleted(true);
        try {
            const token = localStorage.getItem("token");
            const response = await window.api.fetchClientesEliminados(token);
            if (response && response.clientes_eliminados) {
                setDeletedClientes(response.clientes_eliminados);
            }
        } catch (err) {
            console.error("Error cargando clientes eliminados:", err);
        } finally {
            setLoadingDeleted(false);
        }
    };

    const handleRestoreCliente = (cliente) => {
        setConfirmModal({
            isOpen: true,
            title: "¿Desea restaurar al cliente?",
            message: `Esta acción reactivará al cliente "${cliente.nombre}" y lo devolverá al directorio activo.`,
            color: "success",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const token = localStorage.getItem("token");
                    const response = await window.api.reactivateClient({ id: cliente.id, token_session: token });
                    if (response.success) {
                        setSuccess("Cliente restaurado correctamente");
                        loadDeletedClientes();
                        actualizarClientes();
                    } else {
                        setError(response.message || "Error al restaurar cliente", "Restaurar Cliente");
                    }
                } catch (err) {
                    console.error("Error al restaurar cliente:", err);
                    setError(err.message || "Error al restaurar cliente", "Restaurar Cliente");
                }
            }
        });
    };

    const handlePurgeCliente = (cliente) => {
        setConfirmModal({
            isOpen: true,
            title: "¿Eliminar definitivamente al cliente?",
            message: `¿Está completamente seguro de eliminar definitivamente a "${cliente.nombre}"? Esta acción no se puede deshacer y borrará permanentemente todos sus datos del sistema.`,
            color: "failure",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const token = localStorage.getItem("token");
                    const response = await window.api.purgeClient({ id: cliente.id, token_session: token });
                    if (response.success) {
                        setSuccess("Cliente eliminado definitivamente");
                        loadDeletedClientes();
                        actualizarClientes();
                    } else {
                        setError(response.message || "No se puede eliminar definitivamente el cliente. Podría tener facturas o historial registrado.", "Eliminar Definitivamente");
                    }
                } catch (err) {
                    console.error("Error al purgar cliente:", err);
                    setError(err.message || "Error al purgar cliente.", "Eliminar Definitivamente");
                }
            }
        });
    };

    if (initialLoading) return <LoadingSkeleton />;

    const handleAction = (action, cliente) => {
        switch (action) {
            case "view":
                setSelectedCliente(cliente);
                setIsDetailOpen(true);
                break;
            case "edit":
                setSelectedEditId(cliente.id);
                setIsEditOpen(true);
                break;
            case "delete":
                setError(`Para desactivar o eliminar a ${cliente.nombre}, por favor utilice la "Zona de Peligro" al final del formulario de edición.`, "Desactivar Cliente");
                setSelectedEditId(cliente.id);
                setIsEditOpen(true);
                break;
        }
    };

    return (
        <div className="w-full flex flex-col gap-6">

            {/* ── HEADER Y ACCIONES ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 dark:bg-blue-900/30 rounded-2xl shrink-0">
                        <HiUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                                Directorio de Clientes
                            </h3>
                            {loading && !initialLoading && (
                                <LoadingSpinner className="w-4 h-4 ml-1" />
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
                            Gestión y búsqueda general
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                    <ExportDropdown
                        onExportCSV={() => setExportModal({ isOpen: true, format: "csv" })}
                        onExportExcel={() => setExportModal({ isOpen: true, format: "xlsx" })}
                    />
                    <div className="flex-1 sm:flex-none">
                        <RegistrarClientes />
                    </div>
                </div>
            </div>

            {/* ── TAB SELECTOR ── */}
            <div className="flex border-b border-slate-200 dark:border-zinc-800 gap-6 my-2">
                <button
                    onClick={() => setShowDeleted(false)}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all ${!showDeleted ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300"}`}
                >
                    Directorio Activo
                </button>
                <button
                    onClick={() => {
                        setShowDeleted(true);
                        loadDeletedClientes();
                    }}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all ${showDeleted ? "border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300"} flex items-center gap-2`}
                >
                    <HiFolder className="w-4 h-4" /> Papelera
                </button>
            </div>

            {/* ── CONTENEDOR PRINCIPAL ── */}
            <div className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-transparent rounded-2xl overflow-hidden flex flex-col">

                {showDeleted ? (
                    <div className="flex flex-col flex-1">
                        {/* Sub-header Papelera */}
                        <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                        Mostrando <span className="text-rose-600 dark:text-rose-400 font-extrabold">{filteredDeletedClientes.length}</span> de <span className="font-extrabold text-slate-700 dark:text-zinc-200">{deletedClientes.length}</span> clientes desactivados
                                    </span>
                                    <button 
                                        onClick={loadDeletedClientes}
                                        className="text-left text-xs font-bold text-slate-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                                        disabled={loadingDeleted}
                                    >
                                        <HiRefresh className={`w-3.5 h-3.5 ${loadingDeleted ? "animate-spin" : ""}`} />
                                        {loadingDeleted ? "Actualizando..." : "Actualizar papelera"}
                                    </button>
                                </div>
                                <div className="relative w-full md:w-80 flex items-center">
                                    <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none">
                                        <HiSearch className="w-5 h-5" />
                                    </span>
                                    <input
                                        placeholder="Buscar en papelera..."
                                        value={searchDeleted}
                                        onChange={(e) => setSearchDeleted(e.target.value)}
                                        className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-none h-[52px]"
                                    />
                                    {searchDeleted && (
                                        <button
                                            onClick={() => setSearchDeleted("")}
                                            className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                                        >
                                            <HiX className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tabla Papelera */}
                        <div className="bg-white dark:bg-zinc-950 overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-zinc-800">
                                        {["CLIENTE", "FECHA ELIMINACIÓN", "MOTIVO DE ELIMINACIÓN", "ELIMINADO POR", "ACCIONES"].map((col, i) => (
                                            <th
                                                key={col}
                                                className={`py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 bg-transparent ${i === 4 ? "text-right" : "text-left"}`}
                                            >
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingDeleted ? (
                                        <tr>
                                            <td colSpan={5} className="py-16 text-center">
                                                <div className="flex justify-center items-center">
                                                    <LoadingSpinner className="w-8 h-8" />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredDeletedClientes.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-16 text-center">
                                                <p className="font-bold text-sm text-slate-500">No se encontraron clientes desactivados</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDeletedClientes.map((cliente) => (
                                            <tr key={cliente.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-slate-800 dark:text-zinc-100">{cliente.nombre}</span>
                                                        <span className="font-medium text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                            {cliente.numero_predio ? (
                                                                <>Predio <span className="font-bold text-slate-700 dark:text-zinc-300">#{cliente.numero_predio}</span></>
                                                            ) : (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500">Sin predio</span>
                                                            )}
                                                            <span className="text-slate-300 dark:text-zinc-700">·</span> ID: {cliente.id}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-xs text-slate-600 dark:text-zinc-300 font-medium">
                                                    {cliente.fecha_eliminacion ? new Date(cliente.fecha_eliminacion).toLocaleString() : "N/A"}
                                                </td>
                                                <td className="py-4 px-6 text-xs text-slate-600 dark:text-zinc-300 max-w-[250px] truncate font-medium" title={cliente.razon_eliminacion}>
                                                    {cliente.razon_eliminacion || "Sin razón"}
                                                </td>
                                                <td className="py-4 px-6 text-xs text-slate-600 dark:text-zinc-300 font-medium">
                                                    {cliente.eliminado_por_nombre || "Desconocido"}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => { setSelectedCliente(cliente); setIsDetailOpen(true); }}
                                                            title="Ver Detalle"
                                                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 dark:bg-zinc-800 dark:hover:bg-blue-900/30 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
                                                        >
                                                            <HiEye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRestoreCliente(cliente)}
                                                            title="Restaurar Cliente"
                                                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-600 dark:bg-zinc-800 dark:hover:bg-emerald-900/30 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors"
                                                        >
                                                            <HiRefresh className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePurgeCliente(cliente)}
                                                            title="Eliminar Definitivamente"
                                                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400 transition-colors"
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
                    </div>
                ) : (
                    <>
                        {/* Filtros */}
                <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">

                        {/* Buscador */}
                        <div className="lg:col-span-5 relative w-full flex items-center">
                            <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none">
                                <HiSearch className="w-5 h-5" />
                            </span>
                            <input
                                placeholder="Buscar por nombre, dirección, tel., correo o predio..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none h-[52px]"
                            />
                            {search && (
                                <button
                                    onClick={() => handleSearch("")}
                                    className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                                >
                                    <HiX className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Filtro ciudad */}
                        <div className="lg:col-span-2">
                            <select
                                value={cityFilter}
                                onChange={(e) => handleCityFilterChange(e.target.value)}
                                aria-label="Filtrar por ciudad"
                                className={SELECT_CLS}
                            >
                                <option value="All">Todas las ciudades</option>
                                {ciudades.map((ciudad) => (
                                    <option key={ciudad} value={ciudad}>{ciudad}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro estado */}
                        <div className="lg:col-span-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => handleStatusFilterChange(e.target.value)}
                                aria-label="Filtrar por estado"
                                className={SELECT_CLS}
                            >
                                <option value="All">Todos los estados</option>
                                {estados.map((estado) => (
                                    <option key={estado} value={estado}>{estado}</option>
                                ))}
                            </select>
                        </div>

                        {/* Ordenar */}
                        <div className="lg:col-span-2">
                            <select
                                value={orderBy}
                                onChange={(e) => handleOrderByChange(e.target.value)}
                                aria-label="Ordenar clientes"
                                className={SELECT_CLS}
                            >
                                <option value="numero_predio">N° de predio</option>
                                <option value="nombre">Nombre (A-Z)</option>
                            </select>
                        </div>

                        {/* Limpiar filtros */}
                        <div className="lg:col-span-1 flex justify-end">
                            {hasActiveFilters ? (
                                <button
                                    onClick={clearFilters}
                                    className="w-full font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 h-[52px] rounded-xl flex items-center justify-center gap-2 transition-colors"
                                >
                                    <HiFilter className="text-lg" />
                                    Limpiar
                                </button>
                            ) : (
                                <div className="w-full h-[52px]" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Sub-header paginación */}
                <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 bg-slate-50/40 dark:bg-zinc-900/30">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                        Mostrando{" "}
                        <span className="text-blue-600 dark:text-blue-400 font-extrabold">{paginatedData.length}</span>
                        {" "}de{" "}
                        <span className="text-slate-700 dark:text-zinc-200 font-extrabold">{totalItems}</span>
                        {" "}clientes
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 hidden sm:block">
                            Filas por página:
                        </span>
                        <select
                            value={rowsPerPage.toString()}
                            onChange={(e) => handleRowsPerPageChange(e.target.value)}
                            aria-label="Filas por página"
                            className="h-[36px] px-3 text-sm font-bold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-none appearance-none cursor-pointer w-20"
                        >
                            {["5", "10", "15", "20", "50"].map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tabla nativa */}
                <div className="bg-white dark:bg-zinc-950 overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-zinc-800">
                                {["CLIENTE", "CONTACTO", "UBICACIÓN", "ESTADO", "ACCIONES"].map((col, i) => (
                                    <th
                                        key={col}
                                        className={`py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 bg-transparent ${i === 4 ? "text-right" : "text-left"}`}
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <LoadingSpinner className="w-8 h-8" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 animate-pulse">
                                                Cargando directorio...
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <HiUsers className="w-12 h-12 opacity-20 mb-3 text-slate-400 dark:text-zinc-500" />
                                            <p className="font-bold text-sm text-slate-600 dark:text-zinc-300">No se encontraron clientes</p>
                                            <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 mt-1 max-w-[250px] text-center">
                                                Intenta ajustar los filtros de búsqueda.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((cliente) => (
                                    <tr
                                        key={cliente.id}
                                        className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <ClienteUser
                                                nombre={cliente.nombre}
                                                numeroPredio={cliente.numero_predio}
                                                id={cliente.id}
                                            />
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="space-y-1.5">
                                                {cliente.telefono && (
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-300">
                                                        <HiPhone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span>{cliente.telefono}</span>
                                                    </div>
                                                )}
                                                {cliente.email && (
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-300">
                                                        <HiMail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate max-w-[150px] block">{cliente.email}</span>
                                                    </div>
                                                )}
                                                {!cliente.telefono && !cliente.email && (
                                                    <span className="text-xs font-medium text-slate-400 italic">Sin contacto</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="space-y-1 max-w-[200px]">
                                                <div className="flex items-center gap-1.5">
                                                    <HiLocationMarker className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 truncate">
                                                        {cliente.ciudad || "S/C"}
                                                    </span>
                                                </div>
                                                {cliente.direccion && (
                                                    <div className="text-[10px] font-medium text-slate-500 truncate ml-5">
                                                        {cliente.direccion}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <StatusBadge
                                                status={cliente.estado_cliente}
                                                getStatusColor={getStatusColor}
                                            />
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleAction("view", cliente)}
                                                    title="Ver Detalle"
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 dark:bg-zinc-800 dark:hover:bg-blue-900/30 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
                                                >
                                                    <HiEye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleAction("edit", cliente)}
                                                    title="Editar Cliente"
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                                                >
                                                    <HiPencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleAction("delete", cliente)}
                                                    title="Eliminar"
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400 transition-colors"
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

                {/* Paginación inferior */}
                {totalPages > 1 && (
                    <div className="flex justify-center p-4 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/60 dark:bg-zinc-900/40">
                        <SimplePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onChange={setCurrentPage}
                        />
                    </div>
                )}
                </>
                )}
            </div>

            {/* ── MODALES ── */}
            <ModalDetalleCliente
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                cliente={selectedCliente}
            />
            <EditarClientes
                id={selectedEditId}
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
            />

            {/* Modal de Confirmación Premium */}
            <Modal
                show={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                size="md"
                popup
                theme={premiumConfirmModalTheme}
            >
                <Modal.Header />
                <Modal.Body>
                    <div className="text-center p-2">
                        <HiExclamationCircle className={`mx-auto mb-4 h-14 w-14 ${confirmModal.color === "success" ? "text-emerald-500" : "text-rose-500"}`} />
                        <h3 className="mb-4 text-base font-black text-slate-800 dark:text-zinc-100">
                            {confirmModal.title}
                        </h3>
                        <p className="mb-6 text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed">
                            {confirmModal.message}
                        </p>
                        <div className="flex justify-center gap-3">
                            <Button
                                color={confirmModal.color === "success" ? "success" : "failure"}
                                onClick={confirmModal.onConfirm}
                                className="font-bold"
                            >
                                Sí, confirmar
                            </Button>
                            <Button
                                color="gray"
                                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                className="font-bold text-slate-500"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Modal de Configuración de Exportación */}
            <Modal
                show={exportModal.isOpen}
                onClose={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
                size="md"
                popup
                theme={premiumConfirmModalTheme}
            >
                <Modal.Header />
                <Modal.Body>
                    <div className="p-2">
                        <div className="flex items-center gap-3 mb-4 justify-center">
                            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
                                <HiDownload className="w-8 h-8" />
                            </div>
                        </div>
                        <h3 className="mb-2 text-center text-lg font-black text-slate-800 dark:text-zinc-100">
                            Opciones de Exportación ({exportModal.format.toUpperCase()})
                        </h3>
                        <p className="mb-6 text-center text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed">
                            Selecciona el conjunto de datos que deseas descargar en tu archivo.
                        </p>

                        <div className="flex flex-col gap-3 mb-6">
                            {/* Opción 1: Página Actual */}
                            <button
                                type="button"
                                onClick={() => handleExecuteExport("page")}
                                className="flex flex-col text-left p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/10 dark:bg-zinc-900/30 transition-all duration-200 w-full"
                            >
                                <span className="text-xs font-black text-slate-800 dark:text-zinc-100 flex items-center justify-between w-full">
                                    <span>Página actual (tabla)</span>
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md">
                                        {paginatedData.length} registros
                                    </span>
                                </span>
                                <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
                                    Exporta únicamente los registros visibles actualmente en esta página de la tabla.
                                </span>
                            </button>

                            {/* Opción 3: Todos */}
                            <button
                                type="button"
                                onClick={() => handleExecuteExport("all")}
                                className="flex flex-col text-left p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/10 dark:bg-zinc-900/30 transition-all duration-200 w-full"
                            >
                                <span className="text-xs font-black text-slate-800 dark:text-zinc-100 flex items-center justify-between w-full">
                                    <span>Todos los registros</span>
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-md">
                                        {allClientes.length} registros
                                    </span>
                                </span>
                                <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
                                    Exporta la totalidad de la base de datos de clientes en el sistema.
                                </span>
                            </button>
                        </div>

                        <div className="flex justify-center gap-3">
                            <Button
                                color="gray"
                                onClick={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
                                className="font-bold text-slate-500"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}
