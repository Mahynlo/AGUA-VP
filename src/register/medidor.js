import { leerToken } from '../appConfig/authApp';
const URL_REGISTRAR_MEDIDOR = import.meta.env.VITE_API_REGISTRAR_MEDIDORES; // URL del endpoint de registro de medidores
/**************************************************************************************************************
 * registro de medidor
 * ************************************************************************************************************
 */
// Función para registrar medidores
const registerMedidor = async (medidor, token_session)  => {
  try {
    const token_app = leerToken();

    if (!token_app) {
      return { success: false, message: "Token de aplicación no disponible" };
    }

    if (!token_session) {
      return { success: false, message: "Token de sesión no disponible" };
    }


   
    //console.log("Datos del medidor(registro):", medidor); // Para depuración, puedes eliminarlo después


    const response = await fetch(URL_REGISTRAR_MEDIDOR, {
      method: "POST",
      headers: {
        "x-app-key": `AppKey ${token_app}`,
        "Authorization": `Bearer ${token_session}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(medidor)
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || "Error al registrar medidor" };
    }

    return { success: true, message: data.mensaje, medidorID: data.id };
  } catch (error) {
    console.error("Error al registrar medidor:", error);
    return { success: false, message: "Hubo un error al registrar el medidor." };
  }
};

export { registerMedidor };