import { leerToken } from '../appConfig/authApp';

const URL_TARIFAS = import.meta.env.VITE_API_FETCH_TARIFAS; // URL del endpoint de tarifas

const getHeaders = (token_app, token_session) => ({
  "x-app-key": `AppKey ${token_app}`,
  "Authorization": `Bearer ${token_session}`,
  "Content-Type": "application/json"
});

/**
 * Obtiene la lista de tarifas desde el backend
 * @param {string} token_session - Token de sesión del usuario
 * @param {boolean} isRetry - Indica si es un reintento después de renovar token
 * @returns {Promise<Array>} Lista de tarifas o arreglo vacío en caso de error
 */
export const fetchTarifas = async (token_session, isRetry = false) => {
  try {
    const token_app = leerToken(); // usa `await leerToken()` si es necesario

    if (!token_app) {
      console.error("Token app no disponible");
      return [];
    }

    if (!token_session) {
      console.error("Token de sesión no disponible");
      return [];
    }

    const response = await fetch(URL_TARIFAS, {
      method: "GET",
      headers: getHeaders(token_app, token_session)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      
      // Si es error 403 y no es reintento, intentar renovar token
      if (response.status === 403 && !isRetry) {
        console.log("🔄 Token expirado en fetchTarifas, solicitando renovación...");
        // Emitir evento para que AuthContext renueve el token
        window.dispatchEvent(new CustomEvent('token-expired'));
        // Esperar un momento para que se renueve el token
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Obtener el token renovado del localStorage
        const newToken = localStorage.getItem('token');
        if (newToken && newToken !== token_session) {
          console.log("✅ Token renovado, reintentando fetchTarifas...");
          return fetchTarifas(newToken, true); // Reintentar con el nuevo token
        }
      }
      
      throw new Error(`Error HTTP ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Error al obtener tarifas:", error.message || error);
    return [];
  }
};



