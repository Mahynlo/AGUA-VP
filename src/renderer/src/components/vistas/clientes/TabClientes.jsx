//TabClientes

import { Chip, Select, SelectItem, Input, Pagination, Button, Tooltip } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
import { useClientes } from "../../../context/ClientesContext";
import { Spinner } from "@nextui-org/react";
import RegistrarClientes from "./RegistrarCliente";
import EditarClientes from "./EditarCliente";


export function TabClientes() {

    const { clientes, loading } = useClientes();

    if (loading) return <div className="text-center"><Spinner classNames={{ label: "text-foreground mt-4" }} label="wave" variant="wave" /></div>;

    const [search, setSearch] = useState("");
    const [cityFilter, setCityFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1); // Página actual
    const [rowsPerPage, setRowsPerPage] = useState(8); // Cantidad de clientes por página
    const [tableHeight, setTableHeight] = useState(getTableHeight()); // Altura inicial de la tabla


    const [registroSuccess, setRegistroSuccess] = useState("");
const [registroError, setRegistroError] = useState("");


    function getTableHeight() { // Función para calcular la altura de la tabla
        return window.devicePixelRatio >= 1.25 ? "min-h-[28.8rem] max-h-[28.8rem]" : "min-h-[40rem] max-h-[40rem]";
    }

    useEffect(() => { // Ajustar la altura de la tabla al cambiar el tamaño de la ventana
        const handleResize = () => setTableHeight(getTableHeight());
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Filtrar datos por búsqueda y ciudad
    const filteredData = clientes.filter(
        (item) =>
            item.nombre.toLowerCase().includes(search.toLowerCase()) &&
            (cityFilter === "All" || item.ciudad === cityFilter)
    );

    // Manejar la búsqueda
    const handleSearch = (e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };

    // Manejar el filtro de ciudad
    const handleCityFilter = (keys) => {
        setCityFilter(Array.from(keys)[0] || "All");
        setCurrentPage(1);
    };

    // Manejar la cantidad de clientes por página
    const handleRowsPerPageChange = (keys) => {
        setRowsPerPage(Number(Array.from(keys)[0]) || 8);
        setCurrentPage(1);
    };

    // Paginación
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handlePagination = (page) => {
        setCurrentPage(page);
    };


    return (
        <div >
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Clientes</h1>

            {/* Header */}
            <div className="flex justify-between items-center mb-4">


                <div className="relative w-1/3">
                    {/* Ícono de lupa */}
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        <SearchIcon className="inline-block mr-2" />
                    </span>

                    <input
                        type="text"
                        placeholder="Buscar por nombre ..."
                        value={search}
                        onChange={handleSearch}
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





                {/* Select para filtrar por ciudad */}

                <Select
                    className="max-w-40 border rounded-xl border-gray-200 dark:border-gray-500 "
                    color="default"
                    aria-label="ciudad"
                    selectedKeys={new Set([cityFilter])}
                    onSelectionChange={handleCityFilter}
                >
                    <SelectItem key="All">Todos</SelectItem>
                    <SelectItem key="Adivino">Adivino</SelectItem>
                    <SelectItem key="Matape">Matape</SelectItem>
                    <SelectItem key="Nacori Grande">Nacori Grande</SelectItem>
                </Select>

                {/* Select para cantidad de clientes por página */}

                <Select
                    className="max-w-24 border rounded-xl border-gray-200 dark:border-gray-500"
                    aria-label="Rows per page"
                    color="default"
                    selectedKeys={new Set([rowsPerPage.toString()])}
                    onSelectionChange={handleRowsPerPageChange}
                >
                    <SelectItem key="8">8</SelectItem>
                    <SelectItem key="12">12</SelectItem>
                    <SelectItem key="16">16</SelectItem>
                </Select>

                <RegistrarClientes />

            </div>

            {/* Table */}

            <div className={`overflow-y-auto  ${tableHeight}`}>
                <table className="w-full bg-white rounded-lg shadow-lg  dark:bg-gray-700 ">
                    <thead>
                        <tr className="sticky top-0 bg-blue-200 text-gray-600 text-left dark:bg-gray-500 dark:text-gray-200">
                            <th className="p-3">Nombre</th>
                            <th className="p-3">Pueblo</th>
                            <th className="p-3">Estado de la cuenta</th>
                            <th className="p-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item) => (
                                <tr key={item.id} className="border-b hover:bg-gray-100 text-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600">
                                    <td className="p-3">{item.nombre}</td>
                                    <td className="p-3">{item.ciudad}</td>
                                    <td className="p-3">
                                        <Chip
                                            color={
                                                item.estado_cliente === "Activo"
                                                    ? "success"
                                                    : item.estado_cliente === "Inactivo"
                                                        ? "danger"
                                                        : "warning"
                                            }
                                            className="px-2 py-1 rounded-full text-white"
                                        >
                                            {item.estado_cliente}
                                        </Chip>
                                    </td>
                                    <td className="p-3 space-x-2">
                                        <EditarClientes id={item.id} />


                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="p-3 text-center h-[590px] text-gray-500 dark:text-gray-300">
                                    No se encontraron resultados
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-600 dark:text-gray-200">
                    {`Mostrando ${(currentPage - 1) * rowsPerPage + 1}-${currentPage * rowsPerPage > filteredData.length
                        ? filteredData.length
                        : currentPage * rowsPerPage
                        } de ${filteredData.length} resultados`}
                </span>
                <div className="flex space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-200"><Pagination total={Math.ceil(filteredData.length / rowsPerPage)} current={currentPage} pageSize={rowsPerPage} onChange={handlePagination} /></span>

                </div>
            </div>
        </div>
    );
}
