import { ipcMain} from 'electron';
import {fetchFacturas} from '../../fetch/facturas.js'; // Importa la función fetchFacturas
import {registerFacturas} from '../../register/facturas.js'; // Importa la función registerFacturas

export default function IpcHandlerFacturas () {
    /**************************************************************************************************************
     * Fetch facturas
     * ************************************************************************************************************
     */

    // Evento para obtener facturas desde la base de datos (con paginación)
    ipcMain.handle("fetch-facturas", async (event, data) => {
        const { token_session, params } = data;
        
        if (!params) {
            return { success: false, message: "Los parámetros son obligatorios.(ipcmain-fetch-facturas)" };
        }
        if (!token_session) {
            return { success: false, message: "El token de sesión es obligatorio.(ipcmain-fetch-facturas)" };
        }
        
        return await fetchFacturas(token_session, params);
    });

    // 📌 Manejar el registro de una factura
    ipcMain.handle("register-factura", async (event, factura, token_session) => {
        const {lectura_id, cliente_id, tarifa_id, consumo_m3, fecha_emision, modificado_por } = factura;

        // Validación de campos obligatorios (en el lado de Electron)
        if (!lectura_id || !cliente_id || !tarifa_id || !consumo_m3 || !fecha_emision || !modificado_por) {
            return { success: false, message: "Todos los campos son obligatorios.(ipcmain-register-factura)" };
        }
        return await registerFacturas(factura, token_session);
    });
}