import { ipcMain, BrowserWindow, dialog, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'
import {
  saveCustomLogo,
  clearCustomLogo,
  getCustomLogoBase64,
  getDefaultLogoBase64
} from '../../managers/logoManager.js'

const IMAGE_MIME_MAP = { jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', png: 'image/png' }

// Personalización visual: logo de la aplicación e imágenes del login
export default function registerBrandingHandlers() {
  // ============================================================
  // SELECCIONAR IMÁGENES DE LOGIN — multi-selección, devuelve array base64
  // ======================================================================
  ipcMain.handle('select-login-images', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Seleccionar Imágenes del Login',
      filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
      properties: ['openFile', 'multiSelections']
    })
    if (canceled || !filePaths.length) return { canceled: true }
    const results = await Promise.all(
      filePaths.map(async (filePath) => {
        const ext = path.extname(filePath).slice(1).toLowerCase()
        const mime = IMAGE_MIME_MAP[ext] || 'image/png'
        const data = await fs.promises.readFile(filePath)
        return `data:${mime};base64,${data.toString('base64')}`
      })
    )
    return { success: true, data: results }
  })

  // SELECCIONAR LOGO — abre diálogo de archivo, devuelve base64 y persiste en el sistema
  // ============================================================
  ipcMain.handle('select-logo', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Seleccionar Logo de la Aplicación',
      filters: [{ name: 'Imágenes (*.png, *.jpg, *.jpeg, *.webp)', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
      properties: ['openFile']
    })
    if (canceled || !filePaths.length) return { canceled: true }
    const filePath = filePaths[0]

    try {
      // Normalizar siempre a PNG estándar para compatibilidad total con PDFKit/pdfmake
      const img = nativeImage.createFromPath(filePath)
      if (img.isEmpty()) {
        throw new Error('La imagen no se pudo cargar o su formato no es compatible.')
      }
      const pngBuffer = img.toPNG()
      const base64Data = `data:image/png;base64,${pngBuffer.toString('base64')}`
      saveCustomLogo(base64Data)
      return { success: true, data: base64Data }
    } catch (imgErr) {
      console.warn('⚠️ Error procesando imagen con nativeImage, intentando lectura directa:', imgErr.message)
      try {
        const ext = path.extname(filePath).slice(1).toLowerCase()
        const mime = IMAGE_MIME_MAP[ext] || 'image/png'
        const data = await fs.promises.readFile(filePath)
        const base64Data = `data:${mime};base64,${data.toString('base64')}`
        saveCustomLogo(base64Data)
        return { success: true, data: base64Data }
      } catch (readErr) {
        return { success: false, error: readErr.message }
      }
    }
  })

  ipcMain.handle('save-custom-logo', async (_event, base64Data) => {
    try {
      saveCustomLogo(base64Data)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('get-custom-logo', async () => {
    return getCustomLogoBase64()
  })

  ipcMain.handle('clear-custom-logo', async () => {
    return clearCustomLogo()
  })

  ipcMain.handle('get-default-logo', async () => {
    return getDefaultLogoBase64()
  })
}
