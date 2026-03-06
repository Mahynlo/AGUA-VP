import { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";

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
    const { user } = useAuth();
    const [rutas, setRutas] = useState([]);
    const [pagination, setPagination] = useState(null); // Nuevo estado
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [periodoActual, setPeriodoActual] = useState(obtenerPeriodoActual());
    const [error, setError] = useState(null);
    // Ref para detectar la carga inicial sin incluirla como dep de fetchRutas
    // (evita la doble carga que ocurría cuando initialLoading cambiaba de true a false
    // y regeneraba la referencia de fetchRutas, re-disparando el useEffect de inicio)
    const isFirstLoadRef = useRef(true);


    // Función para obtener rutas desde el backend (puede recibir un período o params)
    const fetchRutas = useCallback(async (paramsOrPeriodo = periodoActual) => {
        try {
            // Solo mostrar loading completo en updates, no en carga inicial
            if (!isFirstLoadRef.current) {
                setLoading(true);
            }
            const token_session = localStorage.getItem("token");
            if (!token_session) {
                throw new Error("No se encontró token de sesión");
            }

            // Determinar params
            let params = {};
            if (typeof paramsOrPeriodo === 'string') {
                params = { periodo: paramsOrPeriodo, limit: 10, page: 1 }; // Default legacy
            } else {
                params = {
                    periodo: periodoActual,
                    limit: 10, // Default limit per requirement
                    ...paramsOrPeriodo
                };
            }

            const data = await window.api.listarRutas(token_session, params);

            if (data.rutas) {
                setRutas(Array.isArray(data.rutas) ? data.rutas : []);
                setPagination(data.pagination || null); // Guardar estado paginación
                if (data.periodo) setPeriodoActual(data.periodo);
            } else if (Array.isArray(data)) {
                // Fallback legacy
                setRutas(data);
                setPagination(null);
            } else {
                setRutas([]);
                setPagination(null);
            }

        } catch (error) {
            console.error("❌ Error al obtener rutas:", error);
            setRutas([]);
            setError(error);
            setPagination(null);
        } finally {
            setLoading(false);
            if (isFirstLoadRef.current) {
                setInitialLoading(false);
                isFirstLoadRef.current = false;
            }
        }
    }, [periodoActual]); // sin initialLoading como dep: evita regenerar la referencia


    // Cargar rutas al iniciar — gated on auth user
    useEffect(() => {
        if (user) fetchRutas();
    }, [user, fetchRutas]);

    // Actualizar cuando se restaura la conexión
    useEffect(() => {
        const handleConnectionRestored = () => {
            console.log("🔄 Reconexión detectada en RutasContext, actualizando...");
            fetchRutas();
        };

        window.addEventListener('connection-restored', handleConnectionRestored);
        return () => window.removeEventListener('connection-restored', handleConnectionRestored);
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
            if (!data || !data.ruta) {
                throw new Error("La ruta no se encontró o no tiene medidores asignados");
            }
            //console.log("Información de la ruta obtenida context:", data.ruta);
            return data.ruta;
        } catch (error) {
            console.error("❌ Error al obtener información de la ruta:", error);
            throw error;
        }
        // NO modificar loading state global aquí
    }, []);

    // Función para actualización optimista del progreso
    const actualizarProgresoRuta = useCallback((rutaId, nuevoTotal = null) => {
        setRutas(prevRutas => prevRutas.map(r => {
            if (r.id === rutaId) {
                return {
                    ...r,
                    completadas: nuevoTotal !== null ? nuevoTotal : (r.completadas || 0) + 1
                };
            }
            return r;
        }));
    }, []);

    return (
        <RutasContext.Provider value={{
            rutas,
            loading,
            initialLoading,
            actualizarRutas,
            actualizarProgresoRuta,
            obtenerInfoRuta,
            periodoActual,
            pagination, // Exportar paginación
            fetchRutas // Exponer fetch manual
        }}>
            {children}
        </RutasContext.Provider>
    );
}

// Hook para acceder fácilmente al contexto
export function useRutas() {
    return useContext(RutasContext);
}
