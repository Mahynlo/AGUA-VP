import { createContext, useState, useEffect, useContext } from "react";

// Crear el contexto
const ClientesContext = createContext();

// Proveedor de clientes
export function ClientesProvider({ children }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para obtener los clientes
  async function fetchClientes() {
    try {
      const data = await window.api.fetchClientes();
      setClientes(data);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
    } finally {
      setLoading(false);
    }
  }

  // Cargar clientes al iniciar
  useEffect(() => {
    fetchClientes();
  }, []);

  // Función para actualizar la lista de clientes después de un registro
  async function actualizarClientes() {
    setLoading(true);
    await fetchClientes(); // Llamamos de nuevo a `fetchClientes` para actualizar la lista
  }

  return (
    <ClientesContext.Provider value={{ clientes, loading, actualizarClientes }}>
      {children}
    </ClientesContext.Provider>
  );
}

// Hook para acceder al contexto fácilmente
export function useClientes() {
  return useContext(ClientesContext);
}

