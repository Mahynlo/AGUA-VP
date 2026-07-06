
import {leerToken} from '../appConfig/authApp'; 
import { notifyTokenExpired } from './tokenExpiredHelper.js';

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

    const response = await fetch(URL_DASHBOARD_STATS, {
      method: "GET",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      
      // Manejo de expiración de token (401 = token inválido, 403 = sesión expirada)
      if ((response.status === 401 || response.status === 403) && !isRetry) {
        notifyTokenExpired();
      }
      
      throw new Error(`Error HTTP ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    return null;
  }
};
