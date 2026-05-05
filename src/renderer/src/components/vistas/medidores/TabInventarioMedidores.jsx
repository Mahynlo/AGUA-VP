import { useState, useMemo } from "react";
import {
    Select,
    SelectItem,
    Pagination,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Spinner,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Chip,
    Skeleton
} from "@nextui-org/react";
import React from "react";
import { 
    HiEye, 
    HiTrash, 
    HiLocationMarker, 
    HiUser, 
    HiCog, 
    HiDownload, 
    HiSearch, 
    HiX, 
    HiFilter 
} from "react-icons/hi";
import { useTabMedidores } from "../../../hooks/useTabMedidores";
import RegistrarMedidor from "./RegistrarMedidores";
import ModalDetalleMedidor from "./ModalDetalleMedidor";
import ModalEditarMedidor from "./ModalEditarMedidor";
import { exportData } from "../../../utils/exportUtils";
import { useFeedback } from "../../../context/FeedbackContext";
import { usePermissions } from "../../../context/PermissionsContext";

// Componente LoadingSkeleton Premium (Token 8)
const LoadingSkeleton = () => (
    <div className="w-full animate-in fade-in flex flex-col gap-6">
        <div className="flex justify-between items-center pb-4">
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48 rounded-md" />
                    <Skeleton className="h-3 w-32 rounded-md" />
                </div>
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-11 w-24 rounded-xl" />
                <Skeleton className="h-11 w-32 rounded-xl" />
            </div>
        </div>
        <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Skeleton className="h-[52px] w-full rounded-xl lg:col-span-2" />
                    <Skeleton className="h-[52px] w-full rounded-xl" />
                    <Skeleton className="h-[52px] w-full rounded-xl" />
                </div>
            </div>
            <div className="bg-white dark:bg-zinc-950">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-20 w-full border-b border-slate-100 dark:border-zinc-800/50 flex items-center px-6 gap-4">
                        <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/4 rounded-md" />
                            <Skeleton className="h-3 w-1/3 rounded-md" />
                        </div>
                        <Skeleton className="h-10 w-32 rounded-xl shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const TabInventarioMedidores = () => {
    const {
        paginatedData,
        loading,
        initialLoading,
        search,
        handleSearch,
        statusFilter,
        handleStatusFilterChange,
        locationFilter,
        locationOptions,
        handleLocationFilterChange,
        currentPage,
        setCurrentPage,
        rowsPerPage,
        handleRowsPerPageChange,
        totalPages,
        totalItems,
        getStatusColor,
        filteredData,
        clearFilters,
        hasActiveFilters
    } = useTabMedidores();

    const { setSuccess, setError } = useFeedback();
    const { can } = usePermissions();
    const canModificarMedidores = can("medidores.modificar");

    const [selectedMedidor, setSelectedMedidor] = useState(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleView = (medidor) => {
        setSelectedMedidor(medidor);
        setIsViewOpen(true);
    };

    const handleEdit = (medidor) => {
        if (!canModificarMedidores) {
            setError("No tienes permisos para modificar medidores.", "Edición de Medidor");
            return;
        }

        setSelectedMedidor(medidor);
        setIsEditOpen(true);
    };

    const handleDelete = () => {
        setError("La eliminación de medidores no está disponible actualmente. Para retirar un medidor, cambia su estado a 'Retirado'.", "Eliminar Medidor");
    };

    if (initialLoading) {
        return <LoadingSkeleton />;
    }

    // Clases estandarizadas para Inputs Invisibles
    const selectClassNames = {
        trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none h-[52px] focus:ring-2 focus:ring-indigo-500/20 focus:outline-none",
        value: "font-medium text-slate-700 dark:text-zinc-200 text-sm"
    };

    return (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500">
            
            {/* ── 1. HEADER Y ACCIONES ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    {/* Regla de Tintes: Índigo para Hardware/Inventario */}
                    <div className="p-3 bg-indigo-500/10 dark:bg-indigo-900/30 rounded-2xl shrink-0">
                        <HiCog className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                                Inventario de Medidores
                            </h3>
                            {loading && !initialLoading && (
                                <Spinner size="sm" color="primary" className="w-4 h-4 ml-1" />
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
                            Gestión técnica y ubicación
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                    <Dropdown>
                        <DropdownTrigger>
                            <Button
                                variant="flat"
                                className="font-bold bg-indigo-500/10 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 rounded-xl h-11 px-5 shadow-sm"
                                startContent={<HiDownload className="text-lg" />}
                            >
                                Exportar
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Opciones de exportacion" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl">
                            <DropdownItem
                                key="csv"
                                startContent={<span className="text-xl">📄</span>}
                                className="hover:bg-slate-50 dark:hover:bg-zinc-800"
                                onPress={async () => {
                                    const success = await exportData(filteredData || paginatedData, `Inventario_Medidores_${new Date().toISOString().split("T")[0]}`, "csv");
                                    if (success) setSuccess("Archivo CSV generado exitosamente");
                                }}
                            >
                                <span className="font-semibold text-slate-700 dark:text-zinc-200">Exportar CSV</span>
                            </DropdownItem>
                            <DropdownItem
                                key="excel"
                                startContent={<span className="text-xl">📊</span>}
                                className="hover:bg-slate-50 dark:hover:bg-zinc-800"
                                onPress={async () => {
                                    const success = await exportData(filteredData || paginatedData, `Inventario_Medidores_${new Date().toISOString().split("T")[0]}`, "xlsx");
                                    if (success) setSuccess("Archivo Excel generado exitosamente");
                                }}
                            >
                                <span className="font-semibold text-slate-700 dark:text-zinc-200">Exportar Excel (.xlsx)</span>
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>

                    <div className="flex-1 sm:flex-none">
                        <RegistrarMedidor />
                    </div>
                </div>
            </div>

            {/* ── 2. CONTENEDOR PRINCIPAL: Filtros y Tabla ── */}
            <div className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-transparent rounded-2xl overflow-hidden flex flex-col">
                
                {/* Filtros */}
                <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
                        
                        {/* Buscador */}
                        <div className="lg:col-span-6 relative w-full flex items-center">
                            <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                                <HiSearch className="w-5 h-5" />
                            </span>
                            <input
                                placeholder="Buscar por serie, marca, cliente o predio..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-none h-[52px]"
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

                        {/* Filtro por estado */}
                        <div className="lg:col-span-2">
                            <Select
                                placeholder="Todos los estados"
                                selectedKeys={statusFilter !== "All" ? [statusFilter] : []}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] || "All";
                                    handleStatusFilterChange(value);
                                }}
                                aria-label="Filtrar por estado"
                                variant="flat"
                                classNames={selectClassNames}
                            >
                                <SelectItem key="All" value="All">Todos los estados</SelectItem>
                                <SelectItem key="Activo" value="Activo">Activo</SelectItem>
                                <SelectItem key="Inactivo" value="Inactivo">Inactivo</SelectItem>
                                <SelectItem key="Mantenimiento" value="Mantenimiento">Mantenimiento</SelectItem>
                                <SelectItem key="Cortado" value="Cortado">Cortado</SelectItem>
                                <SelectItem key="Retirado" value="Retirado">Retirado</SelectItem>
                            </Select>
                        </div>

                        {/* Filtro por ubicación */}
                        <div className="lg:col-span-2">
                            <Select
                                placeholder="Todas las ubicaciones"
                                selectedKeys={locationFilter !== "All" ? [locationFilter] : []}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] || "All";
                                    handleLocationFilterChange(value);
                                }}
                                aria-label="Filtrar por ubicacion"
                                variant="flat"
                                classNames={selectClassNames}
                            >
                                <SelectItem key="All" value="All">Todas las ubicaciones</SelectItem>
                                {locationOptions.map((ubicacion) => (
                                    <SelectItem key={ubicacion} value={ubicacion}>{ubicacion}</SelectItem>
                                ))}
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

                {/* Sub-Header Paginación */}
                <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 bg-slate-50/40 dark:bg-zinc-900/30">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                        Mostrando <span className="text-indigo-600 dark:text-indigo-400">{paginatedData.length}</span> de <span className="text-slate-700 dark:text-zinc-200">{totalItems}</span> medidores
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
                                handleRowsPerPageChange(Array.from(keys)[0]);
                            }}
                            classNames={{
                                trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-none h-[36px]",
                                value: "font-bold text-slate-700 dark:text-zinc-300"
                            }}
                        >
                            <SelectItem key="5" value="5">5</SelectItem>
                            <SelectItem key="10" value="10">10</SelectItem>
                            <SelectItem key="15" value="15">15</SelectItem>
                            <SelectItem key="20" value="20">20</SelectItem>
                            <SelectItem key="50" value="50">50</SelectItem>
                        </Select>
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white dark:bg-zinc-950 flex flex-col w-full overflow-x-auto">
                    <Table
                        aria-label="Tabla de inventario de medidores"
                        removeWrapper
                        classNames={{
                            base: "min-h-[400px]",
                            table: "min-w-full",
                            th: "bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 py-4 px-6",
                            td: "text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-4 px-6",
                            tr: "hover:bg-slate-50/80 dark:hover:bg-zinc-900/30 transition-colors cursor-default"
                        }}
                    >
                        <TableHeader>
                            <TableColumn>DATOS DEL EQUIPO</TableColumn>
                            <TableColumn>UBICACIÓN</TableColumn>
                            <TableColumn>ESTADO</TableColumn>
                            <TableColumn>VINCULACIÓN</TableColumn>
                            <TableColumn align="end">ACCIONES</TableColumn>
                        </TableHeader>
                        <TableBody
                            emptyContent={
                                loading ? (
                                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                                        <Spinner size="lg" color="default" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 animate-pulse">Cargando inventario...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400 dark:text-zinc-500">
                                        <HiCog className="w-12 h-12 opacity-20 mb-3" />
                                        <p className="font-bold text-sm text-slate-600 dark:text-zinc-300">No se encontraron medidores</p>
                                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 mt-1 max-w-[250px] text-center">
                                            Intenta ajustar los filtros de búsqueda.
                                        </p>
                                    </div>
                                )
                            }
                        >
                            {paginatedData.map((medidor) => {
                                const estadoVisual = medidor.estado_servicio === "Cortado" ? "Cortado" : medidor.estado_medidor;
                                return (
                                    <TableRow key={medidor.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 shadow-sm shrink-0">
                                                    <HiCog className="text-lg" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="font-black text-sm text-slate-800 dark:text-zinc-100 mb-0.5 truncate uppercase">
                                                        {medidor.numero_serie}
                                                    </p>
                                                    <p className="font-medium text-[11px] text-slate-500 dark:text-zinc-400 truncate capitalize">
                                                        {medidor.marca} {medidor.modelo}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex flex-col space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <HiLocationMarker className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <p className="font-bold text-xs text-slate-700 dark:text-zinc-200 capitalize truncate max-w-[200px]">
                                                        {medidor.ubicacion || "Sin ubicación"}
                                                    </p>
                                                </div>
                                                {medidor.latitud && medidor.longitud ? (
                                                    <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 pl-5 tracking-wider">
                                                        {medidor.latitud.toFixed(4)}, {medidor.longitud.toFixed(4)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 pl-5 italic">Sin coordenadas</span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                className="capitalize font-bold text-[10px] tracking-widest px-1 h-6 uppercase"
                                                color={getStatusColor(estadoVisual)}
                                                size="sm"
                                                variant="flat"
                                            >
                                                {estadoVisual}
                                            </Chip>
                                        </TableCell>

                                        <TableCell>
                                            {medidor.cliente_id ? (
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <HiUser className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                                                        <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest">
                                                            Asignado
                                                        </span>
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
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    isIconOnly 
                                                    size="sm" 
                                                    variant="flat" 
                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400 transition-colors rounded-lg"
                                                    onPress={() => handleView(medidor)}
                                                    title="Ver Detalle"
                                                >
                                                    <HiEye className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    isIconOnly 
                                                    size="sm" 
                                                    variant="flat" 
                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400 transition-colors rounded-lg"
                                                    onPress={() => handleEdit(medidor)}
                                                    isDisabled={!canModificarMedidores}
                                                    title="Editar Medidor"
                                                >
                                                    <HiCog className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    isIconOnly 
                                                    size="sm" 
                                                    variant="flat" 
                                                    className="bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400 rounded-lg transition-colors"
                                                    onPress={handleDelete}
                                                    title="Eliminar"
                                                >
                                                    <HiTrash className="w-4 h-4" />
                                                </Button>
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
                    <div className="flex justify-center p-4 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/60 dark:bg-zinc-900/40">
                        <Pagination
                            total={totalPages}
                            page={currentPage}
                            onChange={setCurrentPage}
                            showControls
                            color="default"
                            variant="flat"
                            classNames={{
                                cursor: "bg-slate-800 text-white dark:bg-zinc-200 dark:text-slate-900 font-bold shadow-sm",
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Modales */}
            <ModalDetalleMedidor
                isOpen={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                medidor={selectedMedidor}
            />
            <ModalEditarMedidor
                key={selectedMedidor?.id}
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                medidor={selectedMedidor}
            />
        </div>
    );
};

export default TabInventarioMedidores;

