import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useAuth } from "./AuthContext";

const DeudoresContext = createContext();

export function DeudoresProvider({ children }) {
    const [deudores, setDeudores] = useState([]);
    const [estadisticas, setEstadisticas] = useState({
        totalDeuda: 0,
        criticos: 0,
        totalDeudores: 0,
        casosActivos: 0,
        convenios: 0
    });
    const [loading, setLoading] = useState(false);

    // Fetch real data
    const fetchDeudores = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            // Usamos window.api.fetchCandidatosCorte si está expuesto, o importamos el fetcher si estamos en renderer puro (pero require node integration).
            // Lo ideal es usar el IPC bridge. Asumimos que existe un método expuesto como `window.api.fetchDeudores` o similar.
            // Si no, usaremos la función simulada pero con lógica de cálculo si tuvieramos datos.

            // INTENTO 1: Usar window.api (Bridge)
            // La API expuesta en preload/index.js es window.api.deudores.fetchCandidatos

            if (window.api && window.api.deudores && window.api.deudores.fetchCandidatos) {
                const data = await window.api.deudores.fetchCandidatos(token);
                // data puede venir como array directo o { data: [...] } dependiendo del controller
                // Asumiremos que es un array o lista
                const deudoresList = Array.isArray(data) ? data : (data.candidatos || []);

                setDeudores(deudoresList);

                // Calcular Estadísticas
                const totalDeuda = deudoresList.reduce((acc, curr) => acc + (Number(curr.total_adeudo || curr.deuda_total || 0)), 0);
                const criticos = deudoresList.filter(d => d.meses_adeudo >= 3).length;
                const totalDeudores = deudoresList.length;
                const casosActivos = deudoresList.filter(d => !d.fecha_corte).length;
                const convenios = deudoresList.filter(d => d.tiene_convenio || d.en_convenio).length;

                setEstadisticas({
                    totalDeuda,
                    criticos,
                    totalDeudores,
                    casosActivos,
                    convenios
                });
            } else {
                console.warn("API de deudores no disponible. Usando datos simulados.");
                // Fallback simulado pero explícito para debugging
                setEstadisticas({
                    totalDeuda: 0,
                    criticos: 0,
                    totalDeudores: 0,
                    casosActivos: 0,
                    convenios: 0
                });
            }

        } catch (error) {
            console.error("Error fetching deudores:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Escuchar eventos de recarga si es necesario
    useEffect(() => {
        fetchDeudores();
    }, [fetchDeudores]);

    return (
        <DeudoresContext.Provider value={{ deudores, estadisticas, loading, fetchDeudores }}>
            {children}
        </DeudoresContext.Provider>
    );
}

export const useDeudores = () => useContext(DeudoresContext);
