import { leerToken } from '../appConfig/authApp';
const URL_REGISTRAR_FACTURA = import.meta.env.VITE_API_REGISTRAR_FACTURAS; // URL del endpoint de registro de facturas

export const registerFacturas = async (factura, token_session) => {
    try {
        const token_app = leerToken();
    
        if (!token_app) {
            return { success: false, message: "Token de aplicación no disponible(ipcmain-factura)" };
        }
    
        if (!token_session) {
            return { success: false, message: "Token de sesión no disponible(ipcmain-factura)" };
        }
            
        //console.log("Datos del factura(registro):", factura); // Para depuración, puedes eliminarlo después

        const response = await fetch(URL_REGISTRAR_FACTURA, {
            method: "POST",
            headers: {
            "x-app-key": `AppKey ${token_app}`,
            "Authorization": `Bearer ${token_session}`,
            "Content-Type": "application/json"
            },
            body: JSON.stringify(factura)
        });
    
        const data = await response.json();
    
        if (!response.ok) {
            return { success: false, message: data.error || "Error al registrar factura(ipcmain)" };
        }

        return { success: true, message: data.mensaje, facturaID: data.id };
    } catch (error) {
        console.error("Error al registrar factura(ipcmain):", error);
        return { success: false, message: "Hubo un error al registrar la lectura(ipcmain)." };
    }
}