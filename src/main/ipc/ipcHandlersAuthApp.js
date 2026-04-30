//file : ipcHandlersAuthApp.js
// Este archivo se encarga de manejar los eventos IPC relacionados con la autenticación de la aplicación
import { ipcMain } from 'electron';
import {
  leerToken,
  registrarApp,
  borrarToken,
  leerId,
  ensureAppToken,
  recuperarORegistrarTokenApp
} from '../../appConfig/authApp'; // Ajusta la ruta si es necesario

const URL_BASE_API_AGUAVP = (import.meta.env.VITE_URL_BASE_API_AGUAVP || 'http://localhost:3000').replace(/\/$/, '');

function isAppKeyErrorMessage(message = '') {
  const msg = String(message).toLowerCase();
  return msg.includes('appkey') || msg.includes('app key') || msg.includes('midappkey');
}

async function requestServerStatusWithToken(token) {
  const response = await fetch(`${URL_BASE_API_AGUAVP}/api/v2/app/status`, {
    method: 'GET',
    headers: {
      'x-app-key': `AppKey ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const rawBody = await response.text();
  let data = null;
  try {
    data = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    data = null;
  }

  return { response, data, rawBody };
}

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

  // Garantiza token de app (si falta, intenta registrar)
  ipcMain.handle('auth-app:ensure-token', async (event, nombreApp = 'Electron App') => {
    return await ensureAppToken(nombreApp);
  });

  // Flujo resiliente (intenta recuperar token, y si falla re-registra)
  ipcMain.handle('auth-app:recover-or-register', async (event, nombreApp = 'Electron App') => {
    return await recuperarORegistrarTokenApp(nombreApp);
  });

  ipcMain.handle('auth-app:borrar-token', () => {
    return borrarToken();
  });

  // 🔍 Verificar estado del servidor
  ipcMain.handle('check-server-status', async () => {
    try {
      const ensured = await ensureAppToken('Electron App');
      const token = ensured?.token || leerToken();

      if (!token) {
        return { success: false, message: 'Token de app no disponible' };
      }

      const firstTry = await requestServerStatusWithToken(token);

      if (!firstTry.response.ok) {
        const shouldRetryAppKey =
          firstTry.response.status === 401 ||
          firstTry.response.status === 403 ||
          isAppKeyErrorMessage(firstTry.data?.error || firstTry.data?.message || firstTry.rawBody);

        if (shouldRetryAppKey) {
          const recovered = await recuperarORegistrarTokenApp('Electron App');
          if (recovered?.success && recovered.token) {
            const secondTry = await requestServerStatusWithToken(recovered.token);
            if (secondTry.response.ok) {
              return { success: true, ...secondTry.data };
            }
          }
        }

        return {
          success: false,
          status: 'ERROR',
          message: firstTry.data?.error || firstTry.data?.message || firstTry.rawBody || 'Error verificando estado del servidor'
        };
      }

      return { success: true, ...firstTry.data };
    } catch (error) {
      console.error('❌ Error al verificar estado del servidor:', error);
      return { success: false, status: 'ERROR', error: error.message };
    }
  });
}
