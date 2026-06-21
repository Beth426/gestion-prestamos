import type { Frecuencia } from './fechas'

const PERIODOS_POR_ANIO: Record<Frecuencia, number> = {
  mensual: 12,
  quincenal: 24,
  semanal: 52,
}

const PERIODOS_POR_MES: Record<Frecuencia, number> = {
  mensual: 1,
  quincenal: 2,
  semanal: 52 / 12,
}

export function calcularCuotaFrancesa(tasa: number, periodos: number, monto: number): number {
  if (periodos <= 0) return monto
  if (tasa === 0) return monto / periodos
  if (Math.abs(tasa + 1) < 0.0001) return monto / periodos

  const potencia = Math.pow(1 + tasa, periodos)
  const denominador = potencia - 1
  if (Math.abs(denominador) < 0.0001) return monto / periodos

  return (monto * tasa * potencia) / denominador
}

export function convertirTasaPeriodica(
  valorPorcentual: number,
  tipoTasa: 'anual' | 'mensual',
  frecuencia: Frecuencia
): number {
  const valor = valorPorcentual / 100
  if (tipoTasa === 'anual') {
    return Math.pow(1 + valor, 1 / PERIODOS_POR_ANIO[frecuencia]) - 1
  }
  // mensual → convertir a la frecuencia indicada
  return Math.pow(1 + valor, 1 / PERIODOS_POR_MES[frecuencia]) - 1
}

export { PERIODOS_POR_ANIO }
