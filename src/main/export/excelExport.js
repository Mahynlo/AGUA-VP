import ExcelJS from 'exceljs'

// === GENERACIÓN EXCEL CON EXCELJS ===
async function setupHoja(sheet, rows) {
  if (!rows || rows.length === 0) return
  const headers = Object.keys(rows[0])

  // Detectar tipo de columna: number, date o string
  const colTypes = {}
  for (const key of headers) {
    const vals = rows.map((r) => r[key]).filter((v) => v !== null && v !== undefined && v !== '')
    if (vals.length === 0) {
      colTypes[key] = 'string'
      continue
    }
    if (vals.every((v) => typeof v === 'number')) {
      colTypes[key] = 'number'
      continue
    }
    if (vals.every((v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v))) {
      colTypes[key] = 'date'
      continue
    }
    colTypes[key] = 'string'
  }

  // Fila de cabecera con estilo
  const headerRow = sheet.addRow(headers)
  headerRow.height = 22
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } } }
  })

  // Filas de datos
  for (const row of rows) {
    const values = headers.map((h) => {
      const v = row[h]
      if (colTypes[h] === 'date' && typeof v === 'string') return new Date(v)
      // Sanitizar si accidentalmente viniera un objeto complejo para evitar interpretaciones erróneas en ExcelJS
      if (v && typeof v === 'object' && !(v instanceof Date)) {
        return JSON.stringify(v)
      }
      return v ?? ''
    })
    const dataRow = sheet.addRow(values)
    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = headers[colNumber - 1]
      if (colTypes[key] === 'number') cell.numFmt = '#,##0.##'
      else if (colTypes[key] === 'date') cell.numFmt = 'dd/mm/yyyy'
      cell.alignment = { vertical: 'middle' }
    })
  }

  // Anchos automáticos de columna basados en el contenido
  sheet.columns.forEach((col, i) => {
    const header = headers[i]
    const maxLen = Math.max(header.length, ...rows.map((r) => String(r[header] ?? '').length))
    col.width = Math.min(maxLen + 4, 55)
  })

  // Congelar primera fila y activar filtros automáticos
  sheet.views = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }]
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } }
}

// Acepta un array de filas (una hoja "Datos") o un objeto { nombreHoja: filas[] } (varias hojas)
export async function generarExcelBuffer(data) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'AguaVP'
  workbook.created = new Date()

  const MAX_SAFE_ROWS = 100000
  const isMultiSheet = !Array.isArray(data) && typeof data === 'object' && data !== null

  if (isMultiSheet) {
    for (const [sheetName, rows] of Object.entries(data)) {
      if (!Array.isArray(rows) || rows.length === 0) continue
      if (rows.length > MAX_SAFE_ROWS) {
        throw new Error(
          `La hoja "${sheetName}" excede el límite máximo seguro (${MAX_SAFE_ROWS} filas)`
        )
      }
      // Excel prohíbe caracteres especiales: \ / ? * : [ ] y máx 31 caracteres
      const safeSheetName =
        String(sheetName)
          .replace(/[/\\?*:[\]]/g, '_')
          .trim()
          .substring(0, 31) || 'Hoja'
      const sheet = workbook.addWorksheet(safeSheetName)
      await setupHoja(sheet, rows)
    }
  } else if (Array.isArray(data)) {
    if (data.length > MAX_SAFE_ROWS) {
      throw new Error(`Los datos exceden el límite máximo seguro (${MAX_SAFE_ROWS} filas)`)
    }
    const sheet = workbook.addWorksheet('Datos')
    await setupHoja(sheet, data)
  }

  return workbook.xlsx.writeBuffer()
}
