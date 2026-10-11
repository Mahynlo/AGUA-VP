import { useState, useMemo, useEffect } from "react";
import { usePagos } from "../context/PagosContext";
import { useClientes } from "../context/ClientesContext";
import { obtenerPeriodoActual } from "../utils/periodoUtils";

// Fecha local (YYYY-MM-DD) de esta computadora
const fechaLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Atajos del filtro "Fecha de cobro": devuelven [desde, hasta]. */
export const RANGOS_FECHA_COBRO = {
  hoy: { label: "Hoy", calcular: () => { const h = fechaLocal(new Date()); return [h, h]; } },
  ayer: { label: "Ayer", calcular: () => { const d = new Date(); d.setDate(d.getDate() - 1); const a = fechaLocal(d); return [a, a]; } },
  semana: { label: "Esta semana", calcular: () => { const d = new Date(); const lunes = new Date(d); lunes.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return [fechaLocal(lunes), fechaLocal(d)]; } },
  mes: { label: "Este mes", calcular: () => { const d = new Date(); return [fechaLocal(new Date(d.getFullYear(), d.getMonth(), 1)), fechaLocal(d)]; } },
  mes_anterior: { label: "Mes anterior", calcular: () => { const d = new Date(); return [fechaLocal(new Date(d.getFullYear(), d.getMonth() - 1, 1)), fechaLocal(new Date(d.getFullYear(), d.getMonth(), 0))]; } },
  personalizado: { label: "Rango de fechas…", calcular: null }
};

export const useTabPagos = () => {
  // Consumir datos y funciones del contexto
  const { pagos, pagination, loading, initialLoading, fetchPagos, resumen, actualizarPagos, filtros, cobradores } = usePagos();
  // Atajo elegido en "Fecha de cobro" (las fechas reales viven en los filtros del contexto)
  const [rangoFecha, setRangoFecha] = useState(filtros?.fecha_desde || filtros?.fecha_hasta ? "personalizado" : "All");
  const { allClientes, fetchAllClientes } = useClientes();

  // Estados locales para UI (debounce y paginación visual)
  const [search, setSearch] = useState(filtros?.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [cityFilter, setCityFilter] = useState(filtros?.ciudad || "All");

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
  // Ahora usamos filtros.periodo, filtros.metodo_pago y filtros.ciudad directamente del contexto o locales si cambiaron
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
          metodo_pago: filtros?.metodo_pago,
          ciudad: cityFilter === "All" ? "" : cityFilter
      });
  }, [debouncedSearch, filtros?.metodo_pago, filtros?.periodo, cityFilter, apiPage, fetchPagos]);

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

  // ── Fecha de cobro, cobrado por y tipo (se guardan en los filtros del contexto) ──
  const handleRangoFechaChange = (clave) => {
    setRangoFecha(clave);
    setCurrentPage(1);
    if (clave === "All") {
      fetchPagos({ fecha_desde: "", fecha_hasta: "", page: 1 });
    } else if (RANGOS_FECHA_COBRO[clave]?.calcular) {
      const [desde, hasta] = RANGOS_FECHA_COBRO[clave].calcular();
      fetchPagos({ fecha_desde: desde, fecha_hasta: hasta, page: 1 });
    }
    // "personalizado": se aplica al escribir las fechas (handleFechasChange)
  };

  const handleFechasChange = (desde, hasta) => {
    setCurrentPage(1);
    fetchPagos({ fecha_desde: desde || "", fecha_hasta: hasta || "", page: 1 });
  };

  const handleCobradoPorChange = (valor) => {
    setCurrentPage(1);
    fetchPagos({ cobrado_por: valor === "All" ? "" : valor, page: 1 });
  };

  const handleTipoChange = (valor) => {
    setCurrentPage(1);
    fetchPagos({ tipo: valor === "All" ? "" : valor, page: 1 });
  };

  const porFechaDeCobro = Boolean(filtros?.fecha_desde || filtros?.fecha_hasta);

  // Parámetros actuales completos (para exportar todos los resultados del filtro)
  const parametrosFiltro = {
    periodo: porFechaDeCobro ? "" : (filtros?.periodo || obtenerPeriodoActual()),
    search,
    metodo_pago: filtros?.metodo_pago && filtros.metodo_pago !== "All" ? filtros.metodo_pago : "",
    ciudad: cityFilter === "All" ? "" : cityFilter,
    fecha_desde: filtros?.fecha_desde || "",
    fecha_hasta: filtros?.fecha_hasta || "",
    cobrado_por: filtros?.cobrado_por || "",
    tipo: filtros?.tipo || ""
  };

  // Manejar cambio de filas por página
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleCityFilterChange = (value) => {
    setCityFilter(value);
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
      metodo_pago: filtros?.metodo_pago,
      ciudad: cityFilter === "All" ? "" : cityFilter
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
    filtroPeriodo: filtros?.periodo || obtenerPeriodoActual(),
    cityFilter,
    ciudades,
    currentPage,
    rowsPerPage,
    totalPages,
    totalItems,
    resumen,
    cobradores,
    rangoFecha,
    fechaDesde: filtros?.fecha_desde || "",
    fechaHasta: filtros?.fecha_hasta || "",
    filtroCobradoPor: filtros?.cobrado_por || "All",
    filtroTipo: filtros?.tipo || "All",
    porFechaDeCobro,
    parametrosFiltro,
    handleRangoFechaChange,
    handleFechasChange,
    handleCobradoPorChange,
    handleTipoChange,
    handleSearch,
    handleMetodoFilterChange,
    handlePeriodoChange,
    handleCityFilterChange,
    handleRowsPerPageChange,
    setCurrentPage,
    getMetodoColor,
    actualizarPagos: refreshPagos, // Sobrescribir la del contexto con la local
    setCityFilter
  };
};
