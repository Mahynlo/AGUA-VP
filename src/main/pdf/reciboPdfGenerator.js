import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import pdfmake from 'pdfmake'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Colores oficiales exactos de Recibo_diseno.png y Recibo.jsx
const COLORES = {
  rojoHeader: '#b91c1c', // Rojo carmesí intenso
  bordeDorado: '#a16207', // Dorado/Bronce para los bordes principales de las tarjetas
  rosaInfo: '#be185d', // Rosa magenta para caja de información
  verdeEquiv: '#15803d', // Verde bosque para caja de equivalencia
  bordeTalon: '#af6327', // Bronce para el marco del talón de caja
  bgGrisClaro: '#f9fafb', // Fondo gris tenue para cajas de métricas
  bordeGris: '#e5e7eb', // Borde suave
  textoOscuro: '#111827', // Texto principal oscuro
  textoGris: '#4b5563', // Texto secundario
  textoGrisClaro: '#6b7280', // Texto terciario / fechas
  tealGrafica: '#27afa7', // Turquesa idéntico al diseño de ApexCharts / Recibo_diseno.png
  guiaGrafica: '#af272f', // Rojo guía de la gráfica
  guiaGraficaClaro: '#fca5a5' // Rojo claro punteado
}

// Escape de caracteres especiales para strings dentro de SVG
function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return ''
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Resolver seguro de la carpeta de fuentes (Segoe UI, Consolas, Roboto)
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

function resolveRobotoFonts() {
  const candidates = [
    path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto'),
    path.join(process.cwd(), 'AguaVP', 'node_modules', 'pdfmake', 'fonts', 'Roboto'),
    path.join(__dirname, '..', 'node_modules', 'pdfmake', 'fonts', 'Roboto'),
    path.join(__dirname, '../..', 'node_modules', 'pdfmake', 'fonts', 'Roboto'),
    path.join(__dirname, '../../..', 'node_modules', 'pdfmake', 'fonts', 'Roboto'),
    path.join(
      process.resourcesPath || '',
      'app.asar.unpacked',
      'node_modules',
      'pdfmake',
      'fonts',
      'Roboto'
    )
  ]

  try {
    const electron = globalThis.require ? globalThis.require('electron') : null
    if (electron?.app?.getAppPath) {
      candidates.unshift(
        path.join(electron.app.getAppPath(), 'node_modules', 'pdfmake', 'fonts', 'Roboto')
      )
    }
  } catch (e) {}

  for (const p of candidates) {
    if (p && fs.existsSync(path.join(p, 'Roboto-Regular.ttf'))) {
      return p
    }
  }
  return null
}

// Configurar fuentes Segoe UI, Consolas y Roboto en pdfmake
let fontsConfigured = false
function ensureFonts() {
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

  pdfmake.addFonts(fonts)

  if (typeof pdfmake.setUrlAccessPolicy === 'function') {
    pdfmake.setUrlAccessPolicy(() => true)
  }
  if (typeof pdfmake.setLocalAccessPolicy === 'function') {
    pdfmake.setLocalAccessPolicy(() => true)
  }
  fontsConfigured = true
}

// Utilidades de formateo de fecha sincronizadas con Recibo.jsx
function parsearFechaYMD(value) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value !== 'string') return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2}))?/)
  if (!match) {
    const fallback = new Date(value)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const hour = match[4] !== undefined ? Number(match[4]) : 0
  const min = match[5] !== undefined ? Number(match[5]) : 0
  const sec = match[6] !== undefined ? Number(match[6]) : 0
  return new Date(year, month, day, hour, min, sec)
}

function formatearFecha(value) {
  if (!value) return 'N/A'
  const date = parsearFechaYMD(value)
  if (!date || Number.isNaN(date.getTime())) return 'N/A'
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const dia = String(date.getDate()).padStart(2, '0')
  const mes = meses[date.getMonth()]
  const anio = date.getFullYear()
  return `${dia} ${mes} ${anio}`
}

function siguienteDiaHabil(fecha) {
  const f = new Date(fecha)
  const diaSemana = f.getDay() // 0 = Dom, 6 = Sáb
  if (diaSemana === 6)
    f.setDate(f.getDate() + 2) // Sábado -> Lunes
  else if (diaSemana === 0) f.setDate(f.getDate() + 1) // Domingo -> Lunes
  return f
}

function calcularCorteApartirDe(fechaVencimiento) {
  const fechaBase = parsearFechaYMD(fechaVencimiento)
  if (!fechaBase) return null
  fechaBase.setDate(fechaBase.getDate() + 1)
  return siguienteDiaHabil(fechaBase)
}

function formatearFechaHoraEmisionCabecera(factura) {
  if (!factura) return 'N/A'
  const fuenteFecha =
    factura.fecha_emision_hora ||
    factura.fecha_emision_datetime ||
    factura.fecha_creacion ||
    factura.created_at ||
    factura.fecha_emision
  if (!fuenteFecha) return 'N/A'
  const date = parsearFechaYMD(fuenteFecha)
  if (!date || Number.isNaN(date.getTime())) return 'N/A'

  const fechaTxt = formatearFecha(date)
  const tieneHora = typeof fuenteFecha === 'string' && /(\d{2}:\d{2})/.test(fuenteFecha)
  if (!tieneHora) return `${fechaTxt}, 09:44:19 p.m.`

  const hora = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
    .format(date)
    .toLowerCase()

  return `${fechaTxt}, ${hora}`
}

function obtenerIdentificadorRecibo(factura, ciudadFiltro = 'All') {
  if (!factura) return ''
  const predio = factura.numero_predio || ''
  const match = predio.match(/^([A-Za-z]+)[-\/]?(\d+)$/)
  if (match) {
    const siglas = match[1].toUpperCase()
    const numero = parseInt(match[2], 10)
    if (ciudadFiltro === 'All' || !ciudadFiltro) {
      return `(${siglas}) - ${numero}`
    }
    return String(numero)
  }
  return predio || ''
}

// Resolver de ruta del logo municipal (PDFKit requiere PNG o JPEG nativo)
function resolveLogoPath() {
  const candidates = [
    path.join(__dirname, 'assets', 'Escudo_Villa_Pesqueira_sin_fondo.png'),
    path.join(
      process.cwd(),
      'src',
      'main',
      'pdf',
      'assets',
      'Escudo_Villa_Pesqueira_sin_fondo.png'
    ),
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
      'AguaVP',
      'src',
      'renderer',
      'src',
      'assets',
      'images',
      'Escudo_Villa_Pesqueira_sin_fondo.png'
    ),
    path.join(
      __dirname,
      '..',
      'src',
      'renderer',
      'src',
      'assets',
      'images',
      'Escudo_Villa_Pesqueira_sin_fondo.png'
    ),
    path.join(
      __dirname,
      '../..',
      'src',
      'renderer',
      'src',
      'assets',
      'images',
      'Escudo_Villa_Pesqueira_sin_fondo.png'
    ),
    path.join(
      __dirname,
      '../../..',
      'src',
      'renderer',
      'src',
      'assets',
      'images',
      'Escudo_Villa_Pesqueira_sin_fondo.png'
    ),
    path.join(
      process.resourcesPath || '',
      'app.asar.unpacked',
      'src',
      'main',
      'pdf',
      'assets',
      'Escudo_Villa_Pesqueira_sin_fondo.png'
    ),
    path.join(
      process.resourcesPath || '',
      'app.asar.unpacked',
      'src',
      'renderer',
      'src',
      'assets',
      'images',
      'Escudo_Villa_Pesqueira_sin_fondo.png'
    )
  ]

  try {
    const electron = globalThis.require ? globalThis.require('electron') : null
    if (electron?.app?.getAppPath) {
      candidates.unshift(
        path.join(
          electron.app.getAppPath(),
          'src',
          'main',
          'pdf',
          'assets',
          'Escudo_Villa_Pesqueira_sin_fondo.png'
        ),
        path.join(
          electron.app.getAppPath(),
          'src',
          'renderer',
          'src',
          'assets',
          'images',
          'Escudo_Villa_Pesqueira_sin_fondo.png'
        )
      )
    }
  } catch (e) {}

  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      return p
    }
  }
  return null
}

// Carga del logo del municipio en base64
function obtenerLogoBase64(customLogoBase64) {
  if (
    customLogoBase64 &&
    typeof customLogoBase64 === 'string' &&
    customLogoBase64.startsWith('data:image')
  ) {
    return customLogoBase64
  }
  const defaultLogoPath = resolveLogoPath()
  if (defaultLogoPath && fs.existsSync(defaultLogoPath)) {
    const data = fs.readFileSync(defaultLogoPath)
    const ext = path.extname(defaultLogoPath).toLowerCase()
    const mime =
      ext === '.avif'
        ? 'image/avif'
        : ext === '.webp'
          ? 'image/webp'
          : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : 'image/png'
    return `data:${mime};base64,${data.toString('base64')}`
  }
  return null
}

// Helper para envolver texto en líneas para elementos SVG sin truncamiento
// Helper para envolver texto en líneas para elementos SVG
// respetando aproximadamente el ancho disponible.
function wrapTextSvg(text, maxWidth = 153, fontSize = 8, maxLines = 4, fontFamily = 'Roboto') {
  if (!text) return []

  const avgCharWidth = fontSize * 0.5
  const maxCharsPerLine = Math.max(10, Math.floor(maxWidth / avgCharWidth))

  const words = String(text).trim().split(/\s+/)

  const lines = []
  let currentLine = ''

  for (const originalWord of words) {
    let word = originalWord

    // Si la palabra individual es demasiado larga,
    // dividirla para evitar que salga de la caja.
    while (word.length > maxCharsPerLine) {
      if (currentLine) {
        lines.push(currentLine)
        currentLine = ''

        if (lines.length >= maxLines) {
          return lines
        }
      }

      lines.push(word.slice(0, maxCharsPerLine - 1) + '…')

      if (lines.length >= maxLines) {
        return lines
      }

      word = word.slice(maxCharsPerLine - 1)
    }

    const candidate = currentLine ? `${currentLine} ${word}` : word

    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate
    } else {
      if (currentLine) {
        lines.push(currentLine)

        if (lines.length >= maxLines) {
          break
        }
      }

      currentLine = word
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine)
  }

  // Si hubo más contenido del que cabe,
  // marcar la última línea con …
  const textoReconstruido = lines.join(' ')
  const textoOriginal = words.join(' ')

  if (textoReconstruido.length < textoOriginal.length && lines.length > 0) {
    let ultima = lines[lines.length - 1]

    if (!ultima.endsWith('…')) {
      ultima = ultima.replace(/[.,;:]?$/, '')

      if (ultima.length >= maxCharsPerLine - 1) {
        ultima = ultima.slice(0, maxCharsPerLine - 2).trimEnd() + '…'
      } else {
        ultima += '…'
      }

      lines[lines.length - 1] = ultima
    }
  }

  return lines
}

//0.Generar linea  puntada en gris
function generarLineaPunteada(ancho = 345, alto = 1) {
  return `<svg width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg">
    <line x1="0" y1="${alto / 2}" x2="${ancho}" y2="${alto / 2}" stroke="#e5e7eb" stroke-width="${alto}" stroke-dasharray="4,2.5" />
  </svg>`
}

// 1. Header SVG con bordes redondeados (rx=10) y círculo de escudo centrado
function generarSvgHeader(ancho = 345, alto = 66, opciones = {}) {
  const {
    paddingIzquierdo = 14,
    espacioLogoTexto = 9,
    circleSize = 55,
    interlineado = 1, // factor multiplicador del fontSize de cada línea
    espacioExtraLineas = 0 // px adicionales fijos entre líneas (encima del interlineado)
  } = opciones

  const circleCx = paddingIzquierdo + circleSize / 2
  const circleCy = alto / 2
  const textX = circleCx + circleSize / 2 + espacioLogoTexto

  const lineas = [
    { text: 'CUIDEMOS DEL AGUA', fontSize: 15, bold: true, color: '#ffffff', letterSpacing: 0.3 },
    { text: 'Comisión Municipal de Agua Potable y Alcantarillado', fontSize: 11, color: '#ffffff' },
    { text: 'Villa Pesqueira, Sonora', fontSize: 9, color: '#fee2e2' }
  ]

  // Cada línea ocupa: (fontSize * interlineado) + espacio extra fijo
  const alturas = lineas.map((l) => l.fontSize * interlineado + espacioExtraLineas)
  const alturaTotal = alturas.reduce((a, b) => a + b, 0)

  let cursorY = circleCy - alturaTotal / 2 + alturas[0] * 0.75

  const textosSvg = lineas
    .map((l, i) => {
      const y = cursorY
      cursorY += alturas[i]
      return `<text
        x="${textX}"
        y="${y}"
        fill="${l.color}"
        font-family="Roboto"
        font-size="${l.fontSize}"
        ${l.bold ? 'font-weight="bold"' : ''}
        ${l.letterSpacing ? `letter-spacing="${l.letterSpacing}"` : ''}
      >${l.text}</text>`
    })
    .join('\n')

  return `
    <svg
      width="${ancho}"
      height="${alto}"
      viewBox="0 0 ${ancho} ${alto}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0.5"
        y="0.5"
        width="${ancho - 1}"
        height="${alto - 1}"
        rx="10"
        ry="10"
        fill="${COLORES.rojoHeader}"
      />

      <circle
        cx="${circleCx}"
        cy="${circleCy}"
        r="${circleSize / 2}"
        fill="#ffffff"
        stroke="#fee2e2"
        stroke-width="0.75"
      />

      ${textosSvg}
    </svg>
  `
}

// 2. Columna Izquierda SVG (Datos, Servicio, Facturación, Total a pagar) con altura fija exacta
function generarSvgColumnaIzquierda(factura, ancho = 167.5, alto = 244) {
  const fechaCorte = calcularCorteApartirDe(factura.fecha_vencimiento)
  const totalMes = Number(factura.total) || 0
  const saldoPendiente = Number(factura.saldo_pendiente) || 0
  const totalPagar = totalMes + saldoPendiente

  const wInner = ancho - 7
  const xLeft = 3.5
  const xTextL = 7.5
  const xTextR = ancho - 7.5
  const xMid = ancho / 2

  const clienteNombre = escapeXml(factura.cliente_nombre || 'N/A').toUpperCase()
  const clienteDireccion = escapeXml(factura.direccion_cliente || 'N/A')
  const clienteCiudad = escapeXml(factura.cliente_ciudad || 'Villa Pesqueira, Son')

  const medidorSerie = escapeXml(factura.medidor?.numero_serie || 'N/A')
  const tarifaNombre = escapeXml(factura.tarifa_nombre || 'Domestica')
  const rutaNombre = escapeXml(factura.ruta?.nombre || 'N/A')

  const mesFacturado = escapeXml(String(factura.mes_facturado || '').toUpperCase())
  const fechaLectura = formatearFecha(factura.fecha_lectura)
  const fechaVencimiento = formatearFecha(factura.fecha_vencimiento)
  const fechaCorteTxt = formatearFecha(fechaCorte)

  return `
    <svg width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg">
      <!-- Marco contenedor dorado con esquinas redondeadas -->
      <rect x="0.75" y="0.75" width="${ancho - 1.5}" height="${alto - 1.5}" rx="8" ry="8" fill="#ffffff" stroke="${COLORES.bordeDorado}" stroke-width="1.5" />

      <!-- SUB-TARJETA 1: DATOS DE CLIENTE -->
      <rect x="${xLeft}" y="3.5" width="${wInner}" height="12" rx="3" fill="${COLORES.rojoHeader}" />
      <text x="${xMid}" y="12" fill="#ffffff" font-family="Roboto" font-size="9" font-weight="bold" text-anchor="middle">DATOS DE CLIENTE</text>
      
      <rect x="${xLeft}" y="15.5" width="${wInner}" height="34.5" rx="2" fill="#ffffff" stroke="#e5e7eb" stroke-width="0.75" />
      <text x="${xTextL}" y="25.5" fill="${COLORES.textoOscuro}" font-family="Roboto" font-size="7.5" font-weight="bold">${clienteNombre}</text>
      <text x="${xTextL}" y="35.5" fill="${COLORES.textoGris}" font-family="Roboto" font-size="6.8">${clienteDireccion}</text>
      <text x="${xTextL}" y="45" fill="${COLORES.textoGrisClaro}" font-family="Roboto" font-size="6.8">${clienteCiudad}</text>

      <!-- SUB-TARJETA 2: INFORMACIÓN DE SERVICIO -->
      <rect x="${xLeft}" y="53" width="${wInner}" height="12" rx="3" fill="${COLORES.rojoHeader}" />
      <text x="${xMid}" y="61.5" fill="#ffffff" font-family="Roboto" font-size="9" font-weight="bold" text-anchor="middle">INFORMACIÓN DE SERVICIO</text>
      
      <rect x="${xLeft}" y="65" width="${wInner}" height="44" rx="2" fill="#ffffff" stroke="#e5e7eb" stroke-width="0.75" />
      
      <text x="${xTextL}" y="74.5" fill="${COLORES.textoGris}" font-family="Roboto" font-size="6.8" font-weight="bold">No. Medidor:</text>
      <text x="${xTextR}" y="74.5" fill="${COLORES.textoOscuro}" font-family="Roboto" font-size="6.8" font-weight="bold" text-anchor="end">${medidorSerie}</text>
      <line x1="${xTextL}" y1="77" x2="${xTextR}" y2="77" stroke="#f3f4f6" stroke-width="0.5" />

      <text x="${xTextL}" y="85" fill="${COLORES.textoGris}" font-family="Roboto" font-size="6.8" font-weight="bold">Consumo:</text>
      <text x="${xTextR}" y="85" fill="#000000" font-family="Roboto" font-size="6.8" font-weight="bold" text-anchor="end">${factura.consumo_m3 || 0} m³</text>
      <line x1="${xTextL}" y1="87.5" x2="${xTextR}" y2="87.5" stroke="#f3f4f6" stroke-width="0.5" />

      <text x="${xTextL}" y="95.5" fill="${COLORES.textoGris}" font-family="Roboto" font-size="6.8" font-weight="bold">Tarifa:</text>
      <text x="${xTextR}" y="95.5" fill="${COLORES.textoGris}" font-family="Roboto" font-size="6.8" text-anchor="end">${tarifaNombre}</text>
      <line x1="${xTextL}" y1="98" x2="${xTextR}" y2="98" stroke="#f3f4f6" stroke-width="0.5" />

      <text x="${xTextL}" y="105.5" fill="${COLORES.textoGris}" font-family="Roboto" font-size="6.8" font-weight="bold">Ruta:</text>
      <text x="${xTextR}" y="105.5" fill="${COLORES.textoGris}" font-family="Roboto" font-size="6.8" text-anchor="end">${rutaNombre}</text>

      <!-- SUB-TARJETA 3: DETALLE DE FACTURACIÓN -->
      <rect x="${xLeft}" y="112" width="${wInner}" height="12" rx="3" fill="${COLORES.rojoHeader}" />
      <text x="${xMid}" y="120.5" fill="#ffffff" font-family="Roboto" font-size="9" font-weight="bold" text-anchor="middle">DETALLE DE FACTURACIÓN</text>
      
      <rect x="${xLeft}" y="124" width="${wInner}" height="71" rx="2" fill="#ffffff" stroke="#e5e7eb" stroke-width="0.75" />

      <text x="${xTextL}" y="133.5" fill="${COLORES.textoGris}" font-family="Roboto" font-size="6.8" font-weight="bold">Mes facturado:</text>
      <text x="${xTextR}" y="133.5" fill="${COLORES.textoOscuro}" font-family="Roboto" font-size="6.8" font-weight="bold" text-anchor="end">${mesFacturado}</text>

      <text x="${xTextL}" y="144.5" fill="${COLORES.textoGris}" font-family="Roboto" font-size="6.8" font-weight="bold">Fecha lectura:</text>
      <text x="${xTextR}" y="144.5" fill="${COLORES.textoGris}" font-family="Roboto" font-size="6.8" text-anchor="end">${fechaLectura}</text>

      <text x="${xTextL}" y="155.5" fill="${COLORES.textoGris}" font-family="Roboto" font-size="6.8" font-weight="bold">Vencimiento:</text>
      <text x="${xTextR}" y="155.5" fill="${COLORES.textoGris}" font-family="Roboto" font-size="6.8" text-anchor="end">${fechaVencimiento}</text>

      <text x="${xTextL}" y="166.5" fill="${COLORES.textoGris}" font-family="Roboto" font-size="6.8" font-weight="bold">Corte a partir de:</text>
      <text x="${xTextR}" y="166.5" fill="${COLORES.textoGris}" font-family="Roboto" font-size="6.8" text-anchor="end">${fechaCorteTxt}</text>

      <text x="${xTextL}" y="178" fill="${COLORES.textoGris}" font-family="Roboto" font-size="6.8" font-weight="bold">Total del mes:</text>
      <text x="${xTextR}" y="178" fill="${COLORES.textoOscuro}" font-family="Roboto" font-size="6.8" text-anchor="end">$${totalMes.toFixed(2)}</text>

      <text x="${xTextL}" y="189.5" fill="#b91c1c" font-family="Roboto" font-size="6.8" font-weight="bold">Adeudo:</text>
      <text x="${xTextR}" y="189.5" fill="${saldoPendiente > 0 ? '#b91c1c' : '#15803d'}" font-family="Roboto" font-size="6.8" font-weight="bold" text-anchor="end">${saldoPendiente > 0 ? `$${saldoPendiente.toFixed(2)}` : 'Sin Adeudo'}</text>

      <!-- SUB-TARJETA 4: TOTAL A PAGAR (Recuadro redondeado punteado) -->
      <rect x="${xLeft}" y="198" width="${wInner}" height="42" rx="6" ry="6" fill="#ffffff" stroke="${COLORES.rojoHeader}" stroke-width="1.5" stroke-dasharray="4,2.5" />
      <text x="${xMid}" y="209" fill="${COLORES.textoGrisClaro}" font-family="Roboto" font-size="6.2" font-weight="bold" text-anchor="middle">TOTAL A PAGAR</text>
      <text x="${xMid}" y="228" fill="#000000" font-family="Roboto" font-size="14.5" font-weight="bold" text-anchor="middle">$${totalPagar.toFixed(2)}</text>
    </svg>
  `
}

// 3. Columna Derecha SVG (Información de Consumo, 2x2 Métricas, Gráfica) con altura fija exacta
function generarSvgColumnaDerecha(factura, ancho = 167.5, alto = 244) {
  const consumoAnt = factura.stats?.anterior ?? Math.max(0, (factura.consumo_m3 || 0) - 2)
  const promedio = factura.stats?.promedio ?? Math.round((factura.consumo_m3 || 0) * 0.9)
  const variacion = factura.stats?.variacion ?? 0

  const wInner = ancho - 7
  const xLeft = 3.5
  const xMid = ancho / 2

  const wMetric = (wInner - 3) / 2
  const xCol2 = xLeft + wMetric + 3

  // Gráfica de barras dentro de la columna derecha (soporta de 1 a 12 meses dinámicamente)
  const datos =
    Array.isArray(factura.historicoConsumo) && factura.historicoConsumo.length > 0
      ? factura.historicoConsumo
      : [
          { mes: 'Ene', consumo: 18 },
          { mes: 'Feb', consumo: 20 },
          { mes: 'Mar', consumo: 55 },
          { mes: 'Abr', consumo: 30 },
          { mes: 'May', consumo: 27 },
          { mes: 'Jun', consumo: 45 },
          { mes: 'Jul', consumo: 60 },
          { mes: 'Ago', consumo: 50 },
          { mes: 'Sep', consumo: 30 },
          { mes: 'Oct', consumo: 25 },
          { mes: 'Nov', consumo: 21 },
          { mes: 'Dic', consumo: 15 }
        ]

  const maxConsumo = Math.max(...datos.map((d) => Number(d.consumo) || 0), 0)

  let ticks = [0, 20, 40, 60, 80]
  let maxEjeY = 80

  if (maxConsumo === 0) {
    ticks = [0, 1, 2]
    maxEjeY = 2
  } else if (maxConsumo <= 2) {
    ticks = [0, 1, 2]
    maxEjeY = 2
  } else if (maxConsumo <= 4) {
    ticks = [0, 1, 2, 3, 4]
    maxEjeY = 4
  } else if (maxConsumo <= 20) {
    ticks = [0, 5, 10, 15, 20]
    maxEjeY = 20
  } else if (maxConsumo <= 40) {
    ticks = [0, 10, 20, 30, 40]
    maxEjeY = 40
  } else if (maxConsumo <= 80) {
    ticks = [0, 20, 40, 60, 80]
    maxEjeY = 80
  } else {
    maxEjeY = Math.ceil(maxConsumo / 20) * 20
    const paso = maxEjeY / 4
    ticks = [0, paso, paso * 2, paso * 3, maxEjeY]
  }

  // Dimensiones del área de gráfica
  const yGraficaBox = 69
  const hGraficaBox = 171
  const xOrigen = xLeft + 15
  const xFin = xLeft + wInner - 6
  const yBase = yGraficaBox + hGraficaBox - 16
  const yTop = yGraficaBox + 15
  const altoUtil = yBase - yTop

  let lineasY = ''
  let labelsY = ''

  ticks.forEach((tickVal) => {
    const yNivel = yBase - (tickVal / maxEjeY) * altoUtil
    lineasY += `<line x1="${xOrigen}" y1="${yNivel.toFixed(1)}" x2="${xFin}" y2="${yNivel.toFixed(1)}" stroke="#af272f" stroke-width="0.5" stroke-dasharray="1.5,1.5" />\n`
    labelsY += `<text x="${xOrigen - 2}" y="${(yNivel + 2).toFixed(1)}" fill="#af272f" font-family="Roboto" font-size="5" text-anchor="end">${Math.round(tickVal)}</text>\n`
  })

  const numBarras = Math.max(1, datos.length)
  const anchoZonaUtil = xFin - xOrigen - 4
  const pasoX = anchoZonaUtil / numBarras
  const anchoBarra = Math.min(13, pasoX * 0.72)
  const fontSizeMes = numBarras >= 10 ? 4.5 : numBarras >= 7 ? 4.9 : 5.3
  const fontSizeVal = numBarras >= 10 ? 4.6 : numBarras >= 7 ? 5.0 : 5.5

  let barrasSvg = ''
  let labelsXSvg = ''

  datos.forEach((d, i) => {
    const consumo = Number(d.consumo) || 0
    const xCentro = xOrigen + 2 + i * pasoX + pasoX / 2
    const xBarra = xCentro - anchoBarra / 2
    const mesNom = String(d.mes || '').slice(0, 3)

    labelsXSvg += `<text x="${xCentro.toFixed(1)}" y="${yGraficaBox + hGraficaBox - 5}" fill="#af272f" font-family="Roboto" font-size="${fontSizeMes}" text-anchor="middle">${mesNom}</text>\n`

    if (consumo > 0) {
      const altoBarra = Math.max(3, (consumo / maxEjeY) * altoUtil)
      const yBarra = yBase - altoBarra

      barrasSvg += `
        <rect x="${xBarra.toFixed(1)}" y="${yBarra.toFixed(1)}" width="${anchoBarra.toFixed(1)}" height="${altoBarra.toFixed(1)}" rx="2" ry="2" fill="${COLORES.tealGrafica}" />
      `

      if (altoBarra >= 10) {
        barrasSvg += `
          <text x="${xCentro.toFixed(1)}" y="${(yBarra + 6.5).toFixed(1)}" fill="#ffffff" font-family="Roboto" font-size="${fontSizeVal}" font-weight="bold" text-anchor="middle">${consumo}</text>
        `
      } else {
        barrasSvg += `
          <text x="${xCentro.toFixed(1)}" y="${(yBarra - 1.5).toFixed(1)}" fill="${COLORES.tealGrafica}" font-family="Roboto" font-size="${fontSizeVal}" font-weight="bold" text-anchor="middle">${consumo}</text>
        `
      }
    }
  })

  return `
    <svg width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg">
      <!-- Marco contenedor dorado con esquinas redondeadas -->
      <rect x="0.75" y="0.75" width="${ancho - 1.5}" height="${alto - 1.5}" rx="8" ry="8" fill="#ffffff" stroke="${COLORES.bordeDorado}" stroke-width="1.5" />

      <!-- HEADER: INFORMACIÓN DE CONSUMO (Dorado con esquinas redondeadas) -->
      <rect x="${xLeft}" y="3.5" width="${wInner}" height="12" rx="3" fill="${COLORES.bordeDorado}" />
      <text x="${xMid}" y="12" fill="#ffffff" font-family="Roboto" font-size="9" font-weight="bold" text-anchor="middle">INFORMACIÓN DE CONSUMO</text>

      <!-- 2X2 GRID DE MÉTRICAS -->
      <!-- Mes Actual -->
      <rect x="${xLeft}" y="17.5" width="${wMetric}" height="22" rx="4" fill="${COLORES.bgGrisClaro}" stroke="${COLORES.bordeGris}" stroke-width="0.75" />
      <text x="${xLeft + wMetric / 2}" y="24.5" fill="${COLORES.textoGrisClaro}" font-family="Roboto" font-size="6" font-weight="bold" text-anchor="middle">MES ACTUAL</text>
      <text x="${xLeft + wMetric / 2}" y="35.5" fill="${COLORES.textoOscuro}" font-family="Roboto" font-size="9.5" font-weight="bold" text-anchor="middle">${factura.consumo_m3 || 0} m³</text>

      <!-- Mes Anterior -->
      <rect x="${xCol2}" y="17.5" width="${wMetric}" height="22" rx="4" fill="${COLORES.bgGrisClaro}" stroke="${COLORES.bordeGris}" stroke-width="0.75" />
      <text x="${xCol2 + wMetric / 2}" y="24.5" fill="${COLORES.textoGrisClaro}" font-family="Roboto" font-size="6" font-weight="bold" text-anchor="middle">MES ANTERIOR</text>
      <text x="${xCol2 + wMetric / 2}" y="35.5" fill="${COLORES.textoOscuro}" font-family="Roboto" font-size="9.5" font-weight="bold" text-anchor="middle">${consumoAnt} m³</text>

      <!-- Promedio -->
      <rect x="${xLeft}" y="42.5" width="${wMetric}" height="22" rx="4" fill="${COLORES.bgGrisClaro}" stroke="${COLORES.bordeGris}" stroke-width="0.75" />
      <text x="${xLeft + wMetric / 2}" y="49.5" fill="${COLORES.textoGrisClaro}" font-family="Roboto" font-size="6" font-weight="bold" text-anchor="middle">PROMEDIO</text>
      <text x="${xLeft + wMetric / 2}" y="60.5" fill="#1d4ed8" font-family="Roboto" font-size="9.5" font-weight="bold" text-anchor="middle">${promedio} m³</text>

      <!-- Variación -->
      <rect x="${xCol2}" y="42.5" width="${wMetric}" height="22" rx="4" fill="${COLORES.bgGrisClaro}" stroke="${COLORES.bordeGris}" stroke-width="0.75" />
      <text x="${xCol2 + wMetric / 2}" y="49.5" fill="${COLORES.textoGrisClaro}" font-family="Roboto" font-size="6" font-weight="bold" text-anchor="middle">VARIACIÓN</text>
      <text x="${xCol2 + wMetric / 2}" y="60.5" fill="${COLORES.textoGris}" font-family="Roboto" font-size="9.5" font-weight="bold" text-anchor="middle">${variacion}%</text>

      <!-- ÁREA DE GRÁFICA DE BARRAS -->
      <rect x="${xLeft}" y="${yGraficaBox}" width="${wInner}" height="${hGraficaBox}" rx="6" ry="6" fill="#ffffff" stroke="${COLORES.bordeGris}" stroke-width="0.75" />
      <text x="${xLeft + 4}" y="${yGraficaBox + 10}" fill="#af272f" font-family="Roboto" font-size="5.5" font-weight="bold">m³</text>
      ${lineasY}
      ${labelsY}
      ${barrasSvg}
      ${labelsXSvg}
    </svg>
  `
}

// 4. Cajas Inferiores SVG (Información Rosa y Consumo Equivalente Verde) con altura fija exacta
function generarSvgCajaInfo(texto, ancho = 167.5, alto = 70) {
  const len = (texto || '').length
  const fontSize = len > 140 ? 7.5 : len > 90 ? 8 : 8.2
  const lineHeight = len > 140 ? 7.5 : len > 90 ? 8.0 : 8.5
  const maxLineas = 5

  // 7 pt a la izquierda + 6 pt de margen derecho
  const maxWidth = ancho - 13

  const lineas = wrapTextSvg(texto, maxWidth, fontSize, maxLineas)

  let tspans = ''

  lineas.forEach((lin, idx) => {
    tspans += `
      <tspan
        x="7"
        dy="${idx === 0 ? 0 : lineHeight}"
      >${escapeXml(lin)}</tspan>
    `
  })

  return `
    <svg
      width="${ancho}"
      height="${alto}"
      viewBox="0 0 ${ancho} ${alto}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0.5"
        y="0.5"
        width="${ancho - 1}"
        height="${alto - 1}"
        rx="8"
        ry="8"
        fill="${COLORES.rosaInfo}"
      />

      <!-- Icono info -->
      <circle
        cx="12"
        cy="11.5"
        r="4.5"
        fill="none"
        stroke="#ffffff"
        stroke-width="1"
      />

      <line
        x1="12"
        y1="10"
        x2="12"
        y2="13"
        stroke="#ffffff"
        stroke-width="1"
      />

      <circle
        cx="12"
        cy="8.5"
        r="0.6"
        fill="#ffffff"
      />

      <!-- Título -->
      <text
        x="21"
        y="13.5"
        fill="#ffffff"
        font-family="Roboto"
        font-size="8"
        font-weight="bold"
        letter-spacing="0.3"
      >
        INFORMACIÓN
      </text>

      <line
        x1="6"
        y1="16.5"
        x2="${ancho - 6}"
        y2="16.5"
        stroke="#ffffff"
        stroke-width="0.5"
        stroke-opacity="0.3"
      />

      <!-- Texto -->
      <text
        x="7"
        y="25"
        fill="#ffffff"
        font-family="Roboto"
        font-size="${fontSize}"
      >
        ${tspans}
      </text>
    </svg>
  `
}

function generarSvgCajaEquiv(texto, ancho = 167.5, alto = 70) {
  const len = (texto || '').length
  const fontSize = len > 140 ? 6.7 : len > 90 ? 7.2 : 7.8
  const lineHeight = len > 140 ? 7.5 : len > 90 ? 8.0 : 8.5
  const maxLineas = 5

  const maxWidth = ancho - 13

  const lineas = wrapTextSvg(texto, maxWidth, fontSize, maxLineas)

  let tspans = ''

  lineas.forEach((lin, idx) => {
    tspans += `
      <tspan
        x="7"
        dy="${idx === 0 ? 0 : lineHeight}"
      >${escapeXml(lin)}</tspan>
    `
  })

  return `
    <svg
      width="${ancho}"
      height="${alto}"
      viewBox="0 0 ${ancho} ${alto}"
      xmlns="http://www.w3.org/2000/svg"
    >

      <rect
        x="0.5"
        y="0.5"
        width="${ancho - 1}"
        height="${alto - 1}"
        rx="8"
        ry="8"
        fill="${COLORES.verdeEquiv}"
      />

      <!-- Icono balanza/equivalencia -->
      <line
        x1="8.5"
        y1="14"
        x2="15.5"
        y2="14"
        stroke="#ffffff"
        stroke-width="0.8"
      />

      <line
        x1="12"
        y1="8"
        x2="12"
        y2="14"
        stroke="#ffffff"
        stroke-width="0.8"
      />

      <line
        x1="8"
        y1="9"
        x2="16"
        y2="9"
        stroke="#ffffff"
        stroke-width="0.8"
      />

      <path
        d="M 8.5 9 L 7.5 12 L 9.5 12 Z"
        fill="#ffffff"
      />

      <path
        d="M 15.5 9 L 14.5 12 L 16.5 12 Z"
        fill="#ffffff"
      />

      <!-- Título -->
      <text
        x="21"
        y="13.5"
        fill="#ffffff"
        font-family="Roboto"
        font-size="8"
        font-weight="bold"
        letter-spacing="0.3"
      >
        CONSUMO EQUIVALENTE
      </text>

      <line
        x1="6"
        y1="16.5"
        x2="${ancho - 6}"
        y2="16.5"
        stroke="#ffffff"
        stroke-width="0.5"
        stroke-opacity="0.3"
      />

      <!-- Texto -->
      <text
        x="7"
        y="26"
        fill="#ffffff"
        font-family="Roboto"
        font-size="${fontSize}"
      >
        ${tspans}
      </text>

    </svg>
  `
}

// 5. Línea de corte SVG (con ícono vectorial de tijeras — el emoji ✂ no
// renderiza porque Roboto no incluye glifos de emoji en pdfmake/pdfkit)
function generarSvgLineaCorte(
  ancho = 345,
  alto = 12,
  {
    colorLinea = '#b91c1c',
    colorTexto = '#6b7280',
    textoEtiqueta = 'CORTAR AQUÍ',
    fontFamily = 'Roboto',
    fontSize = 6,
    anchoEtiqueta = 105
  } = {}
) {
  const centroY = alto / 2
  const inicioEtiqueta = (ancho - anchoEtiqueta) / 2
  const finEtiqueta = inicioEtiqueta + anchoEtiqueta
  const centroEtiqueta = ancho / 2

  // Ícono de tijeras vectorial (estilo Lucide "scissors", viewBox 24x24)
  const iconSize = fontSize * 1.5
  const iconScale = iconSize / 24
  const gapIconoTexto = 3

  const anchoTextoAprox = textoEtiqueta.length * fontSize * 0.55
  const anchoTotal = iconSize + gapIconoTexto + anchoTextoAprox
  const inicioBloqueX = centroEtiqueta - anchoTotal / 2
  const iconX = inicioBloqueX
  const iconY = centroY - iconSize / 2
  const textX = inicioBloqueX + iconSize + gapIconoTexto

  const iconoTijeras = `<g transform="translate(${iconX}, ${iconY}) scale(${iconScale})" stroke="${colorTexto}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></g>`

  return `
    <svg width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="${centroY}" x2="${inicioEtiqueta}" y2="${centroY}" stroke="${colorLinea}" stroke-width="0.8" stroke-dasharray="4,3" />
      <rect x="${inicioEtiqueta}" y="0" width="${anchoEtiqueta}" height="${alto}" fill="#ffffff" />
      ${iconoTijeras}
      <text x="${textX}" y="${centroY + fontSize / 3}" fill="${colorTexto}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="bold" text-anchor="start">${textoEtiqueta}</text>
      <line x1="${finEtiqueta}" y1="${centroY}" x2="${ancho}" y2="${centroY}" stroke="${colorLinea}" stroke-width="0.8" stroke-dasharray="4,3" />
    </svg>
  `
}

// Utilidad: parte un texto en líneas que quepan dentro de un ancho dado (en px)
function partirTextoSvg(texto, maxWidth, fontSize) {
  const anchoPromedioChar = fontSize * 0.52
  const maxChars = Math.max(1, Math.floor(maxWidth / anchoPromedioChar))
  const palabras = String(texto).split(' ')
  const lineas = []
  let actual = ''

  palabras.forEach((palabra) => {
    const prueba = actual ? `${actual} ${palabra}` : palabra
    if (prueba.length > maxChars && actual) {
      lineas.push(actual)
      actual = palabra
    } else {
      actual = prueba
    }
  })
  if (actual) lineas.push(actual)
  return lineas
}

// 6. Talón de Caja SVG con bordes redondeados, marco de bronce grueso
// y alto dinámico: el texto largo se ajusta con salto de línea automático.
// Devuelve { svg, alto } — usa alto en vez de un valor fijo, así el
// contenido nunca queda cortado.
function generarSvgTalonCaja(factura, ancho = 345, opciones = {}) {
  const {
    fontSizeTitulo = 10,
    fontSizeTexto = 9,
    padding = 14,
    espacioColumnas = 14,
    anchoColumnaNotas = 90
  } = opciones

  const clienteNombre = escapeXml(factura.cliente_nombre || 'N/A')
  const clienteDireccion = escapeXml(factura.direccion_cliente || 'N/A')
  const mesFacturado = escapeXml(String(factura.mes_facturado || '').toLowerCase() || 'N/A')

  const xDivisor = padding + anchoColumnaNotas + espacioColumnas / 2
  const xColDerecha = xDivisor + espacioColumnas / 2
  const anchoColDerecha = ancho - xColDerecha - padding

  const lineHeight = fontSizeTexto * 1.5

  const campos = [
    { label: 'Usuario: ', valor: clienteNombre },
    { label: 'Dirección: ', valor: clienteDireccion },
    { label: 'Mes facturado: ', valor: mesFacturado }
  ].map((campo) => {
    const anchoDisponible = anchoColDerecha - campo.label.length * fontSizeTexto * 0.52
    const lineasValor = partirTextoSvg(campo.valor, anchoDisponible, fontSizeTexto)
    return { ...campo, lineas: lineasValor.length ? lineasValor : [''] }
  })

  let yCursor = padding + fontSizeTitulo
  yCursor += lineHeight * 0.6

  const bloquesTexto = []
  campos.forEach((campo) => {
    bloquesTexto.push({ ...campo, y: yCursor })
    yCursor += lineHeight * campo.lineas.length
  })

  yCursor += lineHeight * 0.3
  const yFechaPago = yCursor
  yCursor += lineHeight
  const yTotalPagado = yCursor
  yCursor += lineHeight

  const altoColDerecha = yCursor + padding * 0.6

  const numRenglonesNotas = 4
  const yNotasTitulo = padding + fontSizeTitulo
  const alturaDisponibleNotas = altoColDerecha - yNotasTitulo - padding * 0.6
  const pasoRenglon = alturaDisponibleNotas / numRenglonesNotas

  const renglonesNotas = Array.from({ length: numRenglonesNotas }, (_, i) => {
    const y = yNotasTitulo + pasoRenglon * (i + 1)
    return `<line x1="${padding}" y1="${y}" x2="${padding + anchoColumnaNotas}" y2="${y}" stroke="#d1d5db" stroke-width="0.6" />`
  }).join('\n')

  const alto = altoColDerecha

  const textosCampos = bloquesTexto
    .map((campo) => {
      const primeraLinea = `<tspan font-weight="bold">${campo.label}</tspan><tspan>${campo.lineas[0]}</tspan>`
      const lineasExtra = campo.lineas
        .slice(1)
        .map((linea) => `<tspan x="${xColDerecha}" dy="${lineHeight}">${linea}</tspan>`)
        .join('')
      return `<text x="${xColDerecha}" y="${campo.y}" fill="#1f2937" font-family="Roboto" font-size="${fontSizeTexto}">${primeraLinea}${lineasExtra}</text>`
    })
    .join('\n')

  const svg = `
    <svg width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="1.5" width="${ancho - 3}" height="${alto - 3}" rx="10" ry="10" fill="#ffffff" stroke="${COLORES.bordeTalon}" stroke-width="2.5" />
      <line x1="${xDivisor}" y1="${padding * 0.6}" x2="${xDivisor}" y2="${alto - padding * 0.6}" stroke="#e5e7eb" stroke-width="1" />
      <text x="${padding}" y="${yNotasTitulo}" fill="${COLORES.bordeTalon}" font-family="Roboto" font-size="${fontSizeTitulo}" font-weight="bold">Notas:</text>
      ${renglonesNotas}
      <text x="${xColDerecha}" y="${padding + fontSizeTitulo}" fill="${COLORES.bordeTalon}" font-family="Roboto" font-size="${fontSizeTitulo}" font-weight="bold">Información del recibo</text>
      ${textosCampos}
      <text x="${xColDerecha}" y="${yFechaPago}" fill="#1f2937" font-family="Roboto" font-size="${fontSizeTexto}">
        <tspan font-weight="bold">Fecha de pago: </tspan>____________________
      </text>
      <text x="${xColDerecha}" y="${yTotalPagado}" fill="#1f2937" font-family="Roboto" font-size="${fontSizeTexto}">
        <tspan font-weight="bold">Total pagado: $</tspan>____________________
      </text>
    </svg>
  `

  return { alto, svg }
}

// Construye la estructura visual de un recibo individual para pdfmake con alturas niveladas y diseño institucional idéntico a Recibo_diseno.png
function construirReciboPdfMake(factura, logoBase64, anuncioTexto, equivalenciaTexto) {
  if (!factura) {
    return {
      table: {
        widths: ['*'],
        body: [
          [
            {
              text: 'ESPACIO VACÍO',
              alignment: 'center',
              color: '#9ca3af',
              fontSize: 11,
              bold: true,
              margin: [0, 240, 0, 240]
            }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 1.5,
        vLineWidth: () => 1.5,
        hLineColor: () => COLORES.bordeDorado,
        vLineColor: () => COLORES.bordeDorado
      }
    }
  }

  const textoAnuncio =
    anuncioTexto ||
    'Cuidemos el agua para las futuras generaciones. Reporte cualquier fuga o problema en su medidor al teléfono de la oficina municipal.'

  const textoEquiv =
    equivalenciaTexto ||
    (factura.consumo_m3 > 0
      ? `Con ${factura.consumo_m3} m³ (similar a ${Math.round(factura.consumo_m3 / 10) * 10} m³): Lo mismo que llenar una alberca inflable mediana ${Math.max(1, Math.round(factura.consumo_m3 * 0.5))} veces`
      : 'No hay consumo registrado en este período')

  const lineaPunteada = {
    svg: generarLineaPunteada(345, 1),
    margin: [0, 2, 0, 2]
  }

  const header = {
    // Header SVG ligero con logo institucional en capa nativa (XObject)
    stack: [
      {
        svg: generarSvgHeader(345, 66),
        margin: [0, 0, 0, 0]
      },
      ...(logoBase64
        ? [
            {
              image: 'escudoLogo',
              width: 52,
              height: 52,
              relativePosition: { x: 15.5, y: -59 }
            }
          ]
        : [])
    ],
    margin: [0, 0, 0, 4]
  }

  const columnaIzquierda = {
    width: 167.5,
    svg: generarSvgColumnaIzquierda(factura, 167.5, 250)
  }

  const columnaDerecha = {
    // Columna derecha SVG con información de consumo, métricas y gráfica
    width: 167.5,
    svg: generarSvgColumnaDerecha(factura, 167.5, 250)
  }

  const cuerpoMedio = {
    columns: [columnaIzquierda, { width: 10, text: '' }, columnaDerecha],
    margin: [0, 0, 0, 4]
  }

  const cajasInferiores = {
    columns: [
      {
        width: 167.5,
        svg: generarSvgCajaInfo(textoAnuncio, 167.5, 70)
      },
      { width: 10, text: '' },
      {
        width: 167.5,
        svg: generarSvgCajaEquiv(textoEquiv, 167.5, 70)
      }
    ],
    margin: [0, 0, 0, 4]
  }

  const lineaCorte = {
    svg: generarSvgLineaCorte(345, 12),
    margin: [0, 2, 0, 2]
  }

  const resultadoTalon = generarSvgTalonCaja(factura, 345)
  const talonCaja = {
    svg: resultadoTalon.svg
  }

  return {
    stack: [lineaPunteada, header, cuerpoMedio, cajasInferiores, lineaCorte, talonCaja]
  }
}

/**
 * Genera el documento PDF completo para todas las páginas de recibos usando pdfmake de forma nativa e instantánea.
 * @param {Array} paginasRecibos - Array de páginas, cada una con hasta 2 recibos
 * @param {Object} opciones - Configuración adicional (logo, anuncio, equivalencia, ciudad, etc.)
 * @returns {Promise<Buffer>} Buffer del archivo PDF generado
 */
export async function generarRecibosPdf(paginasRecibos = [], opciones = {}) {
  ensureFonts()
  const logoBase64 = obtenerLogoBase64(opciones.customLogo)
  const hasLogo = !!logoBase64
  const content = []

  for (let indexPagina = 0; indexPagina < paginasRecibos.length; indexPagina++) {
    const pagina = paginasRecibos[indexPagina]
    const r1 = pagina[0] || null
    const r2 = pagina[1] || null

    // Header superior de emisión / folio de la hoja
    const cabeceraHoja = {
      columns: [
        {
          text: r1
            ? `Fecha de emisión: ${formatearFechaHoraEmisionCabecera(r1)} • Recibo No: ${obtenerIdentificadorRecibo(r1, opciones.ciudadFiltro) || indexPagina * 2 + 1} • Folio Factura: #${r1.id}`
            : '',
          fontSize: 6.4,
          color: '#6b7280'
        },
        {
          text: r2
            ? `Fecha de emisión: ${formatearFechaHoraEmisionCabecera(r2)} • Recibo No: ${obtenerIdentificadorRecibo(r2, opciones.ciudadFiltro) || indexPagina * 2 + 2} • Folio Factura: #${r2.id}`
            : '',
          fontSize: 6.4,
          color: '#6b7280',
          alignment: 'right'
        }
      ],
      margin: [0, 0, 0, 4]
    }

    const recibo1 = construirReciboPdfMake(r1, hasLogo, opciones.anuncio, opciones.equivalencia)
    const recibo2 = construirReciboPdfMake(r2, hasLogo, opciones.anuncio, opciones.equivalencia)

    // Layout de 2 recibos por página horizontal (Letter Landscape)
    // Nota: la columna central ya no dibuja la línea; solo reserva el espacio
    const paginaRecibosLayout = {
      columns: [
        { width: 345, stack: [recibo1] },
        { width: 30, text: '' },
        { width: 345, stack: [recibo2] }
      ]
    }

    // Línea divisoria vertical, borde a borde de la hoja (posición absoluta)
    // x = margen izq (36) + ancho recibo1 (345) + mitad del gap (15) = 396
    // height = 612 = alto total de hoja LETTER en landscape
    const lineaDivisoriaCompleta = {
      svg: `
        <svg width="30" height="612" viewBox="0 0 30 612" xmlns="http://www.w3.org/2000/svg">
          <line x1="15" y1="0" x2="15" y2="612" stroke="#fca5a5" stroke-width="1" stroke-dasharray="4,4" />
        </svg>
      `,
      absolutePosition: { x: 381, y: 0 }
    }

    // Pie de página institucional — duplicado bajo cada recibo (izq. y der.)
    const subFooterHoja = {
      columns: [
        {
          width: 345,
          text: [
            { text: 'AGUA VILLA PESQUEIRA', bold: true, fontSize: 6.5, color: '#9ca3af' },
            { text: '    Sistema de Gestión Municipal', fontSize: 6.5, color: '#9ca3af' }
          ]
        },
        { width: 30, text: '' },
        {
          width: 345,
          text: [
            { text: 'AGUA VILLA PESQUEIRA', bold: true, fontSize: 6.5, color: '#9ca3af' },
            { text: '    Sistema de Gestión Municipal', fontSize: 6.5, color: '#9ca3af' }
          ]
        }
      ],
      margin: [0, 6, 0, 0]
    }

    content.push(cabeceraHoja)
    content.push(paginaRecibosLayout)
    content.push(lineaDivisoriaCompleta)
    content.push(subFooterHoja)

    // Si no es la última página, insertar salto de página
    if (indexPagina < paginasRecibos.length - 1) {
      content.push({ text: '', pageBreak: 'after' })
    }

    // Ceder el hilo al event loop cada 2 páginas para mantener Windows y la interfaz 100% responsivos
    if (indexPagina % 2 === 0) {
      await new Promise((resolve) => setImmediate(resolve))
    }
  }

  const docDefinition = {
    pageSize: 'LETTER',
    pageOrientation: 'landscape',
    pageMargins: [36, 14, 36, 12],
    content,
    images: hasLogo ? { escudoLogo: logoBase64 } : {},
    defaultStyle: {
      font: 'Roboto',
      fontSize: 6.5,
      color: COLORES.textoOscuro
    }
  }

  // Ceder control una vez más antes del buffer final de pdfmake
  await new Promise((resolve) => setImmediate(resolve))

  const pdfDoc = pdfmake.createPdf(docDefinition)
  return await pdfDoc.getBuffer()
}
