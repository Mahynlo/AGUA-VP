// src/context/TarifasContext.jsx
import { createContext, useState, useEffect, useContext } from "react";

// Crear el contexto
const TarifasContext = createContext();

// Proveedor de tarifas
export function TarifasProvider({ children }) {
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para obtener todas las tarifas
  async function fetchTarifas() {
    try {
      const token_session = localStorage.getItem("token");
      const data = await window.tarifasApp.fetchTarifas({token_session}); // Asegúrate de exponer esta función en preload
      setTarifas(data); // Actualiza el estado con las tarifas obtenidas
    } catch (error) {
      console.error("Error al obtener tarifas(contx):", error);

    } finally {
      setLoading(false);
    }
  }

  // Cargar tarifas al iniciar
  useEffect(() => {
    fetchTarifas();
  }, []);

  // Función para actualizar las tarifas (después de agregar o editar una)
  async function actualizarTarifas() {
    setLoading(true);
    await fetchTarifas();
  }

  // Función para filtrar por descripción o nombre
function filtrarTarifas({ descripcion = "", nombre = "" }) {
  return tarifas.filter(t =>
    (descripcion ? t.descripcion?.toLowerCase().includes(descripcion.toLowerCase()) : true) &&
    (nombre ? t.nombre?.toLowerCase().includes(nombre.toLowerCase()) : true)
  );
}


  return (
    <TarifasContext.Provider value={{
      tarifas,
      loading,
      actualizarTarifas,
      filtrarTarifas
    }}>
      {children}
    </TarifasContext.Provider>
  );
}

// Hook para acceder al contexto fácilmente
export function useTarifas() {
  return useContext(TarifasContext);
}
