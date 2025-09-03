import { leerToken } from '../appConfig/authApp';
const URL_REGISTRAR_PAGOS = import.meta.env.VITE_API_REGISTRAR_PAGOS; // URL del endpoint de registro de pagos
/**************************************************************************************************************
 * registro de pagos
 *  Función para registrar pagos de lecturas
 * *************************************************************************************************************/
//funcion para registrar pagos de lecturas
const registerPagos = async (pago, token_session) => {
     try {
        const token_app = leerToken();
    
        if (!token_app) {
            return { success: false, message: "Token de aplicación no disponible(ipcmain-pago)" };
        }
    
        if (!token_session) {
            return { success: false, message: "Token de sesión no disponible(ipcmain-pago)" };
        }
    
        //console.log("Datos del lecturas(registro):", lecturas); // Para depuración, puedes eliminarlo después

        const response = await fetch(URL_REGISTRAR_PAGOS, {
            method: "POST",
            headers: {
            "x-app-key": `AppKey ${token_app}`,
            "Authorization": `Bearer ${token_session}`,
            "Content-Type": "application/json"
            },
            body: JSON.stringify(pago)
        });
    
        const data = await response.json();
    
        if (!response.ok) {
            return { success: false, message: data.error || "Error al registrar pago(ipcmain)" };
        }

        return { success: true, message: data.mensaje, pagoID: data.id };
    } catch (error) {
        console.error("Error al registrar pago(ipcmain):", error);
        return { success: false, message: "Hubo un error al registrar el pago(ipcmain)." };
    }
}

export { registerPagos };