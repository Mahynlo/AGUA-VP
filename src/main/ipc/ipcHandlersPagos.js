import { ipcMain} from 'electron';
import {fetchPagos } from "../../fetch/pagos.js"; // Importa la función fetchPagos
import {registerPagos, registerPagoDistribuido } from "../../register/pagos.js"; // Importa funciones de registro de pagos
import { runWithAppKeyFlow } from './appKeyFlow.js';
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
        return await runWithAppKeyFlow(
            () => fetchPagos(token_session, params),
            { fallbackValue: { success: false, message: 'No se pudieron cargar pagos.' } }
        ); // Pasar el token y parámetros como argumentos
    });

    // 📌 Manejar el registro de un pago
    ipcMain.handle("register-pago", async (event, pago, token_session) => {
        const { factura_id, fecha_pago, cantidad_entregada, metodo_pago, modificado_por } = pago;

        // Validar solo los campos realmente obligatorios (comentario es opcional)
        if (!factura_id || !fecha_pago || !cantidad_entregada || !metodo_pago || !modificado_por) {
            return { success: false, message: "Faltan campos obligatorios.(ipcmain-register-pago)" };
        }
        return await runWithAppKeyFlow(() => registerPagos(pago, token_session));
    });

    ipcMain.handle("register-pago-distribuido", async (event, pagoDistribuido, token_session) => {
        const { cliente_id, fecha_pago, cantidad_entregada, metodo_pago, modificado_por } = pagoDistribuido || {};

        if (!cliente_id || !fecha_pago || !cantidad_entregada || !metodo_pago || !modificado_por) {
            return { success: false, message: "Faltan campos obligatorios.(ipcmain-register-pago-distribuido)" };
        }

        return await runWithAppKeyFlow(() => registerPagoDistribuido(pagoDistribuido, token_session));
    });
}