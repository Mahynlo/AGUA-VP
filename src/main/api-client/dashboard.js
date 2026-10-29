import { leerToken } from '../auth/appKey.js';
import { getJson } from './http.js';

// Concatenar URL base con endpoint, validando si el endpoint ya es una URL completa
const BASE_URL = import.meta.env.VITE_URL_BASE_API_AGUAVP;
const ENDPOINT = import.meta.env.VITE_API_DASHBOARD_STATS;
const URL_DASHBOARD_STATS = ENDPOINT.startsWith('http') ? ENDPOINT : `${BASE_URL}${ENDPOINT}`;

/**************************************************************************************************************
|      Funcion Fetch Dashboard Stats
************************************************************************************************************* */

export const fetchDashboardStats = async (token_session, isRetry = false) => {
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

    // 401 = token inválido, 403 = sesión expirada → se notifica al renderer
    return await getJson(URL_DASHBOARD_STATS, { token_app, token_session, isRetry });
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    return null;
  }
};
