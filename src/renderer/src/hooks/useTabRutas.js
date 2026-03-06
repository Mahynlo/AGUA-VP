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
  const { pagination, loading, initialLoading, fetchRutas } = useRutas();

  // Estados de UI
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos"); 
  const [filtroPueblo, setPueblo] = useState("todos");
  
  const [paginaActual, setPagina] = useState(1);
  const [rutasPorPagina, setPorPag] = useState(10);
  const [periodoSel, setPeriodoSel] = useState(null);

  // Contador que se incrementa cuando una ruta es creada/editada
  const [refreshToken, setRefreshToken] = useState(0);

  // Escuchar evento global emitido tras guardar/actualizar ruta
  useEffect(() => {
    const handler = () => setRefreshToken(t => t + 1);
    window.addEventListener("rutas-changed", handler);
    return () => window.removeEventListener("rutas-changed", handler);
  }, []);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
     const timer = setTimeout(() => setDebouncedSearch(search), 500);
     return () => clearTimeout(timer);
  }, [search]);

  const opcionesPeriodo = useMemo(() => generarOpcionesPeriodo(12), []);
  
  // Effect: Actualizar datos al cambiar filtros, página o refreshToken
  useEffect(() => {
    fetchRutas({
        page: paginaActual,
        limit: rutasPorPagina,
        search: debouncedSearch,
        periodo: periodoSel || periodoActual
    });
  }, [paginaActual, rutasPorPagina, debouncedSearch, periodoSel, periodoActual, refreshToken]);

  // Estadisticas: totalRutas viene del servidor (pagination.total) para reflejar
  // el total real de rutas, no solo las de la página actual
  const estadisticas = useMemo(() => {
    const stats = calcularEstadisticasRutas(rutas);
    return {
      ...stats,
      totalRutas: pagination?.total ?? stats.totalRutas
    };
  }, [rutas, pagination]);

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
