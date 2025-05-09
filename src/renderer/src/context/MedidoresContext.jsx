import { createContext, useState, useEffect, useContext } from "react";

// Crear el contexto
const MedidoresContext = createContext();

// Proveedor de medidores
export function MedidoresProvider({ children }) {
  const [medidores, setMedidores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para obtener todos los medidores
  async function fetchMedidores() {
    try {
      const data = await window.api.fetchMedidores(); // Asume que tienes expuesta la API en preload
      setMedidores(data);
      //console.log("Medidores obtenidos:", data);

    } catch (error) {
      console.error("Error al obtener medidores:", error);
    } finally {
      setLoading(false);
    }
  }

  // Cargar medidores al iniciar
  useEffect(() => {
    fetchMedidores();
  }, []);

  // Función para actualizar los medidores (después de agregar o editar uno)
  async function actualizarMedidores() {
    setLoading(true);
    await fetchMedidores();
  }

  // Derivados: medidores asignados / no asignados
  const medidoresAsignados = medidores.filter(m => m.cliente_id !== null);
  const medidoresNoAsignados = medidores.filter(m => m.cliente_id === null);

  // Función para filtrar por pueblo o número de serie
  function filtrarMedidores({ pueblo = "", numeroSerie = "" }) {
    return medidores.filter(m =>
      (m.ubicacion?.toLowerCase().includes(pueblo.toLowerCase()) || pueblo === "") &&
      (m.numero_serie?.toLowerCase().includes(numeroSerie.toLowerCase()) || numeroSerie === "")
    );
  }

  return (
    <MedidoresContext.Provider value={{
      medidores,
      loading,
      actualizarMedidores,
      medidoresAsignados,
      medidoresNoAsignados,
      filtrarMedidores
    }}>
      {children}
    </MedidoresContext.Provider>
  );
}

// Hook para acceder al contexto fácilmente
export function useMedidores() {
  return useContext(MedidoresContext);
}
