import { leerToken } from '../../auth/appKey.js';
import { apiFetch, getJson } from '../http.js';
const URL_LECTURAS = import.meta.env.VITE_API_FETCH_LECTURAS; // URL del endpoint de lecturas
const URL_BASE = import.meta.env.VITE_URL_BASE_API_AGUAVP;

export const modificarLectura = async (lecturaId, datos, token_session) => {
  try {
    const token_app = leerToken();
    if (!token_app) return { success: false, message: 'Token de aplicación no disponible' };
    if (!token_session) return { success: false, message: 'Token de sesión no disponible' };

    const response = await apiFetch(`${URL_BASE}/api/v2/lecturas/modificar/${lecturaId}`, {
      method: 'PUT',
      token_app,
      token_session,
      body: datos
    });

    const data = await response.json();
    if (!response.ok) {
      let msg = data.error || data.message || 'Error al modificar la lectura';
      if (data.detalles?.length) msg += ' — ' + data.detalles.map(d => `${d.campo}: ${d.mensaje}`).join('; ');
      return { success: false, message: msg };
    }
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error en modificarLectura:', error);
    return { success: false, message: 'Error al modificar la lectura' };
  }
};

/**************************************************************************************************************
|      Funcion Fetch lecturas
************************************************************************************************************* */
export const fetchLecturas = async (token_session, isRetry = false) => {
  try {
    const token_app = leerToken();
    if (!token_app) {
      console.error("Token app no disponible(ipcmain-fetch-lecturas)");
      return [];
    }
    if (!token_session) {
      console.error("Token de sesión no disponible(ipcmain-fetch-lecturas)");
      return [];
    }

    // Esto debe ser un array de lecturas
    return await getJson(URL_LECTURAS, { token_app, token_session, isRetry });
  } catch (error) {
    console.error("Error en fetchLecturas:", error," (ipcmain-fetch-lecturas)");
    return [];
  }
};

export const validarCobranzaPeriodoAnterior = async (ruta_id, periodo, token_session) => {
  try {
    const token_app = leerToken();
    if (!token_app) return { success: false, message: 'Token de aplicación no disponible' };
    if (!token_session) return { success: false, message: 'Token de sesión no disponible' };

    const url = new URL(`${URL_BASE}/api/v2/lecturas/validar-cobranza`);
    url.searchParams.append('ruta_id', ruta_id);
    url.searchParams.append('periodo', periodo);

    const response = await apiFetch(url.toString(), { token_app, token_session });

    if (!response.ok) {
      const errorBody = await response.text();
      return { success: false, message: `Error HTTP ${response.status}: ${errorBody}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error en validarCobranzaPeriodoAnterior:', error);
    return { success: false, message: 'Error al validar cobranza' };
  }
};

// Respuesta por defecto cuando no se puede consultar el estado de periodos
const estadoPeriodosPorDefecto = () => {
  const ahora = new Date();
  return {
    success: true,
    periodos: {},
    ultimoPeriodoRegistrado: null,
    ultimoPeriodoFacturado: null,
    siguientePeriodo: `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`
  };
};

export const obtenerEstadoPeriodosLecturas = async (token_session) => {
  try {
    const token_app = leerToken();

    if (!token_app || !token_session) {
      return estadoPeriodosPorDefecto();
    }

    const response = await apiFetch(`${URL_BASE}/api/v2/lecturas/estado-periodos`, {
      token_app,
      token_session
    });

    if (!response.ok) {
      console.warn("API /estado-periodos respondió con status:", response.status);
      return estadoPeriodosPorDefecto();
    }

    return await response.json();
  } catch (error) {
    console.error("Error en obtenerEstadoPeriodosLecturas fetch:", error);
    return estadoPeriodosPorDefecto();
  }
};
