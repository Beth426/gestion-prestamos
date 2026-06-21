import { tasaEfectivaAnual, formatearCEA } from '@/lib/financiero/cea'
import { simularPrestamo } from '@/lib/financiero/motor'

describe('tasaEfectivaAnual', () => {
  it('para préstamo al 2% mensual CEA > 24% (capitalización compuesta)', () => {
    const r = simularPrestamo({
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
    })
    const tea = tasaEfectivaAnual(1_000_000, r.lineas, 12)
    // 2% mensual efectivo → (1.02)^12 - 1 = 0.26824... ≈ 26.82%
    expect(tea).toBeCloseTo(0.2682, 3)
  })

  it('con seguro el CEA es mayor que sin seguro', () => {
    const sinSeguro = simularPrestamo({ monto: 1_000_000, totalPeriodos: 12, tasaPeriodica: 0.02, tipoCuota: 'auto', cuotaManual: 0, tipoGracia: 'ninguno', periodosGracia: 0, abonosExtra: {}, sistema: 'tradicional', seguro: 0 })
    const conSeguro = simularPrestamo({ monto: 1_000_000, totalPeriodos: 12, tasaPeriodica: 0.02, tipoCuota: 'auto', cuotaManual: 0, tipoGracia: 'ninguno', periodosGracia: 0, abonosExtra: {}, sistema: 'tradicional', seguro: 10_000 })
    const teaSin = tasaEfectivaAnual(1_000_000, sinSeguro.lineas, 12)
    const teaCon = tasaEfectivaAnual(1_000_000, conSeguro.lineas, 12)
    expect(teaCon).toBeGreaterThan(teaSin)
  })

  it('monto 0 → devuelve 0', () => {
    expect(tasaEfectivaAnual(0, [], 12)).toBe(0)
  })

  it('sin lineas → devuelve 0', () => {
    expect(tasaEfectivaAnual(1_000_000, [], 12)).toBe(0)
  })
})

describe('formatearCEA', () => {
  it('formatea como porcentaje con 1 decimal', () => {
    expect(formatearCEA(0.2682)).toBe('26.8%')
  })

  it('Infinity → "∞"', () => {
    expect(formatearCEA(Infinity)).toBe('∞')
  })
})
