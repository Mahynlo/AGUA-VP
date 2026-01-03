/**
 * Hook para manejar la tabla de clientes con filtros y paginación
 */

import { useState, useMemo } from "react";
import { useClientes } from "../context/ClientesContext";

export const useTabClientes = () => {
  const { clientes, loading, initialLoading } = useClientes();

  // Estados de filtros y búsqueda
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filtrar datos
  const filteredData = useMemo(() => {
    return clientes.filter((item) => {
      const matchesSearch = 
        item.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        item.direccion?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCity = cityFilter === "All" || item.ciudad === cityFilter;
      const matchesStatus = statusFilter === "All" || item.estado_cliente === statusFilter;

      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [clientes, search, cityFilter, statusFilter]);

  // Obtener listas únicas para filtros
  const ciudades = useMemo(() => 
    [...new Set(clientes.map(cliente => cliente.ciudad))].filter(Boolean),
    [clientes]
  );

  const estados = useMemo(() => 
    [...new Set(clientes.map(cliente => cliente.estado_cliente))].filter(Boolean),
    [clientes]
  );

  // Paginación
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Handler para búsqueda
  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // Handler para cambio de filtro de ciudad
  const handleCityFilterChange = (value) => {
    setCityFilter(value);
    setCurrentPage(1);
  };

  // Handler para cambio de filtro de estado
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Handler para cambio de filas por página
  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Función para obtener el color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case "Activo": return "success";
      case "Inactivo": return "danger";
      case "Suspendido": return "warning";
      default: return "default";
    }
  };

  return {
    // Datos
    clientes,
    filteredData,
    paginatedData,
    loading,
    initialLoading,

    // Filtros
    search,
    cityFilter,
    statusFilter,
    ciudades,
    estados,

    // Paginación
    currentPage,
    rowsPerPage,
    totalPages,

    // Handlers
    handleSearch,
    handleCityFilterChange,
    handleStatusFilterChange,
    handleRowsPerPageChange,
    setCurrentPage,

    // Utilidades
    getStatusColor
  };
};
