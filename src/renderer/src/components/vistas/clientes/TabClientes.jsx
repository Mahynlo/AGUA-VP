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
    HiChevronRight
} from "react-icons/hi";
import RegistrarClientes from "./RegistrarCliente";
import EditarClientes from "./EditarCliente";
import ModalDetalleCliente from "./ModalDetalleCliente";
import { useTabClientes } from "../../../hooks/useTabClientes";
import { exportData } from "../../../utils/exportUtils";
import { useFeedback } from "../../../context/FeedbackContext";

// ── SKELETON DE CARGA (animate-pulse nativo, sin librerías) ───────────────────
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

// ── SPINNER CSS PURO (sin librería) ───────────────────────────────────────────
function LoadingSpinner({ className = "w-4 h-4" }) {
    return (
        <div className={`${className} border-2 border-slate-300 dark:border-zinc-600 border-t-amber-500 rounded-full animate-spin`} />
    );
}

// ── DROPDOWN DE EXPORTAR (estado local, sin librería) ─────────────────────────
function ExportDropdown({ onExportCSV, onExportExcel }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="font-bold bg-amber-500/10 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-xl h-11 px-5 shadow-sm flex items-center gap-2 transition-colors"
            >
                <HiDownload className="text-lg" />
                Exportar
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-52 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden">
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

// ── PAGINACIÓN SIMPLE (sin librería) ──────────────────────────────────────────
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

    const base = "h-9 min-w-[36px] px-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center";
    const active = "bg-slate-800 text-white dark:bg-zinc-200 dark:text-slate-900";
    const inactive = "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700";
    const disabled = "opacity-40 cursor-not-allowed";

    return (
        <div className="flex items-center gap-1.5">
            <button
                onClick={() => onChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`${base} ${currentPage === 1 ? `${inactive} ${disabled}` : inactive}`}
            >
                <HiChevronLeft className="w-4 h-4" />
            </button>
            {pages.map((page, i) =>
                page === "..." ? (
                    <span key={`e${i}`} className="px-1 text-slate-400 text-sm select-none">…</span>
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
            >
                <HiChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

// ── BADGE DE ESTADO (reemplaza Chip de NextUI) ────────────────────────────────
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
            {status || "Sin estado"}
        </span>
    );
}

// ── AVATAR + NOMBRE (reemplaza User de NextUI) ────────────────────────────────
function ClienteUser({ nombre, numeroPredio, id }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 border border-slate-200 dark:border-zinc-700 shadow-sm flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {nombre?.charAt(0)?.toUpperCase() || "C"}
                </span>
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-sm text-slate-800 dark:text-zinc-100 leading-tight">{nombre}</span>
                <span className="font-medium text-[11px] text-slate-500">
                    {numeroPredio ? `Predio #${numeroPredio} · ID: ${id}` : `ID: ${id}`}
                </span>
            </div>
        </div>
    );
}

// ── ESTILOS COMPARTIDOS ───────────────────────────────────────────────────────
const SELECT_CLS = "w-full h-[52px] pl-4 pr-8 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-none appearance-none cursor-pointer";

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

    const { setSuccess } = useFeedback();

    const [selectedCliente, setSelectedCliente] = React.useState(null);
    const [isDetailOpen, setIsDetailOpen] = React.useState(false);
    const [selectedEditId, setSelectedEditId] = React.useState(null);
    const [isEditOpen, setIsEditOpen] = React.useState(false);

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
                if (confirm(`¿Está seguro de eliminar a ${cliente.nombre}?`)) {
                    console.log("Eliminar cliente:", cliente);
                }
                break;
        }
    };

    return (
        <div className="w-full flex flex-col gap-6">

            {/* ── HEADER Y ACCIONES ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 dark:bg-amber-900/30 rounded-2xl shrink-0">
                        <HiUsers className="w-6 h-6 text-amber-600 dark:text-amber-400" />
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
                        onExportCSV={async () => {
                            const ok = await exportData(filteredData, `Clientes_${new Date().toISOString().split("T")[0]}`, "csv");
                            if (ok) setSuccess("Archivo CSV generado exitosamente");
                        }}
                        onExportExcel={async () => {
                            const ok = await exportData(filteredData, `Clientes_${new Date().toISOString().split("T")[0]}`, "xlsx");
                            if (ok) setSuccess("Archivo Excel generado exitosamente");
                        }}
                    />
                    <div className="flex-1 sm:flex-none">
                        <RegistrarClientes />
                    </div>
                </div>
            </div>

            {/* ── CONTENEDOR PRINCIPAL ── */}
            <div className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-transparent rounded-2xl overflow-hidden flex flex-col">

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
                                className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-none h-[52px]"
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
                                    className="w-full font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 h-[52px] rounded-xl flex items-center justify-center gap-2 transition-colors"
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
                        <span className="text-amber-600 dark:text-amber-400">{paginatedData.length}</span>
                        {" "}de{" "}
                        <span className="text-slate-700 dark:text-zinc-200">{totalItems}</span>
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
                            className="h-[36px] px-3 text-sm font-bold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-none appearance-none cursor-pointer w-20"
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
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-600 dark:bg-zinc-800 dark:hover:bg-amber-900/30 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors"
                                                >
                                                    <HiPencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleAction("delete", cliente)}
                                                    title="Eliminar"
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
        </div>
    );
}
