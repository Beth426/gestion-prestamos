import { calcularCuotaFrancesa } from './tasas'

export type SistemaCredito = 'tradicional' | 'pagadiario' | 'fijo'
export type TipoGracia = 'ninguno' | 'parcial' | 'total'
export type TipoCuota = 'auto' | 'manual'

export interface ParametrosSimulacion {
  monto: number
  totalPeriodos: number
  tasaPeriodica: number
  tipoCuota: TipoCuota
  cuotaManual: number
  tipoGracia: TipoGracia
  periodosGracia: number
  abonosExtra: Record<number, number>
  sistema: SistemaCredito
  seguro: number
}

export interface LineaAmortizacion {
  num: number
  pagoMensual: number
  abonoCapitalBase: number
  interes: number
  abonoExtra: number
  seguro: number
  saldoRestante: number
  esNegativo: boolean
  esGracia: boolean
}

export interface ResultadoSimulacion {
  cuotaAplicada: number
  totalPagado: number
  totalInteres: number
  totalSeguro: number
  saldoFinal: number
  periodosTotales: number
  amortizacionNegativa: boolean
  lineas: LineaAmortizacion[]
}

export function simularPrestamo(p: ParametrosSimulacion): ResultadoSimulacion {
  const monto = Math.max(0, p.monto || 0)
  const totalPeriodos = Math.max(1, p.totalPeriodos || 1)
  const tasaPeriodica = Math.max(0, p.tasaPeriodica || 0)
  const periodosGracia = Math.max(0, p.periodosGracia || 0)
  const seguro = Math.max(0, p.seguro || 0)

  if (monto === 0) {
    return { cuotaAplicada: 0, totalPagado: 0, totalInteres: 0, totalSeguro: 0, saldoFinal: 0, periodosTotales: 0, amortizacionNegativa: false, lineas: [] }
  }

  let saldo = monto
  let totalPagado = 0
  let totalInteres = 0
  let totalSeguro = 0
  let amortizacionNegativa = false
  const lineas: LineaAmortizacion[] = []

  let periodosAmortizables = totalPeriodos - periodosGracia
  if (periodosAmortizables <= 0) periodosAmortizables = 1

  let cuotaFija = 0
  if (p.sistema === 'fijo') {
    const interesTotal = monto * tasaPeriodica
    cuotaFija = p.tipoCuota === 'auto' ? (monto + interesTotal) / totalPeriodos : p.cuotaManual
  } else if (p.sistema === 'pagadiario') {
    const interesFijo = monto * tasaPeriodica
    cuotaFija = p.tipoCuota === 'auto' ? (monto + interesFijo * totalPeriodos) / totalPeriodos : p.cuotaManual
  } else {
    cuotaFija = p.tipoCuota === 'auto' ? calcularCuotaFrancesa(tasaPeriodica, periodosAmortizables, monto) : p.cuotaManual
  }

  for (let i = 1; i <= totalPeriodos; i++) {
    let interesMes: number
    if (p.sistema === 'fijo') interesMes = (monto * tasaPeriodica) / totalPeriodos
    else if (p.sistema === 'pagadiario') interesMes = monto * tasaPeriodica
    else interesMes = saldo * tasaPeriodica

    let cuotaReal = 0
    let abonoCapitalBase = 0
    let abonoExtra = p.abonosExtra[i] || 0
    let enGracia = false

    if (i <= periodosGracia && p.tipoGracia !== 'ninguno') {
      enGracia = true
      if (p.tipoGracia === 'parcial') {
        cuotaReal = interesMes
        abonoCapitalBase = 0
      } else {
        cuotaReal = 0
        abonoCapitalBase = -interesMes
      }
    } else {
      if (i === periodosGracia + 1 && p.tipoCuota === 'auto' && saldo > 0 && p.sistema !== 'fijo') {
        const periodosRestantes = totalPeriodos - periodosGracia
        if (periodosRestantes > 0) {
          if (p.sistema === 'pagadiario') {
            cuotaFija = Math.max(0.01, saldo) / periodosRestantes + monto * tasaPeriodica
          } else {
            cuotaFija = calcularCuotaFrancesa(tasaPeriodica, periodosRestantes, Math.max(0.01, saldo))
          }
        }
      }
      cuotaReal = cuotaFija
      abonoCapitalBase = cuotaReal - interesMes
    }

    if (abonoCapitalBase < 0 && !enGracia) amortizacionNegativa = true

    abonoExtra = Math.min(abonoExtra, Math.max(0, saldo - abonoCapitalBase))
    let abonoTotalCapital = abonoCapitalBase + abonoExtra

    if (saldo <= abonoTotalCapital && !enGracia) {
      abonoTotalCapital = saldo
      abonoCapitalBase = Math.max(0, saldo - abonoExtra)
      cuotaReal = abonoCapitalBase + interesMes
      saldo = 0
    } else {
      saldo -= abonoTotalCapital
    }

    totalPagado += cuotaReal + abonoExtra + seguro
    totalInteres += interesMes
    totalSeguro += seguro

    if (saldo < 0.01) saldo = 0

    lineas.push({
      num: i,
      pagoMensual: cuotaReal,
      abonoCapitalBase,
      interes: interesMes,
      abonoExtra,
      seguro,
      saldoRestante: saldo,
      esNegativo: abonoCapitalBase < 0 && !enGracia,
      esGracia: enGracia,
    })

    if (saldo <= 0 && !enGracia) break
  }

  return { cuotaAplicada: cuotaFija, totalPagado, totalInteres, totalSeguro, saldoFinal: saldo, periodosTotales: lineas.length, amortizacionNegativa, lineas }
}
