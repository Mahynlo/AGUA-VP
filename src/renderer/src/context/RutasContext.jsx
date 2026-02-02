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
    const [pagination, setPagination] = useState(null); // Nuevo estado
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [periodoActual, setPeriodoActual] = useState(obtenerPeriodoActual());
    const [error, setError] = useState(null);


    // Función para obtener rutas desde el backend (puede recibir un período o params)
    const fetchRutas = useCallback(async (paramsOrPeriodo = periodoActual) => {
        try {
            // Solo mostrar loading completo en updates, no en carga inicial si ya cargó
            if (!initialLoading) {
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
            setInitialLoading(false);
        }
    }, [periodoActual, initialLoading]);


    // Cargar rutas al iniciar - solo una vez
    useEffect(() => {
        fetchRutas(); // sin parámetro → usará el mes actual
    }, [fetchRutas]);

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
