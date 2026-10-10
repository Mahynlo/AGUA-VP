import { leerToken } from '../appConfig/authApp';
import { getJson, appendDefinedParams } from '../main/api-client/http.js';
const URL_MEDIDORES = import.meta.env.VITE_API_FETCH_MEDIDORES; // URL del endpoint de medidores
// Asumiendo que VITE_API_FETCH_MEDIDORES apunta a /api/v2/medidores


export const fetchMedidores = async (token_session, params = {}, isRetry = false) => {
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

    // Construir URL con parámetros
    const url = appendDefinedParams(new URL(URL_MEDIDORES), params);

    return await getJson(url.toString(), { token_app, token_session, isRetry });
  } catch (error) {
    console.error("Error al obtener medidores:", error.message || error);
    return [];
  }
};

export const fetchMedidoresEliminados = async (token_session, isRetry = false) => {
  try {
    const token_app = leerToken();
    if (!token_app) {
      console.error("Token app no disponible");
      return { total: 0, medidores_eliminados: [] };
    }
    if (!token_session) {
      console.error("Token de sesión no disponible");
      return { total: 0, medidores_eliminados: [] };
    }

    const baseURL = URL_MEDIDORES.replace('/listar', '');
    return await getJson(`${baseURL}/eliminados`, { token_app, token_session, isRetry });
  } catch (error) {
    console.error("Error al obtener medidores eliminados:", error.message || error);
    return { total: 0, medidores_eliminados: [] };
  }
};
