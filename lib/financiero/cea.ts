import type { LineaAmortizacion } from './motor'

export function tasaEfectivaAnual(
  monto: number,
  lineas: LineaAmortizacion[],
  periodosPorAnio: number
): number {
  if (monto <= 0 || !lineas || lineas.length === 0) return 0
  const pagos = lineas.map(l => (l.pagoMensual || 0) + (l.abonoExtra || 0) + (l.seguro || 0))
  const totalPagos = pagos.reduce((a, b) => a + b, 0)
  if (totalPagos <= monto) return 0

  const npv = (r: number) =>
    monto - pagos.reduce((acc, p, idx) => acc + p / Math.pow(1 + r, idx + 1), 0)

  let lo = 0,
    hi = 10
  if (npv(hi) < 0) return Infinity
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2
    if (npv(mid) > 0) hi = mid
    else lo = mid
  }
  const rPeriodica = (lo + hi) / 2
  return Math.pow(1 + rPeriodica, periodosPorAnio) - 1
}

export function formatearCEA(tea: number): string {
  if (tea === Infinity) return '∞'
  return (tea * 100).toFixed(1) + '%'
}
