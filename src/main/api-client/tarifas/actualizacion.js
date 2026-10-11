import { leerToken } from '../../auth/appKey.js';
import { apiFetch } from '../http.js';

const URL_TARIFAS_ACTUALIZAR = import.meta.env.VITE_API_ACTUALIZAR_TARIFA; // URL del endpoint de tarifas
const URL_RANGOS_ACTUALIZAR = import.meta.env.VITE_API_ACTUALIZAR_RANGOS_TARIFAS; // URL del endpoint para registrar rangos de tarifas
const URL_BASE = import.meta.env.VITE_URL_BASE_API_AGUAVP;

const updateTarifa = async (id, nuevosDatos, token_session) => {
  try {
    const token_app = leerToken();
    if (!token_app || !token_session || !id || !nuevosDatos) {
      return { success: false, message: "Faltan datos necesarios para actualizar tarifa" };
    }

    const response = await apiFetch(`${URL_TARIFAS_ACTUALIZAR}/${id}`, {
      method: "PUT",
      token_app,
      token_session,
      body: nuevosDatos
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || "Error al modificar tarifa" };
    }

    return { success: true, message: data.mensaje || "Tarifa modificada correctamente", cambios: data.cambios };
  } catch (error) {
    console.error("Error en updateTarifa:", error);
    return { success: false, message: "Error de red o del servidor" };
  }
};

const updateRangosTarifa = async (id, rangos, token_session) => {
  try {
    const token_app = leerToken();
    if (!token_app || !token_session || !id || !Array.isArray(rangos)) {
      return { success: false, message: "Faltan datos para actualizar rangos" };
    }

    const response = await apiFetch(`${URL_RANGOS_ACTUALIZAR}/${id}`, {
      method: "PUT",
      token_app,
      token_session,
      body: { tarifa_id: id, rangos }
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || "Error al modificar rangos de tarifa" };
    }

    return { success: true, message: data.mensaje || "Rangos modificados correctamente", cambios: data.cambios };
  } catch (error) {
    console.error("Error en updateRangosTarifa:", error);
    return { success: false, message: "Error de red o del servidor" };
  }
};

// Elimina una tarifa sin clientes ni facturas (la API rechaza con 409 si está en uso o es la única)
const eliminarTarifa = async (id, token_session) => {
  try {
    const token_app = leerToken();
    if (!token_app || !token_session || !id) {
      return { success: false, message: "Faltan datos para eliminar la tarifa" };
    }

    const response = await apiFetch(`${URL_BASE}/api/v2/tarifas/eliminar/${id}`, {
      method: "DELETE",
      token_app,
      token_session
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || "Error al eliminar la tarifa" };
    }

    return { success: true, message: data.mensaje || "Tarifa eliminada", rangos: data.rangos, historial: data.historial };
  } catch (error) {
    console.error("Error en eliminarTarifa:", error);
    return { success: false, message: "Error de red o del servidor" };
  }
};

export { updateTarifa, updateRangosTarifa, eliminarTarifa };
