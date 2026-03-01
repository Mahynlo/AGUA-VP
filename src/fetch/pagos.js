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
        console.error("Token app no disponible(ipcmain-fetch-pagos)");
        return [];
    }
    if (!token_session) {
        console.error("Token de sesión no disponible(ipcmain-fetch-pagos)");
        return [];
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

    const query = urlParams.toString();
    const url = `${URL_PAGOS}?${query}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        // Podrías leer el mensaje del backend si viene uno
        const errorBody = await response.text();
        
        // Si es error 403 y no es reintento, intentar renovar token
        if (response.status === 403 && !isRetry) {
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
    console.error("Error en fetchPagos:", error," (ipcmain-fetch-pagos)");
    return [];
    }
}