import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { convertDocToGrayscale } from './grayscale.js'

// Helper para resolver rutas locales de PDF a partir de cualquier URL o formato en Windows
export const resolveLocalPdfPath = (fileUrl) => {
  if (!fileUrl) return null
  let p = String(fileUrl).trim()
  // Remover query parameters o hashes (ej: file:///...pdf?t=123#page=1)
  p = p.split('#')[0].split('?')[0]
  if (p.startsWith('file:')) {
    try {
      p = fileURLToPath(p)
    } catch {
      p = p.replace(/^file:\/{1,3}/i, '')
      p = decodeURIComponent(p)
    }
  } else {
    p = decodeURIComponent(p)
  }
  p = p.replace(/\//g, path.sep)
  if (/^[\\\/][a-zA-Z]:/.test(p)) {
    p = p.slice(1)
  }
  return p
}

// Helper para interpretar rangos de páginas (ej. '1-3, 5') a índices 0-based
export const parsePageRange = (rangeStr, maxPages) => {
  const pages = new Set()
  const parts = String(rangeStr || '').split(',')
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-')
      const start = Math.max(1, parseInt(startStr, 10) || 1)
      const end = Math.min(maxPages, parseInt(endStr, 10) || maxPages)
      for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
        pages.add(i - 1)
      }
    } else {
      const p = parseInt(trimmed, 10)
      if (p >= 1 && p <= maxPages) {
        pages.add(p - 1)
      }
    }
  }
  return Array.from(pages).sort((a, b) => a - b)
}

// Índices 0-based de todas las páginas de un documento
export const allPageIndices = (total) => Array.from({ length: total }, (_, i) => i)

// Carga un PDF desde disco con pdf-lib
export const loadPdf = async (sourcePath) => {
  const { PDFDocument } = await import('pdf-lib')
  const fileBytes = await fs.promises.readFile(sourcePath)
  return PDFDocument.load(fileBytes, { ignoreEncryption: true })
}

// Crea un nuevo PDF con las páginas indicadas, aplicando rotación adicional y/o
// conversión a escala de grises. Devuelve los bytes del documento resultante.
export const buildPdfFromPages = async (srcDoc, pageIndices, { rotateAngle = 0, monochrome = false } = {}) => {
  const { PDFDocument, degrees } = await import('pdf-lib')
  const newDoc = await PDFDocument.create()
  const copiedPages = await newDoc.copyPages(srcDoc, pageIndices)
  copiedPages.forEach((p) => {
    if (rotateAngle !== 0) {
      const currentRot = p.getRotation ? (p.getRotation().angle || 0) : 0
      p.setRotation(degrees((currentRot + rotateAngle) % 360))
    }
    newDoc.addPage(p)
  })
  if (monochrome) {
    await convertDocToGrayscale(newDoc)
  }
  return newDoc.save()
}
