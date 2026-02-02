import { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";

// Crear el contexto
const FacturasContext = createContext();

// Proveedor de facturas
export function FacturasProvider({ children }) {
  const [facturas, setFacturas] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState({});
  const [metadata, setMetadata] = useState({});

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    cliente_nombre: "",
    estado: "", // "Pendiente", "Pagado", "Vencido"
    ciudad: "", // Para filtrar por pueblo
    periodo: "2025-12", // Período por defecto
    mes_facturado: "", // "Agosto 2025", etc.
    fecha_inicio: "",
    fecha_fin: "",
    tarifa_id: "",
    ruta_id: ""
  });

  // Función para obtener las facturas
  const fetchFacturas = useCallback(async (params = {}) => {
    try {
      if (!initialLoading) setLoading(true);

      const token_session = localStorage.getItem("token");
      if (!token_session) {
        throw new Error("No se encontró token de sesión");
      }

      // Parámetros por defecto si no se envían
      const queryParams = {
        periodo: params.periodo || filtros.periodo || "2025-12",
        page: params.page || 1,
        limit: params.limit || 60,
        search: params.search || '',
        estado: params.estado || '',
        ...params
      };

      const response = await window.api.fetchFacturas(
        token_session,
        queryParams
      );

      // Manejar respuesta dual (Array antiguo o {facturas, pagination} nuevo)
      if (Array.isArray(response)) {
        setFacturas(response);
        setPagination(null);
      } else if (response && response.facturas && Array.isArray(response.facturas)) {
        setFacturas(response.facturas);
        setPagination(response.pagination);
        setEstadisticas(response.estadisticas || {});
        setMetadata(response.metadata || {});
      } else {
        setFacturas([]);
        setPagination(null);
      }

      setError(null);

    } catch (error) {
      console.error("Error al obtener facturas:", error);
      setFacturas([]);
      setEstadisticas({});
      setMetadata({});
      setError(error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [initialLoading, filtros.periodo]);

  // Cargar facturas al iniciar
  useEffect(() => {
    if (initialLoading) {
      fetchFacturas(filtros);
    }
  }, []); // Solo se ejecuta una vez al montar el componente

  // Actualizar cuando se restaura la conexión
  useEffect(() => {
    const handleConnectionRestored = () => {
      console.log("🔄 Reconexión detectada en FacturasContext, actualizando...");
      fetchFacturas({ ...filtros, force: true });
    };

    window.addEventListener('connection-restored', handleConnectionRestored);
    return () => window.removeEventListener('connection-restored', handleConnectionRestored);
  }, [filtros, fetchFacturas]);

  // Función para actualizar filtros y recargar datos
  const aplicarFiltros = useCallback(async (nuevosFiltros) => {
    const filtrosActualizados = { ...filtros, ...nuevosFiltros };
    setFiltros(filtrosActualizados);
    await fetchFacturas(filtrosActualizados);
  }, [filtros]);

  // Función para limpiar todos los filtros
  const limpiarFiltros = useCallback(async () => {
    const filtrosVacios = {
      cliente_nombre: "",
      estado: "",
      ciudad: "",
      periodo: "",
      mes_facturado: "",
      fecha_inicio: "",
      fecha_fin: "",
      tarifa_id: "",
      ruta_id: ""
    };
    setFiltros(filtrosVacios);
    await fetchFacturas(filtrosVacios);
  }, []);

  // Función para actualizar facturas después de cambios
  const actualizarFacturas = useCallback(async () => {
    await fetchFacturas({ ...filtros, force: true });
  }, [filtros]);

  // Funciones de filtrado específicas
  const filtrarPorCliente = useCallback(async (nombreCliente) => {
    await aplicarFiltros({ cliente_nombre: nombreCliente });
  }, [aplicarFiltros]);

  const filtrarPorEstado = useCallback(async (estado) => {
    await aplicarFiltros({ estado });
  }, [aplicarFiltros]);

  const filtrarPorPueblo = useCallback(async (ciudad) => {
    await aplicarFiltros({ ciudad });
  }, [aplicarFiltros]);

  const filtrarPorPeriodo = useCallback(async (periodo, mes_facturado = "") => {
    await aplicarFiltros({ periodo, mes_facturado });
  }, [aplicarFiltros]);

  const filtrarPorFechas = useCallback(async (fecha_inicio, fecha_fin) => {
    await aplicarFiltros({ fecha_inicio, fecha_fin });
  }, [aplicarFiltros]);

  // Filtros computados para obtener datos específicos
  const facturasComputadas = useMemo(() => {
    return {
      // Facturas que adeudan (saldo pendiente > 0)
      facturasPendientes: facturas.filter(f =>
        f.saldo_pendiente > 0 && f.estado !== "Pagado"
      ),

      // Facturas pagadas
      facturasPagadas: facturas.filter(f =>
        f.estado === "Pagado" || f.saldo_pendiente === 0
      ),

      // Facturas vencidas (fecha_vencimiento < hoy y saldo > 0)
      facturasVencidas: facturas.filter(f => {
        const hoy = new Date();
        const fechaVencimiento = new Date(f.fecha_vencimiento);
        return fechaVencimiento < hoy && f.saldo_pendiente > 0;
      }),

      // Facturas por pueblo
      facturasPorPueblo: facturas.reduce((acc, factura) => {
        const ciudad = factura.cliente_nombre; // Necesitaríamos el campo ciudad del cliente
        acc[ciudad] = (acc[ciudad] || 0) + 1;
        return acc;
      }, {}),

      // Facturas por periodo
      facturasPorPeriodo: facturas.reduce((acc, factura) => {
        const periodo = factura.periodo;
        acc[periodo] = (acc[periodo] || 0) + 1;
        return acc;
      }, {}),

      // Resumen de montos
      resumen: {
        totalFacturado: facturas.reduce((sum, f) => sum + (f.total || 0), 0),
        totalPendiente: facturas.reduce((sum, f) => sum + (f.saldo_pendiente || 0), 0),
        totalPagado: facturas.reduce((sum, f) => sum + ((f.total || 0) - (f.saldo_pendiente || 0)), 0),
        promedioConsumo: facturas.length > 0
          ? facturas.reduce((sum, f) => sum + (f.consumo_m3 || 0), 0) / facturas.length
          : 0
      }
    };
  }, [facturas]);

  // Función para buscar facturas de un cliente específico
  const buscarFacturasCliente = useCallback((clienteId) => {
    return facturas.filter(f => f.cliente_id === clienteId);
  }, [facturas]);

  // Función para obtener estadísticas específicas
  const obtenerEstadisticas = useCallback(() => {
    return {
      ...estadisticas,
      ...facturasComputadas.resumen,
      facturas_vencidas: facturasComputadas.facturasVencidas.length,
      facturas_pagadas: facturasComputadas.facturasPagadas.length
    };
  }, [estadisticas, facturasComputadas]);

  const contextValue = {
    // Datos principales
    facturas,
    pagination,
    loading,
    initialLoading,
    error,
    estadisticas,
    metadata,

    // Filtros
    filtros,
    setFiltros,
    aplicarFiltros,
    limpiarFiltros,

    // Funciones de filtrado específicas
    filtrarPorCliente,
    filtrarPorEstado,
    filtrarPorPueblo,
    filtrarPorPeriodo,
    filtrarPorFechas,

    // Datos computados
    facturasComputadas,
    buscarFacturasCliente,
    obtenerEstadisticas,

    // Funciones de actualización
    actualizarFacturas,
    fetchFacturas
  };

  return (
    <FacturasContext.Provider value={contextValue}>
      {children}
    </FacturasContext.Provider>
  );
}

// Hook para acceder al contexto fácilmente
export function useFacturas() {
  const context = useContext(FacturasContext);
  if (!context) {
    throw new Error("useFacturas debe ser usado dentro de un FacturasProvider");
  }
  return context;
}

// Hook para obtener facturas de un cliente específico
export function useFacturasCliente(clienteId) {
  const { buscarFacturasCliente } = useFacturas();
  return useMemo(() => buscarFacturasCliente(clienteId), [buscarFacturasCliente, clienteId]);
}

// Hook para obtener estadísticas
export function useEstadisticasFacturas() {
  const { obtenerEstadisticas } = useFacturas();
  return useMemo(() => obtenerEstadisticas(), [obtenerEstadisticas]);
}
