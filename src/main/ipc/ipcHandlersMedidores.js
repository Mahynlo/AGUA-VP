import { ipcMain} from 'electron';
import { registerMedidor  } from '../../register/medidor.js'; // Importa la función registerMedidor
import { fetchMedidores } from '../../fetch/medidores.js';
import { updateMedidor } from '../../update/medidores.js';
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
}
