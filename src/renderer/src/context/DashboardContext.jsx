import { createContext, useState, useContext, useEffect, useCallback } from "react";

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDashboardStats = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No hay sesión activa");
            }

            setLoading(true);
            setError(null);

            const data = await window.api.fetchDashboardStats(token);

            console.log("Datos del dashboard:", data);
            if (data) {
                setDashboardData(data);
            } else {
                throw new Error("No se pudieron obtener los datos del dashboard");
            }
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar datos al montar
    useEffect(() => {
        fetchDashboardStats();

        // Escuchar evento de reconexión y evento personalizado 'dashboard-update'
        const handleUpdate = () => {
            console.log("🔄 Actualizando dashboard por evento...");
            fetchDashboardStats();
        };

        window.addEventListener('connection-restored', handleUpdate);
        window.addEventListener('dashboard-update', handleUpdate);

        return () => {
            window.removeEventListener('connection-restored', handleUpdate);
            window.removeEventListener('dashboard-update', handleUpdate);
        };
    }, [fetchDashboardStats]);

    const value = {
        dashboardData,
        loading,
        error,
        refetch: fetchDashboardStats
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error("useDashboard debe usarse dentro de un DashboardProvider");
    }
    return context;
}
