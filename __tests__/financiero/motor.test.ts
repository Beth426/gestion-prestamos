import { simularPrestamo, type ParametrosSimulacion } from '@/lib/financiero/motor'

// Caso base: $1.000.000 al 2% mensual, 12 meses, sistema tradicional, sin gracia
const casoBase: ParametrosSimulacion = {
  monto: 1_000_000,
  totalPeriodos: 12,
  tasaPeriodica: 0.02,
  tipoCuota: 'auto',
  cuotaManual: 0,
  tipoGracia: 'ninguno',
  periodosGracia: 0,
  abonosExtra: {},
  sistema: 'tradicional',
  seguro: 0,
}

describe('simularPrestamo — sistema tradicional', () => {
  it('genera 12 líneas', () => {
    const r = simularPrestamo(casoBase)
    expect(r.lineas).toHaveLength(12)
  })

  it('primera cuota: interés ≈ 20000', () => {
    const r = simularPrestamo(casoBase)
    expect(r.lineas[0].interes).toBeCloseTo(20_000, 0)
  })

  it('cuota aplicada ≈ 94559.60', () => {
    const r = simularPrestamo(casoBase)
    expect(r.cuotaAplicada).toBeCloseTo(94_559.60, 0)
  })

  it('saldo final = 0 (totalmente cancelado)', () => {
    const r = simularPrestamo(casoBase)
    expect(r.saldoFinal).toBe(0)
  })

  it('saldo de la última línea = 0', () => {
    const r = simularPrestamo(casoBase)
    const ultima = r.lineas[r.lineas.length - 1]
    expect(ultima.saldoRestante).toBe(0)
  })

  it('total intereses = totalPagado − monto', () => {
    const r = simularPrestamo(casoBase)
    expect(r.totalInteres).toBeCloseTo(r.totalPagado - 1_000_000, 0)
  })

  it('amortizacionNegativa = false con cuota auto', () => {
    const r = simularPrestamo(casoBase)
    expect(r.amortizacionNegativa).toBe(false)
  })
})

describe('simularPrestamo — gracia parcial', () => {
  it('periodo de gracia: esGracia=true y capital=0', () => {
    const r = simularPrestamo({
      ...casoBase,
      tipoGracia: 'parcial',
      periodosGracia: 2,
    })
    expect(r.lineas[0].esGracia).toBe(true)
    expect(r.lineas[0].abonoCapitalBase).toBe(0)
    expect(r.lineas[1].esGracia).toBe(true)
    expect(r.lineas[2].esGracia).toBe(false)
  })
})

describe('simularPrestamo — gracia total', () => {
  it('capitaliza interés en gracia total: saldo crece', () => {
    const r = simularPrestamo({
      ...casoBase,
      tipoGracia: 'total',
      periodosGracia: 2,
    })
    // Con gracia total, el saldo después del periodo 1 debe ser mayor al original
    expect(r.lineas[0].saldoRestante).toBeGreaterThan(1_000_000)
  })
})

describe('simularPrestamo — sistema pagadiario', () => {
  it('interés constante en todos los periodos (sobre capital original)', () => {
    const r = simularPrestamo({ ...casoBase, sistema: 'pagadiario' })
    const intereses = r.lineas.map(l => Math.round(l.interes))
    const primero = intereses[0]
    expect(intereses.every(i => i === primero)).toBe(true)
  })
})

describe('simularPrestamo — sistema fijo', () => {
  it('interés distribuido uniformemente por periodo', () => {
    const r = simularPrestamo({
      ...casoBase,
      sistema: 'fijo',
      tasaPeriodica: 0.24, // 24% global
    })
    const intereses = r.lineas.map(l => Math.round(l.interes))
    const primero = intereses[0]
    expect(intereses.every(i => i === primero)).toBe(true)
  })
})

describe('simularPrestamo — seguro', () => {
  it('seguro aparece en cada línea y se acumula en totalSeguro', () => {
    const r = simularPrestamo({ ...casoBase, seguro: 5_000 })
    expect(r.lineas[0].seguro).toBe(5_000)
    expect(r.totalSeguro).toBe(5_000 * 12)
  })
})

describe('simularPrestamo — monto 0', () => {
  it('devuelve lineas vacías', () => {
    const r = simularPrestamo({ ...casoBase, monto: 0 })
    expect(r.lineas).toHaveLength(0)
  })
})
