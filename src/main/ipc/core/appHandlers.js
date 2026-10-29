import { ipcMain, BrowserWindow, app } from 'electron'
import { zoomIn, zoomOut, zoomReset, getZoom } from '../../managers/zoomManager.js'

// Zoom de la ventana y versión de la aplicación
export default function registerAppHandlers() {
  // === ZOOM HANDLERS ===
  // La lógica (clamp, persistencia y notificación) vive en zoomManager,
  // compartida con los atajos de teclado del menú nativo.
  ipcMain.handle('zoom-in', (event) => zoomIn(BrowserWindow.fromWebContents(event.sender)))

  ipcMain.handle('zoom-out', (event) => zoomOut(BrowserWindow.fromWebContents(event.sender)))

  ipcMain.handle('zoom-reset', (event) => zoomReset(BrowserWindow.fromWebContents(event.sender)))

  ipcMain.handle('get-zoom-level', (event) => getZoom(BrowserWindow.fromWebContents(event.sender)))

  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })
}
