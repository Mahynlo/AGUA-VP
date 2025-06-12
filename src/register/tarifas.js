import { leerToken } from '../appConfig/authApp';
const URL_TARIFAS = import.meta.env.VITE_API_REGISTRAR_TARIFAS; // URL del endpoint de tarifas
const URL_REGISTRAR_RANGOS = import.meta.env.VITE_API_REGISTRAR_RANGOS_TARIFAS; // URL del endpoint para registrar rangos de tarifas

const registerTarifas = async (tarifa, token_session) => {
  try {
    const token_app = leerToken(); // Asegúrate de que esta función retorne el token correctamente

    if (!token_app) {
      console.error("Token app no disponible");
      return { success: false, message: "Token de aplicación no disponible" };
    }

    if (!token_session) {
      console.error("Token de sesión no disponible");
      return { success: false, message: "Token de sesión no disponible" };
    }

    const response = await fetch(URL_TARIFAS, {
      method: "POST",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(tarifa) // tarifa debe ser un objeto con los campos necesarios
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
    const token_app = leerToken(); // Asegúrate de que esta función retorne el token correctamente

    if (!token_app || !token_session) {
      return { success: false, message: "Faltan credenciales" };
    }

    const response = await fetch(URL_REGISTRAR_RANGOS, {
      method: "POST",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tarifa_id: tarifaId,
        rangos: rangos
      })
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