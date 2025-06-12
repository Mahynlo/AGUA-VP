//file : ipcHandlersAuthApp.js
// Este archivo se encarga de manejar los eventos IPC relacionados con la autenticación de la aplicación
import { ipcMain } from 'electron';
import { leerToken, registrarApp,borrarToken,leerId } from '../../appConfig/authApp'; // Ajusta la ruta si es necesario

export default function IpcHandlersAuthApp() {
  // 🧩 Leer token previamente guardado
  ipcMain.handle('auth-app:leer-token', async () => {
    const token = leerToken();
    if (token) {
      return { success: true, token }; // Retorna el token si existe
    } else {
      return { success: false, message: 'No se encontró token de aplicación' };
    }
  });

  ipcMain.handle('auth-app:leer-id', async () => {
    const id = leerId();
    if (id) {
      return { success: true, id }; // Retorna el token si existe
    } else {
      return { success: false, message: 'No se encontró ID de aplicación' };
    }
  });

  // 🔐 Registrar la app con el backend
  ipcMain.handle('auth-app:registrar-app', async (event, nombreApp = 'Electron App') => {
    const resultado = await registrarApp(nombreApp);
    return resultado; // { success: true/false, token, app_id, message }
  });

  ipcMain.handle('auth-app:borrar-token', () => {
    return borrarToken();
  });
}
