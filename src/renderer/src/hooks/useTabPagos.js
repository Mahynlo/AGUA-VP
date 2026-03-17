import { useState, useMemo, useEffect } from "react";
import { usePagos } from "../context/PagosContext";

export const useTabPagos = () => {
  // Consumir datos y funciones del contexto
  const { pagos, pagination, loading, initialLoading, fetchPagos, resumen, actualizarPagos, filtros } = usePagos();

  // Estados locales para UI (debounce y paginación visual)
  const [search, setSearch] = useState(filtros?.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  
  // Paginación visual (filas por página)
  // Nota: currentPage DEBE sincronizarse con lo que diga el contexto o resetearse
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Esto es puramente visual
  
  // Sincronizar búsqueda local con la del contexto al cargar
  useEffect(() => {
    if (filtros?.search) {
      setSearch(filtros.search);
      setDebouncedSearch(filtros.search);
    }
  }, []);

  // Debounce search
  useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(search), 500);
      return () => clearTimeout(timer);
  }, [search]);

  // Constante de buffer
  const FETCH_LIMIT = 60;
  
  // Calcular página API necesaria
  const apiPage = Math.ceil(((currentPage - 1) * rowsPerPage + 1) / FETCH_LIMIT);

  // Efecto principal: Buscar datos
  // Ahora usamos filtros.periodo y filtros.metodo_pago directamente del contexto o locales si cambiaron
  // PERO: para mantener la lógica de "controlador" aquí, llamaremos a fetchPagos con los valores deseados
  useEffect(() => {
      // Si el contexto ya tiene datos y coinciden con lo que queremos, NO hacer fetch innecesario
      // Pero por simplicidad y garantizar frescura, haremos el fetch inteligente del contexto
      
      fetchPagos({
          page: apiPage,
          limit: FETCH_LIMIT,
          search: debouncedSearch,
          // Si no hay filtro en contexto, usar defaults
          periodo: filtros?.periodo, 
          metodo_pago: filtros?.metodo_pago
      });
  }, [debouncedSearch, filtros?.metodo_pago, filtros?.periodo, apiPage, fetchPagos]);

  // Handlers
  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1); 
  };

  const handleMetodoFilterChange = (keys) => {
    const selected = Array.from(keys)[0] || ""; // "" es All
    // Actualizar contexto
    fetchPagos({ metodo_pago: selected, page: 1 });
    setCurrentPage(1);
  };

  const handlePeriodoChange = (nuevoPeriodo) => {
    if (!nuevoPeriodo) return;
    // Actualizar contexto
    fetchPagos({ periodo: nuevoPeriodo, page: 1 });
    setCurrentPage(1);
  };

  // Manejar cambio de filas por página
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Obtener color para el badge de método de pago
  const getMetodoColor = (metodo) => {
    switch (metodo) {
      case "Efectivo": return "success";
      case "Transferencia": return "primary";
      case "Tarjeta": return "secondary";
      case "Convenio": return "warning";
      default: return "default";
    }
  };

  // Lógica de Paginación Client-Side sobre el buffer
  const paginatedData = useMemo(() => {
      if (!pagos || pagos.length === 0) return [];

      // Calcular índices relativos al buffer actual
      const startIndex = ((currentPage - 1) * rowsPerPage) % FETCH_LIMIT;
      const endIndex = startIndex + rowsPerPage;

      return pagos.slice(startIndex, endIndex);
  }, [pagos, currentPage, rowsPerPage]);

  // Total de páginas calculadas desde el total real del backend
  const totalPages = pagination?.total ? Math.ceil(pagination.total / rowsPerPage) : 1;
  const totalItems = pagination?.total || 0;

  // Función para recargar manteniendo filtros actuales
  const refreshPagos = () => {
    fetchPagos({
      periodo: filtros?.periodo,
      page: apiPage,
      limit: FETCH_LIMIT,
      search: debouncedSearch,
      metodo_pago: filtros?.metodo_pago
    });
  };

  return {
    pagos, 
    paginatedData,
    loading,
    initialLoading,
    search,
    // Exponer valores del contexto para la UI
    filtroMetodo: filtros?.metodo_pago || "All", 
    filtroPeriodo: filtros?.periodo || new Date().toISOString().slice(0, 7),
    currentPage,
    rowsPerPage,
    totalPages,
    totalItems,
    resumen,
    handleSearch,
    handleMetodoFilterChange,
    handlePeriodoChange,
    handleRowsPerPageChange,
    setCurrentPage,
    getMetodoColor,
    actualizarPagos: refreshPagos // Sobrescribir la del contexto con la local
  };
};
