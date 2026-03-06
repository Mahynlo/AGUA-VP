import { leerToken } from '../appConfig/authApp';

const URL_TARIFAS = import.meta.env.VITE_API_FETCH_TARIFAS; // URL del endpoint de tarifas

const getHeaders = (token_app, token_session) => ({
  "x-app-key": `AppKey ${token_app}`,
  "Authorization": `Bearer ${token_session}`,
  "Content-Type": "application/json"
});

/**
 * Obtiene la lista de tarifas desde el backend con paginación
 * @param {string} token_session - Token de sesión
 * @param {Object} params - Parámetros { page, limit, search }
 * @param {boolean} isRetry - Si es reintento
 */
export const fetchTarifas = async (token_session, params = {}, isRetry = false) => {
  try {
    const token_app = leerToken(); 

    if (!token_app) {
      console.error("Token app no disponible");
      return [];
    }
    if (!token_session) {
      console.error("Token de sesión no disponible");
      return [];
    }

    // Construir query string
    let query = "";
    if (params) {
        const urlParams = new URLSearchParams();
        if (params.page) urlParams.append("page", params.page);
        if (params.limit) urlParams.append("limit", params.limit);
        if (params.search) urlParams.append("search", params.search);
        query = "?" + urlParams.toString();
    }

    const response = await fetch(`${URL_TARIFAS}${query}`, {
      method: "GET",
      headers: getHeaders(token_app, token_session)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      
      // Si es error 401/403 y no es reintento, intentar renovar token
      if ((response.status === 401 || response.status === 403) && !isRetry && typeof window !== 'undefined') {
        console.log("🔄 Token expirado en fetchTarifas, solicitando renovación...");
        window.dispatchEvent(new CustomEvent('token-expired'));
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newToken = localStorage.getItem('token');
        if (newToken && newToken !== token_session) {
          console.log("✅ Token renovado, reintentando fetchTarifas...");
          return fetchTarifas(newToken, true);
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



