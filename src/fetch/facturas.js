import {leerToken} from '../appConfig/authApp'; // Asegúrate de que la ruta sea correcta
const URL_FACTURAS = import.meta.env.VITE_API_FETCH_FACTURAS; // URL del endpoint de facturas

/**************************************************************************************************************
 * |      Funcion Fetch facturas
 * ************************************************************************************************************* */
export const fetchFacturas = async (token_session, params, isRetry = false) => {
    try {
    const token_app = leerToken(); // Asegúrate de que esta función retorne el token correctamente
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
    // Evita respuesta cacheada en Electron/Chromium para datos de cobranza.
    urlParams.append("_t", String(Date.now()));
    
    const query = "?" + urlParams.toString();

    const response = await fetch(`${URL_FACTURAS}${query}`, {
        method: "GET",
        cache: "no-store",
        headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        // Podrías leer el mensaje del backend si viene uno
        const errorBody = await response.text();
        
        // Si es error 401/403 y no es reintento, intentar renovar token
        if ((response.status === 401 || response.status === 403) && !isRetry && typeof window !== 'undefined') {
            console.log("🔄 Token expirado en fetchFacturas, solicitando renovación...");
            window.dispatchEvent(new CustomEvent('token-expired'));
            await new Promise(resolve => setTimeout(resolve, 1000));
            const newToken = localStorage.getItem('token');
            if (newToken && newToken !== token_session) {
                console.log("✅ Token renovado, reintentando fetchFacturas...");
                return fetchFacturas(newToken, params, true);
            }
        }
        
        throw new Error(`Error HTTP ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data; // Esto debe ser un array de lecturas
    } catch (error) {
    const message = error?.message || "Error desconocido en fetchFacturas";
    console.error("Error en fetchFacturas:", message, "(ipcmain-fetch-facturas)");
    throw error;
    }
}