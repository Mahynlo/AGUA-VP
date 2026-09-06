import { createContext, useState, useContext, useCallback, useEffect, useRef } from "react";
import { adaptarReciboAPI } from "../utils/reciboUtils";

const ReportesContext = createContext();

export function ReportesProvider({ children }) {
    // Cache para recibos: { '2024-11': [...data], '2024-12': [...data] }
    const [cacheRecibos, setCacheRecibos] = useState({});
    const cacheRecibosRef = useRef({});

    // Estado actual visualizado para recibos
    const [recibosActuales, setRecibosActuales] = useState([]);
    const [periodoActual, setPeriodoActual] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- NUEVO: Cache para lecturas ---
    const [cacheLecturas, setCacheLecturas] = useState({});
    const cacheLecturasRef = useRef({});
    const [lecturasActuales, setLecturasActuales] = useState([]);

    // --- NUEVO: Cache y estado para reporte financiero ---
    const [cacheFinanciero, setCacheFinanciero] = useState({});
    const cacheFinancieroRef = useRef({});
    const [financieroActual, setFinancieroActual] = useState(null);
    const [loadingFinanciero, setLoadingFinanciero] = useState(false);
    const [errorFinanciero, setErrorFinanciero] = useState(null);

    /**
     * Carga los recibos para un periodo dado.
     * Si ya existen en memoria (cache), los usa directamante sin llamar a la API.
     */
    const cargarRecibos = useCallback(async (token, periodo, forzarRecarga = false) => {
        if (!periodo) {
            setRecibosActuales([]);
            setPeriodoActual("");
            return;
        }

        setPeriodoActual(periodo);

        // 1. Revisar caché si no se fuerza recarga
        if (!forzarRecarga && cacheRecibosRef.current[periodo]) {
            console.log(`📦 Usando datos en caché para periodo ${periodo}`);
            setRecibosActuales(cacheRecibosRef.current[periodo]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log(`📡 Descargando datos del servidor para periodo ${periodo}...`);
            const data = await window.api.fetchReporteRecibos(token, periodo);

            if (data && data.recibos) {
                const recibosAdaptados = data.recibos.map(adaptarReciboAPI);
                setRecibosActuales(recibosAdaptados);
                cacheRecibosRef.current = {
                    ...cacheRecibosRef.current,
                    [periodo]: recibosAdaptados
                };
                setCacheRecibos(cacheRecibosRef.current);
            } else {
                setRecibosActuales([]);
            }
        } catch (err) {
            console.error("Error cargando recibos:", err);
            setError(err.message || "Error al descargar reporte");
            setRecibosActuales([]);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Carga las lecturas para un periodo dado.
     */
    const cargarLecturas = useCallback(async (token, periodo, forzarRecarga = false) => {
        if (!periodo) {
            setLecturasActuales([]);
            return;
        }

        // 1. Revisar caché
        if (!forzarRecarga && cacheLecturasRef.current[periodo]) {
            console.log(`📦 Usando lecturas en caché para ${periodo}`);
            setLecturasActuales(cacheLecturasRef.current[periodo]);
            return;
        }

        setLoading(true);
        try {
            console.log(`📡 Descargando lecturas para ${periodo}...`);
            const data = await window.api.fetchReporteLecturas(token, periodo);
            const datos = data.datos || []; // Asegurar array
            console.log("Datos de lecturas reporte:", datos);

            setLecturasActuales(datos);
            cacheLecturasRef.current = { ...cacheLecturasRef.current, [periodo]: datos };
            setCacheLecturas(cacheLecturasRef.current);
        } catch (err) {
            console.error("Error cargando lecturas:", err);
            setLecturasActuales([]);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Carga el reporte financiero con filtros flexibles.
     */
    const cargarReporteFinanciero = useCallback(async (token, filtros = {}, forzarRecarga = false) => {
        const cacheKey = JSON.stringify(filtros || {});

        if (!forzarRecarga && cacheFinancieroRef.current[cacheKey]) {
            setFinancieroActual(cacheFinancieroRef.current[cacheKey]);
            return cacheFinancieroRef.current[cacheKey];
        }

        setLoadingFinanciero(true);
        setErrorFinanciero(null);

        try {
            const data = await window.api.fetchReporteFinanciero(token, filtros);
            setFinancieroActual(data || null);
            cacheFinancieroRef.current = { ...cacheFinancieroRef.current, [cacheKey]: data || null };
            setCacheFinanciero(cacheFinancieroRef.current);
            return data;
        } catch (err) {
            console.error("Error cargando reporte financiero:", err);
            const errorMessage = err?.message || "Error al cargar reporte financiero";
            setErrorFinanciero(errorMessage);
            throw err;
        } finally {
            setLoadingFinanciero(false);
        }
    }, []);


    /**
     * Limpia la caché si es necesario (ej. logout)
     */
    const limpiarCache = useCallback(() => {
        cacheRecibosRef.current = {};
        cacheLecturasRef.current = {};
        cacheFinancieroRef.current = {};
        setCacheRecibos({});
        setCacheLecturas({});
        setCacheFinanciero({});
        setRecibosActuales([]);
        setLecturasActuales([]);
        setFinancieroActual(null);
        setErrorFinanciero(null);
        setPeriodoActual("");
    }, []);

    // Escuchar cambios en la datos globales para invalidar caché
    useEffect(() => {
        const handleInvalidate = () => {
            console.log("🧹 Invalidando caché de reportes por actualización de datos...");
            cacheRecibosRef.current = {};
            cacheLecturasRef.current = {};
            cacheFinancieroRef.current = {};
            setCacheRecibos({});
            setCacheLecturas({});
            setCacheFinanciero({});
        };

        window.addEventListener('dashboard-update', handleInvalidate);
        return () => window.removeEventListener('dashboard-update', handleInvalidate);
    }, []);

    const value = {
        recibos: recibosActuales,
        lecturas: lecturasActuales,
        periodo: periodoActual,
        loading,
        error,
        financiero: financieroActual,
        loadingFinanciero,
        errorFinanciero,
        cargarRecibos,
        cargarLecturas,
        cargarReporteFinanciero,
        limpiarCache
    };

    return (
        <ReportesContext.Provider value={value}>
            {children}
        </ReportesContext.Provider>
    );
}

export function useReportes() {
    return useContext(ReportesContext);
}
