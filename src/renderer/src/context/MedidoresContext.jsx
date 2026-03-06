import { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from "react";
import { useAuth } from "./AuthContext";

// Crear el contexto
const MedidoresContext = createContext();

// Proveedor de medidores
export function MedidoresProvider({ children }) {
  const { user } = useAuth();
  const [medidores, setMedidores] = useState([]);       // Buffer paginado (tabla)
  const [allMedidores, setAllMedidores] = useState([]);  // Dataset completo (mapa + stats)
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState(null);
  const lastFetchParamsRef = useRef(null);

  // Función para obtener TODOS los medidores (sin paginación — para mapa y estadísticas)
  const fetchAllMedidores = useCallback(async () => {
    try {
      const token_session = localStorage.getItem("token");
      if (!token_session) return;

      // Llamar SIN params → API retorna array completo (modo legacy)
      const response = await window.api.fetchMedidores(token_session);

      if (Array.isArray(response)) {
        setAllMedidores(response);
      } else if (response && response.data) {
        setAllMedidores(response.data);
      } else {
        setAllMedidores([]);
      }
    } catch (error) {
      console.error("❌ Error al obtener todos los medidores:", error);
    }
  }, []);

  // Función para obtener medidores paginados (para tabla de inventario)
  const fetchMedidores = useCallback(async (params = {}) => {
    try {
      // Solo mostrar loading completo en updates o primera carga
      if (!initialLoading) {
        setLoading(true);
      }
      const token_session = localStorage.getItem("token");
      if (!token_session) {
        throw new Error("No se encontró token de sesión");
      }

      // Guardar params para reutilizar en actualizarMedidores
      if (Object.keys(params).length > 0) {
        lastFetchParamsRef.current = params;
      }

      // Parámetros por defecto para asegurar respuesta paginada
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 60, // Buffer default
        search: params.search || '',
        ...params
      };

      const response = await window.api.fetchMedidores(token_session, queryParams);

      if (response && response.data && response.pagination) {
        // Nueva estructura paginada
        setMedidores(response.data);
        setPagination(response.pagination);
      } else if (Array.isArray(response)) {
        // Fallback legacy
        setMedidores(response);
        setPagination(null);
      } else {
        setMedidores([]);
      }

      setError(null);

    } catch (error) {
      console.error("❌ Error al obtener medidores:", error);
      setMedidores([]);
      setError(error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [initialLoading]);

  // Cargar medidores al iniciar — gated on auth user
  useEffect(() => {
    if (user) {
      fetchMedidores();
      fetchAllMedidores();
    }
  }, [user, fetchMedidores, fetchAllMedidores]);

  // Actualizar cuando se restaura la conexión
  useEffect(() => {
    const handleConnectionRestored = () => {
      console.log("🔄 Reconexión detectada en MedidoresContext, actualizando...");
      const savedParams = lastFetchParamsRef.current || {};
      fetchMedidores(savedParams);
      fetchAllMedidores();
    };

    window.addEventListener('connection-restored', handleConnectionRestored);
    return () => window.removeEventListener('connection-restored', handleConnectionRestored);
  }, [fetchMedidores, fetchAllMedidores]);

  // Función para actualizar los medidores (después de agregar o editar uno)
  const actualizarMedidores = useCallback(async () => {
    const savedParams = lastFetchParamsRef.current || {};
    await Promise.all([
      fetchMedidores(savedParams),
      fetchAllMedidores()
    ]);
    window.dispatchEvent(new CustomEvent('dashboard-update'));
  }, [fetchMedidores, fetchAllMedidores]);

  // Derivados: medidores asignados / no asignados — basados en allMedidores (totales reales)
  const medidoresAsignados = useMemo(() =>
    allMedidores.filter(m => m.cliente_id !== null), [allMedidores]
  );
  const medidoresNoAsignados = useMemo(() =>
    allMedidores.filter(m => m.cliente_id === null), [allMedidores]
  );

  // Función para filtrar por pueblo o número de serie — basada en allMedidores
  const filtrarMedidores = useCallback(({ pueblo = "", numeroSerie = "" }) => {
    return allMedidores.filter(m =>
      (m.ubicacion?.toLowerCase().includes(pueblo.toLowerCase()) || pueblo === "") &&
      (m.numero_serie?.toLowerCase().includes(numeroSerie.toLowerCase()) || numeroSerie === "")
    );
  }, [allMedidores]);

  return (
    <MedidoresContext.Provider value={{
      medidores,
      allMedidores,
      loading,
      initialLoading,
      actualizarMedidores,
      fetchMedidores, // Exponer para control manual
      pagination,
      medidoresAsignados,
      medidoresNoAsignados,
      filtrarMedidores,
      error
    }}>
      {children}
    </MedidoresContext.Provider>
  );
}

// Hook para acceder al contexto fácilmente
export function useMedidores() {
  return useContext(MedidoresContext);
}
