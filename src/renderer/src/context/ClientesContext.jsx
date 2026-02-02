import { createContext, useState, useEffect, useContext, useCallback } from "react";

// =====================================================
// Context
// =====================================================
const ClientesContext = createContext();

// =====================================================
// Provider
// =====================================================
export function ClientesProvider({ children }) {

  // --------------------
  // State
  // --------------------
  const [clientes, setClientes] = useState([]);
  const [pagination, setPagination] = useState(null); // Nuevo estado para paginación
  const [estadisticas, setEstadisticas] = useState(null);

  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // =====================================================
  // Helpers
  // =====================================================
  const getToken = () => localStorage.getItem("token");

  // =====================================================
  // Fetchers
  // =====================================================
  const fetchClientes = useCallback(async (params = {}) => {
    try {
      if (!initialLoading) setLoading(true);

      const token = getToken();
      if (!token) {
        throw new Error("No se encontró token de sesión");
      }

      // Parámetros por defecto si no se envían
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 50,
        search: params.search || '',
        ...params
      };

      const response = await window.api.fetchClientes(token, queryParams);

      // Manejar respuesta dual (Array antiguo o {data, pagination} nuevo)
      if (Array.isArray(response)) {
        setClientes(response);
        setPagination(null);
      } else if (response && response.data && Array.isArray(response.data)) {
        setClientes(response.data);
        setPagination(response.pagination);
      } else {
        setClientes([]);
        setPagination(null);
      }

      setError(null);
    } catch (err) {
      console.error("❌ Error al obtener clientes:", err);
      setClientes([]);
      setError(err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [initialLoading]);

  const fetchEstadisticas = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const data = await window.api.fetchClientesEstadisticas(token);
      setEstadisticas(data);
    } catch (err) {
      console.error("❌ Error al obtener estadísticas:", err);
    }
  }, []);

  // =====================================================
  // Effects
  // =====================================================

  // Carga inicial
  useEffect(() => {
    fetchClientes();
    fetchEstadisticas();
  }, [fetchClientes, fetchEstadisticas]);

  // Reconexión global
  useEffect(() => {
    const handleConnectionRestored = () => {
      console.log("🔄 Reconexión detectada en ClientesContext");
      fetchClientes();
      fetchEstadisticas();
    };

    window.addEventListener("connection-restored", handleConnectionRestored);
    return () => {
      window.removeEventListener("connection-restored", handleConnectionRestored);
    };
  }, [fetchClientes, fetchEstadisticas]);

  // =====================================================
  // API pública
  // =====================================================
  const actualizarClientes = useCallback(async () => {
    await fetchClientes();
    await fetchEstadisticas();
    window.dispatchEvent(new CustomEvent('dashboard-update'));
  }, [fetchClientes, fetchEstadisticas]);

  return (
    <ClientesContext.Provider
      value={{
        clientes,
        pagination, // Exportar paginación
        estadisticas,
        estadisticasServidor: estadisticas, // Alias para compatibilidad con TabMetricas
        loading,
        initialLoading,
        error,
        actualizarClientes,
        fetchClientes // Expose direct fetcher for pagination
      }}
    >
      {children}
    </ClientesContext.Provider>
  );
}

// =====================================================
// Hook
// =====================================================
export function useClientes() {
  return useContext(ClientesContext);
}


