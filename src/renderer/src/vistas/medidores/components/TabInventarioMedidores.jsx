import { useState } from "react";
import {
    HiEye, HiTrash, HiLocationMarker, HiUser, HiCog,
    HiDownload, HiSearch, HiX, HiFilter, HiChevronLeft, HiChevronRight, HiRefresh, HiFolder,
    HiExclamationCircle
} from "react-icons/hi";
import { useTabMedidores } from "../../../hooks/useTabMedidores";
import { useMedidores } from "../../../context/MedidoresContext";
import { Modal, Button, ModalHeader, ModalBody, ModalFooter } from "flowbite-react";
import { normalizarTexto } from "../../../utils/textUtils";

const premiumModalTheme = {
    root: {
        show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" }
    },
    content: {
        base: "relative h-full w-full p-4 md:h-auto",
        inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-lg dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800"
    },
    header: {
        base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-t-2xl",
        close: { base: "inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer",
            icon: "h-5 w-5"
        }
    },
    body: { base: "p-8 flex-1 overflow-y-auto" },
    footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-b-2xl" }
};
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

const normalizarMedidoresParaExport = (lista) => {
    return lista.map((m, index) => ({
        "No.": index + 1,
        "Número de Serie": m.numero_serie || "",
        "Marca": m.marca || "",
        "Modelo": m.modelo || "",
        "Ubicación": m.ubicacion || "",
        "Latitud": m.latitud || "",
        "Longitud": m.longitud || "",
        "Fecha de Instalación": m.fecha_instalacion ? new Date(m.fecha_instalacion).toLocaleDateString("es-MX") : "No registrada",
        "Lectura Base": m.lectura_base || 0,
        "Capacidad Máxima (m³)": m.capacidad_maxima ?? 99999,
        "Estado Medidor": m.estado_medidor || "",
        "Estado Servicio": m.estado_servicio || "",
        "Cliente Asignado": m.cliente_nombre || "No Asignado",
        "Predio del Cliente": m.numero_predio || ""
    }));
};

import RegistrarMedidor from "./RegistrarMedidores";
import ModalDetalleMedidor from "./ModalDetalleMedidor";
import ModalEditarMedidor from "./ModalEditarMedidor";
import { exportData } from "../../../utils/exportUtils";
import { useFeedback } from "../../../context/FeedbackContext";
import { usePermissions } from "../../../context/PermissionsContext";

// ── SKELETON (animate-pulse, sin librerías) ───────────────────────────────────
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
                <div className="h-11 w-36 rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
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
                        <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse shrink-0" />
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
    return <div className={`${className} border-2 border-slate-300 dark:border-zinc-600 border-t-blue-600 rounded-full animate-spin`} />;
}

// ── DROPDOWN EXPORTAR ────────────────────────────────────────────────────────
function ExportDropdown({ onExportCSV, onExportExcel }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className="font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl h-[52px] px-5 shadow-sm flex items-center gap-2 transition-colors border border-slate-200 dark:border-zinc-800"
            >
                <HiDownload className="text-lg text-blue-600 dark:text-blue-400" /> Exportar
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-52 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <button onClick={() => { onExportCSV(); setOpen(false); }} className="w-full px-4 py-3 flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left">
                            <span className="text-xl">📄</span> Exportar CSV
                        </button>
                        <button onClick={() => { onExportExcel(); setOpen(false); }} className="w-full px-4 py-3 flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left">
                            <span className="text-xl">📊</span> Exportar Excel (.xlsx)
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
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
        pages.push(1);
        if (currentPage > 3) pages.push("...");
        const start = Math.max(2, currentPage - 1), end = Math.min(totalPages - 1, currentPage + 1);
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
            <button onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1} className={`${base} ${currentPage === 1 ? `${inactive} ${disabled}` : inactive}`} title="Página anterior"><HiChevronLeft className="w-4 h-4" /></button>
            {pages.map((page, i) => page === "..." ? (
                <span key={`e${i}`} className="px-1 text-slate-400 text-sm select-none font-bold">…</span>
            ) : (
                <button key={page} onClick={() => onChange(page)} className={`${base} ${page === currentPage ? active : inactive}`}>{page}</button>
            ))}
            <button onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages} className={`${base} ${currentPage === totalPages ? `${inactive} ${disabled}` : inactive}`} title="Página siguiente"><HiChevronRight className="w-4 h-4" /></button>
        </div>
    );
}

// ── BADGE DE ESTADO ────────────────────────────────────────────────────────────
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

const SELECT_CLS = "w-full h-[52px] pl-4 pr-8 text-sm font-semibold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none appearance-none cursor-pointer";

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
const TabInventarioMedidores = () => {
    const {
        paginatedData, loading, initialLoading, search, handleSearch,
        statusFilter, handleStatusFilterChange,
        locationFilter, locationOptions, handleLocationFilterChange,
        cityFilter, cityOptions, handleCityFilterChange,
        currentPage, setCurrentPage, rowsPerPage, handleRowsPerPageChange,
        totalPages, totalItems, getStatusColor, medidores, clearFilters, hasActiveFilters
    } = useTabMedidores();

    const { setSuccess, setError } = useFeedback();
    const { can } = usePermissions();
    const canModificarMedidores = can("medidores.modificar");
    const { actualizarMedidores, allMedidores } = useMedidores();

    const [selectedMedidor, setSelectedMedidor] = useState(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Estados para Papelera de Medidores
    const [showDeleted, setShowDeleted] = useState(false);
    const [deletedMedidores, setDeletedMedidores] = useState([]);
    const [loadingDeleted, setLoadingDeleted] = useState(false);
    const [searchDeleted, setSearchDeleted] = useState("");

    const filteredDeletedMedidores = deletedMedidores.filter(m => {
        const term = normalizarTexto(searchDeleted);
        return (
            normalizarTexto(m.numero_serie).includes(term) ||
            (m.marca && normalizarTexto(m.marca).includes(term)) ||
            (m.modelo && normalizarTexto(m.modelo).includes(term)) ||
            (m.razon_eliminacion && normalizarTexto(m.razon_eliminacion).includes(term))
        );
    });

    // Deletion dialog states
    const [isDeleteReasonOpen, setIsDeleteReasonOpen] = useState(false);
    const [medidorToDelete, setMedidorToDelete] = useState(null);
    const [deleteReason, setDeleteReason] = useState("");

    // Estado para confirmación premium
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        color: "indigo",
        onConfirm: () => {}
    });

    // Estado para exportación premium
    const [exportModal, setExportModal] = useState({
        isOpen: false,
        format: "csv"
    });

    const handleExecuteExport = async (type) => {
        setExportModal(prev => ({ ...prev, isOpen: false }));
        try {
            let rawData = [];
            let prefix = "";
            if (type === "page") {
                rawData = paginatedData;
                prefix = "Pagina_";
            } else if (type === "filtered") {
                rawData = medidores || paginatedData;
                prefix = "Filtrados_";
            } else {
                rawData = allMedidores;
                prefix = "Todos_";
            }

            const normalizedData = normalizarMedidoresParaExport(rawData);
            const format = exportModal.format;
            const filename = `Inventario_Medidores_${prefix}${new Date().toISOString().split("T")[0]}`;
            
            const ok = await exportData(normalizedData, filename, format);
            if (ok) {
                setSuccess("Medidores exportados correctamente");
            } else {
                setError("Error al exportar medidores", "Exportación");
            }
        } catch (err) {
            console.error("Error al exportar medidores:", err);
            setError("Error al exportar medidores", "Exportación");
        }
    };

    const loadDeletedMedidores = async () => {
        setLoadingDeleted(true);
        try {
            const token = localStorage.getItem("token");
            const response = await window.api.fetchMedidoresEliminados(token);
            if (response && response.medidores_eliminados) {
                setDeletedMedidores(response.medidores_eliminados);
            }
        } catch (err) {
            console.error("Error cargando medidores eliminados:", err);
        } finally {
            setLoadingDeleted(false);
        }
    };

    const handleRestoreMedidor = (medidor) => {
        setConfirmModal({
            isOpen: true,
            title: "¿Desea restaurar el medidor?",
            message: `Esta acción reactivará el medidor con serie "${medidor.numero_serie}" y lo devolverá al inventario activo.`,
            color: "success",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const token = localStorage.getItem("token");
                    const response = await window.api.reactivateMedidor({ id: medidor.id, token_session: token });
                    if (response.success) {
                        setSuccess("Medidor restaurado correctamente");
                        loadDeletedMedidores();
                        actualizarMedidores();
                    } else {
                        setError(response.message || "Error al restaurar medidor", "Restaurar Medidor");
                    }
                } catch (err) {
                    console.error("Error al restaurar medidor:", err);
                    setError(err.message || "Error al restaurar medidor", "Restaurar Medidor");
                }
            }
        });
    };

    const handlePurgeMedidor = (medidor) => {
        setConfirmModal({
            isOpen: true,
            title: "¿Eliminar definitivamente el medidor?",
            message: `¿Está completamente seguro de eliminar definitivamente el medidor con serie "${medidor.numero_serie}"? Esta acción no se puede deshacer y borrará permanentemente todos sus registros.`,
            color: "failure",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const token = localStorage.getItem("token");
                    const response = await window.api.purgeMedidor({ id: medidor.id, token_session: token });
                    if (response.success) {
                        setSuccess("Medidor eliminado definitivamente");
                        loadDeletedMedidores();
                        actualizarMedidores();
                    } else {
                        setError(response.message || "No se puede eliminar definitivamente el medidor. Podría tener lecturas u otro historial.", "Eliminar Definitivamente");
                    }
                } catch (err) {
                    console.error("Error al purgar medidor:", err);
                    setError(err.message || "Error al purgar medidor.", "Eliminar Definitivamente");
                }
            }
        });
    };

    const handleView = (m) => { setSelectedMedidor(m); setIsViewOpen(true); };
    const handleEdit = (m) => {
        if (!canModificarMedidores) { setError("No tienes permisos para modificar medidores.", "Edición de Medidor"); return; }
        setSelectedMedidor(m); setIsEditOpen(true);
    };

    const handleDelete = (medidor) => {
        if (!canModificarMedidores) { 
            setError("No tienes permisos para eliminar medidores.", "Eliminar Medidor"); 
            return; 
        }
        setMedidorToDelete(medidor);
        setDeleteReason("");
        setIsDeleteReasonOpen(true);
    };

    const confirmDeleteMedidor = async () => {
        if (!medidorToDelete) return;
        setIsDeleteReasonOpen(false);
        try {
            const token = localStorage.getItem("token");
            const response = await window.api.deleteMedidor({ id: medidorToDelete.id, razon: deleteReason, token_session: token });
            if (response.success) {
                setSuccess("Medidor eliminado correctamente.");
                actualizarMedidores();
                setDeleteReason("");
                setMedidorToDelete(null);
            } else {
                setError(response.message || "Error al eliminar el medidor.", "Eliminar Medidor");
            }
        } catch (err) {
            console.error("Error al eliminar medidor:", err);
            setError(err.message || "Error al eliminar el medidor.", "Eliminar Medidor");
        }
    };

    if (initialLoading) return <LoadingSkeleton />;

    return (
        <div className="w-full flex flex-col gap-6">

            {/* ── HEADER Y ACCIONES ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 dark:bg-blue-900/30 rounded-2xl shrink-0">
                        <HiCog className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">Inventario de Medidores</h3>
                            {loading && !initialLoading && <LoadingSpinner className="w-4 h-4 ml-1" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-1">Gestión técnica y ubicación</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                    <ExportDropdown
                        onExportCSV={() => setExportModal({ isOpen: true, format: "csv" })}
                        onExportExcel={() => setExportModal({ isOpen: true, format: "xlsx" })}
                    />
                    <div className="flex-1 sm:flex-none">
                        <RegistrarMedidor />
                    </div>
                </div>
            </div>

            {/* ── TAB SELECTOR ── */}
            <div className="flex border-b border-slate-200 dark:border-zinc-800 gap-6 my-2">
                <button
                    onClick={() => setShowDeleted(false)}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all ${!showDeleted ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300"}`}
                >
                    Inventario Activo
                </button>
                <button
                    onClick={() => {
                        setShowDeleted(true);
                        loadDeletedMedidores();
                    }}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all ${showDeleted ? "border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300"} flex items-center gap-2`}
                >
                    <HiFolder className="w-4 h-4" /> Papelera
                </button>
            </div>

            {/* ── CONTENEDOR PRINCIPAL ── */}
            <div className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-transparent rounded-2xl overflow-hidden flex flex-col col-span-12">

                {showDeleted ? (
                    <div className="flex flex-col flex-1">
                        {/* Sub-header Papelera */}
                        <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                        Mostrando <span className="text-rose-600 dark:text-rose-400 font-extrabold">{filteredDeletedMedidores.length}</span> de <span className="font-extrabold text-slate-700 dark:text-zinc-200">{deletedMedidores.length}</span> medidores desactivados
                                    </span>
                                    <button 
                                        onClick={loadDeletedMedidores}
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
                                        {["MEDIDOR", "FECHA ELIMINACIÓN", "MOTIVO DE ELIMINACIÓN", "ELIMINADO POR", "ACCIONES"].map((col, i) => (
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
                                    ) : filteredDeletedMedidores.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-16 text-center">
                                                <p className="font-bold text-sm text-slate-500">No se encontraron medidores desactivados</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDeletedMedidores.map((medidor) => (
                                            <tr key={medidor.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-slate-800 dark:text-zinc-100 font-mono uppercase">{medidor.numero_serie}</span>
                                                        <span className="text-[11px] text-slate-500">{medidor.marca} {medidor.modelo} · ID: {medidor.id}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-xs text-slate-600 dark:text-zinc-300 font-medium">
                                                    {medidor.fecha_eliminacion ? new Date(medidor.fecha_eliminacion).toLocaleString() : "N/A"}
                                                </td>
                                                <td className="py-4 px-6 text-xs text-slate-600 dark:text-zinc-300 max-w-[250px] truncate font-medium" title={medidor.razon_eliminacion}>
                                                    {medidor.razon_eliminacion || "Sin razón"}
                                                </td>
                                                <td className="py-4 px-6 text-xs text-slate-600 dark:text-zinc-300 font-medium">
                                                    {medidor.eliminado_por_nombre || "Desconocido"}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleView(medidor)}
                                                            title="Ver Detalle"
                                                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 dark:bg-zinc-800 dark:hover:bg-blue-900/30 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
                                                        >
                                                            <HiEye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRestoreMedidor(medidor)}
                                                            title="Restaurar Medidor"
                                                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-600 dark:bg-zinc-800 dark:hover:bg-emerald-900/30 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors"
                                                        >
                                                            <HiRefresh className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePurgeMedidor(medidor)}
                                                            title="Eliminar Definitivamente"
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
                    </div>
                ) : (
                    <>
                        {/* Filtros */}
                <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
                        {/* Buscador */}
                        <div className="lg:col-span-4 relative w-full flex items-center">
                            <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none">
                                <HiSearch className="w-5 h-5" />
                            </span>
                            <input
                                placeholder="Buscar por serie, marca, cliente o predio..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none h-[52px]"
                            />
                            {search && (
                                <button onClick={() => handleSearch("")} className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">
                                    <HiX className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Filtro estado */}
                        <div className="lg:col-span-2">
                            <select value={statusFilter} onChange={(e) => handleStatusFilterChange(e.target.value)} aria-label="Filtrar por estado" className={SELECT_CLS}>
                                <option value="All">Todos los estados</option>
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                                <option value="Mantenimiento">Mantenimiento</option>
                                <option value="Cortado">Cortado</option>
                                <option value="Retirado">Retirado</option>
                            </select>
                        </div>

                        {/* Filtro ubicación */}
                        <div className="lg:col-span-2">
                            <select value={locationFilter} onChange={(e) => handleLocationFilterChange(e.target.value)} aria-label="Filtrar por ubicación" className={SELECT_CLS}>
                                <option value="All">Todas las ubicaciones</option>
                                {locationOptions.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>

                        {/* Filtro ciudad */}
                        <div className="lg:col-span-2">
                            <select value={cityFilter} onChange={(e) => handleCityFilterChange(e.target.value)} aria-label="Filtrar por ciudad" className={SELECT_CLS}>
                                <option value="All">Todas las ciudades</option>
                                {cityOptions.map(ciudad => (
                                    <option key={ciudad} value={ciudad}>{ciudad}</option>
                                ))}
                            </select>
                        </div>

                        {/* Limpiar */}
                        <div className="lg:col-span-2 flex justify-end">
                            {hasActiveFilters ? (
                                <button onClick={clearFilters} className="w-full font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 h-[52px] rounded-xl flex items-center justify-center gap-2 transition-colors">
                                    <HiFilter className="text-lg" /> Limpiar
                                </button>
                            ) : <div className="w-full h-[52px]" />}
                        </div>
                    </div>
                </div>

                {/* Sub-header paginación */}
                <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 bg-slate-50/40 dark:bg-zinc-900/30">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                        Mostrando <span className="text-blue-600 dark:text-blue-400 font-extrabold">{paginatedData.length}</span> de <span className="text-slate-700 dark:text-zinc-200 font-extrabold">{totalItems}</span> medidores
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 hidden sm:block">Filas por página:</span>
                        <select
                            value={rowsPerPage.toString()}
                            onChange={(e) => handleRowsPerPageChange(e.target.value)}
                            aria-label="Filas por página"
                            className="h-[36px] px-3 text-sm font-bold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-none appearance-none cursor-pointer w-20"
                        >
                            {["5", "10", "15", "20", "50"].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>

                {/* Tabla nativa */}
                <div className="bg-white dark:bg-zinc-950 overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-zinc-800">
                                {["DATOS DEL EQUIPO", "UBICACIÓN", "ESTADO", "VINCULACIÓN", "ACCIONES"].map((col, i) => (
                                    <th key={col} className={`py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 bg-transparent ${i === 4 ? "text-right" : "text-left"}`}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && paginatedData.length === 0 ? (
                                <tr><td colSpan={5} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <LoadingSpinner className="w-8 h-8" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 animate-pulse">Cargando inventario...</span>
                                    </div>
                                </td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={5} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <HiCog className="w-12 h-12 opacity-20 mb-3 text-slate-400 dark:text-zinc-500" />
                                        <p className="font-bold text-sm text-slate-600 dark:text-zinc-300">No se encontraron medidores</p>
                                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 mt-1 max-w-[250px] text-center">Intenta ajustar los filtros de búsqueda.</p>
                                    </div>
                                </td></tr>
                            ) : paginatedData.map((medidor) => {
                                const estadoVisual = medidor.estado_servicio === "Cortado" ? "Cortado" : medidor.estado_medidor;
                                return (
                                    <tr key={medidor.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-blue-500/10 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50 shadow-sm shrink-0">
                                                    <HiCog className="text-lg" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="font-black text-sm text-slate-800 dark:text-zinc-100 mb-0.5 truncate font-mono uppercase">{medidor.numero_serie}</p>
                                                    <p className="font-medium text-[11px] text-slate-500 dark:text-zinc-400 truncate capitalize">{medidor.marca} {medidor.modelo}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <HiLocationMarker className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <p className="font-bold text-xs text-slate-700 dark:text-zinc-200 capitalize truncate max-w-[200px]">{medidor.ubicacion || "Sin ubicación"}</p>
                                                </div>
                                                {medidor.latitud && medidor.longitud ? (
                                                    <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 pl-5 tracking-wider">
                                                        {medidor.latitud.toFixed(4)}, {medidor.longitud.toFixed(4)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 pl-5 italic">Sin coordenadas</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <StatusBadge status={estadoVisual} getStatusColor={getStatusColor} />
                                        </td>
                                        <td className="py-4 px-6">
                                            {medidor.cliente_id ? (
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <HiUser className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                                                        <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest">Asignado</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 pl-5 truncate max-w-[200px]">
                                                        {medidor.cliente_nombre || "Cliente"}
                                                        {medidor.numero_predio ? <span className="font-medium text-slate-500"> • Predio #{medidor.numero_predio}</span> : ""}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                                                    Disponible
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleView(medidor)} title="Ver Detalle" className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 dark:bg-zinc-800 dark:hover:bg-blue-900/30 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors">
                                                    <HiEye className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleEdit(medidor)} title="Editar Medidor" disabled={!canModificarMedidores} className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                                    <HiCog className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(medidor)} title="Eliminar" className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400 transition-colors">
                                                    <HiTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Paginación inferior */}
                {totalPages > 1 && (
                    <div className="flex justify-center p-4 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/60 dark:bg-zinc-900/40">
                        <SimplePagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
                    </div>
                )}
                </>
                )}
            </div>

            {/* ── MODALES ── */}
            <ModalDetalleMedidor isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} medidor={selectedMedidor} />
            <ModalEditarMedidor key={selectedMedidor?.id} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} medidor={selectedMedidor} />

            {/* Modal de Confirmación de Eliminación con Razón (Flowbite React) */}
            <Modal show={isDeleteReasonOpen} onClose={() => setIsDeleteReasonOpen(false)} size="md" popup theme={premiumModalTheme}>
                <ModalHeader />
                <ModalBody className="p-6 bg-white dark:bg-zinc-950">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Desactivar Medidor</h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-400">¿Está seguro de desactivar el medidor con número de serie <strong className="text-slate-800 dark:text-zinc-100 font-mono">{medidorToDelete?.numero_serie}</strong>? Se marcará como retirado y se moverá a la papelera.</p>
                        
                        {medidorToDelete?.cliente_id && (
                            <div className="p-3.5 bg-amber-500/10 border border-amber-200/70 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex flex-col gap-1">
                                <span className="font-bold">Nota de trazabilidad:</span>
                                <span>Este medidor está vinculado al cliente <strong>{medidorToDelete.cliente_nombre || `#${medidorToDelete.cliente_id}`}</strong>. Sus lecturas y facturas pasadas se conservarán intactas. Podrás registrar y asignar un nuevo medidor al cliente desde la vista de clientes.</span>
                            </div>
                        )}
                        
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                                Motivo de la eliminación (mínimo 10 caracteres)
                                {deleteReason.trim().length < 10 ? (
                                    <span className="text-rose-500 ml-2 font-extrabold">(Faltan {10 - deleteReason.trim().length} caract.)</span>
                                ) : (
                                    <span className="text-emerald-500 ml-2 font-extrabold">✓ Listo</span>
                                )}
                            </label>
                            <textarea
                                placeholder="Ingrese el motivo por el cual se elimina este medidor..."
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 min-h-[80px]"
                            />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
                    <button
                        onClick={() => setIsDeleteReasonOpen(false)}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={confirmDeleteMedidor}
                        disabled={deleteReason.trim().length < 10}
                        className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
                    >
                        Desactivar Medidor
                    </button>
                </ModalFooter>
            </Modal>

            {/* Modal de Confirmación Premium */}
            <Modal
                show={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                size="md"
                popup
                theme={premiumConfirmModalTheme}
            >
                <ModalHeader />
                <ModalBody>
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
                </ModalBody>
            </Modal>

            {/* Modal de Configuración de Exportación */}
            <Modal
                show={exportModal.isOpen}
                onClose={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
                size="md"
                popup
                theme={premiumConfirmModalTheme}
            >
                <ModalHeader />
                <ModalBody>
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
                                        {(paginatedData || []).length} registros
                                    </span>
                                </span>
                                <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
                                    Exporta únicamente los registros visibles actualmente en esta página de la tabla.
                                </span>
                            </button>

                            {/* Opción 2: Todos */}
                            <button
                                type="button"
                                onClick={() => handleExecuteExport("all")}
                                className="flex flex-col text-left p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/10 dark:bg-zinc-900/30 transition-all duration-200 w-full"
                            >
                                <span className="text-xs font-black text-slate-800 dark:text-zinc-100 flex items-center justify-between w-full">
                                    <span>Todos los registros</span>
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-md">
                                        {(allMedidores || []).length} registros
                                    </span>
                                </span>
                                <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
                                    Exporta la totalidad del inventario de medidores en el sistema.
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
                </ModalBody>
            </Modal>
        </div>
    );
};

export default TabInventarioMedidores;
