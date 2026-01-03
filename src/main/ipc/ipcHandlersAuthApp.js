//file : ipcHandlersAuthApp.js
// Este archivo se encarga de manejar los eventos IPC relacionados con la autenticación de la aplicación
import { ipcMain } from 'electron';
import { leerToken, registrarApp,borrarToken,leerId } from '../../appConfig/authApp'; // Ajusta la ruta si es necesario

const URL_BASE_API_AGUAVP = import.meta.env.VITE_URL_BASE_API_AGUAVP;

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

  // 🔍 Verificar estado del servidor
  ipcMain.handle('check-server-status', async () => {
    try {
      const token = leerToken();
      if (!token) {
        return { success: false, message: 'Token de app no disponible' };
      }

      const response = await fetch(`${URL_BASE_API_AGUAVP}/api/v2/app/status`, {
        method: 'GET',
        headers: {
          'x-app-key': `AppKey ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return { success: false, status: 'ERROR' };
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('❌ Error al verificar estado del servidor:', error);
      return { success: false, status: 'ERROR', error: error.message };
    }
  });
}
