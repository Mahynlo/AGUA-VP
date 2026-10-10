import { leerToken } from '../appConfig/authApp';
import { getJson } from '../main/api-client/http.js';

const URL_TARIFAS = import.meta.env.VITE_API_FETCH_TARIFAS; // URL del endpoint de tarifas

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

    return await getJson(`${URL_TARIFAS}${query}`, { token_app, token_session, isRetry });
  } catch (error) {
    console.error("Error al obtener tarifas:", error.message || error);
    return [];
  }
};
