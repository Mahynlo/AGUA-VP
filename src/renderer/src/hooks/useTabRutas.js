// hooks/useTabRutas.js
// Hook para manejar la lógica de la pestaña de rutas (filtros, paginación, estadísticas)

import { useState, useEffect, useMemo } from "react";
import { calcularEstadisticasRutas, generarOpcionesPeriodo } from "../utils/rutaUtils";
import { useRutas } from "../context/RutasContext";

/**
 * Hook personalizado para manejar la lógica de TabRutas
 * @param {Array} rutas - Array de rutas desde el contexto
 * @param {Function} actualizarRutas - Función para actualizar rutas
 * @param {string} periodoActual - Periodo actual del contexto
 * @returns {Object} - Estados y funciones para TabRutas
 */
export function useTabRutas(rutas, actualizarRutas, periodoActual) {
  const { pagination, loading, initialLoading, fetchRutas } = useRutas(); // Usar fetchRutas del context

  // Estados de UI
  const [search, setSearch] = useState("");
  // Nota: Filtros de estado y pueblo requieren backend más complejo. 
  // Por ahora mantenemos paginación server-side simple con búsqueda.
  const [filtro, setFiltro] = useState("todos"); 
  const [filtroPueblo, setPueblo] = useState("todos");
  
  const [paginaActual, setPagina] = useState(1);
  const [rutasPorPagina, setPorPag] = useState(10); // Default solicitado 10
  const [periodoSel, setPeriodoSel] = useState(null);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
     const timer = setTimeout(() => setDebouncedSearch(search), 500);
     return () => clearTimeout(timer);
  }, [search]);

  // Opciones de periodo (12 últimos meses)
  const opcionesPeriodo = useMemo(() => generarOpcionesPeriodo(12), []);
  
  // Effect: Actualizar datos al cambiar filtros o página
  useEffect(() => {
    // Si viene del props (legacy) ignoramos, usamos el del context
    // Llamar al fetch con params
    fetchRutas({
        page: paginaActual,
        limit: rutasPorPagina,
        search: debouncedSearch,
        periodo: periodoSel || periodoActual
    });
  }, [paginaActual, rutasPorPagina, debouncedSearch, periodoSel, periodoActual /*, filtro, filtroPueblo*/]);

  // Calcular estadísticas (Nota: con paginación server-side, esto solo calcula sobre la página visible
  // Si se requieren estadísticas globales, se debería usar otro endpoint o el objeto pagination)
  const estadisticas = useMemo(() => {
    return calcularEstadisticasRutas(rutas);
  }, [rutas]);

  // Rutas ya vienen paginadas del server
  const rutasPaginadas = rutas; 
  const totalPaginas = pagination ? pagination.totalPages : 1;
  const totalItems = pagination ? pagination.total : 0;

  // Funciones para actualizar filtros y resetear página
  const actualizarSearch = (valor) => {
    setSearch(valor);
    setPagina(1);
  };

  const actualizarFiltro = (valor) => {
    setFiltro(valor);
    setPagina(1);
    // TODO: Implementar filtro server-side
  };

  const actualizarPueblo = (valor) => {
    setPueblo(valor);
    setPagina(1);
    // TODO: Implementar filtro server-side
  };

  const actualizarPeriodo = (valor) => {
    setPeriodoSel(valor);
    setPagina(1);
  };

  const limpiarFiltros = () => {
    setSearch("");
    setFiltro("todos");
    setPueblo("todos");
    setPagina(1);
    setPeriodoSel(null);
  };

  return {
    // Filtros
    search,
    setSearch: actualizarSearch,
    filtro,
    setFiltro: actualizarFiltro,
    filtroPueblo,
    setPueblo: actualizarPueblo,
    periodoSel,
    setPeriodoSel: actualizarPeriodo,
    
    // Paginación
    paginaActual,
    setPagina,
    rutasPorPagina,
    totalPaginas,
    totalItems,
    
    // Datos
    rutasFiltradas: rutasPaginadas, // Compatibilidad
    rutasPaginadas,
    estadisticas,
    opcionesPeriodo,
    
    // Utilidades
    limpiarFiltros
  };
}
