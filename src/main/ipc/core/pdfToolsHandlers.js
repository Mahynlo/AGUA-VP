import { ipcMain, BrowserWindow, app, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { pathToFileURL } from 'url'
import {
  resolveLocalPdfPath,
  parsePageRange,
  allPageIndices,
  loadPdf,
  buildPdfFromPages
} from '../../pdf/pdfTools.js'

// Operaciones sobre PDFs ya generados: guardar copia, metadatos y cortes de vista previa
export default function registerPdfToolsHandlers() {
  // ============================================================
  // GUARDAR PDF — copiar o exportar el PDF a ubicación elegida por el usuario
  // Soporta filtrado nativo de rangos de páginas, rotación y conversión B/N
  // ============================================================
  ipcMain.handle('save-pdf', async (event, fileUrl, options = {}) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const sourcePath = resolveLocalPdfPath(fileUrl)

    if (!sourcePath || !fs.existsSync(sourcePath)) {
      return { success: false, error: 'El archivo temporal ya no existe' }
    }

    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Guardar PDF',
      defaultPath: path.join(app.getPath('downloads'), path.basename(sourcePath)),
      filters: [{ name: 'Archivos PDF', extensions: ['pdf'] }]
    })

    if (canceled || !filePath) {
      return { success: false, canceled: true }
    }

    try {
      const isMonochrome = options.colorMode === 'monochrome'
      const hasCustomPages = options.pages && typeof options.pages === 'string' && options.pages !== 'all'
      const hasRotation = typeof options.rotateAngle === 'number' && options.rotateAngle !== 0

      if (isMonochrome || hasCustomPages || hasRotation) {
        const srcDoc = await loadPdf(sourcePath)
        const total = srcDoc.getPageCount()
        const pageIndices = hasCustomPages ? parsePageRange(options.pages, total) : allPageIndices(total)

        if (hasCustomPages && pageIndices.length === 0) {
          return { success: false, error: 'El rango de páginas especificado no coincide con ninguna página del documento.' }
        }

        if (pageIndices.length > 0) {
          const newPdfBytes = await buildPdfFromPages(srcDoc, pageIndices, {
            rotateAngle: hasRotation ? options.rotateAngle : 0,
            monochrome: isMonochrome
          })
          await fs.promises.writeFile(filePath, newPdfBytes)
          return { success: true, filePath }
        }
      }

      await fs.promises.copyFile(sourcePath, filePath)
      return { success: true, filePath }
    } catch (error) {
      console.error('Error guardando PDF:', error)
      return { success: false, error: error.message }
    }
  })

  // Obtener metadatos nativos del documento (orientación y total de páginas con detección real de rotación)
  ipcMain.handle('get-pdf-metadata', async (_event, fileUrl) => {
    try {
      const sourcePath = resolveLocalPdfPath(fileUrl)
      if (!sourcePath || !fs.existsSync(sourcePath)) {
        console.warn('⚠️ [get-pdf-metadata] Archivo no existe:', sourcePath)
        return null
      }

      const doc = await loadPdf(sourcePath)
      const pageCount = doc.getPageCount()
      if (pageCount === 0) {
        return {
          success: true,
          pageCount: 0,
          orientation: 'portrait',
          isLandscape: false,
          width: 612,
          height: 792
        }
      }

      const firstPage = doc.getPage(0)
      const size = firstPage.getSize()
      const rot = firstPage.getRotation ? (firstPage.getRotation().angle || 0) : 0
      const effectiveWidth = (rot === 90 || rot === 270) ? size.height : size.width
      const effectiveHeight = (rot === 90 || rot === 270) ? size.width : size.height
      const isLandscape = effectiveWidth >= effectiveHeight
      const orientation = isLandscape ? 'landscape' : 'portrait'

      const result = {
        success: true,
        pageCount,
        orientation,
        isLandscape,
        width: Math.round(effectiveWidth),
        height: Math.round(effectiveHeight),
        rotation: rot
      }
      console.log('✅ [get-pdf-metadata]:', result)
      return result
    } catch (err) {
      console.warn('⚠️ Error al obtener metadatos de PDF:', err.message)
      return null
    }
  })

  // Generar corte o transformación temporal de vista previa (filtrado de páginas, rotación y/o monocromático)
  ipcMain.handle('generate-preview-slice', async (_event, { fileUrl, pages, rotateAngle = 0, colorMode = 'color' }) => {
    try {
      const sourcePath = resolveLocalPdfPath(fileUrl)
      if (!sourcePath || !fs.existsSync(sourcePath)) {
        return { success: false, error: 'Archivo PDF de origen no encontrado' }
      }

      const srcDoc = await loadPdf(sourcePath)
      const total = srcDoc.getPageCount()

      let pageIndices = []
      if (!pages || pages === 'all') {
        pageIndices = allPageIndices(total)
      } else {
        pageIndices = parsePageRange(pages, total)
      }

      if (pageIndices.length === 0) {
        pageIndices = allPageIndices(total)
      }

      const newBytes = await buildPdfFromPages(srcDoc, pageIndices, {
        rotateAngle,
        monochrome: colorMode === 'monochrome'
      })

      const tempSlicePath = path.join(app.getPath('temp'), `preview_slice_${Date.now()}.pdf`)
      await fs.promises.writeFile(tempSlicePath, newBytes)

      return {
        success: true,
        url: pathToFileURL(tempSlicePath).href,
        pageCount: pageIndices.length,
        path: tempSlicePath
      }
    } catch (err) {
      console.error('Error generando corte de vista previa:', err)
      return { success: false, error: err.message }
    }
  })
}
