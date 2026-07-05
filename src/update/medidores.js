import { leerToken } from '../appConfig/authApp';

// Env var for updating meter
const URL_ACTUALIZAR_MEDIDOR = import.meta.env.VITE_API_ACTUALIZAR_MEDIDOR; 

/**
 * Función para Actualizar Medidor
 * @param {string} id - ID del medidor
 * @param {object} nuevosDatos - Datos a actualizar
 * @param {string} token_session - Token de sesión del usuario
 */
const updateMedidor = async (id, nuevosDatos, token_session) => {
  try {
    const token_app = leerToken(); // Token app

    // console.log("URL Update Medidor:", URL_ACTUALIZAR_MEDIDOR);

    const response = await fetch(`${URL_ACTUALIZAR_MEDIDOR}/${id}`, {
      method: "PUT",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(nuevosDatos),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || data.message || "Error al modificar medidor" };
    }

    return { success: true, message: "Medidor modificado correctamente", data };
  } catch (error) {
    console.error("Error en updateMedidor:", error);
    return { success: false, message: "Error de red o del servidor" };
  }
};

const deleteMedidor = async (data, token_session) => {
  const { id, razon } = data;
  try {
    const token_app = leerToken();
    const baseURL = URL_ACTUALIZAR_MEDIDOR.replace('/modificar', '');
    const response = await fetch(`${baseURL}/${id}/eliminar`, {
      method: "DELETE",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ razon }),
    });

    const payload = await response.json();
    if (!response.ok) {
      return { success: false, message: payload.error || payload.message || "Error al eliminar medidor" };
    }
    return { success: true, message: "Medidor eliminado correctamente", medidor_id: payload.medidor_id };
  } catch (error) {
    console.error("Error en deleteMedidor:", error);
    return { success: false, message: "Error de red o del servidor" };
  }
};

const reactivateMedidor = async (id, token_session) => {
  try {
    const token_app = leerToken();
    const baseURL = URL_ACTUALIZAR_MEDIDOR.replace('/modificar', '');
    const response = await fetch(`${baseURL}/${id}/restaurar`, {
      method: "PUT",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      }
    });

    const payload = await response.json();
    if (!response.ok) {
      return { success: false, message: payload.error || payload.message || "Error al restaurar medidor" };
    }
    return { success: true, message: "Medidor restaurado correctamente", medidor_id: payload.medidor_id };
  } catch (error) {
    console.error("Error en reactivateMedidor:", error);
    return { success: false, message: "Error de red o del servidor" };
  }
};

const purgeMedidor = async (id, token_session) => {
  try {
    const token_app = leerToken();
    const baseURL = URL_ACTUALIZAR_MEDIDOR.replace('/modificar', '');
    const response = await fetch(`${baseURL}/${id}/purgar`, {
      method: "DELETE",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      }
    });

    const payload = await response.json();
    if (!response.ok) {
      return { success: false, message: payload.error || payload.message || "Error al eliminar definitivamente" };
    }
    return { success: true, message: "Medidor eliminado definitivamente", medidor_id: payload.medidor_id };
  } catch (error) {
    console.error("Error en purgeMedidor:", error);
    return { success: false, message: "Error de red o del servidor" };
  }
};

export { updateMedidor, deleteMedidor, reactivateMedidor, purgeMedidor };
