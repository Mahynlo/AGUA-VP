import { ipcMain} from 'electron';

//Fetch de clientes
import { fetchClientes } from '../../fetch/clientes.js'; // Importa la función fetchClientes
//registro y actualizar
import { registerClientes } from '../../register/cliente.js'; // Importa la función registerClientes
import { updateCliente } from '../../update/cliente.js'; // Importa la función updateCliente

export default function IpcHandlerClientes () {
    /**************************************************************************************************************
     * Fetch clientes
     * ************************************************************************************************************
     */
    // Evento para obtener clientes desde la base de datos
    ipcMain.handle("fetch-clientes", async (event, token_session) => {
      return await fetchClientes(token_session); // Pasar el token recibido como argumento
    });

    // 📌 Manejar la actualización de un cliente
    ipcMain.handle("update-cliente", async (event, data) => {
      const { id,nuevosDatos, token_session } = data;
      return await updateCliente(id,nuevosDatos, token_session);
    });

    ipcMain.handle("register-cliente", async (event, data) => {
      const { cliente, token_session } = data;

      // Validación de campos obligatorios (en el lado de Electron)
      if (!cliente.nombre || !cliente.direccion || !cliente.telefono || !cliente.ciudad || !cliente.correo) {
        return { success: false, message: "Todos los campos son obligatorios." };
      }

      return await registerClientes(cliente, token_session);
    });
}