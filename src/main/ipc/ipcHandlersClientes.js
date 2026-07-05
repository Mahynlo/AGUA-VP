import { ipcMain} from 'electron';

//Fetch de clientes
import { fetchClientes, fetchClientesEstadisticas, fetchClientesEliminados } from '../../fetch/clientes.js';
//registro y actualizar
import { registerClientes } from '../../register/cliente.js'; // Importa la función registerClientes
import { updateCliente, asignarTarifaCliente, deleteCliente, reactivateCliente, purgeCliente } from '../../update/cliente.js'; // Importa la función updateCliente
import { runWithAppKeyFlow } from './appKeyFlow.js';

export default function IpcHandlerClientes () {
    /**************************************************************************************************************
     * Fetch clientes
     * ************************************************************************************************************
     */
    // Evento para obtener clientes desde la base de datos
    ipcMain.handle("fetch-clientes", async (event, token_session, params) => {
      return await runWithAppKeyFlow(
        () => fetchClientes(token_session, params),
        { fallbackValue: [] }
      ); // Pasar el token recibido como argumento
    });

    // Evento para obtener estadísticas de clientes
    ipcMain.handle("fetch-clientes-estadisticas", async (event, token_session) => {
      return await runWithAppKeyFlow(
        () => fetchClientesEstadisticas(token_session),
        { fallbackValue: null }
      );
    });

    // 📌 Manejar la actualización de un cliente
    ipcMain.handle("update-cliente", async (event, data) => {
      const { id,nuevosDatos, token_session } = data;
      return await runWithAppKeyFlow(() => updateCliente(id,nuevosDatos, token_session));
    });

    // 📌 Manejar la asignación de tarifa a un cliente
    ipcMain.handle("asignar-tarifa-cliente", async (event, data) => {
      const { clienteId, tarifaId, token_session } = data;
      console.log("🔄 Asignando tarifa", tarifaId, "al cliente", clienteId);
      return await runWithAppKeyFlow(() => asignarTarifaCliente(clienteId, tarifaId, token_session));
    });

    ipcMain.handle("register-cliente", async (event, data) => {
      const { cliente, token_session } = data;

      // Validación de campos obligatorios (en el lado de Electron)
      if (!cliente.nombre || !cliente.direccion || !cliente.telefono || !cliente.ciudad || !cliente.correo || !cliente.tarifa_id) {
        return { success: false, message: "Todos los campos son obligatorios." };
      }

      return await runWithAppKeyFlow(() => registerClientes(cliente, token_session));
    });

    // 📌 Manejar la eliminación lógica de un cliente
    ipcMain.handle("delete-cliente", async (event, data) => {
      const { id, razon, token_session } = data;
      return await runWithAppKeyFlow(() => deleteCliente({ id, razon }, token_session));
    });

    // 📌 Manejar la restauración de un cliente
    ipcMain.handle("reactivate-cliente", async (event, data) => {
      const { id, token_session } = data;
      return await runWithAppKeyFlow(() => reactivateCliente(id, token_session));
    });

    // 📌 Manejar la eliminación física/definitiva de un cliente
    ipcMain.handle("purge-cliente", async (event, data) => {
      const { id, token_session } = data;
      return await runWithAppKeyFlow(() => purgeCliente(id, token_session));
    });

    // 📌 Manejar listado de clientes eliminados
    ipcMain.handle("fetch-clientes-eliminados", async (event, token_session) => {
      return await runWithAppKeyFlow(() => fetchClientesEliminados(token_session), { fallbackValue: { total: 0, clientes_eliminados: [] } });
    });
}