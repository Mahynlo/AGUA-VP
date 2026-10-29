import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import pdfmake from 'pdfmake'

// Registro único de fuentes para todos los generadores pdfmake (recibos y reportes).
// pdfmake mantiene un registro global de fuentes: basta con configurarlo una vez.
// En el bundle, __dirname apunta a out/main (igual que en los generadores originales).
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- RESOLUCIÓN SEGURA DE FUENTES ---
// Carpeta con Segoe UI y Consolas (repo en desarrollo; Windows/Fonts como respaldo)
function resolveCustomFontsDir() {
  const candidates = [
    path.join(__dirname, 'fonts'),
    path.join(process.cwd(), 'src', 'main', 'pdf', 'fonts'),
    path.join(process.cwd(), 'AguaVP', 'src', 'main', 'pdf', 'fonts'),
    path.join(__dirname, '..', 'fonts'),
    path.join(__dirname, '../..', 'src', 'main', 'pdf', 'fonts'),
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'src', 'main', 'pdf', 'fonts'),
    'C:/Windows/Fonts'
  ]

  for (const p of candidates) {
    if (p && fs.existsSync(p) && fs.existsSync(path.join(p, 'segoeui.ttf'))) {
      return p
    }
  }
  return null
}

// Carpeta Roboto incluida en pdfmake
function resolveRobotoFonts() {
  const candidates = [
    path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto'),
    path.join(process.cwd(), 'AguaVP', 'node_modules', 'pdfmake', 'fonts', 'Roboto'),
    path.join(__dirname, '..', 'node_modules', 'pdfmake', 'fonts', 'Roboto'),
    path.join(__dirname, '../..', 'node_modules', 'pdfmake', 'fonts', 'Roboto'),
    path.join(__dirname, '../../..', 'node_modules', 'pdfmake', 'fonts', 'Roboto'),
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'node_modules', 'pdfmake', 'fonts', 'Roboto')
  ]

  try {
    const electron = globalThis.require ? globalThis.require('electron') : null
    if (electron?.app?.getAppPath) {
      candidates.unshift(path.join(electron.app.getAppPath(), 'node_modules', 'pdfmake', 'fonts', 'Roboto'))
    }
  } catch (e) {}

  for (const p of candidates) {
    if (p && fs.existsSync(path.join(p, 'Roboto-Regular.ttf'))) {
      return p
    }
  }
  return null
}

// Configura las familias SegoeUI, Consolas y Roboto en pdfmake (una sola vez por proceso)
let fontsConfigured = false
export function ensureFonts() {
  if (fontsConfigured) return
  const robotoDir = resolveRobotoFonts()
  const customFontsDir = resolveCustomFontsDir()

  const robotoNormal = robotoDir ? path.join(robotoDir, 'Roboto-Regular.ttf') : ''
  const robotoBold = robotoDir ? path.join(robotoDir, 'Roboto-Medium.ttf') : ''
  const robotoItalic = robotoDir ? path.join(robotoDir, 'Roboto-Italic.ttf') : ''
  const robotoBoldItalic = robotoDir ? path.join(robotoDir, 'Roboto-MediumItalic.ttf') : ''

  const getCustomFont = (filename, fallback) => {
    if (customFontsDir) {
      const p = path.join(customFontsDir, filename)
      if (fs.existsSync(p)) return p
    }
    return fallback
  }

  const fonts = {
    SegoeUI: {
      normal: getCustomFont('segoeui.ttf', robotoNormal),
      bold: getCustomFont('segoeuib.ttf', robotoBold),
      italics: getCustomFont('segoeuii.ttf', robotoItalic),
      bolditalics: getCustomFont('segoeuiz.ttf', robotoBoldItalic)
    },
    // Usada por los recibos (números y montos)
    Consolas: {
      normal: getCustomFont('consola.ttf', robotoNormal),
      bold: getCustomFont('consolab.ttf', robotoBold),
      italics: getCustomFont('consola.ttf', robotoItalic),
      bolditalics: getCustomFont('consolab.ttf', robotoBoldItalic)
    }
  }

  if (robotoDir) {
    fonts.Roboto = {
      normal: robotoNormal,
      bold: robotoBold,
      italics: robotoItalic,
      bolditalics: robotoBoldItalic
    }
  }

  try {
    pdfmake.addFonts(fonts)
  } catch (err) {
    console.warn('Advertencia al configurar fuentes en pdfmake:', err.message)
  }

  if (typeof pdfmake.setUrlAccessPolicy === 'function') {
    pdfmake.setUrlAccessPolicy(() => true)
  }
  if (typeof pdfmake.setLocalAccessPolicy === 'function') {
    pdfmake.setLocalAccessPolicy(() => true)
  }
  fontsConfigured = true
}
