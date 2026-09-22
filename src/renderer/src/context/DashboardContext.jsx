import { createContext, useState, useContext, useEffect, useCallback, useMemo } from "react";

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDashboardStats = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setDashboardData(null);
                return;
            }

            setLoading(true);
            setError(null);

            const data = await window.api.fetchDashboardStats(token);

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

    // Cargar datos al montar y escuchar eventos de sincronización
    useEffect(() => {
        fetchDashboardStats();

        const handleUpdate = () => {
            fetchDashboardStats();
        };

        window.addEventListener('connection-restored', handleUpdate);
        window.addEventListener('dashboard-update', handleUpdate);
        window.addEventListener('token-refreshed', handleUpdate);

        return () => {
            window.removeEventListener('connection-restored', handleUpdate);
            window.removeEventListener('dashboard-update', handleUpdate);
            window.removeEventListener('token-refreshed', handleUpdate);
        };
    }, [fetchDashboardStats]);

    const value = useMemo(() => ({
        dashboardData,
        loading,
        error,
        refetch: fetchDashboardStats
    }), [
        dashboardData,
        loading,
        error,
        fetchDashboardStats
    ]);

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
