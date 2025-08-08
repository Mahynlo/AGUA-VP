import { ipcMain} from 'electron';
import {fetchFacturas} from '../../fetch/facturas.js'; // Importa la función fetchFacturas
import {registerFacturas} from '../../register/facturas.js'; // Importa la función registerFacturas

export default function IpcHandlerFacturas () {
    /**************************************************************************************************************
     * Fetch facturas
     * ************************************************************************************************************
     */

    // Evento para obtener facturas desde la base de datos
    ipcMain.handle("fetch-facturas", async (event, token_session) => {
        return await fetchFacturas(token_session); // Pasar el token recibido como argumento
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