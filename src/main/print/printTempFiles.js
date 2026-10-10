import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { pathToFileURL } from 'url'
import { buildPdfFilename } from './printUrl.js'

// Ruta del JSON temporal con los datos de impresión (savePrintData / dataKey)
export const getPrintDataPath = (id) => path.join(app.getPath('temp'), `print_data_${id}.json`)

// Guarda los datos de impresión en un archivo temporal (se borra a los 10 minutos) y devuelve su id
export const savePrintData = async (dataStr) => {
  const id = randomUUID()
  const tempPath = getPrintDataPath(id)

  // Escribir archivo temporalmente
  await fs.promises.writeFile(tempPath, dataStr, 'utf-8')

  // Limpieza automática después de 10 minutos
  setTimeout(
    () => {
      fs.unlink(tempPath, (err) => {
        if (!err) console.log('Archivo temporal borrado:', tempPath)
      })
    },
    10 * 60 * 1000
  )

  return id
}

// Devuelve el JSON (texto) de una clave de impresión, o null si no existe
export const readPrintData = async (id) => {
  const tempPath = getPrintDataPath(id)
  if (fs.existsSync(tempPath)) {
    return fs.promises.readFile(tempPath, 'utf-8')
  }
  return null
}

// Escribe un PDF generado en el directorio temporal y devuelve su ruta local
export const writeTempPdf = async (url, pdfBuffer) => {
  const pdfPath = path.join(app.getPath('temp'), `${buildPdfFilename(url)}.pdf`)
  await fs.promises.writeFile(pdfPath, pdfBuffer)
  return pdfPath
}

export const toFileUrl = (filePath) => pathToFileURL(filePath).href

// Limpiar PDFs temporales de sesiones anteriores (> 1 hora de antigüedad)
export const cleanupOldTempPdfs = () => {
  try {
    const tempDir = app.getPath('temp')
    fs.readdir(tempDir, (err, files) => {
      if (err) return
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      ;(files || [])
        .filter(
          (f) => (f.startsWith('aguavp_') || f.startsWith('preview_recibos_')) && f.endsWith('.pdf')
        )
        .forEach(async (f) => {
          try {
            const fp = path.join(tempDir, f)
            const stats = await fs.promises.stat(fp)
            if (stats.mtimeMs < oneHourAgo) {
              await fs.promises.unlink(fp)
              console.log('Temp PDF antiguo eliminado:', f)
            }
          } catch (e) {}
        })
    })
  } catch (e) {}
}
