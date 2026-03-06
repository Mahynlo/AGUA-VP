import { useState, useMemo, useEffect } from "react";
import { useMedidores } from "../context/MedidoresContext";

export const useTabMedidores = () => {
  const { medidores, loading, initialLoading, fetchMedidores, pagination } = useMedidores();

  // Estados locales para filtros y paginación UI
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState(""); // Filtro de text para ubicación
  
  // Paginación UI
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounce para búsqueda
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [debouncedLocation, setDebouncedLocation] = useState(locationFilter);

  useEffect(() => {
      const timer = setTimeout(() => {
          setDebouncedSearch(search);
          setDebouncedLocation(locationFilter);
      }, 500);
      return () => clearTimeout(timer);
  }, [search, locationFilter]);

  // Constante de buffer (Mínimo Común Múltiplo de 5, 10, 15, 20 para alineación perfecta)
  const FETCH_LIMIT = 60;

  // Calcular qué página de la API necesitamos basada en la página actual de la UI
  const apiPage = Math.ceil(((currentPage - 1) * rowsPerPage + 1) / FETCH_LIMIT);

  // Efecto principal para buscar datos
  useEffect(() => {
      fetchMedidores({
          page: apiPage,
          limit: FETCH_LIMIT,
          search: debouncedSearch,
          estado: statusFilter,
          ubicacion: debouncedLocation || 'All'
      });
  }, [debouncedSearch, statusFilter, debouncedLocation, apiPage, fetchMedidores]);

  // Lógica de Slicing (Cliente) sobre el Buffer (API)
  const paginatedData = useMemo(() => {
      // Verificar si el buffer actual corresponde a la página de API que necesitamos
      // Esto previene mostrar datos de la página anterior mientras carga la nueva
      if (pagination && pagination.page !== apiPage) {
          return []; 
      }
      
      if (!medidores.length) return [];

      const startIdx = ((currentPage - 1) * rowsPerPage) % FETCH_LIMIT;
      const endIdx = startIdx + rowsPerPage;

      // Seguridad: Asegurar que no pedimos índices fuera del array
      // (ej. si es la última página y tiene menos items)
      return medidores.slice(startIdx, Math.min(endIdx, medidores.length));

  }, [medidores, currentPage, rowsPerPage, pagination, apiPage]);

  // Total de items REAL (basado en el total de la BD)
  const totalItems = pagination ? pagination.total : 0;
  const totalPages = pagination ? Math.ceil(pagination.total / rowsPerPage) : 1;

  // Handlers
  const handleSearch = (value) => {
    setSearch(value);
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Activo": return "success";
      case "Inactivo": return "danger";
      case "Cortado": return "danger"; 
      case "Mantenimiento": return "warning";
      case "Retirado": return "default";
      default: return "default";
    }
  };

  return {
    medidores, 
    paginatedData,
    loading,
    initialLoading,
    search,
    statusFilter,
    locationFilter,
    setLocationFilter,
    currentPage,
    rowsPerPage,
    totalPages,
    totalItems,
    handleSearch,
    handleStatusFilterChange,
    handleRowsPerPageChange,
    setCurrentPage,
    getStatusColor
  };
};
