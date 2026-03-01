//TabClientes

import {
    Chip,
    Select,
    SelectItem,
    Pagination,
    Button,
    Card,
    CardBody,
    CardHeader,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    User,
    Spinner
} from "@nextui-org/react";
import React from "react";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import { HiEye, HiTrash, HiPhone, HiMail, HiLocationMarker } from "react-icons/hi";
import RegistrarClientes from "./RegistrarCliente";
import EditarClientes from "./EditarCliente";
import ModalDetalleCliente from "./ModalDetalleCliente";
import { useTabClientes } from "../../../hooks/useTabClientes";
import { HiDownload } from "react-icons/hi";
import { exportData } from "../../../utils/exportUtils";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { useFeedback } from "../../../context/FeedbackContext";
import LoadingSkeleton from "./components/LoadingSkeleton";

export function TabClientes() {
    const {
        clientes,
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
        handleRowsPerPageChange,
        setCurrentPage,
        getStatusColor
    } = useTabClientes();

    const { setSuccess, setError } = useFeedback();

    const [selectedCliente, setSelectedCliente] = React.useState(null);
    const [isDetailOpen, setIsDetailOpen] = React.useState(false);

    // Solo mostrar skeleton en la carga inicial para evitar parpadeos
    if (initialLoading) {
        return <LoadingSkeleton tipo="tabla" />;
    }

    // Manejar acciones
    const handleAction = (action, cliente) => {
        switch (action) {
            case "view":
                setSelectedCliente(cliente);
                setIsDetailOpen(true);
                break;
            case "delete":
                if (confirm(`¿Está seguro de eliminar a ${cliente.nombre}?`)) {
                    console.log("Eliminar cliente:", cliente);
                }
                break;
            default:
                break;
        }
    };

    return (
        <div className="space-y-6 p-4">

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
                                    <SearchIcon className="inline-block mr-2" />
                                </span>
                                <input
                                    placeholder="Buscar por nombre o dirección..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="border border-gray-300 text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                />
                                {/* Botón para limpiar */}
                                {search && (
                                    <button
                                        onClick={() => handleSearch("")}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>


                        </div>

                        {/* Filtro por ciudad */}
                        <Select
                            label="Ciudad"
                            placeholder="Todas las ciudades"
                            selectedKeys={cityFilter !== "All" ? [cityFilter] : []}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] || "All";
                                handleCityFilterChange(value);
                            }}
                        >
                            <SelectItem key="All" value="All">Todas las ciudades</SelectItem>
                            {ciudades.map(ciudad => (
                                <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                            ))}
                        </Select>

                        {/* Filtro por estado */}
                        <Select
                            label="Estado"
                            placeholder="Todos los estados"
                            selectedKeys={statusFilter !== "All" ? [statusFilter] : []}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] || "All";
                                handleStatusFilterChange(value);
                            }}
                        >
                            <SelectItem key="All" value="All">Todos los estados</SelectItem>
                            {estados.map(estado => (
                                <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                            ))}
                        </Select>

                        {/* Botón Agregar Cliente */}
                        <div className="flex items-end gap-2">
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
                                <DropdownMenu aria-label="Opciones de exportación">
                                    <DropdownItem
                                        key="csv"
                                        startContent={<span className="text-xl">📄</span>}
                                        onPress={async () => {
                                            const success = await exportData(filteredData, `Clientes_${new Date().toISOString().split('T')[0]}`, 'csv');
                                            if (success) setSuccess("Archivo CSV generado exitosamente");
                                        }}
                                    >
                                        Exportar CSV
                                    </DropdownItem>
                                    <DropdownItem
                                        key="excel"
                                        startContent={<span className="text-xl">📊</span>}
                                        onPress={async () => {
                                            const success = await exportData(filteredData, `Clientes_${new Date().toISOString().split('T')[0]}`, 'xlsx');
                                            if (success) setSuccess("Archivo Excel generado exitosamente");
                                        }}
                                    >
                                        Exportar Excel (.xlsx)
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>

                            <RegistrarClientes />
                        </div>
                    </div>

                    {/* Información de resultados */}
                    {/* Información de resultados */}
                    <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>
                            Mostrando {paginatedData.length} de {totalItems} clientes
                        </span>

                        <Select
                            label="Por página"
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

            {/* Tabla de clientes */}
            <Card>
                <CardBody className="p-0">
                    <Table
                        aria-label="Tabla de clientes"
                        classNames={{
                            wrapper: "min-h-[400px]",
                        }}
                    >
                        <TableHeader>
                            <TableColumn>CLIENTE</TableColumn>
                            <TableColumn>CONTACTO</TableColumn>
                            <TableColumn>UBICACIÓN</TableColumn>
                            <TableColumn>ESTADO</TableColumn>
                            <TableColumn align="center">ACCIONES</TableColumn>
                        </TableHeader>
                        <TableBody
                            emptyContent={
                                loading ? (
                                    <div className="flex flex-col items-center justify-center gap-2 p-4">
                                        <Spinner size="lg" color="primary" />
                                        <span className="text-gray-500">Cargando clientes...</span>
                                    </div>
                                ) : "No se encontraron clientes"
                            }
                        >
                            {paginatedData.map((cliente) => (
                                <TableRow key={cliente.id}>
                                    <TableCell>
                                        <User
                                            name={cliente.nombre}
                                            description={cliente.numero_predio ? `#${cliente.numero_predio} · ID: ${cliente.id}` : `ID: ${cliente.id}`}
                                            avatarProps={{
                                                name: cliente.nombre?.charAt(0) || "C",
                                                size: "sm",
                                                className: "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                                            }}
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <div className="space-y-1">
                                            {cliente.telefono && (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <HiPhone className="w-3 h-3 text-gray-400" />
                                                    <span>{cliente.telefono}</span>
                                                </div>
                                            )}
                                            {cliente.email && (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <HiMail className="w-3 h-3 text-gray-400" />
                                                    <span>{cliente.email}</span>
                                                </div>
                                            )}
                                            {!cliente.telefono && !cliente.email && (
                                                <span className="text-sm text-gray-400">Sin contacto</span>
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1">
                                                <HiLocationMarker className="w-3 h-3 text-gray-400" />
                                                <span className="text-sm font-medium">{cliente.ciudad}</span>
                                            </div>
                                            {cliente.direccion && (
                                                <div className="text-xs text-gray-500 max-w-[200px] truncate">
                                                    {cliente.direccion}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            size="sm"
                                            color={getStatusColor(cliente.estado_cliente)}
                                            variant="flat"
                                        >
                                            {cliente.estado_cliente || "Sin estado"}
                                        </Chip>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                color="primary"
                                                onClick={() => handleAction("view", cliente)}
                                            >
                                                <HiEye className="w-4 h-4" />
                                            </Button>

                                            <EditarClientes id={cliente.id} />

                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                color="danger"
                                                onClick={() => handleAction("delete", cliente)}
                                            >
                                                <HiTrash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {/* Paginación */}
            {
                totalPages > 1 && (
                    <div className="flex justify-center">
                        <Pagination
                            total={totalPages}
                            page={currentPage}
                            onChange={setCurrentPage}
                            showControls
                            showShadow
                            color="primary"
                        />
                    </div>
                )
            }
            {/* Modal de Detalle */}
            <ModalDetalleCliente
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                cliente={selectedCliente}
            />
        </div >
    );
}
