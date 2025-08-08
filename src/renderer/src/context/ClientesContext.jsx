import { createContext, useState, useEffect, useContext, useCallback } from "react";

// Crear el contexto
const ClientesContext = createContext();

// Proveedor de clientes
export function ClientesProvider({ children }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener los clientes
  const fetchClientes = useCallback(async () => {
    try {
      // Solo mostrar loading completo en updates, no en carga inicial
      if (!initialLoading) {
        setLoading(true);
      }
      const token_session = localStorage.getItem("token");
      if (!token_session) {
        throw new Error("No se encontró token de sesión");
      }
      const data = await window.api.fetchClientes(token_session);
      setClientes(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error("❌ Error al obtener clientes:", error);
      setClientes([]);
      setError(error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [initialLoading]);

  // Cargar clientes al iniciar - solo una vez
  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  // Función para actualizar la lista de clientes después de un registro
  const actualizarClientes = useCallback(async () => {
    await fetchClientes();
  }, [fetchClientes]);

  return (
    <ClientesContext.Provider value={{ 
      clientes, 
      loading, 
      initialLoading,
      actualizarClientes,
      error 
    }}>
      {children}
    </ClientesContext.Provider>
  );
}

// Hook para acceder al contexto fácilmente
export function useClientes() {
  return useContext(ClientesContext);
}

