import { leerToken } from '../../auth/appKey.js';
import { getJson } from '../http.js';
const URL_FACTURAS = import.meta.env.VITE_API_FETCH_FACTURAS; // URL del endpoint de facturas

/**************************************************************************************************************
 * |      Funcion Fetch facturas
 * ************************************************************************************************************* */
export const fetchFacturas = async (token_session, params, isRetry = false) => {
    try {
    const token_app = leerToken();
    if (!token_app) {
        throw new Error("Token app no disponible(ipcmain-fetch-facturas)");
    }
    if (!token_session) {
        throw new Error("Token de sesión no disponible(ipcmain-fetch-facturas)");
    }

    // Construir query string con parámetros dinámicos
    const urlParams = new URLSearchParams();
    if (params.periodo) urlParams.append("periodo", params.periodo);
    if (params.page) urlParams.append("page", params.page);
    if (params.limit) urlParams.append("limit", params.limit);
    if (params.search) urlParams.append("search", params.search);
    if (params.estado) urlParams.append("estado", params.estado);
    if (params.ciudad) urlParams.append("ciudad", params.ciudad);
    // Evita respuesta cacheada en Electron/Chromium para datos de cobranza.
    urlParams.append("_t", String(Date.now()));

    const query = "?" + urlParams.toString();

    return await getJson(`${URL_FACTURAS}${query}`, {
        token_app,
        token_session,
        isRetry,
        cache: "no-store"
    });
    } catch (error) {
    const message = error?.message || "Error desconocido en fetchFacturas";
    console.error("Error en fetchFacturas:", message, "(ipcmain-fetch-facturas)");
    throw error;
    }
}
