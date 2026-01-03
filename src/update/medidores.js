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

export { updateMedidor };
