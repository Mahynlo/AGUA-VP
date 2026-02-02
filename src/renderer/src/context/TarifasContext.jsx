// src/context/TarifasContext.jsx
import { createContext, useState, useEffect, useContext, useCallback } from "react";

// Crear el contexto
const TarifasContext = createContext();

// Proveedor de tarifas
export function TarifasProvider({ children }) {
  const [tarifas, setTarifas] = useState([]);
  const [pagination, setPagination] = useState(null); // Nuevo estado
  const [loading, setLoading] = useState(true);

  // Función para obtener tarifas (con parametros opcionales)
  const fetchTarifas = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const token_session = localStorage.getItem("token");

      // Default params
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 10,
        search: params.search || '',
        ...params
      };

      const data = await window.tarifasApp.fetchTarifas({
        token_session,
        params: queryParams
      });

      if (data.tarifas) {
        setTarifas(data.tarifas);
        setPagination(data.pagination);
      } else if (Array.isArray(data)) {
        // Fallback legacy
        setTarifas(data);
        setPagination(null);
      } else {
        setTarifas([]);
        setPagination(null);
      }

    } catch (error) {
      console.error("Error al obtener tarifas(contx):", error);
      setTarifas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar tarifas al iniciar
  useEffect(() => {
    fetchTarifas();
  }, [fetchTarifas]);

  // Actualizar cuando se restaura la conexión
  useEffect(() => {
    const handleConnectionRestored = () => {
      console.log("🔄 Reconexión detectada en TarifasContext, actualizando...");
      fetchTarifas();
    };

    window.addEventListener('connection-restored', handleConnectionRestored);
    return () => window.removeEventListener('connection-restored', handleConnectionRestored);
  }, [fetchTarifas]);

  // Función para actualizar las tarifas (después de agregar o editar una)
  const actualizarTarifas = useCallback(async () => {
    await fetchTarifas();
  }, [fetchTarifas]);

  return (
    <TarifasContext.Provider value={{
      tarifas,
      pagination,
      loading,
      fetchTarifas,
      actualizarTarifas
    }}>
      {children}
    </TarifasContext.Provider>
  );
}

// Hook para acceder al contexto fácilmente
export function useTarifas() {
  return useContext(TarifasContext);
}
