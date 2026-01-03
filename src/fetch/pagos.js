import {leerToken} from '../appConfig/authApp'; // Asegúrate de que la ruta sea correcta
const URL_PAGOS = import.meta.env.VITE_API_FETCH_PAGOS; // URL del endpoint de pagos

/**************************************************************************************************************
 * 
 * |      Funcion Fetch pagos
 * 
 * ************************************************************************************************************* */

export const fetchPagos = async (token_session, periodo = null, isRetry = false) => {
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

    // Construir URL con parámetro de período si se proporciona
    let url = URL_PAGOS;
    if (periodo) {
        url += `?periodo=${periodo}`;
    }

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
            console.log("🔄 Token expirado en fetchPagos, solicitando renovación...");
            // Emitir evento para que AuthContext renueve el token
            window.dispatchEvent(new CustomEvent('token-expired'));
            // Esperar un momento para que se renueve el token
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Obtener el token renovado del localStorage
            const newToken = localStorage.getItem('token');
            if (newToken && newToken !== token_session) {
                console.log("✅ Token renovado, reintentando fetchPagos...");
                return fetchPagos(newToken, periodo, true); // Reintentar con el nuevo token
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