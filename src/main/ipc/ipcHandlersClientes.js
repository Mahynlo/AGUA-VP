import { ipcMain} from 'electron';

//Fetch de clientes
import { fetchClientes, fetchClientesEstadisticas } from '../../fetch/clientes.js';
//registro y actualizar
import { registerClientes } from '../../register/cliente.js'; // Importa la función registerClientes
import { updateCliente, asignarTarifaCliente } from '../../update/cliente.js'; // Importa la función updateCliente

export default function IpcHandlerClientes () {
    /**************************************************************************************************************
     * Fetch clientes
     * ************************************************************************************************************
     */
    // Evento para obtener clientes desde la base de datos
    ipcMain.handle("fetch-clientes", async (event, token_session) => {
      return await fetchClientes(token_session); // Pasar el token recibido como argumento
    });

    // Evento para obtener estadísticas de clientes
    ipcMain.handle("fetch-clientes-estadisticas", async (event, token_session) => {
      return await fetchClientesEstadisticas(token_session);
    });

    // 📌 Manejar la actualización de un cliente
    ipcMain.handle("update-cliente", async (event, data) => {
      const { id,nuevosDatos, token_session } = data;
      return await updateCliente(id,nuevosDatos, token_session);
    });

    // 📌 Manejar la asignación de tarifa a un cliente
    ipcMain.handle("asignar-tarifa-cliente", async (event, data) => {
      const { clienteId, tarifaId, token_session } = data;
      console.log("🔄 Asignando tarifa", tarifaId, "al cliente", clienteId);
      return await asignarTarifaCliente(clienteId, tarifaId, token_session);
    });

    ipcMain.handle("register-cliente", async (event, data) => {
      const { cliente, token_session } = data;

      // Validación de campos obligatorios (en el lado de Electron)
      if (!cliente.nombre || !cliente.direccion || !cliente.telefono || !cliente.ciudad || !cliente.correo || !cliente.tarifa_id) {
        return { success: false, message: "Todos los campos son obligatorios." };
      }

      return await registerClientes(cliente, token_session);
    });
}