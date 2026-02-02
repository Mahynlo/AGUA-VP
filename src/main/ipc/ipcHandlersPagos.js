import { ipcMain} from 'electron';
import {fetchPagos } from "../../fetch/pagos.js"; // Importa la función fetchPagos
import {registerPagos } from "../../register/pagos.js"; // Importa la función registerPagos
export default function IpcHandlerPagos () {
    /**************************************************************************************************************
     * Fetch pagos
     * ************************************************************************************************************
     */

    // Evento para obtener pagos desde la base de datos
    ipcMain.handle("fetch-pagos", async (event, token_session, params) => {
        if (!token_session) {
            return { success: false, message: "El token de sesión es obligatorio.(ipcmain-fetch-pagos)" };
        }
        return await fetchPagos(token_session, params); // Pasar el token y parámetros como argumentos
    });

    // 📌 Manejar el registro de un pago
    ipcMain.handle("register-pago", async (event, pago, token_session) => {
        const { factura_id,fecha_pago,cantidad_entregada,metodo_pago,comentario,modificado_por } = pago;

        // Validación de campos obligatorios (en el lado de Electron)
        if (!factura_id || !fecha_pago || !cantidad_entregada || !metodo_pago || !comentario || !modificado_por) {
            return { success: false, message: "Todos los campos son obligatorios.(ipcmain-register-pago)" };
        }
        return await registerPagos(pago, token_session);
    });
}