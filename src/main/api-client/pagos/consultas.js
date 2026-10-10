import { leerToken } from '../appConfig/authApp';
import { getJson } from '../main/api-client/http.js';
const URL_PAGOS = import.meta.env.VITE_API_FETCH_PAGOS; // URL del endpoint de pagos

/**************************************************************************************************************
 *
 * |      Funcion Fetch pagos
 *
 * ************************************************************************************************************* */

export const fetchPagos = async (token_session, params = {}, isRetry = false) => {
    try {
    const token_app = leerToken();
    if (!token_app) {
        throw new Error("Token app no disponible(ipcmain-fetch-pagos)");
    }
    if (!token_session) {
        throw new Error("Token de sesión no disponible(ipcmain-fetch-pagos)");
    }

    // Construir URL query string
    const urlParams = new URLSearchParams();

    // Si params es un string (compatibilidad hacia atrás), tratarlo como periodo
    if (typeof params === 'string') {
        urlParams.append('periodo', params);
    } else {
        // Si es objeto, agregar todos los parámetros
        if (params.periodo) urlParams.append('periodo', params.periodo);
        if (params.page) urlParams.append('page', params.page);
        if (params.limit) urlParams.append('limit', params.limit);
        if (params.search) urlParams.append('search', params.search);
        if (params.metodo_pago) urlParams.append('metodo_pago', params.metodo_pago);
        if (params.ciudad) urlParams.append('ciudad', params.ciudad);
    }
    // Evita respuestas cacheadas justo después de registrar cobros.
    urlParams.append('_t', String(Date.now()));

    const url = `${URL_PAGOS}?${urlParams.toString()}`;

    return await getJson(url, { token_app, token_session, isRetry, cache: "no-store" });
    } catch (error) {
    const message = error?.message || "Error desconocido en fetchPagos";
    console.error("Error en fetchPagos:", message, "(ipcmain-fetch-pagos)");
    throw error;
    }
}
