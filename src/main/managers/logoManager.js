import { app, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { DEFAULT_LOGO_BASE64 } from '../pdf/defaultLogoBase64.js'
import logManager from './logManager.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CUSTOM_LOGO_FILENAME = 'custom-logo.png'
const CUSTOM_LOGO_DATA_FILENAME = 'custom-logo.txt'

/**
 * Resuelve la ruta del archivo del logo municipal predeterminado.
 * Funciona de manera robusta tanto en desarrollo como en producción (instalador de Windows).
 */
export function resolveDefaultLogoPath() {
  const isPackaged = app?.isPackaged ?? false
  const appPath = app?.getAppPath ? app.getAppPath() : process.cwd()
  const resourcesPath = process.resourcesPath || ''

  const candidates = []

  // 1. Prioridad en producción: carpeta de recursos de Electron
  if (isPackaged || resourcesPath) {
    candidates.push(
      path.join(resourcesPath, 'resources', 'Escudo_Villa_Pesqueira_sin_fondo.png'),
      path.join(resourcesPath, 'Escudo_Villa_Pesqueira_sin_fondo.png'),
      path.join(
        resourcesPath,
        'app.asar.unpacked',
        'resources',
        'Escudo_Villa_Pesqueira_sin_fondo.png'
      ),
      path.join(appPath, 'resources', 'Escudo_Villa_Pesqueira_sin_fondo.png')
    )

    // Buscar en assets empaquetados por Vite en el renderer dentro de app.asar
    try {
      const assetsDir = path.join(appPath, 'out', 'renderer', 'assets')
      if (fs.existsSync(assetsDir)) {
        const files = fs.readdirSync(assetsDir)
        const match = files.find(
          (f) => f.startsWith('Escudo_Villa_Pesqueira_sin_fondo') && f.endsWith('.png')
        )
        if (match) {
          candidates.push(path.join(assetsDir, match))
        }
      }
    } catch (e) {
      // Ignorar fallo de búsqueda en carpeta de assets
    }
  }

  // 2. Prioridad en desarrollo / local
  candidates.push(
    path.join(process.cwd(), 'resources', 'Escudo_Villa_Pesqueira_sin_fondo.png'),
    path.join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'assets',
      'images',
      'Escudo_Villa_Pesqueira_sin_fondo.png'
    ),
    path.join(
      process.cwd(),
      'src',
      'main',
      'pdf',
      'assets',
      'Escudo_Villa_Pesqueira_sin_fondo.png'
    ),
    path.join(process.cwd(), 'AguaVP', 'resources', 'Escudo_Villa_Pesqueira_sin_fondo.png'),
    path.join(__dirname, '..', '..', '..', 'resources', 'Escudo_Villa_Pesqueira_sin_fondo.png'),
    path.join(__dirname, '..', 'pdf', 'assets', 'Escudo_Villa_Pesqueira_sin_fondo.png')
  )

  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      return p
    }
  }

  return null
}

/**
 * Obtiene el logo predeterminado en formato base64 Data URL.
 * Si existe en disco lo lee; si no, retorna el fallback embebido DEFAULT_LOGO_BASE64.
 */
export function getDefaultLogoBase64() {
  const filePath = resolveDefaultLogoPath()
  if (filePath && fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath)
      const ext = path.extname(filePath).toLowerCase()
      const mime =
        ext === '.webp'
          ? 'image/webp'
          : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : 'image/png'
      return `data:${mime};base64,${data.toString('base64')}`
    } catch (err) {
      logManager?.warn?.(
        `Error leyendo logo predeterminado de disco (${filePath}): ${err.message}`,
        'system'
      )
    }
  }

  // Respaldo instantáneo infalible (compilado en el bundle)
  return DEFAULT_LOGO_BASE64
}

/**
 * Obtiene la ruta al archivo de logo personalizado en userData.
 */
function getCustomLogoPaths() {
  const userData = app.getPath('userData')
  return {
    imagePath: path.join(userData, CUSTOM_LOGO_FILENAME),
    dataPath: path.join(userData, CUSTOM_LOGO_DATA_FILENAME)
  }
}

/**
 * Retorna el logo personalizado guardado en el sistema, o null si no existe.
 */
export function getCustomLogoBase64() {
  const { dataPath, imagePath } = getCustomLogoPaths()

  // 1. Intentar leer data URL cacheada
  if (fs.existsSync(dataPath)) {
    try {
      const dataUrl = fs.readFileSync(dataPath, 'utf8').trim()
      if (dataUrl.startsWith('data:image')) {
        return dataUrl
      }
    } catch (_e) {
      // Ignorar fallo de lectura de archivo cache
    }
  }

  // 2. Intentar leer imagen directa
  if (fs.existsSync(imagePath)) {
    try {
      const data = fs.readFileSync(imagePath)
      return `data:image/png;base64,${data.toString('base64')}`
    } catch (_e) {
      // Ignorar fallo de lectura de archivo binario
    }
  }

  return null
}

/**
 * Guarda un logo personalizado en el almacenamiento persistente de la app.
 * @param {string} base64DataUrl
 */
export function saveCustomLogo(base64DataUrl) {
  if (
    !base64DataUrl ||
    typeof base64DataUrl !== 'string' ||
    !base64DataUrl.startsWith('data:image')
  ) {
    throw new Error('El logo proporcionado no es un Data URL de imagen válido')
  }

  const { dataPath, imagePath } = getCustomLogoPaths()

  let finalDataUrl = base64DataUrl
  let pngBuffer = null

  // Normalizar imagen a PNG estándar para compatibilidad total con PDFKit
  try {
    if (nativeImage?.createFromDataURL) {
      const img = nativeImage.createFromDataURL(base64DataUrl)
      if (!img.isEmpty()) {
        pngBuffer = img.toPNG()
        finalDataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`
      }
    }
  } catch (_convErr) {
    // Si falla la conversión nativeImage, continuar con guardado directo
  }

  // Guardar string Data URL
  fs.writeFileSync(dataPath, finalDataUrl, 'utf8')

  // Extraer y guardar buffer de imagen de forma segura
  if (pngBuffer) {
    fs.writeFileSync(imagePath, pngBuffer)
  } else {
    const commaIndex = finalDataUrl.indexOf(';base64,')
    if (commaIndex !== -1) {
      const rawBase64 = finalDataUrl.slice(commaIndex + 8)
      const buffer = Buffer.from(rawBase64, 'base64')
      fs.writeFileSync(imagePath, buffer)
    }
  }

  logManager?.info?.(
    'Logo personalizado guardado correctamente en almacenamiento persistente',
    'system'
  )
  return true
}

/**
 * Elimina el logo personalizado y restaura el predeterminado.
 */
export function clearCustomLogo() {
  const { dataPath, imagePath } = getCustomLogoPaths()

  try {
    if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath)
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath)
    logManager?.info?.('Logo personalizado eliminado. Restaurado predeterminado', 'system')
    return true
  } catch (err) {
    logManager?.error?.(`Error eliminando logo personalizado: ${err.message}`, 'system')
    return false
  }
}

/**
 * Retorna el logo que debe utilizarse en recibos o reportes:
 * 1. Si override === false, explícitamente fuerza el logo predeterminado.
 * 2. Si se provee un override directo (base64 Data URL), lo utiliza.
 * 3. Si hay un logo personalizado guardado por el usuario en Identidad Visual, lo utiliza.
 * 4. Si no, carga el logo predeterminado de la aplicación.
 */
export function getEffectiveLogoBase64(override = null) {
  if (override === false) {
    return getDefaultLogoBase64()
  }

  if (override && typeof override === 'string' && override.startsWith('data:image')) {
    return override
  }

  const custom = getCustomLogoBase64()
  if (custom) {
    return custom
  }

  return getDefaultLogoBase64()
}

export default {
  resolveDefaultLogoPath,
  getDefaultLogoBase64,
  getCustomLogoBase64,
  saveCustomLogo,
  clearCustomLogo,
  getEffectiveLogoBase64
}
