import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { obtenerPeriodoActual } from "../utils/periodoUtils";

// Crear el contexto
const PagosContext = createContext();

// Proveedor de pagos
export function PagosProvider({ children }) {
  const [pagos, setPagos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const { renovarAccessToken, user } = useAuth();

  // Agregar estado persistente de filtros
  const [filtros, setFiltros] = useState({
    periodo: obtenerPeriodoActual(),
    search: "",
    metodo_pago: "",
    page: 1,
    limit: 60
  });

  const [pagination, setPagination] = useState(null);

  // Función para obtener los pagos
  const fetchPagos = useCallback(async (params = {}) => {
    try {
      if (!initialLoading) {
        setLoading(true);
      }
      const token_session = localStorage.getItem("token");
      if (!token_session) {
        throw new Error("No se encontró token de sesión");
      }

      // Manejo robusto de parámetros: fusionar con filtros y sobreescribir con nuevos
      let finalParams = { ...filtros }; // Empezar con lo que ya teniamos

      if (typeof params === 'string') {
        // Soporte legado
        finalParams.periodo = params;
      } else if (params) {
        // Actualizar solo lo que viene nuevo
        finalParams = { ...finalParams, ...params };
      }

      // Actualizar el estado global de filtros con la nueva combinación
      // IMPORTANTE: Esto asegura persistencia para la próxima vez
      setFiltros(prev => ({ ...prev, ...finalParams }));

      // Construir query params finales para el fetch
      const queryParams = {
        periodo: finalParams.periodo,
        page: finalParams.page,
        limit: finalParams.limit,
        search: finalParams.search,
        metodo_pago: finalParams.metodo_pago
      };

      const data = await window.api.fetchPagos(token_session, queryParams);

      // Manejar la estructura de respuesta que incluye pagos, paginación y resumen
      if (data && typeof data === 'object') {
        if (data.pagos && Array.isArray(data.pagos)) {
          setPagos(data.pagos);
          setPagination(data.pagination || null);
        } else if (Array.isArray(data)) {
          setPagos(data);
          setPagination(null);
        } else {
          setPagos([]);
          setPagination(null);
        }

        if (data.resumen) {
          setResumen(data.resumen);
        }
      } else {
        setPagos([]);
        setPagination(null);
        setResumen(null);
      }

      setError(null);
    } catch (error) {
      console.error("❌ Error al obtener pagos:", error);
      setPagos([]);
      setPagination(null);
      setResumen(null);
      setError(error.message || error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [initialLoading]);

  // Cargar pagos al iniciar — gated on auth user
  useEffect(() => {
    if (user) fetchPagos();
  }, [user, fetchPagos]);

  // Actualizar cuando se restaura la conexión
  useEffect(() => {
    const handleConnectionRestored = () => {
      console.log("🔄 Reconexión detectada en PagosContext, actualizando...");
      fetchPagos();
    };

    window.addEventListener('connection-restored', handleConnectionRestored);
    return () => window.removeEventListener('connection-restored', handleConnectionRestored);
  }, [fetchPagos]);

  // Función para actualizar la lista de pagos
  const actualizarPagos = useCallback(async (periodo = null) => {
    await fetchPagos(periodo);
  }, [fetchPagos]);

  // Función para registrar un nuevo pago
  const registrarPago = useCallback(async (pagoData) => {
    try {
      setLoading(true);
      const token_session = localStorage.getItem("token");
      if (!token_session) {
        throw new Error("No se encontró token de sesión");
      }

      // Validar datos requeridos del lado del cliente (comentario es opcional)
      const requiredFields = ['factura_id', 'fecha_pago', 'cantidad_entregada', 'metodo_pago', 'modificado_por'];
      const missingFields = requiredFields.filter(field => !pagoData[field] && pagoData[field] !== 0);

      if (missingFields.length > 0) {
        throw new Error(`Campos requeridos: ${missingFields.join(', ')}`);
      }

      const result = await window.api.registerPago(pagoData, token_session);

      if (result.success) {
        // Actualizar la lista de pagos después del registro exitoso
        await actualizarPagos();
        window.dispatchEvent(new CustomEvent('dashboard-update')); // Notificar al dashboard
        return {
          success: true,
          message: result.message || "Pago registrado exitosamente"
        };
      } else {
        throw new Error(result.message || "Error al registrar el pago");
      }
    } catch (error) {
      console.error("❌ Error al registrar pago:", error);
      setError(error);
      throw error; // Re-lanzar para que el modal muestre el estado de error
    } finally {
      setLoading(false);
    }
  }, [actualizarPagos]);

  // Función para registrar un pago distribuido por cliente (FIFO)
  const registrarPagoDistribuido = useCallback(async (pagoData) => {
    try {
      setLoading(true);
      const token_session = localStorage.getItem("token");
      if (!token_session) {
        throw new Error("No se encontró token de sesión");
      }

      const requiredFields = ['cliente_id', 'fecha_pago', 'cantidad_entregada', 'metodo_pago', 'modificado_por'];
      const missingFields = requiredFields.filter(field => !pagoData[field] && pagoData[field] !== 0);

      if (missingFields.length > 0) {
        throw new Error(`Campos requeridos: ${missingFields.join(', ')}`);
      }

      const result = await window.api.registerPagoDistribuido(pagoData, token_session);

      if (result.success) {
        await actualizarPagos();
        window.dispatchEvent(new CustomEvent('dashboard-update'));
        return {
          success: true,
          message: result.message || "Pago distribuido registrado exitosamente",
          data: result.data
        };
      }

      throw new Error(result.message || "Error al registrar pago distribuido");
    } catch (error) {
      console.error("❌ Error al registrar pago distribuido:", error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [actualizarPagos]);

  // Función para obtener pagos de una factura específica
  const obtenerPagosPorFactura = useCallback((facturaId) => {
    return pagos.filter(pago => pago.factura_id === facturaId);
  }, [pagos]);

  return (
    <PagosContext.Provider value={{
      pagos,
      pagination,
      resumen,
      filtros, // Exponer filtros
      setFiltros,
      loading,
      initialLoading,
      error,
      actualizarPagos,
      registrarPago,
      registrarPagoDistribuido,
      obtenerPagosPorFactura,
      fetchPagos
    }}>
      {children}
    </PagosContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function usePagos() {
  const context = useContext(PagosContext);
  if (!context) {
    throw new Error("usePagos debe usarse dentro de un PagosProvider");
  }
  return context;
}

// Hook específico para pagos de una factura
export function usePagosFactura(facturaId) {
  const { obtenerPagosPorFactura } = usePagos();
  const [pagosFacura, setPagosFactura] = useState([]);

  useEffect(() => {
    if (facturaId) {
      const pagos = obtenerPagosPorFactura(facturaId);
      setPagosFactura(pagos);
    }
  }, [facturaId, obtenerPagosPorFactura]);

  return { pagosFacura };
}
