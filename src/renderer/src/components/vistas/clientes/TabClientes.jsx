//TabClientes

import { Chip, Select, SelectItem, Input,Pagination} from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { SearchIcon } from "../../../IconsApp/IconsSidebar";
export function TabClientes() {
    const data = [
        { id: 1, name: "Jane Fisher", city: "New York", accountStatus: "Active" },
        { id: 2, name: "Kristen Copper", city: "Los Angeles", accountStatus: "Inactive" },
        { id: 3, name: "Zoey Lang", city: "Chicago", accountStatus: "Paused" },
        { id: 4, name: "William Howard", city: "New York", accountStatus: "Active" },
        { id: 5, name: "Tony Reichert", city: "San Francisco", accountStatus: "Inactive" },
        { id: 6, name: "Linda Johnson", city: "Los Angeles", accountStatus: "Active" },
        { id: 7, name: "John Doe", city: "Chicago", accountStatus: "Inactive" },
        { id: 8, name: "Jane Fisher", city: "New York", accountStatus: "Active" },
        { id: 9, name: "Kristen Copper", city: "Los Angeles", accountStatus: "Inactive" },
        { id: 10, name: "Zoey Lang", city: "Chicago", accountStatus: "Paused" },
        { id: 11, name: "William Howard", city: "New York", accountStatus: "Active" },
        { id: 12, name: "Tony Reichert", city: "San Francisco", accountStatus: "Inactive" },
        { id: 13, name: "Linda Johnson", city: "Los Angeles", accountStatus: "Active" },
        { id: 14, name: "John Doe", city: "Chicago", accountStatus: "Inactive" },
        { id: 15, name: "Juan Acosta del Valle Verde", city: "New York", accountStatus: "Active" },
    ];

    const [search, setSearch] = useState("");
    const [cityFilter, setCityFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1); // Página actual
    const [rowsPerPage, setRowsPerPage] = useState(8); // Cantidad de clientes por página
    const [tableHeight, setTableHeight] = useState(getTableHeight()); // Altura inicial de la tabla

    function getTableHeight() { // Función para calcular la altura de la tabla
        return window.devicePixelRatio >= 1.25 ? "min-h-[29.8rem] max-h-[29.8rem]" : "min-h-[40rem] max-h-[40rem]";
    }

    useEffect(() => { // Ajustar la altura de la tabla al cambiar el tamaño de la ventana
        const handleResize = () => setTableHeight(getTableHeight());
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Filtrar datos por búsqueda y ciudad
    const filteredData = data.filter(
        (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) &&
            (cityFilter === "All" || item.city === cityFilter)
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
        <div className="p-3 bg-gray-50 rounded-lg shadow-lg dark:bg-gray-800 dark:text-white ">

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <input
                    type="text"
                    placeholder="Buscar por nombre ..."
                    value={search}
                    onChange={handleSearch}
                    className="border border-gray-300 text-gray-600 rounded-xl px-4 py-2 w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />

                {/* Select para filtrar por ciudad */}
               
                <Select
                    className="max-w-40 border rounded-xl border-gray-200 dark:border-gray-500 "
                   color="default"
                    aria-label="City"
                    selectedKeys={new Set([cityFilter])}
                    onSelectionChange={handleCityFilter}
                >
                    <SelectItem key="All">Todos</SelectItem>
                    <SelectItem key="New York">New York</SelectItem>
                    <SelectItem key="Los Angeles">Los Angeles</SelectItem>
                    <SelectItem key="Chicago">Chicago</SelectItem>
                    <SelectItem key="San Francisco">San Francisco</SelectItem>
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
            </div>

            {/* Table */}

            <div className={`overflow-y-auto ${tableHeight}`}>
                <table className="w-full bg-white rounded-lg shadow-lg overflow-hidden dark:bg-gray-700">
                    <thead>
                        <tr className="bg-blue-200 text-gray-600 text-left dark:bg-gray-500 dark:text-gray-200">
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
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3">{item.city}</td>
                                    <td className="p-3">
                                        <Chip
                                            color={
                                                item.accountStatus === "Active"
                                                    ? "success"
                                                    : item.accountStatus === "Inactive"
                                                        ? "danger"
                                                        : "warning"
                                            }
                                            className="px-2 py-1 rounded-full text-white"
                                        >
                                            {item.accountStatus}
                                        </Chip>
                                    </td>
                                    <td className="p-3">
                                        <button className="text-blue-500 hover:underline">Edit</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="p-3 text-center h-[388px] text-gray-500 dark:text-gray-300">
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
                    <span className="text-sm text-gray-600 dark:text-gray-200">Pag:</span>
                    <Pagination total={Math.ceil(filteredData.length/rowsPerPage)} current={currentPage} pageSize={rowsPerPage} onChange={handlePagination} />
                </div>
            </div>
        </div>
    );
}
