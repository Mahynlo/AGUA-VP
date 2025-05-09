import { dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import { net } from 'electron';

/**************************************************************************************************************
  Funcion de Actualizaciones automáticas
 
**/

// Función para verificar la conexión a Internet
function isOnline() {
  return new Promise((resolve) => {
    const request = net.request('https://www.google.com');
    request.on('response', (response) => {
      if (response.statusCode === 200) {
        resolve(true); // Conexión exitosa
      } else {
        resolve(false); // Conexión fallida
      }
    });
    request.on('error', () => {
      resolve(false); // Error de conexión
    });
    request.end();
  });
}

// Función para verificar actualizaciones
async function checkForUpdates(mainWindow) {
  // Verificar si hay conexión a Internet
  const online = await isOnline();
  if (!online) {
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'No hay conexión',
      message: 'No tienes conexión a Internet.',
      buttons: ['OK']
    });
    return; // No hacer nada si no hay conexión
  }

  autoUpdater.setFeedURL({ // Configuración de la actualización automática con GitHub
    provider: 'github',
    owner: 'Mahynlo',
    repo: 'AGUA-VP',
    token: import.meta.env.VITE_GITHUB_TOKEN
  });

  autoUpdater.checkForUpdatesAndNotify(); // Comprobar actualizaciones y notificar al usuario

  // Notificar cuando haya una actualización disponible
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Actualización disponible',
      message: `Nueva versión ${info.version} disponible. Se descargará en segundo plano.`,
      buttons: ['OK']
    });
  });

  // Notificar cuando la actualización se haya descargado
  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox(mainWindow, {
        type: 'question',
        title: 'Instalar actualización',
        message: 'La actualización se ha descargado. ¿Desea instalarla ahora?',
        buttons: ['Reiniciar', 'Más tarde']
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  // Manejar errores en la actualización
  autoUpdater.on('error', (err) => {
    console.error('Error en la actualización:', err);
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Error en actualización',
      message: `Hubo un problema al buscar actualizaciones: ${err.message}`,
    });
  });
}

export { checkForUpdates };
