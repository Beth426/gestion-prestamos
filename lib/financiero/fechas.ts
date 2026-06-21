export type Frecuencia = 'mensual' | 'quincenal' | 'semanal'

export function parseLocalDate(str: string): Date {
  if (!str) return new Date()
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addMonths(date: Date, n: number): Date {
  const d = new Date(date.getTime())
  const day = d.getDate()
  d.setMonth(d.getMonth() + n)
  if (d.getDate() < day) d.setDate(0) // desbordó de mes → último día del mes objetivo
  return d
}

export function addPeriods(baseDate: Date, n: number, frecuencia: Frecuencia): Date {
  if (frecuencia === 'mensual') return addMonths(baseDate, n)
  const d = new Date(baseDate.getTime())
  d.setDate(d.getDate() + n * (frecuencia === 'quincenal' ? 15 : 7))
  return d
}

export function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}
