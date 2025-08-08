import { ipcMain} from 'electron';

// Fetch de facturas
import {fetchLecturas} from '../../fetch/lecturas.js'; // Importa la función fetchLecturas
// registro y actualizar
import {registerLectura} from '../../register/lecturas.js'; // Importa la función registerLectura

export default function IpcHandlerLecturas () {
    /**************************************************************************************************************
     * Fetch lecturas
     * ************************************************************************************************************
     */
    // Evento para obtener lecturas desde la base de datos
    ipcMain.handle("fetch-lecturas", async (event, token_session) => {
        return await fetchLecturas(token_session); // Pasar el token recibido como argumento
    });

    // 📌 Manejar el registro de una lectura
    ipcMain.handle("register-lectura", async (event, lectura, token_session) => {
        const {medidor_id, ruta_id, consumo_m3, fecha_lectura, periodo, modificado_por} = lectura;
        console.log("📌 Registrando lectura con datos:", lectura);

        // Validación de campos obligatorios (en el lado de Electron)
        if (!medidor_id || !ruta_id || !consumo_m3 || !fecha_lectura || !periodo || !modificado_por) {
            return { success: false, message: "Todos los campos son obligatorios.(ipcmain-register-lectura)" };
        }
        return await registerLectura(lectura, token_session);
    });
}