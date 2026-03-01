import { leerToken } from '../appConfig/authApp';
const URL_REGISTRAR_LECTURA = import.meta.env.VITE_API_REGISTRAR_LECTURAS; // URL del endpoint de registro de lecturas
/**************************************************************************************************************
 * registro de lectura
 *  
 * ************************************************************************************************************
*/
//funcion para registrar lectura
export const registerLectura = async (lectura, token_session) => {

    try {
        const token_app = leerToken();
    
        if (!token_app) {
          return { success: false, message: "Token de aplicación no disponible(ipcmain-lectura)" };
        }
    
        if (!token_session) {
          return { success: false, message: "Token de sesión no disponible(ipcmain-lectura)" };
        }
    
        //console.log("Datos del lecturas(registro):", lecturas); // Para depuración, puedes eliminarlo después

        const response = await fetch(URL_REGISTRAR_LECTURA, {
          method: "POST",
          headers: {
            "x-app-key": `AppKey ${token_app}`,
            "Authorization": `Bearer ${token_session}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(lectura)
        });
    
        const data = await response.json();
    
        if (!response.ok) {
          return { success: false, message: data.error || data.message || 'Error al registrar lectura' };
        }

        return { success: true, message: data.message, lecturaID: data.data?.lectura_id };
    } catch (error) {
        console.error("Error al registrar lectura(ipcmain):", error);
        return { success: false, message: "Hubo un error al registrar la lectura(ipcmain)." };
    }
}