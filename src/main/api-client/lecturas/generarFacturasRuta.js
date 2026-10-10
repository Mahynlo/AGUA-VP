import { leerToken } from '../appConfig/authApp';
import { apiFetch } from '../main/api-client/http.js';

const URL_BASE = import.meta.env.VITE_URL_BASE_API_AGUAVP;

/**
 * Genera facturas para todas las lecturas pendientes de una ruta y periodo.
 * @param {object} params  - { ruta_id, periodo, fecha_emision, recalcular?, motivo_recalculo? }
 * @param {string} token_session
 */
export const generarFacturasRuta = async ({ ruta_id, periodo, fecha_emision, recalcular = false, motivo_recalculo = '' }, token_session) => {
  try {
    const token_app = leerToken();

    if (!token_app) {
      return { success: false, message: 'Token de aplicación no disponible' };
    }
    if (!token_session) {
      return { success: false, message: 'Token de sesión no disponible' };
    }

    const response = await apiFetch(`${URL_BASE}/api/v2/lecturas/generar-facturas-masivo`, {
      method: 'POST',
      token_app,
      token_session,
      body: { ruta_id, periodo, fecha_emision, recalcular, motivo_recalculo }
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || data.error || 'Error al generar facturas' };
    }

    return {
      success: true,
      message: data.message,
      data: data.data,
    };
  } catch (error) {
    console.error('Error en generarFacturasRuta:', error);
    return { success: false, message: 'Error de conexión al generar facturas' };
  }
};
