import { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";

// Crear el contexto
const MedidoresContext = createContext();

// Proveedor de medidores
export function MedidoresProvider({ children }) {
  const [medidores, setMedidores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener todos los medidores
  const fetchMedidores = useCallback(async () => {
    try {
      // Solo mostrar loading completo en updates, no en carga inicial
      if (!initialLoading) {
        setLoading(true);
      }
      const token_session = localStorage.getItem("token");
      if (!token_session) {
        throw new Error("No se encontró token de sesión");
      }
      const data = await window.api.fetchMedidores(token_session);
      setMedidores(Array.isArray(data) ? data : []);
      setError(null);
      //console.log("Medidores obtenidos:", data);

    } catch (error) {
      console.error("❌ Error al obtener medidores:", error);
      setMedidores([]);
      setError(error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [initialLoading]);

  // Cargar medidores al iniciar - solo una vez
  useEffect(() => {
    fetchMedidores();
  }, [fetchMedidores]);

  // Función para actualizar los medidores (después de agregar o editar uno)
  const actualizarMedidores = useCallback(async () => {
    await fetchMedidores();
  }, [fetchMedidores]);

  // Derivados: medidores asignados / no asignados - memoizados
  const medidoresAsignados = useMemo(() => 
    medidores.filter(m => m.cliente_id !== null), [medidores]
  );
  const medidoresNoAsignados = useMemo(() => 
    medidores.filter(m => m.cliente_id === null), [medidores]
  );

  // Función para filtrar por pueblo o número de serie - memoizada
  const filtrarMedidores = useCallback(({ pueblo = "", numeroSerie = "" }) => {
    return medidores.filter(m =>
      (m.ubicacion?.toLowerCase().includes(pueblo.toLowerCase()) || pueblo === "") &&
      (m.numero_serie?.toLowerCase().includes(numeroSerie.toLowerCase()) || numeroSerie === "")
    );
  }, [medidores]);

  return (
    <MedidoresContext.Provider value={{
      medidores,
      loading,
      initialLoading,
      actualizarMedidores,
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
