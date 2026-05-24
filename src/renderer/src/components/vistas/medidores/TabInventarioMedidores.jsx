import { useState } from "react";
import {
    HiEye, HiTrash, HiLocationMarker, HiUser, HiCog,
    HiDownload, HiSearch, HiX, HiFilter, HiChevronLeft, HiChevronRight
} from "react-icons/hi";
import { useTabMedidores } from "../../../hooks/useTabMedidores";
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
    return <div className={`${className} border-2 border-slate-300 dark:border-zinc-600 border-t-indigo-500 rounded-full animate-spin`} />;
}

// ── DROPDOWN EXPORTAR (sin librería) ──────────────────────────────────────────
function ExportDropdown({ onExportCSV, onExportExcel }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className="font-bold bg-indigo-500/10 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 rounded-xl h-11 px-5 shadow-sm flex items-center gap-2 transition-colors"
            >
                <HiDownload className="text-lg" /> Exportar
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-52 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden">
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
    const base = "h-9 min-w-[36px] px-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center";
    const active = "bg-slate-800 text-white dark:bg-zinc-200 dark:text-slate-900";
    const inactive = "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700";
    return (
        <div className="flex items-center gap-1.5">
            <button onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1} className={`${base} ${inactive} ${currentPage === 1 ? "opacity-40 cursor-not-allowed" : ""}`}><HiChevronLeft className="w-4 h-4" /></button>
            {pages.map((page, i) => page === "..." ? (
                <span key={`e${i}`} className="px-1 text-slate-400 text-sm select-none">…</span>
            ) : (
                <button key={page} onClick={() => onChange(page)} className={`${base} ${page === currentPage ? active : inactive}`}>{page}</button>
            ))}
            <button onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages} className={`${base} ${inactive} ${currentPage === totalPages ? "opacity-40 cursor-not-allowed" : ""}`}><HiChevronRight className="w-4 h-4" /></button>
        </div>
    );
}

// ── BADGE DE ESTADO ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger:  "bg-red-500/10 text-red-600 dark:text-red-400",
    default: "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400",
};
function StatusBadge({ status, getStatusColor }) {
    const color = STATUS_COLORS[getStatusColor(status)] ?? STATUS_COLORS.default;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${color}`}>
            {status}
        </span>
    );
}

const SELECT_CLS = "w-full h-[52px] pl-4 pr-8 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-none appearance-none cursor-pointer";

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
const TabInventarioMedidores = () => {
    const {
        paginatedData, loading, initialLoading, search, handleSearch,
        statusFilter, handleStatusFilterChange,
        locationFilter, locationOptions, handleLocationFilterChange,
        currentPage, setCurrentPage, rowsPerPage, handleRowsPerPageChange,
        totalPages, totalItems, getStatusColor, filteredData, clearFilters, hasActiveFilters
    } = useTabMedidores();

    const { setSuccess, setError } = useFeedback();
    const { can } = usePermissions();
    const canModificarMedidores = can("medidores.modificar");

    const [selectedMedidor, setSelectedMedidor] = useState(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleView = (m) => { setSelectedMedidor(m); setIsViewOpen(true); };
    const handleEdit = (m) => {
        if (!canModificarMedidores) { setError("No tienes permisos para modificar medidores.", "Edición de Medidor"); return; }
        setSelectedMedidor(m); setIsEditOpen(true);
    };
    const handleDelete = () => setError("La eliminación de medidores no está disponible actualmente. Para retirar un medidor, cambia su estado a 'Retirado'.", "Eliminar Medidor");

    if (initialLoading) return <LoadingSkeleton />;

    return (
        <div className="w-full flex flex-col gap-6">

            {/* ── HEADER Y ACCIONES ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 dark:bg-indigo-900/30 rounded-2xl shrink-0">
                        <HiCog className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
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
                        onExportCSV={async () => {
                            const ok = await exportData(filteredData || paginatedData, `Inventario_Medidores_${new Date().toISOString().split("T")[0]}`, "csv");
                            if (ok) setSuccess("Archivo CSV generado exitosamente");
                        }}
                        onExportExcel={async () => {
                            const ok = await exportData(filteredData || paginatedData, `Inventario_Medidores_${new Date().toISOString().split("T")[0]}`, "xlsx");
                            if (ok) setSuccess("Archivo Excel generado exitosamente");
                        }}
                    />
                    <div className="flex-1 sm:flex-none">
                        <RegistrarMedidor />
                    </div>
                </div>
            </div>

            {/* ── CONTENEDOR PRINCIPAL ── */}
            <div className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-transparent rounded-2xl overflow-hidden flex flex-col">

                {/* Filtros */}
                <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
                        {/* Buscador */}
                        <div className="lg:col-span-6 relative w-full flex items-center">
                            <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none">
                                <HiSearch className="w-5 h-5" />
                            </span>
                            <input
                                placeholder="Buscar por serie, marca, cliente o predio..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-none h-[52px]"
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

                        {/* Limpiar */}
                        <div className="lg:col-span-2 flex justify-end">
                            {hasActiveFilters ? (
                                <button onClick={clearFilters} className="w-full font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 h-[52px] rounded-xl flex items-center justify-center gap-2 transition-colors">
                                    <HiFilter className="text-lg" /> Limpiar
                                </button>
                            ) : <div className="w-full h-[52px]" />}
                        </div>
                    </div>
                </div>

                {/* Sub-header paginación */}
                <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 bg-slate-50/40 dark:bg-zinc-900/30">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                        Mostrando <span className="text-indigo-600 dark:text-indigo-400">{paginatedData.length}</span> de <span className="text-slate-700 dark:text-zinc-200">{totalItems}</span> medidores
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 hidden sm:block">Filas por página:</span>
                        <select
                            value={rowsPerPage.toString()}
                            onChange={(e) => handleRowsPerPageChange(e.target.value)}
                            aria-label="Filas por página"
                            className="h-[36px] px-3 text-sm font-bold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-none appearance-none cursor-pointer w-20"
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
                                                <div className="p-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 shadow-sm shrink-0">
                                                    <HiCog className="text-lg" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="font-black text-sm text-slate-800 dark:text-zinc-100 mb-0.5 truncate uppercase">{medidor.numero_serie}</p>
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
                                                <button onClick={() => handleView(medidor)} title="Ver Detalle" className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400 transition-colors">
                                                    <HiEye className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleEdit(medidor)} title="Editar Medidor" disabled={!canModificarMedidores} className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 dark:bg-zinc-800 dark:hover:bg-indigo-900/30 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                                    <HiCog className="w-4 h-4" />
                                                </button>
                                                <button onClick={handleDelete} title="Eliminar" className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400 transition-colors">
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
            </div>

            {/* ── MODALES ── */}
            <ModalDetalleMedidor isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} medidor={selectedMedidor} />
            <ModalEditarMedidor key={selectedMedidor?.id} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} medidor={selectedMedidor} />
        </div>
    );
};

export default TabInventarioMedidores;
