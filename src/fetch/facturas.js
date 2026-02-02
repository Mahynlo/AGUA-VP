import {leerToken} from '../appConfig/authApp'; // Asegúrate de que la ruta sea correcta
const URL_FACTURAS = import.meta.env.VITE_API_FETCH_FACTURAS; // URL del endpoint de facturas

/**************************************************************************************************************
 * |      Funcion Fetch facturas
 * ************************************************************************************************************* */
export const fetchFacturas = async (token_session, params, isRetry = false) => {
    try {
    const token_app = leerToken(); // Asegúrate de que esta función retorne el token correctamente
    if (!token_app) {
        console.error("Token app no disponible(ipcmain-fetch-facturas)");
        return [];
    }
    if (!token_session) {
        console.error("Token de sesión no disponible(ipcmain-fetch-facturas)");
        return [];
    }

    // Construir query string con parámetros dinámicos
    const urlParams = new URLSearchParams();
    if (params.periodo) urlParams.append("periodo", params.periodo);
    if (params.page) urlParams.append("page", params.page);
    if (params.limit) urlParams.append("limit", params.limit);
    if (params.search) urlParams.append("search", params.search);
    if (params.estado) urlParams.append("estado", params.estado);
    
    const query = "?" + urlParams.toString();

    const response = await fetch(`${URL_FACTURAS}${query}`, {
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
    console.error("Error en fetchFacturas:", error," (ipcmain-fetch-facturas)");
    return [];
    }
}