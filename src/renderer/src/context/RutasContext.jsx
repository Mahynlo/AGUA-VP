import { createContext, useState, useEffect, useContext, useCallback } from "react";

// Crear el contexto
const RutasContext = createContext();

// Utilidad para obtener el mes actual en formato YYYY-MM
function obtenerPeriodoActual() {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    return `${año}-${mes}`;
}

// Proveedor de rutas
export function RutasProvider({ children }) {
    const [rutas, setRutas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [periodoActual, setPeriodoActual] = useState(obtenerPeriodoActual());
    const [error, setError] = useState(null);


    // Función para obtener rutas desde el backend (puede recibir un período)
    const fetchRutas = useCallback(async (periodo = periodoActual) => {
        try {
            // Solo mostrar loading completo en updates, no en carga inicial
            if (!initialLoading) {
                setLoading(true);
            }
            const token_session = localStorage.getItem("token");
            if (!token_session) {
                throw new Error("No se encontró token de sesión");
            }
            const data = await window.api.listarRutas(token_session, periodo);
            setRutas(Array.isArray(data.rutas) ? data.rutas : []);
            setPeriodoActual(periodo);
            
        } catch (error) {
            console.error("❌ Error al obtener rutas:", error);
            setRutas([]);
            setError(error);
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    }, [periodoActual, initialLoading]);


    // Cargar rutas al iniciar - solo una vez
    useEffect(() => {
        fetchRutas(); // sin parámetro → usará el mes actual
    }, [fetchRutas]);

    // Función externa para actualizar rutas con período opcional
    const actualizarRutas = useCallback(async (periodo = obtenerPeriodoActual()) => {
        await fetchRutas(periodo);
    }, [fetchRutas]);

    // Función para obtener información detallada de una ruta específica
    const obtenerInfoRuta = useCallback(async (rutaId) => {
        try {
            // NO modificar el loading state global para peticiones específicas
            const token_session = localStorage.getItem("token");
            if (!token_session) {
                throw new Error("No se encontró token de sesión");
            }
            
            const data = await window.api.listarRutasInfoMedidores(token_session, rutaId);
            //console.log("Información de la ruta obtenida context:", data.ruta);
            return data.ruta;
        } catch (error) {
            console.error("❌ Error al obtener información de la ruta:", error);
            throw error;
        }
        // NO modificar loading state global aquí
    }, []);

    return (
        <RutasContext.Provider value={{ 
            rutas, 
            loading, 
            initialLoading,
            actualizarRutas, 
            obtenerInfoRuta,
            periodoActual 
        }}>
            {children}
        </RutasContext.Provider>
    );
}

// Hook para acceder fácilmente al contexto
export function useRutas() {
    return useContext(RutasContext);
}
