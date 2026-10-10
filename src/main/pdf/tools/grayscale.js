import zlib from 'zlib'

// Convierte un documento PDF a escala de grises real (monocromático) transformando
// flujos vectoriales (páginas y Form XObjects), gradientes (Shadings/Patterns) e imágenes (/DeviceRGB / ICCBased).
export const convertDocToGrayscale = async (doc) => {
  const { PDFName, PDFRawStream, PDFStream } = await import('pdf-lib')

  const processContentStream = (stream) => {
    if (!stream || !stream.contents) return

    const filter = stream.dict?.get(PDFName.of('Filter'))?.toString()
    let decompressed
    const isFlate = filter === '/FlateDecode'
    if (isFlate) {
      try {
        decompressed = zlib.inflateSync(Buffer.from(stream.contents))
      } catch {
        return
      }
    } else if (!filter) {
      decompressed = Buffer.from(stream.contents)
    } else {
      return
    }

    let contentStr = decompressed.toString('latin1')

    // Transformar operadores RGB: r g b (rg|RG|scn|SCN|sc|SC)
    contentStr = contentStr.replace(
      /(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)\s+(scn|SCN|rg|RG|sc|SC)\b/g,
      (match, rStr, gStr, bStr, op) => {
        const r = parseFloat(rStr)
        const g = parseFloat(gStr)
        const b = parseFloat(bStr)
        if (isNaN(r) || isNaN(g) || isNaN(b)) return match
        const gray = Math.max(0, Math.min(1, 0.299 * r + 0.587 * g + 0.114 * b)).toFixed(4)
        return `${gray} ${gray} ${gray} ${op}`
      }
    )

    // Transformar operadores CMYK: c m y k (k|K)
    contentStr = contentStr.replace(
      /(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)\s+(k|K)\b/g,
      (match, cStr, mStr, yStr, kStr, op) => {
        const c = parseFloat(cStr)
        const m = parseFloat(mStr)
        const y = parseFloat(yStr)
        const k = parseFloat(kStr)
        if (isNaN(c) || isNaN(m) || isNaN(y) || isNaN(k)) return match
        const grayK = Math.max(0, Math.min(1, 0.299 * c + 0.587 * m + 0.114 * y + k)).toFixed(4)
        return `0 0 0 ${grayK} ${op}`
      }
    )

    const newBuffer = Buffer.from(contentStr, 'latin1')
    if (isFlate) {
      stream.contents = zlib.deflateSync(newBuffer)
    } else {
      stream.contents = new Uint8Array(newBuffer)
    }
  }

  const convertFunctionColors = (fnTarget) => {
    if (!fnTarget) return
    const resolved = (fnTarget.tag === 'Ref' || fnTarget._objectNumber !== undefined)
      ? doc.context.lookup(fnTarget)
      : fnTarget
    if (!resolved) return
    const d = resolved.dict || (typeof resolved.get === 'function' ? resolved : null)
    if (!d) return

    // Manejar funciones compuestas / stitching (Tipo 3)
    const childFunctions = d.get(PDFName.of('Functions'))
    if (childFunctions && typeof childFunctions.asArray === 'function') {
      for (const child of childFunctions.asArray()) {
        convertFunctionColors(child)
      }
    } else if (Array.isArray(childFunctions)) {
      for (const child of childFunctions) {
        convertFunctionColors(child)
      }
    }

    // Procesar puntos extremos de color de gradientes C0 y C1
    for (const key of ['C0', 'C1']) {
      const cArr = d.get(PDFName.of(key))
      if (cArr && typeof cArr.asArray === 'function') {
        const arr = cArr.asArray()
        if (arr.length === 3) {
          const r = parseFloat(arr[0].toString())
          const g = parseFloat(arr[1].toString())
          const b = parseFloat(arr[2].toString())
          if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            const gray = Math.round(Math.max(0, Math.min(1, 0.299 * r + 0.587 * g + 0.114 * b)) * 10000) / 10000
            d.set(PDFName.of(key), doc.context.obj([gray, gray, gray]))
          }
        }
      }
    }
  }

  // 1. Convertir flujos de contenido de todas las páginas
  for (const page of doc.getPages()) {
    const contentsRef = page.node.Contents()
    if (!contentsRef) continue

    let streams = []
    if (typeof contentsRef.asArray === 'function') {
      streams = contentsRef.asArray().map((r) => doc.context.lookup(r) || r)
    } else if (Array.isArray(contentsRef)) {
      streams = contentsRef.map((r) => doc.context.lookup(r) || r)
    } else {
      const resolved = (contentsRef.tag === 'Ref' || contentsRef._objectNumber !== undefined)
        ? doc.context.lookup(contentsRef)
        : contentsRef
      streams = [resolved || contentsRef]
    }

    for (const s of streams) {
      processContentStream(s)
    }
  }

  // 2. Procesar todos los objetos indirectos (Form XObjects, Imágenes e iluminación/degradados Shading)
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    if (!obj) continue

    // 2A. Flujos (Form XObjects, imágenes y patrones)
    const isStream = (PDFRawStream && obj instanceof PDFRawStream) ||
                     (PDFStream && obj instanceof PDFStream) ||
                     (obj && obj.contents !== undefined && obj.dict !== undefined)
    if (isStream) {
      const subtype = obj.dict?.get(PDFName.of('Subtype'))?.toString()
      const type = obj.dict?.get(PDFName.of('Type'))?.toString()

      // Imágenes raster (/DeviceRGB, /ICCBased, etc.)
      if (subtype === '/Image') {
        const filter = obj.dict?.get(PDFName.of('Filter'))?.toString()
        const w = parseInt(obj.dict?.get(PDFName.of('Width'))?.toString() || '0', 10)
        const h = parseInt(obj.dict?.get(PDFName.of('Height'))?.toString() || '0', 10)

        if (filter === '/FlateDecode' && w > 0 && h > 0) {
          try {
            const raw = zlib.inflateSync(Buffer.from(obj.contents))
            // Buffer RGB de 3 canales (DeviceRGB, ICCBased, CalRGB)
            if (raw.length === w * h * 3) {
              for (let i = 0; i < raw.length; i += 3) {
                const gray = Math.round(0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2])
                raw[i] = gray
                raw[i + 1] = gray
                raw[i + 2] = gray
              }
              obj.contents = zlib.deflateSync(raw)
            } else if (raw.length === h * (1 + w * 3)) {
              // Buffer con predictor PNG (3 canales)
              const rowBytes = 1 + w * 3
              for (let y = 0; y < h; y++) {
                const rowStart = y * rowBytes + 1
                for (let x = 0; x < w; x++) {
                  const idx = rowStart + x * 3
                  const gray = Math.round(0.299 * raw[idx] + 0.587 * raw[idx + 1] + 0.114 * raw[idx + 2])
                  raw[idx] = gray
                  raw[idx + 1] = gray
                  raw[idx + 2] = gray
                }
              }
              obj.contents = zlib.deflateSync(raw)
            } else if (raw.length === w * h * 4) {
              // Buffer RGBA de 4 canales (preserva canal alfa)
              for (let i = 0; i < raw.length; i += 4) {
                const gray = Math.round(0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2])
                raw[i] = gray
                raw[i + 1] = gray
                raw[i + 2] = gray
              }
              obj.contents = zlib.deflateSync(raw)
            } else if (raw.length === h * (1 + w * 4)) {
              // Buffer RGBA de 4 canales con predictor PNG (preserva canal alfa)
              const rowBytes = 1 + w * 4
              for (let y = 0; y < h; y++) {
                const rowStart = y * rowBytes + 1
                for (let x = 0; x < w; x++) {
                  const idx = rowStart + x * 4
                  const gray = Math.round(0.299 * raw[idx] + 0.587 * raw[idx + 1] + 0.114 * raw[idx + 2])
                  raw[idx] = gray
                  raw[idx + 1] = gray
                  raw[idx + 2] = gray
                }
              }
              obj.contents = zlib.deflateSync(raw)
            }
          } catch (imgErr) {
            console.warn('⚠️ Error al transformar imagen a escala de grises:', imgErr.message)
          }
        }
        continue
      }

      // Form XObjects (cabeceras, componentes visuales de Chromium) y flujos de patrones
      if (subtype === '/Form' || type === '/Pattern') {
        processContentStream(obj)
      }
    }

    // 2B. Diccionarios de Degradados (Shadings) y Patrones con Shading (cabeceras y fondos con gradientes CSS)
    const dict = obj.dict || (typeof obj.get === 'function' ? obj : null)
    if (dict) {
      let shading = dict.get(PDFName.of('Shading'))
      if (shading) {
        shading = (shading.tag === 'Ref' || shading._objectNumber !== undefined) ? doc.context.lookup(shading) : shading
      } else if (dict.get(PDFName.of('ShadingType'))) {
        shading = obj
      }

      if (shading) {
        const sDict = shading.dict || shading
        const fn = sDict.get(PDFName.of('Function'))
        if (fn) {
          convertFunctionColors(fn)
        }
        const bg = sDict.get(PDFName.of('Background'))
        if (bg && typeof bg.asArray === 'function') {
          const arr = bg.asArray()
          if (arr.length === 3) {
            const r = parseFloat(arr[0].toString())
            const g = parseFloat(arr[1].toString())
            const b = parseFloat(arr[2].toString())
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
              const gray = Math.round((0.299 * r + 0.587 * g + 0.114 * b) * 10000) / 10000
              sDict.set(PDFName.of('Background'), doc.context.obj([gray, gray, gray]))
            }
          }
        }
      }
    }
  }
}
