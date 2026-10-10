import { ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { openHelpWindow } from '../../managers/helpWindowManager.js'
import {
  FRONTMATTER_REGEX,
  parseFrontmatter,
  resolveAyudaPath,
  resolveImageFile,
  findImageRecursive,
  imageToDataUri,
  ayudaImageCandidates
} from '../../docs/ayudaDocs.js'

// =====================================
// HANDLERS DE DOCUMENTACIÓN (ayuda)
// =====================================
export default function registerDocsHandlers() {
  // Handler para listar archivos de documentación
  ipcMain.handle('list-documentation-files', async (event, section = null) => {
    console.log(`📚 Handler documentación - Listando archivos de sección: ${section || 'todas'}`)

    try {
      const ayudaPath = resolveAyudaPath()
      console.log(`📁 Buscando en directorio: ${ayudaPath}`)

      if (!fs.existsSync(ayudaPath)) {
        console.warn(`⚠️ Directorio de ayuda no encontrado: ${ayudaPath}`)
        return { success: false, error: 'Directorio de ayuda no encontrado', sections: {} }
      }

      const sections = {}
      const subDirs = fs.readdirSync(ayudaPath).filter((d) => {
        try {
          return fs.statSync(path.join(ayudaPath, d)).isDirectory() && d !== 'imagenes'
        } catch {
          return false
        }
      })

      for (const sDir of subDirs) {
        if (section && sDir !== section) continue
        const sPath = path.join(ayudaPath, sDir)
        const mdFiles = fs.readdirSync(sPath).filter((f) => f.endsWith('.md'))
        sections[sDir] = []

        for (const f of mdFiles) {
          try {
            const fullF = path.join(sPath, f)
            const content = fs.readFileSync(fullF, 'utf8')
            const metadata = parseFrontmatter(content, f)
            metadata.seccion = sDir
            sections[sDir].push({ fileName: f, metadata })
          } catch (e) {
            console.warn(`Error leyendo archivo ${f}:`, e)
          }
        }

        sections[sDir].sort((a, b) => (a.metadata.orden || 999) - (b.metadata.orden || 999))
      }

      console.log(
        `✅ Documentación listada exitosamente: ${Object.keys(sections).length} secciones`
      )
      return { success: true, sections }
    } catch (error) {
      console.error('❌ Error listando documentación:', error)
      return { success: false, error: error.message, sections: {} }
    }
  })

  // Handler para abrir ventana independiente de ayuda
  ipcMain.handle('open-help-window', async (_event, section = null, file = null) => {
    try {
      openHelpWindow(section, file)
      return { success: true }
    } catch (error) {
      console.error('❌ Error al abrir ventana de ayuda:', error)
      return { success: false, error: error.message }
    }
  })

  // Handler para cargar un archivo específico de documentación
  ipcMain.handle('load-documentation-file', async (event, section, fileName) => {
    console.log(`📄 Handler documentación - Solicitando archivo: ${section}/${fileName}`)

    try {
      const ayudaPath = resolveAyudaPath()

      const candidatePaths = [
        path.join(ayudaPath, section, fileName),
        path.join(ayudaPath, section, `${fileName}.md`),
        path.join(ayudaPath, fileName)
      ]

      let filePath = null
      for (const cand of candidatePaths) {
        if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
          filePath = cand
          break
        }
      }

      if (!filePath) {
        console.warn(`⚠️ Archivo no encontrado en ninguna ruta: ${section}/${fileName}`)
        return { success: false, error: 'Archivo no encontrado', content: '', metadata: {} }
      }

      const content = fs.readFileSync(filePath, 'utf8')
      console.log(`✅ Archivo leído exitosamente: ${filePath} (${content.length} caracteres)`)

      // Parsear y remover frontmatter del contenido
      let cleanContent = content
      if (content.match(FRONTMATTER_REGEX)) {
        cleanContent = content.replace(FRONTMATTER_REGEX, '')
      }
      const metadata = parseFrontmatter(content, fileName)

      // Resolver y transformar rutas de imágenes locales relativas a Data URIs
      const tryFindImage = (imgPath) => {
        if (
          !imgPath ||
          imgPath.startsWith('http://') ||
          imgPath.startsWith('https://') ||
          imgPath.startsWith('data:')
        ) {
          return null
        }
        const clean = imgPath.trim().replace(/^<|>$/g, '').trim()

        const candidates = [
          path.resolve(path.dirname(filePath), clean),
          ...ayudaImageCandidates(ayudaPath, clean)
        ]

        for (const cand of candidates) {
          const resolved = resolveImageFile(cand)
          if (resolved) {
            try {
              return imageToDataUri(resolved)
            } catch (e) {
              console.warn(`Error leyendo imagen ${resolved}:`, e)
            }
          }
        }

        // Búsqueda exhaustiva en la carpeta imágenes de ayuda
        const baseNoExt = path.basename(clean, path.extname(clean))
        const found = findImageRecursive(path.join(ayudaPath, 'imagenes'), baseNoExt)
        if (found) {
          try {
            return imageToDataUri(found)
          } catch (e) {
            console.warn(`Error leyendo imagen encontrada ${found}:`, e)
          }
        }

        return null
      }

      // 1. Reemplazar enlaces inline ![alt](path)
      cleanContent = cleanContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, imgPath) => {
        const dataUri = tryFindImage(imgPath)
        if (dataUri) {
          return `![${alt}](${dataUri})`
        }
        return match
      })

      // 2. Reemplazar referencias [ref]: path o [ref]: <path>
      cleanContent = cleanContent.replace(
        /^\[([^\]]+)\]:\s*<?([^\s>]+)>?/gm,
        (match, ref, imgPath) => {
          const dataUri = tryFindImage(imgPath)
          if (dataUri) {
            return `[${ref}]: ${dataUri}`
          }
          return match
        }
      )

      // 3. Reemplazar etiquetas HTML <img src="path" ... />
      cleanContent = cleanContent.replace(
        /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)\/?>/gi,
        (match, before, imgPath, after) => {
          const dataUri = tryFindImage(imgPath)
          if (dataUri) {
            return `<img ${before}src="${dataUri}"${after} />`
          }
          return match
        }
      )

      return {
        success: true,
        content: cleanContent,
        metadata: metadata
      }
    } catch (error) {
      console.error('❌ Error cargando archivo de documentación:', error)
      return { success: false, error: error.message, content: '', metadata: {} }
    }
  })

  // Handler para cargar imágenes individuales de documentación
  ipcMain.handle('load-documentation-image', async (_event, imagePath) => {
    try {
      if (!imagePath) return { success: false, error: 'Ruta no proporcionada' }
      if (
        imagePath.startsWith('data:') ||
        imagePath.startsWith('http://') ||
        imagePath.startsWith('https://')
      ) {
        return { success: true, dataUri: imagePath }
      }

      const ayudaPath = resolveAyudaPath()
      const clean = imagePath.trim().replace(/^<|>$/g, '').trim()

      const candidates = [...ayudaImageCandidates(ayudaPath, clean), path.resolve(clean)]

      for (const cand of candidates) {
        const fileToRead = resolveImageFile(cand)
        if (fileToRead) {
          return { success: true, dataUri: imageToDataUri(fileToRead) }
        }
      }

      // Búsqueda recursiva en ayudaPath/imagenes
      const baseNoExt = path.basename(clean, path.extname(clean))
      const found = findImageRecursive(path.join(ayudaPath, 'imagenes'), baseNoExt)
      if (found) {
        return { success: true, dataUri: imageToDataUri(found) }
      }

      return { success: false, error: 'Imagen no encontrada' }
    } catch (error) {
      console.error('❌ Error cargando imagen de documentación:', error)
      return { success: false, error: error.message }
    }
  })
}
