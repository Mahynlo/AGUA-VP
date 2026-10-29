import { useState, useMemo, useEffect, useCallback } from "react";
import { useClientes } from "../context/ClientesContext";
import { useMedidores } from "../context/MedidoresContext";
import { useTarifas } from "../context/TarifasContext";

// Filtros de la tabla ("All" = sin filtro). Los valores van tal cual a la API (filtrosListado.js).
const FILTROS_INICIALES = {
  pago: "All",
  estado: "All",
  tarifa_id: "All",
  medidor: "All",
  ruta_id: "All",
  ciudad: "All"
};
// Filtros que van en el panel "Más filtros"
const FILTROS_PANEL = ["tarifa_id", "medidor", "ruta_id", "ciudad"];
const ORDEN_INICIAL = "numero_predio";

const ESTADOS = ["Activo", "Inactivo", "Suspendido"];

export const useTabClientes = () => {
  const { clientes, pagination, loading, initialLoading, fetchClientes, estadisticas, allClientes, fetchAllClientes, fetchEstadisticas } = useClientes();
  const { allMedidores } = useMedidores();
  const { tarifas } = useTarifas();

  const [search, setSearch] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [orderBy, setOrderBy] = useState(ORDEN_INICIAL);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounce solo para la búsqueda escrita (las listas aplican al instante)
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Asegurar que las estadísticas y todos los clientes estén cargados
  useEffect(() => {
    if (!estadisticas && !loading && !initialLoading) {
      fetchEstadisticas();
    }
    if ((!allClientes || allClientes.length === 0) && !loading && !initialLoading) {
      fetchAllClientes();
    }
  }, [estadisticas, allClientes, loading, initialLoading, fetchEstadisticas, fetchAllClientes]);

  // ── Opciones de cada filtro con su cantidad (a partir de los datos completos) ──
  const opciones = useMemo(() => {
    const lista = allClientes || [];
    const contar = (fn) => lista.filter(fn).length;

    // Ciudades (con respaldo en las estadísticas si la lista completa aún no carga)
    const ciudades = new Map();
    lista.forEach((c) => { const v = (c?.ciudad || "").trim(); if (v) ciudades.set(v, (ciudades.get(v) || 0) + 1); });
    if (ciudades.size === 0) {
      (estadisticas?.distribucion?.por_ciudad || []).forEach((c) => { if (c.ciudad) ciudades.set(c.ciudad.trim(), null); });
    }

    // Medidores activos por cliente y clientes por ruta
    const clientesConMedidor = new Set();
    const clientesEnRuta = new Set();
    const porRuta = new Map();
    for (const m of allMedidores || []) {
      if (m.cliente_id == null) continue;
      clientesConMedidor.add(m.cliente_id);
      if (m.ruta_id) {
        clientesEnRuta.add(m.cliente_id);
        const r = porRuta.get(m.ruta_id) || { value: String(m.ruta_id), label: m.ruta_nombre || `Ruta ${m.ruta_id}`, clientes: new Set() };
        r.clientes.add(m.cliente_id);
        porRuta.set(m.ruta_id, r);
      }
    }
    const sinRuta = contar((c) => !clientesEnRuta.has(c.id));
    const sinTarifa = contar((c) => c.tarifa_id == null);

    return {
      pago: [
        { value: "al_corriente", label: "Al corriente", count: contar((c) => !(c.adeudo_total > 0)) },
        { value: "con_saldo", label: "Con saldo pendiente", count: contar((c) => c.adeudo_total > 0) },
        { value: "vencidas_1", label: "1 o más facturas vencidas", count: contar((c) => c.facturas_vencidas >= 1) },
        { value: "vencidas_2", label: "2 o más facturas vencidas", count: contar((c) => c.facturas_vencidas >= 2) },
        { value: "vencidas_3", label: "3 o más facturas vencidas", count: contar((c) => c.facturas_vencidas >= 3) }
      ],
      estado: ESTADOS.map((e) => ({ value: e, label: e, count: contar((c) => c.estado_cliente === e) })),
      tarifa_id: [
        ...(tarifas || []).map((t) => ({ value: String(t.id), label: t.nombre, count: contar((c) => c.tarifa_id === t.id) })),
        ...(sinTarifa ? [{ value: "sin_tarifa", label: "Sin tarifa", count: sinTarifa }] : [])
      ],
      medidor: [
        { value: "con", label: "Con medidor", count: contar((c) => clientesConMedidor.has(c.id)) },
        { value: "sin", label: "Sin medidor", count: contar((c) => !clientesConMedidor.has(c.id)) }
      ],
      ruta_id: [
        ...[...porRuta.values()]
          .map((r) => ({ value: r.value, label: r.label, count: r.clientes.size }))
          .sort((a, b) => a.label.localeCompare(b.label, "es")),
        ...(sinRuta ? [{ value: "sin_ruta", label: "Sin ruta", count: sinRuta }] : [])
      ],
      ciudad: [...ciudades.entries()]
        .sort((a, b) => a[0].localeCompare(b[0], "es", { sensitivity: "base" }))
        .map(([c, count]) => ({ value: c, label: c, count }))
    };
  }, [allClientes, allMedidores, tarifas, estadisticas]);

  // Parámetros para la API (sin los filtros en "All")
  const parametrosFiltro = useMemo(() => {
    const p = { search: debouncedSearch, orderBy };
    for (const [clave, valor] of Object.entries(filtros)) if (valor !== "All") p[clave] = valor;
    return p;
  }, [debouncedSearch, filtros, orderBy]);

  // Constante de buffer (Mínimo Común Múltiplo de 5, 10, 15, 20 para alineación perfecta)
  const FETCH_LIMIT = 60;

  // Calcular qué página de la API necesitamos basada en la página actual de la UI
  const apiPage = Math.ceil(((currentPage - 1) * rowsPerPage + 1) / FETCH_LIMIT);

  useEffect(() => {
    fetchClientes({ page: apiPage, limit: FETCH_LIMIT, ...parametrosFiltro });
  }, [parametrosFiltro, apiPage, fetchClientes]); // rowsPerPage no está porque solo afecta apiPage

  // Paginación: Cortar los datos del buffer (clientes) para mostrar solo la página actual
  const paginatedData = useMemo(() => {
    // Mientras llega la página de API pedida, no mostrar la anterior
    if (pagination && pagination.page !== apiPage) return [];
    const startIndex = ((currentPage - 1) * rowsPerPage) % FETCH_LIMIT;
    return clientes.slice(startIndex, startIndex + rowsPerPage);
  }, [clientes, currentPage, rowsPerPage, pagination, apiPage]);

  // Total de páginas REAL (basado en el total de la BD)
  const totalItems = pagination ? pagination.total : 0;
  const totalPages = pagination ? Math.ceil(pagination.total / rowsPerPage) : 1;

  /** Todos los clientes que cumplen los filtros actuales (para exportar), no solo la página cargada. */
  const obtenerTodosFiltrados = useCallback(async () => {
    const token = localStorage.getItem("token");
    const res = await window.api.fetchClientes(token, { ...parametrosFiltro, search, page: 1, limit: Math.max(totalItems, 1) });
    return Array.isArray(res) ? res : res?.data || [];
  }, [parametrosFiltro, search, totalItems]);

  // Handlers
  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const setFiltro = (clave, valor) => {
    setFiltros((prev) => ({ ...prev, [clave]: valor || "All" }));
    setCurrentPage(1);
  };

  const handleOrderByChange = (value) => {
    setOrderBy(value);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(Number(value));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setFiltros(FILTROS_INICIALES);
    setOrderBy(ORDEN_INICIAL);
    setCurrentPage(1);
  };

  const filtrosPanelActivos = FILTROS_PANEL.filter((k) => filtros[k] !== "All").length;
  const hasActiveFilters = search.trim() !== "" || Object.values(filtros).some((v) => v !== "All");

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
    paginatedData,
    loading,
    initialLoading,
    search,
    filtros,
    opciones,
    setFiltro,
    filtrosPanelActivos,
    orderBy,
    currentPage,
    rowsPerPage,
    totalPages,
    totalItems,
    handleSearch,
    handleOrderByChange,
    handleRowsPerPageChange,
    clearFilters,
    hasActiveFilters,
    setCurrentPage,
    getStatusColor,
    obtenerTodosFiltrados
  };
};
