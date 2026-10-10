import { leerToken } from '../appConfig/authApp';
import { getJson, appendDefinedParams } from '../main/api-client/http.js';

const BASE_URL = import.meta.env.VITE_URL_BASE_API_AGUAVP;

// Tokens obligatorios para los reportes (lanza si faltan)
const requireTokens = (token_session) => {
    const token_app = leerToken();
    if (!token_app || !token_session) {
        throw new Error("Tokens de autenticación faltantes");
    }
    return token_app;
};

// Los reportes no notifican token expirado al renderer (comportamiento original)
const getReporte = (url, token_app, token_session) =>
    getJson(url.toString(), { token_app, token_session, notifyOnAuthError: false });

/**
 * Fetch para obtener datos masivos de recibos para impresión
 * @param {string} token_session - Token JWT del usuario
 * @param {string} periodo - Periodo en formato YYYY-MM
 * @param {number} rutaId - (Opcional) ID de la ruta
 * @param {string} estadoPago - (Opcional) 'pendiente', 'pagado', etc.
 */
export const fetchReporteRecibos = async (token_session, periodo, rutaId = null, estadoPago = null) => {
    try {
        const token_app = requireTokens(token_session);

        // Construir URL con query params
        const url = new URL(`${BASE_URL}/api/v2/reports/recibos`);
        url.searchParams.append('mes', periodo);
        if (rutaId) url.searchParams.append('ruta_id', rutaId);
        if (estadoPago) url.searchParams.append('estado_pago', estadoPago);

        return await getReporte(url, token_app, token_session); // { periodo, total_recibos, recibos: [...] }
    } catch (error) {
        console.error("Error en fetchReporteRecibos:", error);
        throw error;
    }
};

/**
 * Fetch para obtener lista de lecturas por localidad
 * @param {string} token_session - Token JWT del usuario
 * @param {string} periodo - Periodo en formato YYYY-MM
 * @param {string} localidad - (Opcional) Localidad para filtrar
 */
export const fetchReporteLecturas = async (token_session, periodo, localidad = null) => {
    try {
        const token_app = requireTokens(token_session);

        // Construir URL con query params
        const url = new URL(`${BASE_URL}/api/v2/reports/lecturas`);
        url.searchParams.append('mes', periodo);
        if (localidad) url.searchParams.append('localidad', localidad);

        return await getReporte(url, token_app, token_session);
    } catch (error) {
        console.error("Error en fetchReporteLecturas:", error);
        throw error;
    }
};

/**
 * Fetch para obtener reporte de consumo de agua potable
 * @param {string} token_session - Token JWT del usuario
 * @param {Object} filtros - { tipo, periodo, meses }
 */
export const fetchReporteConsumoAgua = async (token_session, filtros = {}) => {
    try {
        const token_app = requireTokens(token_session);
        const url = appendDefinedParams(new URL(`${BASE_URL}/api/v2/reports/consumo-agua`), filtros);
        return await getReporte(url, token_app, token_session);
    } catch (error) {
        console.error("Error en fetchReporteConsumoAgua:", error);
        throw error;
    }
};

/**
 * Fetch para obtener reporte financiero consolidado
 * @param {string} token_session - Token JWT del usuario
 * @param {Object} filtros - Filtros del reporte
 */
export const fetchReporteFinanciero = async (token_session, filtros = {}) => {
    try {
        const token_app = requireTokens(token_session);
        const url = appendDefinedParams(new URL(`${BASE_URL}/api/v2/reports/financiero`), filtros);
        return await getReporte(url, token_app, token_session);
    } catch (error) {
        console.error("Error en fetchReporteFinanciero:", error);
        throw error;
    }
};
