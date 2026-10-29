import { leerToken } from '../../auth/appKey.js';
import { getJson, appendDefinedParams } from '../http.js';
const URL_CLIENTES = import.meta.env.VITE_API_FETCH_CLIENTES; // URL del endpoint de clientes

/**************************************************************************************************************
|      Funcion Fetch clientes
************************************************************************************************************* */

export const fetchClientes = async (token_session, params = {}, isRetry = false) => {
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
    const url = appendDefinedParams(new URL(URL_CLIENTES), params);

    // Puede ser array o objeto {data, pagination}
    return await getJson(url.toString(), { token_app, token_session, isRetry });
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return [];
  }
};

/**************************************************************************************************************
|      Funcion Fetch estadísticas de clientes
************************************************************************************************************* */

export const fetchClientesEstadisticas = async (token_session, isRetry = false) => {
  try {
    const token_app = leerToken();
    if (!token_app) {
      console.error("Token app no disponible");
      return null;
    }
    if (!token_session) {
      console.error("Token de sesión no disponible");
      return null;
    }

    // Construir URL base desde URL_CLIENTES
    const baseURL = URL_CLIENTES.replace('/listar', '');
    return await getJson(`${baseURL}/estadisticas`, { token_app, token_session, isRetry });
  } catch (error) {
    console.error("Error al obtener estadísticas de clientes:", error);
    return null;
  }
};

export const fetchClientesEliminados = async (token_session, isRetry = false) => {
  try {
    const token_app = leerToken();
    if (!token_app) {
      console.error("Token app no disponible");
      return { total: 0, clientes_eliminados: [] };
    }
    if (!token_session) {
      console.error("Token de sesión no disponible");
      return { total: 0, clientes_eliminados: [] };
    }

    const baseURL = URL_CLIENTES.replace('/listar', '');
    return await getJson(`${baseURL}/eliminados`, { token_app, token_session, isRetry });
  } catch (error) {
    console.error("Error al obtener clientes eliminados:", error);
    return { total: 0, clientes_eliminados: [] };
  }
};
