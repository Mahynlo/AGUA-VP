import { createContext, useState, useEffect, useContext } from "react";

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
    const [periodoActual, setPeriodoActual] = useState(obtenerPeriodoActual());
    const [error, setError] = useState(null);


    // Función para obtener rutas desde el backend (puede recibir un período)
    async function fetchRutas(periodo = periodoActual) {
        try {
            setLoading(true);
            const token_session = localStorage.getItem("token");
            if (!token_session) {
                throw new Error("No se encontró token de sesión");
            }
            const data = await window.api.listarRutas(token_session, periodo);
            setRutas(Array.isArray(data.rutas) ? data.rutas : []);
            setPeriodoActual(periodo);
            
            console.log("Error al obtener rutas:", error);
        } catch (error) {
            console.error("❌ Error al obtener rutas:", error);
            setRutas([]);
        } finally {
            setLoading(false);
        }
    }


    // Cargar rutas al iniciar
    useEffect(() => {
        fetchRutas(); // sin parámetro → usará el mes actual
    }, []);

    // Función externa para actualizar rutas con período opcional
    async function actualizarRutas(periodo = obtenerPeriodoActual()) {
        await fetchRutas(periodo);
    }

    return (
        <RutasContext.Provider value={{ rutas, loading, actualizarRutas, periodoActual }}>
            {children}
        </RutasContext.Provider>
    );
}

// Hook para acceder fácilmente al contexto
export function useRutas() {
    return useContext(RutasContext);
}
