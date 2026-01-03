import React, { useState, useMemo } from "react";
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
    SelectItem
} from "@nextui-org/react";
import { HiSearch, HiPencilAlt, HiEye, HiTrash, HiLocationMarker, HiUser, HiCog } from "react-icons/hi";
import { useMedidores } from "../../../context/MedidoresContext";
import RegistrarMedidor from "./RegistrarMedidores";
import ModalDetalleMedidor from "./ModalDetalleMedidor";
import ModalEditarMedidor from "./ModalEditarMedidor";

const TabInventarioMedidores = () => {
    const { medidores, loading, initialLoading } = useMedidores();

    // Estados de filtros y paginación
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [assignmentFilter, setAssignmentFilter] = useState("All");
    const [page, setPage] = useState(1);

    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Estados para modales
    const [selectedMedidor, setSelectedMedidor] = useState(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Handlers
    const handleView = (medidor) => {
        setSelectedMedidor(medidor);
        setIsViewOpen(true);
    };

    const handleEdit = (medidor) => {
        console.log("TabInventario: Seleccionando para editar:", medidor); // DEBUG
        setSelectedMedidor(medidor);
        setIsEditOpen(true);
    };

    // --- Lógica de filtrado ---
    const filteredItems = useMemo(() => {
        let items = [...medidores];

        // Filtro de Búsqueda
        if (search) {
            const lowerSearch = search.toLowerCase();
            items = items.filter((medidor) =>
                medidor.numero_serie?.toLowerCase().includes(lowerSearch) ||
                medidor.ubicacion?.toLowerCase().includes(lowerSearch) ||
                medidor.marca?.toLowerCase().includes(lowerSearch) ||
                medidor.modelo?.toLowerCase().includes(lowerSearch)
            );
        }

        // Filtro de Estado
        if (statusFilter !== "All") {
            items = items.filter((medidor) => medidor.estado_medidor === statusFilter);
        }

        // Filtro de Asignación
        if (assignmentFilter !== "All") {
            if (assignmentFilter === "Asignado") {
                items = items.filter((medidor) => medidor.cliente_id);
            } else if (assignmentFilter === "No Asignado") {
                items = items.filter((medidor) => !medidor.cliente_id);
            }
        }

        return items;
    }, [medidores, search, statusFilter, assignmentFilter]);

    // --- Lógica de paginación ---
    const totalPages = Math.ceil(filteredItems.length / rowsPerPage);

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);


    // --- Renderizado de celdas ---
    const renderCell = React.useCallback((medidor, columnKey) => {
        const cellValue = medidor[columnKey];

        switch (columnKey) {
            case "info_medidor":
                return (
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 rounded-full">
                            <HiCog className="text-blue-600 dark:text-blue-300 text-sm" />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-bold text-sm capitalize flex items-center gap-1">
                                {medidor.numero_serie}
                            </p>
                            <p className="text-bold text-xs capitalize text-default-400">
                                {medidor.marca} {medidor.modelo}
                            </p>
                        </div>
                    </div>
                );
            case "ubicacion":
                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <HiLocationMarker className="w-3 h-3 text-gray-400" />
                            <p className="text-bold text-sm capitalize">{medidor.ubicacion}</p>
                        </div>
                        {medidor.latitud && medidor.longitud ? (
                            <span className="text-xs text-default-400 pl-4">
                                {medidor.latitud.toFixed(4)}, {medidor.longitud.toFixed(4)}
                            </span>
                        ) : (
                            <span className="text-xs text-default-400 pl-4">Sin coordenadas</span>
                        )}
                    </div>
                );
            case "estado":
                return (
                    <Chip
                        className="capitalize"
                        color={medidor.estado_medidor === "Activo" ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                    >
                        {medidor.estado_medidor}
                    </Chip>
                );
            case "cliente":
                return medidor.cliente_id ? (
                    <div className="flex items-center gap-1">
                        <HiUser className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            Asignado
                        </span>
                    </div>
                ) : (
                    <span className="text-xs text-gray-400 pl-4">
                        Disponible
                    </span>
                );
            case "acciones":
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => handleView(medidor)}
                        >
                            <HiEye className="w-4 h-4" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="default"
                            onPress={() => handleEdit(medidor)}
                        >
                            <HiPencilAlt className="w-4 h-4" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                        >
                            <HiTrash className="w-4 h-4" />
                        </Button>
                    </div>
                );
            default:
                return cellValue;
        }
    }, []);

    // Columnas
    const columns = [
        { name: "MEDIDOR", uid: "info_medidor" },
        { name: "UBICACIÓN", uid: "ubicacion" },
        { name: "ESTADO", uid: "estado" },
        { name: "CLIENTE", uid: "cliente" },
        { name: "ACCIONES", uid: "acciones" },
    ];

    return (
        <div className="space-y-6">

            {/* Filtros y controles */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">Filtros y Búsqueda</h3>
                        {loading && !initialLoading && (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        )}
                    </div>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

                        {/* Búsqueda */}
                        <div className="lg:col-span-2">
                            <div className="relative w-full flex">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                    <HiSearch className="inline-block mr-2" />
                                </span>
                                <input
                                    placeholder="Buscar por serie, marca o ubicación..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="border border-gray-300 text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch("")}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filtro de Estado */}
                        <Select
                            label="Estado"
                            placeholder="Todos"
                            selectedKeys={[statusFilter]}
                            onChange={(e) => {
                                setStatusFilter(e.target.value || "All");
                                setPage(1);
                            }}
                            size="sm"
                        >
                            <SelectItem key="All" value="All">Todos</SelectItem>
                            <SelectItem key="Activo" value="Activo">Activo</SelectItem>
                            <SelectItem key="Inactivo" value="Inactivo">Inactivo</SelectItem>
                            <SelectItem key="Mantenimiento" value="Mantenimiento">Mantenimiento</SelectItem>
                        </Select>

                        {/* Filtro de Asignación */}
                        <Select
                            label="Asignación"
                            placeholder="Todos"
                            selectedKeys={[assignmentFilter]}
                            onChange={(e) => {
                                setAssignmentFilter(e.target.value || "All");
                                setPage(1);
                            }}
                            size="sm"
                        >
                            <SelectItem key="All" value="All">Todos</SelectItem>
                            <SelectItem key="Asignado" value="Asignado">Asignados</SelectItem>
                            <SelectItem key="No Asignado" value="No Asignado">No Asignados</SelectItem>
                        </Select>


                        {/* Botón de Agregar */}
                        <div className="flex items-end justify-end">
                            <RegistrarMedidor />
                        </div>

                    </div>

                    {/* Resumen y Selector de Filas */}
                    <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>
                            Mostrando {items.length} de {filteredItems.length} medidores
                            {filteredItems.length !== medidores.length && ` (filtrado de ${medidores.length} total)`}
                        </span>

                        <Select
                            label="Por página"
                            size="sm"
                            className="w-32"
                            selectedKeys={[rowsPerPage.toString()]}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            <SelectItem key="5" value="5">5</SelectItem>
                            <SelectItem key="10" value="10">10</SelectItem>
                            <SelectItem key="15" value="15">15</SelectItem>
                            <SelectItem key="20" value="20">20</SelectItem>
                            <SelectItem key="50" value="50">50</SelectItem>
                        </Select>
                    </div>
                </CardBody>
            </Card>

            {/* Tabla */}
            <Card>
                <CardBody className="p-0">
                    <Table
                        aria-label="Tabla de inventario de medidores"
                        classNames={{
                            wrapper: "min-h-[400px]",
                        }}
                    >
                        <TableHeader columns={columns}>
                            {(column) => (
                                <TableColumn key={column.uid} align={column.uid === "acciones" ? "center" : "start"}>
                                    {column.name}
                                </TableColumn>
                            )}
                        </TableHeader>
                        <TableBody emptyContent={"No se encontraron medidores"} items={items} isLoading={loading}>
                            {(item) => (
                                <TableRow key={item.id}>
                                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex justify-center pb-4">
                    <Pagination
                        total={totalPages}
                        page={page}
                        onChange={setPage}
                        showControls
                        showShadow
                        color="primary"
                    />
                </div>
            )}

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
