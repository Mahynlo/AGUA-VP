import { ipcMain, BrowserWindow, app, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { generarExcelBuffer } from '../../export/excelExport.js'

// Exportación de datos a Excel / CSV con diálogo nativo de guardado
export default function registerExportHandlers() {
  // === HANDLER DE GUARDADO DE ARCHIVOS ===
  ipcMain.handle('save-file-dialog', async (event, { data, fileName, format }) => {
    const win = BrowserWindow.fromWebContents(event.sender)

    // Sanitizar formato y nombre de archivo para prevenir Path Traversal y caracteres prohibidos
    const safeFormat = format === 'csv' ? 'csv' : 'xlsx'
    const safeBaseName =
      path
        .basename(String(fileName || 'exportacion'))
        .replace(/[/\\?%*:|"<>]/g, '_')
        .trim() || 'exportacion'

    const options = {
      title: 'Guardar Archivo',
      defaultPath: path.join(app.getPath('downloads'), `${safeBaseName}.${safeFormat}`),
      filters: [
        {
          name: safeFormat === 'csv' ? 'Archivos CSV' : 'Archivos Excel',
          extensions: [safeFormat]
        }
      ]
    }

    const { canceled, filePath } = await dialog.showSaveDialog(win, options)

    if (canceled || !filePath) {
      return { success: false, canceled: true }
    }

    try {
      let buffer
      if (safeFormat === 'xlsx') {
        buffer = await generarExcelBuffer(data)
      } else {
        // CSV con BOM para soporte UTF-8 en Excel
        buffer = Buffer.concat([Buffer.from('﻿'), Buffer.from(data, 'utf-8')])
      }

      await fs.promises.writeFile(filePath, buffer)
      return { success: true, filePath }
    } catch (error) {
      console.error('Error guardando archivo:', error)
      return { success: false, error: error.message }
    }
  })
}
