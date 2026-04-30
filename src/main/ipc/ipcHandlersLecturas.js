import { ipcMain} from 'electron';

// Fetch de facturas
import {fetchLecturas, modificarLectura} from '../../fetch/lecturas.js';
// registro y actualizar
import {registerLectura} from '../../register/lecturas.js'; // Importa la función registerLectura
import { generarFacturasRuta } from '../../fetch/generarFacturasRuta.js';
import { runWithAppKeyFlow } from './appKeyFlow.js';

export default function IpcHandlerLecturas () {
    /**************************************************************************************************************
     * Fetch lecturas
     * ************************************************************************************************************
     */
    // Evento para obtener lecturas desde la base de datos
    ipcMain.handle("fetch-lecturas", async (event, token_session) => {
        return await runWithAppKeyFlow(
            () => fetchLecturas(token_session),
            { fallbackValue: [] }
        ); // Pasar el token recibido como argumento
    });

    // 📌 Manejar el registro de una lectura
    ipcMain.handle("register-lectura", async (event, lectura, token_session) => {
        const { medidor_id, ruta_id, lectura_actual, consumo_m3, fecha_lectura, periodo, modificado_por } = lectura;

        // Validación de campos obligatorios (en el lado de Electron)
        if (!medidor_id || !ruta_id || !fecha_lectura || !periodo || !modificado_por) {
            return { success: false, message: "Todos los campos son obligatorios." };
        }
        // Se acepta flujo nuevo (lectura_actual) o flujo legacy (consumo_m3)
        if (lectura_actual === undefined && !consumo_m3) {
            return { success: false, message: "Debe proporcionar lectura_actual o consumo_m3." };
        }
        return await runWithAppKeyFlow(() => registerLectura(lectura, token_session));
    });

    // ✏️ Rectificar / modificar una lectura ya registrada (antes de generar factura)
    ipcMain.handle("modificar-lectura", async (event, lecturaId, datos, token_session) => {
        if (!lecturaId || !token_session) {
            return { success: false, message: 'Se requiere el ID de la lectura y el token de sesión.' };
        }
        if (!datos || Object.keys(datos).length === 0) {
            return { success: false, message: 'Debe proporcionar al menos un campo para modificar.' };
        }
        return await runWithAppKeyFlow(() => modificarLectura(lecturaId, datos, token_session));
    });

    // 🧾 Generar facturas para lecturas pendientes de una ruta
    ipcMain.handle("generar-facturas-ruta", async (event, params, token_session) => {
        const { ruta_id, periodo, fecha_emision, recalcular = false, motivo_recalculo = '' } = params || {};
        if (!ruta_id || !periodo || !fecha_emision) {
            return { success: false, message: 'ruta_id, periodo y fecha_emision son requeridos' };
        }
        return await runWithAppKeyFlow(
            () => generarFacturasRuta({ ruta_id, periodo, fecha_emision, recalcular, motivo_recalculo }, token_session)
        );
    });
}