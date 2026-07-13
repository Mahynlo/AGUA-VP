import { useState, useMemo, useEffect } from "react";
import { useFacturas } from "../context/FacturasContext";
import { useClientes } from "../context/ClientesContext";
import { obtenerPeriodoActual } from "../utils/periodoUtils";

export const useTabFacturas = () =>{
  const { facturas, pagination, loading, initialLoading, fetchFacturas, estadisticas, actualizarFacturas } = useFacturas();
  const { allClientes, fetchAllClientes } = useClientes();

  // Estados de filtros y búsqueda
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("All");
  const [filtroPeriodo, setFiltroPeriodo] = useState(obtenerPeriodoActual());
  const [cityFilter, setCityFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Asegurar que allClientes esté cargado
  useEffect(() => {
    if ((!allClientes || allClientes.length === 0) && !loading && !initialLoading) {
      fetchAllClientes();
    }
  }, [allClientes, loading, initialLoading, fetchAllClientes]);

  // Obtener la lista de ciudades de todos los clientes en memoria
  const ciudades = useMemo(() => {
    const unique = new Set();
    (allClientes || []).forEach((c) => {
      const value = (c?.ciudad || "").trim();
      if (value) unique.add(value);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [allClientes]);
  
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
      fetchFacturas({
          periodo: filtroPeriodo,
          page: apiPage,
          limit: FETCH_LIMIT,
          search: debouncedSearch,
          estado: filtroEstado === "All" ? "" : filtroEstado,
          ciudad: cityFilter === "All" ? "" : cityFilter
      });
  }, [debouncedSearch, filtroEstado, filtroPeriodo, cityFilter, apiPage, fetchFacturas]);

  // Estados fijos para filtro
  const estados = ["Pendiente", "Pagado", "Vencido", "En Convenio"];

  // Paginación: Cortar los datos del buffer (facturas) para mostrar solo la página actual
  const paginatedData = useMemo(() => {
    // Verificar si el buffer actual corresponde a la página que queremos
    if (pagination && pagination.page !== apiPage) {
        // Estamos esperando nueva data, retornar vacío o anterior si es seguro
        return []; 
    }
    
    // Calcular índices relativos al buffer
    const startIndex = ((currentPage - 1) * rowsPerPage) % FETCH_LIMIT;
    const endIndex = startIndex + rowsPerPage;
    
    return facturas.slice(startIndex, endIndex);
  }, [facturas, currentPage, rowsPerPage, pagination, apiPage]);

  // Total de páginas REAL (basado en el total de la BD)
  const totalItems = pagination ? pagination.total : 0;
  const totalPages = pagination ? Math.ceil(pagination.total / rowsPerPage) : 1;

  // Handlers
  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleEstadoFilterChange = (value) => {
    setFiltroEstado(value);
    setCurrentPage(1);
  };

  const handlePeriodoChange = (value) => {
    setFiltroPeriodo(value);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleCityFilterChange = (value) => {
    setCityFilter(value);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pagado": return "success";
      case "pendiente": return "warning";
      case "vencido": return "danger";
      case "en convenio": return "primary";
      default: return "default";
    }
  };

  return {
    facturas, 
    filteredData: facturas,
    paginatedData,
    loading,
    initialLoading,
    search,
    filtroEstado,
    filtroPeriodo,
    cityFilter,
    ciudades,
    estados,
    currentPage,
    rowsPerPage,
    totalPages,
    totalItems,
    estadisticas,
    handleSearch,
    handleEstadoFilterChange,
    handlePeriodoChange,
    handleCityFilterChange,
    handleRowsPerPageChange,
    setCurrentPage,
    getStatusColor,
    actualizarFacturas,
    setCityFilter
  };
};
