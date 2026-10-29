import { ipcMain, BrowserWindow, app, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { execFile } from 'child_process'
import {
  resolveLocalPdfPath,
  parsePageRange,
  allPageIndices,
  loadPdf,
  buildPdfFromPages
} from '../../pdf/tools/pdfTools.js'

// ============================================================
// IMPRESIÓN SILENCIOSA vía SumatraPDF (pdf-to-printer) — sin BrowserWindow, sin React.
// Recibe pdfFileUrl (file:///...) y envía el trabajo directo al spooler de Windows.
const getSumatraPath = () => {
  const distDir = app.isPackaged
    ? path.join(
        process.resourcesPath,
        'app.asar.unpacked',
        'node_modules',
        'pdf-to-printer',
        'dist'
      )
    : path.join(app.getAppPath(), 'node_modules', 'pdf-to-printer', 'dist')
  const entries = fs
    .readdirSync(distDir)
    .filter((f) => f.startsWith('SumatraPDF') && f.endsWith('.exe'))
  if (!entries.length) throw new Error('SumatraPDF.exe no encontrado en ' + distDir)
  return path.join(distDir, entries[0])
}

const VIRTUAL_PRINTERS = [
  'microsoft print to pdf',
  'microsoft xps document writer',
  'onenote',
  'fax'
]

// Impresoras instaladas e impresión silenciosa
export default function registerSilentPrintHandlers() {
  // Obtener lista de impresoras
  ipcMain.handle('getPrinters', async () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      const printers = await win.webContents.getPrintersAsync()
      return printers
    }
    return []
  })

  ipcMain.handle('print-silent', async (event, pdfFileUrl, config = {}) => {
    const {
      printer = '',
      copies = 1,
      landscape = false,
      pageSize = 'Letter',
      colorMode = 'color',
      pages = '',
      duplex = 'simplex',
      scale = 'fit',
      collate = true,
      pagesPerSheet = 1,
      rotateAngle = 0
    } = config
    console.log('print-silent (SumatraPDF):', {
      printer,
      copies,
      landscape,
      pageSize,
      colorMode,
      pages,
      duplex,
      scale,
      collate,
      pagesPerSheet,
      rotateAngle
    })

    const isVirtual = VIRTUAL_PRINTERS.some((v) => (printer || '').toLowerCase().includes(v))

    const pdfPath = resolveLocalPdfPath(pdfFileUrl)
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      throw new Error('El archivo PDF a imprimir no existe: ' + pdfFileUrl)
    }

    const isMonochrome = colorMode === 'monochrome'
    const hasCustomPages = pages && typeof pages === 'string' && pages !== 'all'
    const hasRotation = typeof rotateAngle === 'number' && rotateAngle !== 0
    const transformOptions = { rotateAngle: hasRotation ? rotateAngle : 0, monochrome: isMonochrome }

    // Si el usuario seleccionó una impresora virtual de PDF (ej. Microsoft Print to PDF):
    // En lugar de enviar un PDF a través del spooler de Windows para volverlo a convertir a PDF
    // (lo que genera archivos EMF de 44MB+ y falla por timeout en PORTPROMPT:),
    // guardamos directamente el archivo PDF de alta fidelidad aplicando las opciones (páginas, B/N, rotación).
    if (isVirtual && (printer.toLowerCase().includes('pdf') || !printer)) {
      try {
        const win = BrowserWindow.fromWebContents(event.sender)
        const { canceled, filePath } = await dialog.showSaveDialog(win, {
          title: 'Guardar Salida de Impresión',
          defaultPath: path.basename(pdfPath),
          filters: [{ name: 'Documentos PDF', extensions: ['pdf'] }]
        })
        if (canceled || !filePath) {
          return { success: false, canceled: true }
        }
        if (hasCustomPages || isMonochrome || hasRotation) {
          const srcDoc = await loadPdf(pdfPath)
          const total = srcDoc.getPageCount()
          const pageIndices = hasCustomPages ? parsePageRange(pages, total) : allPageIndices(total)

          if (hasCustomPages && pageIndices.length === 0) {
            throw new Error('El rango de páginas especificado no coincide con ninguna página del documento.')
          }

          if (pageIndices.length > 0) {
            const newPdfBytes = await buildPdfFromPages(srcDoc, pageIndices, transformOptions)
            await fs.promises.writeFile(filePath, newPdfBytes)
            console.log('print-silent: guardado directo virtual exitoso (páginas y color transformados) en:', filePath)
            return { success: true, savedPath: filePath }
          }
        }
        await fs.promises.copyFile(pdfPath, filePath)
        console.log('print-silent: guardado directo exitoso en:', filePath)
        return { success: true, savedPath: filePath }
      } catch (saveErr) {
        console.warn('print-silent: error en guardado directo virtual:', saveErr.message)
        throw saveErr
      }
    }

    return new Promise(async (resolve, reject) => {
      let sumatraPath
      try {
        sumatraPath = getSumatraPath()
      } catch (e) {
        return reject('SumatraPDF no encontrado: ' + e.message)
      }

      // Si hay selección de páginas específica, rotación o modo monocromático, generamos un archivo transformado
      // para que SumatraPDF y el Windows Print Spooler solo procesen esas páginas en B/N real (ahorrando memoria y tóner)
      let fileToPrint = pdfPath
      let tempPrintFile = null

      try {
        if (hasCustomPages || isMonochrome || hasRotation) {
          const srcDoc = await loadPdf(pdfPath)
          const total = srcDoc.getPageCount()
          const pageIndices = hasCustomPages ? parsePageRange(pages, total) : allPageIndices(total)

          if (hasCustomPages && pageIndices.length === 0) {
            return reject('El rango de páginas especificado no coincide con ninguna página del documento.')
          }

          if (pageIndices.length > 0) {
            const newPdfBytes = await buildPdfFromPages(srcDoc, pageIndices, transformOptions)
            tempPrintFile = path.join(app.getPath('temp'), `print_job_${Date.now()}.pdf`)
            await fs.promises.writeFile(tempPrintFile, newPdfBytes)
            fileToPrint = tempPrintFile
            console.log('print-silent: enviando archivo pre-procesado a SumatraPDF:', { tempPrintFile, isMonochrome, pagesCount: pageIndices.length })
          }
        }
      } catch (sliceErr) {
        console.warn('print-silent: no se pudo pre-procesar PDF previo a impresión, usando original:', sliceErr.message)
      }

      const cleanupTempPrintFile = async () => {
        if (tempPrintFile) {
          try {
            await fs.promises.unlink(tempPrintFile)
          } catch {}
        }
      }

      // Configuración de impresión avanzada para SumatraPDF
      const settingsList = [
        `paper=${pageSize.toLowerCase()}`,
        landscape ? 'landscape' : 'portrait',
        `copies=${Math.max(1, parseInt(copies) || 1)}`,
        isMonochrome ? 'monochrome' : 'color'
      ]

      if (scale === 'fit' || scale === 'shrink' || scale === 'noscale') {
        settingsList.push(scale)
      }

      if (duplex === 'duplex' || duplex === true) {
        settingsList.push('duplex')
      } else if (duplex === 'duplexshort') {
        settingsList.push('duplexshort')
      } else if (duplex === 'duplexlong') {
        settingsList.push('duplexlong')
      } else if (duplex === 'simplex') {
        settingsList.push('simplex')
      }

      if (parseInt(copies) > 1) {
        settingsList.push(collate ? 'collate' : 'nocolla')
      }

      if (pagesPerSheet === 2 || pagesPerSheet === 4) {
        settingsList.push(`nup=${pagesPerSheet}`)
      }

      const settings = settingsList.join(',')

      const args = [
        printer ? `-print-to` : `-print-to-default`,
        ...(printer ? [printer] : []),
        `-print-settings`,
        settings,
        `-silent`,
        fileToPrint
      ]

      // Timeout generoso de 10 minutos (600,000 ms) para soportar lotes grandes de 44, 80 o más páginas sin corte prematuro
      execFile(sumatraPath, args, { timeout: 600000, maxBuffer: 50 * 1024 * 1024 }, async (error, stdout, stderr) => {
        await cleanupTempPrintFile()
        if (!error) {
          console.log('print-silent: SumatraPDF OK')
          resolve({ success: true })
        } else {
          const exitCode = error.code
          const errText = (stderr || '').trim()
          console.warn(
            'print-silent: SumatraPDF salió con código',
            exitCode,
            '| killed:',
            error.killed,
            '| stderr:',
            errText || '(vacío)'
          )
          if (error.killed || exitCode === null) {
            reject('La impresora no respondió a tiempo después de 10 minutos.')
          } else if (exitCode === 1 && !errText && isVirtual) {
            reject(
              'El documento no fue guardado. Selecciona una impresora física para imprimir silenciosamente.'
            )
          } else if (exitCode === 1 && !errText) {
            // SumatraPDF 3.x sale con código 1 incluso cuando el trabajo se envió correctamente a impresoras físicas
            console.log('print-silent: código 1 sin stderr → considerado exitoso')
            resolve({ success: true })
          } else {
            reject(errText || error.message || 'Error al imprimir con SumatraPDF')
          }
        }
      })
    })
  })
}
