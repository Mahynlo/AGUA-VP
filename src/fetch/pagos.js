import {leerToken} from '../appConfig/authApp'; // Asegúrate de que la ruta sea correcta
const URL_PAGOS = import.meta.env.VITE_API_FETCH_PAGOS; // URL del endpoint de pagos

/**************************************************************************************************************
 * 
 * |      Funcion Fetch pagos
 * 
 * ************************************************************************************************************* */

export const fetchPagos = async (token_session, params = {}, isRetry = false) => {
    try {
    const token_app = leerToken(); // Asegúrate de que esta función retorne el token correctamente
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
    }
    // Evita respuestas cacheadas justo después de registrar cobros.
    urlParams.append('_t', String(Date.now()));

    const query = urlParams.toString();
    const url = `${URL_PAGOS}?${query}`;

    const response = await fetch(url, {
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
            window.dispatchEvent(new CustomEvent('token-expired'));
            await new Promise(resolve => setTimeout(resolve, 1000));
            const newToken = localStorage.getItem('token');
            if (newToken && newToken !== token_session) {
                return fetchPagos(newToken, params, true); // Reintentar con el nuevo token
            }
        }
        
        throw new Error(`Error HTTP ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data; // Esto debe ser un array de pagos
    } catch (error) {
    const message = error?.message || "Error desconocido en fetchPagos";
    console.error("Error en fetchPagos:", message, "(ipcmain-fetch-pagos)");
    throw error;
    }
}