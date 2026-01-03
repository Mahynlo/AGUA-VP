import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useAuth } from "./AuthContext";

// Crear el contexto
const PagosContext = createContext();

// Proveedor de pagos
export function PagosProvider({ children }) {
  const [pagos, setPagos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const { renovarAccessToken } = useAuth();

  // Función para obtener los pagos
  const fetchPagos = useCallback(async (periodo = null, retryCount = 0) => {
    try {
      if (!initialLoading) {
        setLoading(true);
      }
      const token_session = localStorage.getItem("token");
      if (!token_session) {
        throw new Error("No se encontró token de sesión");
      }

      // Si no se proporciona período, usar el mes actual
      const periodoActual = periodo || new Date().toISOString().slice(0, 7);

      const data = await window.api.fetchPagos(token_session, periodoActual);

      console.log("📊 Datos recibidos del fetch de pagos:", data);

      // Manejar la estructura de respuesta que incluye pagos y resumen
      if (data && typeof data === 'object') {
        if (data.pagos && Array.isArray(data.pagos)) {
          console.log("✅ Configurando pagos desde data.pagos:", data.pagos.length);
          setPagos(data.pagos);
        } else if (Array.isArray(data)) {
          console.log("✅ Configurando pagos desde array directo:", data.length);
          setPagos(data);
        } else {
          console.log("⚠️ No se encontraron pagos en la respuesta");
          setPagos([]);
        }

        // Guardar resumen si existe
        if (data.resumen) {
          console.log("✅ Configurando resumen:", data.resumen);
          setResumen(data.resumen);
        } else {
          console.log("⚠️ No se encontró resumen en la respuesta");
        }
      } else {
        console.log("❌ Datos no válidos recibidos:", data);
        setPagos([]);
        setResumen(null);
      }

      setError(null);
    } catch (error) {
      // Plan B: Si es error 403 y no hemos reintentado, renovar token y reintentar
      if (error.message && error.message.includes("403") && retryCount === 0) {
        console.log("⚠️ Error 403 en pagos, renovando token como fallback...");
        await renovarAccessToken();
        // Esperar 500ms para asegurar que el nuevo token esté listo
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("✅ Reintentando obtener pagos con nuevo token...");
        return await fetchPagos(periodo, 1);
      }
      console.error("❌ Error al obtener pagos:", error);
      setPagos([]);
      setResumen(null);
      setError(error.message || error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [initialLoading, renovarAccessToken]);

  // Cargar pagos al iniciar
  useEffect(() => {
    fetchPagos();
  }, [fetchPagos]);

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

      // Validar datos requeridos del lado del cliente
      const requiredFields = ['factura_id', 'fecha_pago', 'cantidad_entregada', 'metodo_pago', 'comentario', 'modificado_por'];
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
      return {
        success: false,
        message: error.message || "Error al registrar el pago"
      };
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
      resumen,
      loading,
      initialLoading,
      error,
      actualizarPagos,
      registrarPago,
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
