import { ipcMain} from 'electron';
import { registerTarifas,registrarRangosTarifa  } from '../../register/tarifas.js'; // Importa las funciones registerTarifa y registrarRangosTarifa
import  {fetchTarifas } from '../../fetch/tarifas.js'; // Importa la función fetchTarifas
import  {updateTarifa,updateRangosTarifa } from '../../update/tarifas.js'; // Importa las funciones updateTarifa y updateRangosTarifa
import { runWithAppKeyFlow } from './appKeyFlow.js';


/**************************************************************************************************************
| Registro Tarifas
* ************************************************************************************************************/
export default function IpcHandlersTarifas () {
    
    // Registrar una nueva tarifa
    ipcMain.handle("register-tarifa", async (event, data) => {
        const { tarifa, token_session } = data;

        // Validación de campos obligatorios (en el lado de Electron)
        if (!tarifa.nombre || !tarifa.descripcion || !token_session  ) {
            return { success: false, message: "Todos los campos son obligatorios." };
        }

        return await runWithAppKeyFlow(() => registerTarifas(tarifa, token_session));
    });

    // Registrar rangos de tarifa
    ipcMain.handle("registrar-rangos-tarifa", async (event, data) => {
        try {
            const { rangos, tarifaId, token_session } = data;

            console.log("Datos recibidos en registrar-rangos-tarifa:", data);

            if (!tarifaId || !Array.isArray(rangos) || rangos.length === 0) {
            return { success: false, message: "Tarifa ID y rangos son obligatorios." };
            }

            return await runWithAppKeyFlow(() => registrarRangosTarifa(rangos, tarifaId, token_session));
        } catch (error) {
            console.error("Error en registrar-rangos-tarifa:", error);
            return { success: false, message: "Ocurrió un error inesperado al registrar los rangos." };
        }
    });

    // Obtiene todas las tarifas (paginadas)
    ipcMain.handle("fetch-tarifas", async (event, data) => {
        const { token_session, params } = data; // params ahora viene en data
        // Validación de token de sesión
        if (!token_session) {
            return { success: false, message: "Token de sesión es obligatorio." };
        }

        return await runWithAppKeyFlow(
            () => fetchTarifas(token_session, params),
            { fallbackValue: { success: false, message: 'No se pudieron cargar tarifas.' } }
        );
    });

    // Actualiza una tarifa existente
    ipcMain.handle("update-tarifa", async (event, data) => {
        try {
            const { id, nuevosDatos, token_session } = data;
            if (!id || !nuevosDatos || !token_session) {
            return { success: false, message: "ID, nuevos datos y token de sesión son obligatorios." };
            }
            return await runWithAppKeyFlow(() => updateTarifa(id, nuevosDatos, token_session));
        } catch (error) {
            console.error("Error en ipcMain 'update-tarifa':", error);
            return { success: false, message: "Error inesperado en el proceso de actualización." };
        }
    });

    // Actualiza los rangos de una tarifa
    ipcMain.handle("update-rangos-tarifa", async (event, data) => {
        try {
            const { id, rangos, token_session } = data;
            if (!id || !Array.isArray(rangos) || rangos.length === 0 || !token_session) {
            return { success: false, message: "ID, rangos y token de sesión son obligatorios." };
            }
            return await runWithAppKeyFlow(() => updateRangosTarifa(id, rangos, token_session));
        } catch (error) {
            console.error("Error en ipcMain 'update-rangos-tarifa':", error);
            return { success: false, message: "Error inesperado en el proceso de actualización de rangos." };
        }
    });



}

