import { ipcMain} from 'electron';
import { registerMedidor  } from '../../register/medidor.js'; // Importa la función registerMedidor
import { fetchMedidores, fetchMedidoresEliminados } from '../../fetch/medidores.js';
import { updateMedidor, deleteMedidor, reactivateMedidor, purgeMedidor } from '../../update/medidores.js';
import { runWithAppKeyFlow } from './appKeyFlow.js';

export default function IpcHandlersMedidores () {
  ipcMain.handle("register-medidor", async (event, data) => {
    const { medidor, token_session } = data;

    console.log("Datos del medidor (registro):", medidor);

    try {
      if (
        !medidor.numero_serie ||
        !medidor.fecha_instalacion ||
        !medidor.latitud ||
        !medidor.longitud
      ) {
        throw new Error("Faltan datos obligatorios.");
      }

      const response = await runWithAppKeyFlow(
        () => registerMedidor(medidor, token_session)
      );

      return response;
    } catch (error) {
      console.error("Error al registrar medidor:", error.message);
      return {
        success: false,
        message: `Error al registrar el medidor: ${error.message}`
      };
    }
  });

   ipcMain.handle("fetch-medidores", async (event, token_session, params) => {
      return await runWithAppKeyFlow(
        () => fetchMedidores(token_session, params),
        { fallbackValue: [] }
      );
    });

    ipcMain.handle("update-medidor", async (event, data) => {
        const { id, medidor, token_session } = data;
      return await runWithAppKeyFlow(() => updateMedidor(id, medidor, token_session));
    });

    // 📌 Manejar la eliminación lógica de un medidor
    ipcMain.handle("delete-medidor", async (event, data) => {
      const { id, razon, token_session } = data;
      return await runWithAppKeyFlow(() => deleteMedidor({ id, razon }, token_session));
    });

    // 📌 Manejar la restauración de un medidor
    ipcMain.handle("reactivate-medidor", async (event, data) => {
      const { id, token_session } = data;
      return await runWithAppKeyFlow(() => reactivateMedidor(id, token_session));
    });

    // 📌 Manejar la eliminación física/definitiva de un medidor
    ipcMain.handle("purge-medidor", async (event, data) => {
      const { id, token_session } = data;
      return await runWithAppKeyFlow(() => purgeMedidor(id, token_session));
    });

    // 📌 Manejar listado de medidores eliminados
    ipcMain.handle("fetch-medidores-eliminados", async (event, token_session) => {
      return await runWithAppKeyFlow(() => fetchMedidoresEliminados(token_session), { fallbackValue: { total: 0, medidores_eliminados: [] } });
    });
}
