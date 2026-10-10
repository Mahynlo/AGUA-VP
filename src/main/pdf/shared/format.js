// Formateadores compartidos por los generadores de reportes.
// Solo se incluyen los que eran idénticos en todos los archivos que los usan;
// las variantes con formato propio permanecen en su generador.

// Número con separador de miles es-MX y `dec` decimales
export const fmt = (n, dec = 0) =>
  Number(n || 0).toLocaleString('es-MX', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  })

// Moneda MXN con 2 decimales ($1,234.50)
export const money = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0))

// Porcentaje con 1 decimal (12.3%)
export const percent = (value) => `${Number(value || 0).toFixed(1)}%`

// 'YYYY-MM' → 'ENE'
export const shortMonth = (periodoMes) => {
  if (!periodoMes || !/^\d{4}-\d{2}$/.test(periodoMes)) return periodoMes || ''
  const [anio, mes] = periodoMes.split('-')
  const fecha = new Date(Number(anio), Number(mes) - 1, 1)
  return fecha.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '').toUpperCase()
}

// 'YYYY-MM' → 'Enero de 2025'
export const formatMonthYearLong = (periodoMes) => {
  if (!periodoMes || !/^\d{4}-\d{2}$/.test(periodoMes)) return periodoMes || '-'
  const [anio, mes] = periodoMes.split('-')
  const fecha = new Date(Number(anio), Number(mes) - 1, 1)
  const label = fecha.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Escape de caracteres especiales para strings dentro de SVG
export function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return ''
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
