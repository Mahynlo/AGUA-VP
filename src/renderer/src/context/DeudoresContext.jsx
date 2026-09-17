import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useAuth } from "./AuthContext";

const DeudoresContext = createContext();

export function DeudoresProvider({ children }) {
    const { user } = useAuth();
    const [deudores, setDeudores] = useState([]);
    const [estadisticas, setEstadisticas] = useState({
        totalDeuda: 0,
        criticos: 0,
        totalDeudores: 0,
        casosActivos: 0,
        convenios: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch real data
    const fetchDeudores = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            if (window.api?.deudores?.fetchCandidatos) {
                const data = await window.api.deudores.fetchCandidatos(token);
                const deudoresList = Array.isArray(data) ? data : (data.candidatos || []);

                setDeudores(deudoresList);

                // Calcular Estadísticas usando campos reales del API
                const totalDeuda = deudoresList.reduce((acc, curr) => acc + Number(curr.deuda?.total || curr.saldo_pendiente || 0), 0);
                const criticos = deudoresList.filter(d => Number(d.deuda?.facturas_vencidas || 0) >= 3).length;
                const totalDeudores = deudoresList.length;
                const casosActivos = deudoresList.filter(d => d.medidor?.estado_servicio !== 'Cortado').length;
                const convenios = deudoresList.filter(d => d.tiene_convenio === true).length;

                setEstadisticas({
                    totalDeuda,
                    criticos,
                    totalDeudores,
                    casosActivos,
                    convenios
                });
            } else {
                setEstadisticas({
                    totalDeuda: 0,
                    criticos: 0,
                    totalDeudores: 0,
                    casosActivos: 0,
                    convenios: 0
                });
            }
        } catch (err) {
            console.error("Error fetching deudores:", err);
            setError(err.message || "Error al obtener lista de deudores");
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar deudores al iniciar sesión
    useEffect(() => {
        if (user) fetchDeudores();
    }, [user, fetchDeudores]);

    // Sincronizar automáticamente tras pagos o reconexión
    useEffect(() => {
        const handleUpdate = () => {
            console.log("🔄 Actualización detectada en DeudoresContext, refrescando deudores...");
            fetchDeudores();
        };

        window.addEventListener('dashboard-update', handleUpdate);
        window.addEventListener('connection-restored', handleUpdate);
        return () => {
            window.removeEventListener('dashboard-update', handleUpdate);
            window.removeEventListener('connection-restored', handleUpdate);
        };
    }, [fetchDeudores]);

    return (
        <DeudoresContext.Provider value={{ deudores, estadisticas, loading, error, fetchDeudores }}>
            {children}
        </DeudoresContext.Provider>
    );
}

export const useDeudores = () => useContext(DeudoresContext);
