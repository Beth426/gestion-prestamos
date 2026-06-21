/** Formats a COP monetary amount. @param centavos - integer amount in COP cents (e.g. 150000 = $1,500) */
export function formatCOP(centavos: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(centavos / 100)
}

export function formatFecha(date: Date | string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(new Date(date))
}

export function formatPorcentaje(valor: number): string {
  return `${Number(valor).toFixed(2)}%`
}
