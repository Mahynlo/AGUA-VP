import { app } from 'electron'
import path from 'path'
import fs from 'fs'

// Utilidades para la documentación de ayuda (/ayuda/<seccion>/*.md) cargada desde disco.

export const FRONTMATTER_REGEX = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/

export const IMAGE_MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
}

const ALT_IMAGE_EXTENSIONS = ['.avif', '.webp', '.png', '.jpg', '.jpeg', '.svg']

// Función helper para parsear frontmatter
export const parseFrontmatter = (content, fileName) => {
  const match = content.match(FRONTMATTER_REGEX)

  let metadata = {
    titulo: fileName.replace('.md', '').replace(/-/g, ' '),
    orden: 999,
    descripcion: '',
    seccion: '',
    tags: []
  }

  if (match) {
    try {
      const frontmatterText = match[1]
      const frontmatterLines = frontmatterText.split(/\r?\n/).filter((line) => line.trim())

      frontmatterLines.forEach((line) => {
        const colonIndex = line.indexOf(':')
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim()
          let value = line.substring(colonIndex + 1).trim()

          // Remover comillas si existen
          value = value.replace(/^["']|["']$/g, '')

          // Convertir orden a número
          if (key === 'orden') {
            value = parseInt(value) || 999
          }

          // Parsear arrays básicos (solo para strings)
          if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
            try {
              value = JSON.parse(value)
            } catch {
              // Mantener como string si no se puede parsear
            }
          }

          metadata[key] = value
        }
      })
    } catch (parseError) {
      console.warn(`⚠️ Error parseando metadata de ${fileName}:`, parseError)
    }
  }

  if (!metadata.tipo) {
    const lowerFile = fileName.toLowerCase()
    const lowerTitle = (metadata.titulo || '').toLowerCase()
    if (
      lowerFile.includes('introduccion') ||
      lowerFile.includes('recalcular') ||
      lowerFile.includes('cartera vencida') ||
      lowerFile.includes('configurar-tarifas') ||
      lowerTitle.includes('introducción') ||
      lowerTitle.includes('funcionamiento') ||
      lowerTitle.includes('lógica') ||
      lowerTitle.includes('arquitectura')
    ) {
      metadata.tipo = 'funcionamiento'
    } else {
      metadata.tipo = 'uso'
    }
  }

  return metadata
}

// Función helper para resolver la ruta del directorio ayuda
export const resolveAyudaPath = () => {
  const isDev = !app.isPackaged
  const candidates = isDev
    ? [
        path.join(process.cwd(), 'ayuda'),
        path.join(app.getAppPath(), 'ayuda'),
        path.join(__dirname, '../../ayuda'),
        path.join(__dirname, '../ayuda')
      ]
    : [
        path.join(process.resourcesPath, 'ayuda'),
        path.join(process.resourcesPath, 'app.asar.unpacked', 'ayuda'),
        path.join(app.getAppPath(), 'ayuda'),
        path.join(process.cwd(), 'ayuda')
      ]

  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      return cand
    }
  }
  return candidates[0]
}

// Devuelve la ruta de la imagen si existe, probando también extensiones alternativas
export const resolveImageFile = (candPath) => {
  if (!candPath) return null
  if (fs.existsSync(candPath) && fs.statSync(candPath).isFile()) {
    return candPath
  }
  const dir = path.dirname(candPath)
  const baseNoExt = path.basename(candPath, path.extname(candPath))
  for (const ext of ALT_IMAGE_EXTENSIONS) {
    const altCand = path.join(dir, `${baseNoExt}${ext}`)
    if (fs.existsSync(altCand) && fs.statSync(altCand).isFile()) {
      return altCand
    }
  }
  return null
}

// Búsqueda recursiva de una imagen por nombre (sin extensión, sin distinguir mayúsculas)
export const findImageRecursive = (dir, targetBaseNoExt) => {
  try {
    if (!fs.existsSync(dir)) return null
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const ent of entries) {
      const full = path.join(dir, ent.name)
      if (ent.isDirectory()) {
        const res = findImageRecursive(full, targetBaseNoExt)
        if (res) return res
      } else if (ent.isFile()) {
        const entBaseNoExt = path.basename(ent.name, path.extname(ent.name)).toLowerCase()
        if (entBaseNoExt === targetBaseNoExt.toLowerCase()) {
          return full
        }
      }
    }
  } catch {}
  return null
}

// Lee una imagen y la devuelve como Data URI (lanza si no se puede leer)
export const imageToDataUri = (filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  const mime = IMAGE_MIME_TYPES[ext] || 'image/png'
  const buf = fs.readFileSync(filePath)
  return `data:${mime};base64,${buf.toString('base64')}`
}

// Normaliza una ruta de imagen relativa quitando prefijos ../, ./ y /
const stripRelativePrefix = (p) =>
  p
    .replace(/^(\.\.\/)+/g, '')
    .replace(/^(\.\/)+/g, '')
    .replace(/^\//g, '')

const stripImagenesPrefix = (p) =>
  p
    .replace(/^(\.\.\/)+/g, '')
    .replace(/^(\.\/)+/g, '')
    .replace(/^imagenes\//g, '')
    .replace(/^\//g, '')

// Rutas candidatas comunes para una imagen referenciada en la documentación
export const ayudaImageCandidates = (ayudaPath, clean) => [
  path.resolve(ayudaPath, stripRelativePrefix(clean)),
  path.resolve(ayudaPath, 'imagenes', stripImagenesPrefix(clean)),
  path.resolve(ayudaPath, 'imagenes', 'Guia_Acccion_mes', path.basename(clean)),
  path.resolve(ayudaPath, 'imagenes', path.basename(clean))
]
