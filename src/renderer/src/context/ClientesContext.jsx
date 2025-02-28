import { createContext, useState, useEffect, useContext } from "react";

// Crear el contexto
const ClientesContext = createContext();

// Proveedor de clientes
export function ClientesProvider({ children }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchClientes();
  }, []);

  return (
    <ClientesContext.Provider value={{ clientes, loading }}>
      {children}
    </ClientesContext.Provider>
  );
}

// Hook para acceder al contexto fácilmente
export function useClientes() {
  return useContext(ClientesContext);
}
