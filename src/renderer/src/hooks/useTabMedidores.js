import { useState, useMemo, useEffect, useCallback } from "react";
import { useMedidores } from "../context/MedidoresContext";
import { useClientes } from "../context/ClientesContext";
import { opcionesAgrupadas } from "../components/ui/FiltrosTabla";

// Filtros del inventario ("All" = sin filtro). Los valores van tal cual a la API (filtrosListado.js).
const FILTROS_INICIALES = {
  estado: "All",
  ubicacion: "All",
  asignacion: "All",
  marca: "All",
  ruta_id: "All",
  gps: "All",
  anio_instalacion: "All",
  ciudad: "All"
};
// Filtros que van en el panel "Más filtros"
const FILTROS_PANEL = ["asignacion", "marca", "ruta_id", "gps", "anio_instalacion", "ciudad"];

const ESTADOS = ["Activo", "Inactivo", "Mantenimiento", "Cortado", "Retirado"];

const contarPor = (lista, clave) => {
  const conteo = new Map();
  for (const item of lista) {
    const k = clave(item);
    conteo.set(k, (conteo.get(k) || 0) + 1);
  }
  return conteo;
};

export const useTabMedidores = () => {
  const { medidores, allMedidores, loading, initialLoading, fetchMedidores, pagination } = useMedidores();
  const { allClientes, fetchAllClientes } = useClientes();

  const [search, setSearch] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  // Paginación UI
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounce solo para la búsqueda escrita (las listas aplican al instante)
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Asegurar que allClientes esté cargado (opciones de ciudad)
  useEffect(() => {
    if ((!allClientes || allClientes.length === 0) && !loading && !initialLoading) {
      fetchAllClientes();
    }
  }, [allClientes, loading, initialLoading, fetchAllClientes]);

  // ── Opciones de cada filtro con su cantidad (a partir del inventario completo) ──
  const opciones = useMemo(() => {
    const lista = allMedidores || [];
    const estadoDe = (m) => (m.estado_servicio === "Cortado" ? "Cortado" : m.estado_medidor);
    const porEstado = contarPor(lista, (m) =>
      m.estado_servicio === "Cortado" ? "Cortado" : m.estado_medidor === "Activo" && m.estado_servicio === "Activo" ? "Activo" : estadoDe(m)
    );
    const porRuta = new Map();
    let sinRuta = 0;
    for (const m of lista) {
      if (m.ruta_id) {
        const r = porRuta.get(m.ruta_id) || { value: String(m.ruta_id), label: m.ruta_nombre || `Ruta ${m.ruta_id}`, count: 0 };
        r.count++;
        porRuta.set(m.ruta_id, r);
      } else sinRuta++;
    }
    const porAnio = contarPor(lista, (m) => (m.fecha_instalacion ? String(m.fecha_instalacion).slice(0, 4) : "sin_fecha"));
    const conGps = lista.filter((m) => m.latitud != null && m.longitud != null).length;
    const asignados = lista.filter((m) => m.cliente_id != null).length;

    const ciudades = new Set();
    (allClientes || []).forEach((c) => { const v = (c?.ciudad || "").trim(); if (v) ciudades.add(v); });

    return {
      estado: ESTADOS.map((e) => ({ value: e, label: e, count: porEstado.get(e) || 0 })),
      ubicacion: opcionesAgrupadas(lista, "ubicacion", "Sin ubicación"),
      marca: opcionesAgrupadas(lista, "marca", "Sin marca"),
      asignacion: [
        { value: "asignados", label: "Asignados a un cliente", count: asignados },
        { value: "sin_asignar", label: "Disponibles (sin cliente)", count: lista.length - asignados }
      ],
      ruta_id: [
        ...[...porRuta.values()].sort((a, b) => a.label.localeCompare(b.label, "es")),
        ...(sinRuta ? [{ value: "sin_ruta", label: "Sin ruta", count: sinRuta }] : [])
      ],
      gps: [
        { value: "con", label: "Con coordenadas", count: conGps },
        { value: "sin", label: "Sin coordenadas", count: lista.length - conGps }
      ],
      anio_instalacion: [...porAnio.entries()]
        .map(([anio, count]) => ({ value: anio, label: anio === "sin_fecha" ? "Sin fecha" : anio, count }))
        .sort((a, b) => (a.value === "sin_fecha") - (b.value === "sin_fecha") || b.value.localeCompare(a.value)),
      ciudad: Array.from(ciudades).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" })).map((c) => ({ value: c, label: c }))
    };
  }, [allMedidores, allClientes]);

  // Parámetros para la API (sin los filtros en "All")
  const parametrosFiltro = useMemo(() => {
    const p = { search: debouncedSearch };
    for (const [clave, valor] of Object.entries(filtros)) if (valor !== "All") p[clave] = valor;
    return p;
  }, [debouncedSearch, filtros]);

  // Constante de buffer (Mínimo Común Múltiplo de 5, 10, 15, 20 para alineación perfecta)
  const FETCH_LIMIT = 60;

  // Calcular qué página de la API necesitamos basada en la página actual de la UI
  const apiPage = Math.ceil(((currentPage - 1) * rowsPerPage + 1) / FETCH_LIMIT);

  useEffect(() => {
    fetchMedidores({ page: apiPage, limit: FETCH_LIMIT, ...parametrosFiltro });
  }, [parametrosFiltro, apiPage, fetchMedidores]);

  // Lógica de Slicing (Cliente) sobre el Buffer (API)
  const paginatedData = useMemo(() => {
    // Mientras llega la página de API pedida, no mostrar la anterior
    if (pagination && pagination.page !== apiPage) return [];
    if (!medidores.length) return [];
    const startIdx = ((currentPage - 1) * rowsPerPage) % FETCH_LIMIT;
    return medidores.slice(startIdx, Math.min(startIdx + rowsPerPage, medidores.length));
  }, [medidores, currentPage, rowsPerPage, pagination, apiPage]);

  // Total de items REAL (basado en el total de la BD)
  const totalItems = pagination ? pagination.total : 0;
  const totalPages = pagination ? Math.ceil(pagination.total / rowsPerPage) : 1;

  /** Todos los medidores que cumplen los filtros actuales (para exportar), no solo la página cargada. */
  const obtenerTodosFiltrados = useCallback(async () => {
    const token = localStorage.getItem("token");
    const res = await window.api.fetchMedidores(token, { ...parametrosFiltro, search: search, page: 1, limit: Math.max(totalItems, 1) });
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

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(Number(value));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setFiltros(FILTROS_INICIALES);
    setCurrentPage(1);
  };

  const filtrosPanelActivos = FILTROS_PANEL.filter((k) => filtros[k] !== "All").length;
  const hasActiveFilters = search.trim() !== "" || Object.values(filtros).some((v) => v !== "All");

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
    filtros,
    opciones,
    setFiltro,
    filtrosPanelActivos,
    currentPage,
    rowsPerPage,
    totalPages,
    totalItems,
    handleSearch,
    handleRowsPerPageChange,
    setCurrentPage,
    getStatusColor,
    clearFilters,
    hasActiveFilters,
    obtenerTodosFiltrados
  };
};
