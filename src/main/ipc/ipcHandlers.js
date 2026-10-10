// Handlers IPC generales de la aplicación (no ligados a un dominio de negocio).
// Cada grupo vive en ./core/; la lógica sin IPC está en src/main/print, pdf, docs y export.
import { cleanupOldTempPdfs } from '../print/printTempFiles.js'
import registerAppHandlers from './core/appHandlers.js'
import registerPrintHandlers from './core/printHandlers.js'
import registerSilentPrintHandlers from './core/silentPrintHandlers.js'
import registerPdfToolsHandlers from './core/pdfToolsHandlers.js'
import registerDocsHandlers from './core/docsHandlers.js'
import registerExportHandlers from './core/exportHandlers.js'
import registerBrandingHandlers from './core/brandingHandlers.js'

export default function IpcHandlers() {
  console.log('🔧 Registrando handlers IPC principales...')

  // Limpiar PDFs temporales de sesiones anteriores (> 1 hora de antigüedad)
  cleanupOldTempPdfs()

  registerAppHandlers() // zoom-*, get-app-version
  registerPrintHandlers() // printComponent, previewComponent, savePrintData, getPrintData, delete-temp-pdf
  registerSilentPrintHandlers() // getPrinters, print-silent
  registerPdfToolsHandlers() // save-pdf, get-pdf-metadata, generate-preview-slice
  registerDocsHandlers() // list/load-documentation-*, open-help-window
  registerExportHandlers() // save-file-dialog
  registerBrandingHandlers() // select-logo, *-custom-logo, get-default-logo, select-login-images

  console.log('✅ Handlers de documentación registrados')
}
