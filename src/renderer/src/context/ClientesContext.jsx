import { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";

// =====================================================
// Context
// =====================================================
const ClientesContext = createContext();

// =====================================================
// Provider
// =====================================================
export function ClientesProvider({ children }) {
  const { user } = useAuth();

  // --------------------
  // State
  // --------------------
  const [clientes, setClientes] = useState([]);        // Buffer paginado (tabla)
  const [allClientes, setAllClientes] = useState([]);  // Dataset completo (modales + búsquedas)
  const [pagination, setPagination] = useState(null); // Nuevo estado para paginación
  const [estadisticas, setEstadisticas] = useState(null);

  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref para recordar los últimos parámetros de paginación/filtros usados
  const lastFetchParamsRef = useRef(null);

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

      // Guardar parámetros cuando vienen con datos reales (desde useTabClientes)
      if (Object.keys(params).length > 0) {
        lastFetchParamsRef.current = params;
      }

      // Parámetros por defecto si no se envían (alineado con FETCH_LIMIT=60)
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 60,
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

  // Obtener TODOS los clientes sin paginación (para modales, búsquedas cruzadas y export)
  const fetchAllClientes = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      // Llamar SIN params → API retorna array completo (modo legacy)
      const response = await window.api.fetchClientes(token);

      if (Array.isArray(response)) {
        setAllClientes(response);
      } else if (response && response.data) {
        setAllClientes(response.data);
      } else {
        setAllClientes([]);
      }
    } catch (err) {
      console.error("❌ Error al obtener todos los clientes:", err);
    }
  }, []);

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

  // Carga inicial — gated on auth user to prevent premature fetching with stale token
  useEffect(() => {
    if (user) {
      fetchClientes();
      fetchEstadisticas();
      fetchAllClientes();
    }
  }, [user, fetchClientes, fetchEstadisticas, fetchAllClientes]);

  // Reconexión global
  useEffect(() => {
    const handleConnectionRestored = () => {
      console.log("🔄 Reconexión detectada en ClientesContext");
      fetchClientes(lastFetchParamsRef.current || {});
      fetchEstadisticas();
      fetchAllClientes();
    };

    window.addEventListener("connection-restored", handleConnectionRestored);
    return () => {
      window.removeEventListener("connection-restored", handleConnectionRestored);
    };
  }, [fetchClientes, fetchEstadisticas, fetchAllClientes]);

  // =====================================================
  // API pública
  // =====================================================
  const actualizarClientes = useCallback(async () => {
    // Reutilizar los últimos parámetros de paginación/filtros para no perder la página actual
    await Promise.all([
      fetchClientes(lastFetchParamsRef.current || {}),
      fetchEstadisticas(),
      fetchAllClientes()
    ]);
    window.dispatchEvent(new CustomEvent('dashboard-update'));
  }, [fetchClientes, fetchEstadisticas, fetchAllClientes]);

  return (
    <ClientesContext.Provider
      value={{
        clientes,
        allClientes,      // Dataset completo sin paginación
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


