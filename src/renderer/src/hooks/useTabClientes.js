import { useState, useMemo, useEffect } from "react";
import { useClientes } from "../context/ClientesContext";

export const useTabClientes = () => {
  const { clientes, pagination, loading, initialLoading, fetchClientes, estadisticas } = useClientes();

  // Estados de filtros y búsqueda
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  
  useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(search), 500);
      return () => clearTimeout(timer);
  }, [search]);

  // Constante de buffer (Mínimo Común Múltiplo de 5, 10, 15, 20 para alineación perfecta)
  const FETCH_LIMIT = 60;

  // Calcular qué página de la API necesitamos basada en la página actual de la UI
  const apiPage = Math.ceil(((currentPage - 1) * rowsPerPage + 1) / FETCH_LIMIT);

  // Effect: Buscar datos cuando cambian los filtros o la página API requerida
  useEffect(() => {
      fetchClientes({
          page: apiPage,
          limit: FETCH_LIMIT,
          search: debouncedSearch,
          ciudad: cityFilter === "All" ? "" : cityFilter,
          estado: statusFilter === "All" ? "" : statusFilter
      });
    }, [debouncedSearch, cityFilter, statusFilter, apiPage, fetchClientes]); // rowsPerPage no está porque solo afecta apiPage

  // Obtener listas únicas para filtros
  const ciudades = useMemo(() => {
    if (estadisticas?.distribucion?.por_ciudad) {
        return estadisticas.distribucion.por_ciudad.map(c => c.ciudad);
    }
    return [];
  }, [estadisticas]);

  const estados = ["Activo", "Inactivo", "Suspendido"];

  // Paginación: Cortar los datos del buffer (clientes) para mostrar solo la página actual
  const paginatedData = useMemo(() => {
    // Verificar si el buffer actual corresponde a la página que queremos
    if (pagination && pagination.page !== apiPage) {
        // Estamos esperando nueva data, retornar vacío o anterior si es seguro
        return []; 
    }
    
    // Calcular índices relativos al buffer
    const startIndex = ((currentPage - 1) * rowsPerPage) % FETCH_LIMIT;
    const endIndex = startIndex + rowsPerPage;
    
    return clientes.slice(startIndex, endIndex);
  }, [clientes, currentPage, rowsPerPage, pagination, apiPage]);

  // Total de páginas REAL (basado en el total de la BD)
  const totalItems = pagination ? pagination.total : 0;
  const totalPages = pagination ? Math.ceil(pagination.total / rowsPerPage) : 1;

  // Handlers
  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCityFilterChange = (value) => {
    setCityFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(Number(value));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setCityFilter("All");
    setStatusFilter("All");
    setCurrentPage(1);
  };

  const hasActiveFilters = search.trim() !== "" || cityFilter !== "All" || statusFilter !== "All";

  const getStatusColor = (status) => {
    switch (status) {
      case "Activo": return "success";
      case "Inactivo": return "danger";
      case "Suspendido": return "warning";
      default: return "default";
    }
  };

  return {
    clientes, 
    filteredData: clientes, 
    paginatedData,
    loading,
    initialLoading,
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
    clearFilters,
    hasActiveFilters,
    setCurrentPage,
    getStatusColor
  };
};
