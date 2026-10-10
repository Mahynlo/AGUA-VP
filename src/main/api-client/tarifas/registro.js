import { leerToken } from '../../auth/appKey.js';
import { apiFetch } from '../http.js';
const URL_TARIFAS = import.meta.env.VITE_API_REGISTRAR_TARIFAS; // URL del endpoint de tarifas
const URL_REGISTRAR_RANGOS = import.meta.env.VITE_API_REGISTRAR_RANGOS_TARIFAS; // URL del endpoint para registrar rangos de tarifas

const registerTarifas = async (tarifa, token_session) => {
  try {
    const token_app = leerToken();

    if (!token_app) {
      console.error("Token app no disponible");
      return { success: false, message: "Token de aplicación no disponible" };
    }

    if (!token_session) {
      console.error("Token de sesión no disponible");
      return { success: false, message: "Token de sesión no disponible" };
    }

    // tarifa debe ser un objeto con los campos necesarios
    const response = await apiFetch(URL_TARIFAS, {
      method: "POST",
      token_app,
      token_session,
      body: tarifa
    });

    const data = await response.json();

    if (!response.ok) { // si los datos no son correctos
      return { success: false, message: data.error || "Error al registrar tarifa en el Servidor" };
    }

    return { success: true, message: data.mensaje, tarifaID: data.tarifaID };
  } catch (error) {
    console.error("Error al registrar tarifa:", error);
    return { success: false, message: "Hubo un error al registrar la tarifa" };
  }
}


const  registrarRangosTarifa= async(rangos, tarifaId, token_session)=> {
  try {
    const token_app = leerToken();

    if (!token_app || !token_session) {
      return { success: false, message: "Faltan credenciales" };
    }

    const response = await apiFetch(URL_REGISTRAR_RANGOS, {
      method: "POST",
      token_app,
      token_session,
      body: {
        tarifa_id: tarifaId,
        rangos: rangos
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.error || "Error al registrar los rangos" };
    }

    return { success: true, message: "Rangos registrados correctamente", data };
  } catch (error) {
    console.error("Error al registrar rangos:", error);
    return { success: false, message: "Error de conexión al registrar rangos" };
  }
}


export { registerTarifas, registrarRangosTarifa };
