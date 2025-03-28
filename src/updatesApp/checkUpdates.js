import { dialog } from 'electron'
import { autoUpdater } from 'electron-updater'

/**************************************************************************************************************
 * Funcion de Actualizaciones automáticas
 * ************************************************************************************************************
 */

// Función para verificar actualizaciones
function checkForUpdates(mainWindow) {

  autoUpdater.setFeedURL({ // Configuracion de la actualización automática con GitHub
    provider: 'github',
    owner: 'Mahynlo',
    repo: 'AGUA-VP',
    token: import.meta.env.VITE_GITHUB_TOKEN
  })

  autoUpdater.checkForUpdatesAndNotify() // Comprobar actualizaciones y notificar al usuario

  // Notificar cuando haya una actualización disponible
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Actualización disponible',
      message: `Nueva versión ${info.version} disponible. Se descargará en segundo plano.`,
      buttons: ['OK']
    })
  })

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
          autoUpdater.quitAndInstall()
        }
      })
  })

  // Manejar errores en la actualización
  autoUpdater.on('error', (err) => {
    console.error('Error en la actualización:', err)
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Error en actualización',
      message: `Hubo un problema al buscar actualizaciones: ${err.message}`
    })
  })
}

export { checkForUpdates };