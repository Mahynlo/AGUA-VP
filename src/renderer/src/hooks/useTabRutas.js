// hooks/useTabRutas.js
// Hook para manejar la lógica de la pestaña de rutas (filtros, paginación, estadísticas)

import { useState, useEffect, useMemo } from "react";
import { calcularEstadisticasRutas, generarOpcionesPeriodo } from "../utils/rutaUtils";

/**
 * Hook personalizado para manejar la lógica de TabRutas
 * @param {Array} rutas - Array de rutas desde el contexto
 * @param {Function} actualizarRutas - Función para actualizar rutas
 * @param {string} periodoActual - Periodo actual del contexto
 * @returns {Object} - Estados y funciones para TabRutas
 */
export function useTabRutas(rutas, actualizarRutas, periodoActual) {
  // Estados de UI
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [filtroPueblo, setPueblo] = useState("todos");
  const [paginaActual, setPagina] = useState(1);
  const [rutasPorPagina, setPorPag] = useState(4);
  const [periodoSel, setPeriodoSel] = useState(null);

  // Opciones de periodo (12 últimos meses)
  const opcionesPeriodo = useMemo(() => generarOpcionesPeriodo(12), []);

  // Actualizar rutas cuando cambia el periodo
  useEffect(() => {
    if (periodoSel && periodoSel !== periodoActual) {
      actualizarRutas(periodoSel);
    }
  }, [periodoSel, periodoActual, actualizarRutas]);

  // Calcular tarjetas por responsive
  useEffect(() => {
    const calcularPorPagina = () => {
      const w = window.innerWidth;
      setPorPag(w < 640 ? 2 : w < 1024 ? 4 : w < 1280 ? 6 : 8);
    };
    
    calcularPorPagina();
    window.addEventListener("resize", calcularPorPagina);
    return () => window.removeEventListener("resize", calcularPorPagina);
  }, []);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    return calcularEstadisticasRutas(rutas);
  }, [rutas]);

  // Aplicar filtros
  const rutasFiltradas = useMemo(() => {
    return rutas
      .filter(r => r.nombre.toLowerCase().includes(search.toLowerCase()))
      .filter(r => {
        if (filtro === "completas") return r.completadas >= r.total_puntos;
        if (filtro === "incompletas") return r.completadas < r.total_puntos;
        return true;
      })
      .filter(r => {
        if (filtroPueblo === "todos") return true;
        // Determinar prefijo dominante
        const freq = {};
        r.numeros_serie?.forEach(s => {
          const p = s.slice(0, 2).toLowerCase();
          freq[p] = (freq[p] || 0) + 1;
        });
        const dominante = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
        return dominante === filtroPueblo;
      });
  }, [rutas, search, filtro, filtroPueblo]);

  // Calcular paginación
  const totalPaginas = Math.ceil(rutasFiltradas.length / rutasPorPagina);
  const rutasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * rutasPorPagina;
    const fin = inicio + rutasPorPagina;
    return rutasFiltradas.slice(inicio, fin);
  }, [rutasFiltradas, paginaActual, rutasPorPagina]);

  // Funciones para actualizar filtros y resetear página
  const actualizarSearch = (valor) => {
    setSearch(valor);
    setPagina(1);
  };

  const actualizarFiltro = (valor) => {
    setFiltro(valor);
    setPagina(1);
  };

  const actualizarPueblo = (valor) => {
    setPueblo(valor);
    setPagina(1);
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
    
    // Datos
    rutasFiltradas,
    rutasPaginadas,
    estadisticas,
    opcionesPeriodo,
    
    // Utilidades
    limpiarFiltros
  };
}
