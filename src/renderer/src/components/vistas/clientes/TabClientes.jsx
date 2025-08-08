//TabClientes

import {
    Chip,
    Select,
    SelectItem,
    Input,
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
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Spinner,
    Skeleton
} from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import { HiDotsVertical, HiEye, HiPencil, HiTrash, HiLocationMarker, HiPhone, HiMail, HiUsers } from "react-icons/hi";
import { useClientes } from "../../../context/ClientesContext";
import RegistrarClientes from "./RegistrarCliente";
import EditarClientes from "./EditarCliente";

export function TabClientes() {
    const { clientes, loading, initialLoading } = useClientes();

    const [search, setSearch] = useState("");
    const [cityFilter, setCityFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Componente de loading elegante para la tabla
    const LoadingSkeleton = () => (
        <div className="space-y-6 p-4">
            {/* Header skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="w-48 h-6 rounded-lg" />
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="lg:col-span-2">
                            <Skeleton className="w-full h-10 rounded-lg" />
                        </div>
                        <Skeleton className="w-full h-10 rounded-lg" />
                        <Skeleton className="w-full h-10 rounded-lg" />
                        <Skeleton className="w-full h-10 rounded-lg" />
                    </div>
                    <div className="flex justify-between items-center mt-4">
                        <Skeleton className="w-64 h-4 rounded-lg" />
                        <Skeleton className="w-32 h-8 rounded-lg" />
                    </div>
                </CardBody>
            </Card>

            {/* Table skeleton */}
            <Card>
                <CardBody className="p-0">
                    <div className="space-y-3 p-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="w-3/4 h-4 rounded-lg" />
                                    <Skeleton className="w-1/2 h-3 rounded-lg" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="w-16 h-6 rounded-lg" />
                                    <Skeleton className="w-12 h-4 rounded-lg" />
                                </div>
                                <Skeleton className="w-8 h-8 rounded-lg" />
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        </div>
    );

    // Solo mostrar skeleton en la carga inicial para evitar parpadeos
    if (initialLoading) {
        return <LoadingSkeleton />;
    }

    // Filtrar datos por búsqueda, ciudad y estado
    const filteredData = clientes.filter((item) => {
        const matchesSearch = item.nombre.toLowerCase().includes(search.toLowerCase()) ||
            (item.direccion && item.direccion.toLowerCase().includes(search.toLowerCase()));
        const matchesCity = cityFilter === "All" || item.ciudad === cityFilter;
        const matchesStatus = statusFilter === "All" || item.estado_cliente === statusFilter;

        return matchesSearch && matchesCity && matchesStatus;
    });

    // Obtener ciudades únicas
    const ciudades = [...new Set(clientes.map(cliente => cliente.ciudad))].filter(Boolean);
    const estados = [...new Set(clientes.map(cliente => cliente.estado_cliente))].filter(Boolean);

    // Manejar búsqueda
    const handleSearch = (value) => {
        setSearch(value);
        setCurrentPage(1);
    };

    // Paginación
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    const getStatusColor = (status) => {
        switch (status) {
            case "Activo": return "success";
            case "Inactivo": return "danger";
            case "Suspendido": return "warning";
            default: return "default";
        }
    };

    const handleAction = (action, cliente) => {
        switch (action) {
            case "view":
                console.log("Ver cliente:", cliente);
                break;
            case "edit":
                console.log("Editar cliente:", cliente);
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
                                    onClear={() => handleSearch("")}
                                     className="border border-gray-300 text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                />
                                {/* Botón para limpiar */}
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

                        {/* Filtro por ciudad */}
                        <Select
                            label="Ciudad"
                            placeholder="Todas las ciudades"
                            selectedKeys={cityFilter !== "All" ? [cityFilter] : []}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] || "All";
                                setCityFilter(value);
                                setCurrentPage(1);
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
                                setStatusFilter(value);
                                setCurrentPage(1);
                            }}
                        >
                            <SelectItem key="All" value="All">Todos los estados</SelectItem>
                            {estados.map(estado => (
                                <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                            ))}
                        </Select>

                        {/* Botón Agregar Cliente */}
                        <div className="flex items-end">
                            <RegistrarClientes />
                        </div>
                    </div>

                    {/* Información de resultados */}
                    <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>
                            Mostrando {paginatedData.length} de {filteredData.length} clientes
                            {filteredData.length !== clientes.length && ` (filtrado de ${clientes.length} total)`}
                        </span>

                        <Select
                            label="Por página"
                            size="sm"
                            className="w-32"
                            selectedKeys={[rowsPerPage.toString()]}
                            onSelectionChange={(keys) => {
                                setRowsPerPage(Number(Array.from(keys)[0]));
                                setCurrentPage(1);
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
                        <TableBody emptyContent="No se encontraron clientes">
                            {paginatedData.map((cliente) => (
                                <TableRow key={cliente.id}>
                                    <TableCell>
                                        <User
                                            name={cliente.nombre}
                                            description={`ID: ${cliente.id}`}
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
            {totalPages > 1 && (
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
            )}
        </div>
    );
}
