import { leerToken } from '../appConfig/authApp';

const API_URL = "http://localhost:3000/api/tarifas/modificar-rangos"; // O usa variable de entorno
const URL_TARIFAS_ACTUALIZAR = import.meta.env.VITE_API_ACTUALIZAR_TARIFA; // URL del endpoint de tarifas
const URL_RANGOS_ACTUALIZAR = import.meta.env.VITE_API_ACTUALIZAR_RANGOS_TARIFAS; // URL del endpoint para registrar rangos de tarifas

const updateTarifa = async (id, nuevosDatos, token_session) => {
  try {
    const token_app = leerToken();
    if (!token_app || !token_session || !id || !nuevosDatos) {
      return { success: false, message: "Faltan datos necesarios para actualizar tarifa" };
    }

    const response = await fetch(`${URL_TARIFAS_ACTUALIZAR}/${id}`, {
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

    const response = await fetch(`${URL_RANGOS_ACTUALIZAR}/${id}`, {
      method: "PUT",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({tarifa_id:id, rangos }),
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

export { updateTarifa, updateRangosTarifa };
