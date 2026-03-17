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
import { HiSearch, HiPencilAlt, HiEye, HiTrash, HiLocationMarker, HiUser, HiCog, HiDownload } from "react-icons/hi";
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
        getStatusColor
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
        setError("La eliminacion de medidores no esta disponible actualmente. Para retirar un medidor, cambia su estado a 'Retirado'.", "Eliminar Medidor");
    };

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
            case "estado": {
                const estadoVisual = medidor.estado_servicio === "Cortado" ? "Cortado" : medidor.estado_medidor;
                return (
                    <Chip
                        className="capitalize"
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
                        <div className="flex items-center gap-1">
                            <HiUser className="w-3 h-3 text-blue-500" />
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                Asignado
                            </span>
                        </div>
                        {(medidor.cliente_nombre || medidor.numero_predio) && (
                            <span className="text-[11px] text-gray-500 pl-4">
                                {medidor.cliente_nombre || "Cliente"}
                                {medidor.numero_predio ? ` · Predio ${medidor.numero_predio}` : ""}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-gray-400 pl-4">Disponible</span>
                );
            case "acciones":
                return (
                    <div className="flex items-center gap-2">
                        <Button isIconOnly size="sm" variant="light" color="primary" onPress={() => handleView(medidor)}>
                            <HiEye className="w-4 h-4" />
                        </Button>
                        <Button isIconOnly size="sm" variant="light" color="default" onPress={() => handleEdit(medidor)}>
                            <HiPencilAlt className="w-4 h-4" />
                        </Button>
                        <Button isIconOnly size="sm" variant="light" color="danger" onPress={handleDelete}>
                            <HiTrash className="w-4 h-4" />
                        </Button>
                    </div>
                );
            default:
                return cellValue;
        }
    }, [getStatusColor]);

    const columns = [
        { name: "MEDIDOR", uid: "info_medidor" },
        { name: "UBICACION", uid: "ubicacion" },
        { name: "ESTADO", uid: "estado" },
        { name: "CLIENTE", uid: "cliente" },
        { name: "ACCIONES", uid: "acciones" }
    ];

    if (initialLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-64">
                <Spinner size="lg" color="primary" label="Cargando medidores..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">Filtros y Busqueda</h3>
                    </div>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="lg:col-span-2">
                            <div className="relative w-full flex">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                    <HiSearch className="inline-block mr-2" />
                                </span>
                                <input
                                    placeholder="Buscar por serie, marca, cliente o predio..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="border border-gray-300 text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                />
                                {search && (
                                    <button
                                        onClick={() => handleSearch("")}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                                    >
                                        x
                                    </button>
                                )}
                            </div>
                        </div>

                        <Select
                            label="Estado"
                            placeholder="Todos"
                            selectedKeys={[statusFilter]}
                            onChange={(e) => handleStatusFilterChange(e.target.value)}
                            size="sm"
                        >
                            <SelectItem key="All" value="All">Todos</SelectItem>
                            <SelectItem key="Activo" value="Activo">Activo</SelectItem>
                            <SelectItem key="Inactivo" value="Inactivo">Inactivo</SelectItem>
                            <SelectItem key="Mantenimiento" value="Mantenimiento">Mantenimiento</SelectItem>
                            <SelectItem key="Cortado" value="Cortado">Cortado</SelectItem>
                            <SelectItem key="Retirado" value="Retirado">Retirado</SelectItem>
                        </Select>

                        <Select
                            label="Ubicacion"
                            placeholder="Todas"
                            selectedKeys={[locationFilter]}
                            onChange={(e) => handleLocationFilterChange(e.target.value)}
                            size="sm"
                        >
                            <SelectItem key="All" value="All">Todas</SelectItem>
                            {locationOptions.map((ubicacion) => (
                                <SelectItem key={ubicacion} value={ubicacion}>{ubicacion}</SelectItem>
                            ))}
                        </Select>

                        <div className="flex items-end justify-end gap-2">
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        color="success"
                                        className="text-white"
                                        startContent={<HiDownload className="text-lg" />}
                                    >
                                        Exportar
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Opciones de exportacion">
                                    <DropdownItem
                                        key="csv"
                                        startContent={<span className="text-xl">📄</span>}
                                        onPress={async () => {
                                            const success = await exportData(paginatedData, `Inventario_Medidores_${new Date().toISOString().split("T")[0]}`, "csv");
                                            if (success) setSuccess("Archivo CSV generado exitosamente");
                                        }}
                                    >
                                        Exportar CSV (Pagina actual)
                                    </DropdownItem>
                                    <DropdownItem
                                        key="excel"
                                        startContent={<span className="text-xl">📊</span>}
                                        onPress={async () => {
                                            const success = await exportData(paginatedData, `Inventario_Medidores_${new Date().toISOString().split("T")[0]}`, "xlsx");
                                            if (success) setSuccess("Archivo Excel generado exitosamente");
                                        }}
                                    >
                                        Exportar Excel (Pagina actual)
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>

                            <RegistrarMedidor />
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>
                            Mostrando {paginatedData.length} de {totalItems} medidores
                        </span>

                        <Select
                            label="Por pagina"
                            size="sm"
                            className="w-32"
                            selectedKeys={[rowsPerPage.toString()]}
                            onSelectionChange={(keys) => {
                                handleRowsPerPageChange(Array.from(keys)[0]);
                            }}
                        >
                            <SelectItem key="5" value="5">5</SelectItem>
                            <SelectItem key="10" value="10">10</SelectItem>
                            <SelectItem key="15" value="15">15</SelectItem>
                            <SelectItem key="20" value="20">20</SelectItem>
                        </Select>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardBody className="p-0">
                    <Table
                        aria-label="Tabla de inventario de medidores"
                        classNames={{ wrapper: "min-h-[400px]" }}
                    >
                        <TableHeader columns={columns}>
                            {(column) => (
                                <TableColumn key={column.uid} align={column.uid === "acciones" ? "center" : "start"}>
                                    {column.name}
                                </TableColumn>
                            )}
                        </TableHeader>
                        <TableBody
                            emptyContent={
                                loading ? (
                                    <div className="flex flex-col items-center justify-center gap-2 p-4">
                                        <Spinner size="lg" color="primary" />
                                        <span className="text-gray-500">Cargando medidores...</span>
                                    </div>
                                ) : "No se encontraron medidores"
                            }
                        >
                            {paginatedData.map((item) => (
                                <TableRow key={item.id}>
                                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {totalPages > 1 && (
                <div className="flex justify-center pb-4">
                    <Pagination
                        total={totalPages}
                        page={currentPage}
                        onChange={setCurrentPage}
                        showControls
                        showShadow
                        color="primary"
                    />
                </div>
            )}

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
