import React, { useState } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Button,
    Pagination,
    Card,
    CardBody,
    CardHeader,
    Select,
    SelectItem,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Spinner
} from "@nextui-org/react";
import { HiSearch, HiEye, HiTrash, HiLocationMarker, HiUser, HiCog, HiDownload, HiX, HiFilter } from "react-icons/hi";
import { useTabMedidores } from "../../../hooks/useTabMedidores";
import RegistrarMedidor from "./RegistrarMedidores";
import ModalDetalleMedidor from "./ModalDetalleMedidor";
import ModalEditarMedidor from "./ModalEditarMedidor";
import { exportData } from "../../../utils/exportUtils";
import { useFeedback } from "../../../context/FeedbackContext";

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

    const [selectedMedidor, setSelectedMedidor] = useState(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleView = (medidor) => {
        setSelectedMedidor(medidor);
        setIsViewOpen(true);
    };

    const handleEdit = (medidor) => {
        setSelectedMedidor(medidor);
        setIsEditOpen(true);
    };

    const handleDelete = () => {
        setError("La eliminación de medidores no está disponible actualmente. Para retirar un medidor, cambia su estado a 'Retirado'.", "Eliminar Medidor");
    };

    const renderCell = React.useCallback((medidor, columnKey) => {
        const cellValue = medidor[columnKey];

        switch (columnKey) {
            case "info_medidor":
                return (
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                            <HiCog className="text-lg" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <p className="font-bold text-sm text-slate-800 dark:text-zinc-100 mb-0.5 truncate uppercase">
                                {medidor.numero_serie}
                            </p>
                            <p className="font-medium text-[11px] text-slate-500 dark:text-zinc-400 truncate capitalize">
                                {medidor.marca} {medidor.modelo}
                            </p>
                        </div>
                    </div>
                );
            case "ubicacion":
                return (
                    <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-1.5">
                            <HiLocationMarker className="w-4 h-4 text-orange-500" />
                            <p className="font-bold text-xs text-slate-700 dark:text-zinc-200 capitalize truncate max-w-[200px]">
                                {medidor.ubicacion || "Sin ubicación"}
                            </p>
                        </div>
                        {medidor.latitud && medidor.longitud ? (
                            <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 pl-5">
                                {medidor.latitud.toFixed(4)}, {medidor.longitud.toFixed(4)}
                            </span>
                        ) : (
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 pl-5 italic">Sin coordenadas</span>
                        )}
                    </div>
                );
            case "estado": {
                const estadoVisual = medidor.estado_servicio === "Cortado" ? "Cortado" : medidor.estado_medidor;
                return (
                    <Chip
                        className="capitalize font-bold text-[10px] tracking-wider px-1 h-6"
                        color={getStatusColor(estadoVisual)}
                        size="sm"
                        variant="flat"
                    >
                        {estadoVisual}
                    </Chip>
                );
            }
            case "cliente":
                return medidor.cliente_id ? (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            <HiUser className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                Asignado
                            </span>
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-zinc-300 pl-5 truncate max-w-[200px]">
                            {medidor.cliente_nombre || "Cliente"}
                            {medidor.numero_predio ? ` • Predio #${medidor.numero_predio}` : ""}
                        </span>
                    </div>
                ) : (
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                        Disponible
                    </span>
                );
            case "acciones":
                return (
                    <div className="flex items-center justify-end gap-2">
                        <Button 
                            isIconOnly 
                            size="sm" 
                            variant="flat" 
                            className="bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 dark:bg-zinc-800 dark:hover:bg-blue-900/30 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
                            onPress={() => handleView(medidor)}
                            title="Ver Detalle"
                        >
                            <HiEye className="w-4 h-4" />
                        </Button>
                        <Button 
                            isIconOnly 
                            size="sm" 
                            variant="flat" 
                            className="bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 dark:bg-zinc-800 dark:hover:bg-blue-900/30 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
                            onPress={() => handleEdit(medidor)}
                            title="Editar Medidor"
                        >
                            <HiCog className="w-4 h-4" /> {/* Cambié el icono a Cog para diferenciarlo visualmente en este contexto */}
                        </Button>
                        <Button 
                            isIconOnly 
                            size="sm" 
                            variant="flat" 
                            className="bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 dark:bg-zinc-800 dark:hover:bg-red-900/30 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
                            onPress={handleDelete}
                            title="Eliminar"
                        >
                            <HiTrash className="w-4 h-4" />
                        </Button>
                    </div>
                );
            default:
                return cellValue;
        }
    }, [getStatusColor]);

    const columns = [
        { name: "DATOS DEL EQUIPO", uid: "info_medidor" },
        { name: "UBICACIÓN", uid: "ubicacion" },
        { name: "ESTADO", uid: "estado" },
        { name: "VINCULACIÓN", uid: "cliente" },
        { name: "ACCIONES", uid: "acciones" }
    ];

    if (initialLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-64">
                <Spinner size="lg" color="primary" />
                <p className="mt-4 text-sm font-bold text-slate-500 dark:text-zinc-400 animate-pulse">Cargando inventario de medidores...</p>
            </div>
        );
    }

    const selectClassNames = {
        trigger: "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors h-11",
        value: "font-medium text-slate-700 dark:text-zinc-200 text-sm"
    };

    return (
        <div className="space-y-6 w-full animate-in fade-in duration-300">
            
            {/* ── SECCIÓN 1: FILTROS Y ACCIONES ── */}
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
                            <HiCog className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                                    Inventario de Medidores
                                </h3>
                                {loading && !initialLoading && (
                                    <Spinner size="sm" color="primary" className="w-4 h-4 ml-1" />
                                )}
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                                Gestión técnica y ubicación
                            </p>
                        </div>
                    </div>

                    {/* Acciones Principales (Registrar y Exportar) */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    color="success"
                                    variant="flat"
                                    className="font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 flex-1 sm:flex-none"
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
                                        // Usa filteredData o paginatedData según prefieras (suele ser mejor exportar todo lo filtrado)
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
                </CardHeader>
                
                <CardBody className="p-6 bg-slate-50/50 dark:bg-black/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
                        
                        {/* Buscador */}
                        <div className="lg:col-span-6 relative w-full flex items-center">
                            <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                                <HiSearch className="w-5 h-5" />
                            </span>
                            <input
                                placeholder="Buscar por serie, marca, cliente o predio..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm h-11"
                            />
                            {search && (
                                <button
                                    onClick={() => handleSearch("")}
                                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
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
                                variant="bordered"
                                classNames={selectClassNames}
                            >
                                <SelectItem key="All" value="All">Todos</SelectItem>
                                <SelectItem key="Activo" value="Activo">Activo</SelectItem>
                                <SelectItem key="Inactivo" value="Inactivo">Inactivo</SelectItem>
                                <SelectItem key="Mantenimiento" value="Mantenimiento">Mantenimiento</SelectItem>
                                <SelectItem key="Cortado" value="Cortado">Cortado</SelectItem>
                                <SelectItem key="Retirado" value="Retirado">Retirado</SelectItem>
                            </Select>
                        </div>

                        {/* Filtro por ubicacion */}
                        <div className="lg:col-span-2">
                            <Select
                                placeholder="Todas las ubicaciones"
                                selectedKeys={locationFilter !== "All" ? [locationFilter] : []}
                                onSelectionChange={(keys) => {
                                    const value = Array.from(keys)[0] || "All";
                                    handleLocationFilterChange(value);
                                }}
                                aria-label="Filtrar por ubicacion"
                                variant="bordered"
                                classNames={selectClassNames}
                            >
                                <SelectItem key="All" value="All">Todas</SelectItem>
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
                                    color="default"
                                    onPress={clearFilters}
                                    className="w-full font-bold text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm h-11"
                                    startContent={<HiFilter className="text-slate-400" />}
                                >
                                    Limpiar
                                </Button>
                            ) : (
                                <div className="w-full h-11"></div> // Espaciador para mantener grid
                            )}
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* ── SECCIÓN 2: TABLA DE DATOS ── */}
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
                {/* Cabecera interna de tabla */}
                <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4">
                    <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">
                        Mostrando <span className="text-blue-600 dark:text-blue-400">{paginatedData.length}</span> de <span className="text-slate-800 dark:text-zinc-200">{totalItems}</span> medidores
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
                                handleRowsPerPageChange(Array.from(keys)[0]);
                            }}
                            classNames={{
                                trigger: "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 shadow-sm rounded-lg",
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

                <CardBody className="p-0">
                    <Table
                        aria-label="Tabla de inventario de medidores"
                        removeWrapper
                        classNames={{
                            base: "min-h-[400px]",
                            table: "min-w-full",
                            thead: "bg-slate-50 dark:bg-zinc-800/50",
                            th: "bg-transparent text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px] py-3 border-b border-slate-200 dark:border-zinc-700",
                            td: "py-3 border-b border-slate-100 dark:border-zinc-800/50",
                            tr: "hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors cursor-default"
                        }}
                    >
                        <TableHeader columns={columns}>
                            {(column) => (
                                <TableColumn key={column.uid} align={column.uid === "acciones" ? "end" : "start"}>
                                    {column.name}
                                </TableColumn>
                            )}
                        </TableHeader>
                        <TableBody
                            emptyContent={
                                loading ? (
                                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                                        <Spinner size="lg" color="primary" />
                                        <span className="text-sm font-bold text-slate-500 animate-pulse">Cargando medidores...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400 dark:text-zinc-500">
                                        <HiCog className="w-12 h-12 opacity-20 mb-2" />
                                        <p className="font-bold">No se encontraron medidores</p>
                                    </div>
                                )
                            }
                        >
                            {paginatedData.map((item) => (
                                <TableRow key={item.id}>
                                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Paginación Inferior */}
                    {totalPages > 1 && (
                        <div className="flex justify-center p-4 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900">
                            <Pagination
                                total={totalPages}
                                page={currentPage}
                                onChange={setCurrentPage}
                                showControls
                                color="primary"
                                variant="light"
                                classNames={{
                                    cursor: "bg-blue-600 text-white font-bold shadow-md",
                                }}
                            />
                        </div>
                    )}
                </CardBody>
            </Card>

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
