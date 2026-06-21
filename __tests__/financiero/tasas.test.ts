import { calcularCuotaFrancesa, convertirTasaPeriodica } from '@/lib/financiero/tasas'

describe('calcularCuotaFrancesa', () => {
  it('tasa 2% mensual, 12 periodos, monto 1000000 → ≈ 94559.60', () => {
    const cuota = calcularCuotaFrancesa(0.02, 12, 1_000_000)
    expect(cuota).toBeCloseTo(94559.60, 0) // tolerancia ±0.5
  })

  it('tasa 0 → monto / periodos', () => {
    const cuota = calcularCuotaFrancesa(0, 12, 1_200_000)
    expect(cuota).toBeCloseTo(100_000, 2)
  })

  it('1 periodo → devuelve el monto entero', () => {
    const cuota = calcularCuotaFrancesa(0.05, 1, 500_000)
    // cuota = 500000 * 0.05 * 1.05 / (1.05 - 1) = 525000
    expect(cuota).toBeCloseTo(525_000, 0)
  })
})

describe('convertirTasaPeriodica', () => {
  it('tasa anual 24% → mensual efectiva ≈ 1.808%', () => {
    // (1 + 0.24)^(1/12) - 1 = 0.01808
    const tp = convertirTasaPeriodica(24, 'anual', 'mensual')
    expect(tp).toBeCloseTo(0.01808, 4)
  })

  it('tasa mensual 2% → mensual efectiva = 2%', () => {
    const tp = convertirTasaPeriodica(2, 'mensual', 'mensual')
    expect(tp).toBeCloseTo(0.02, 6)
  })

  it('tasa anual 24% → quincenal efectiva ≈ 0.9003%', () => {
    // (1 + 0.24)^(1/24) - 1 = 0.009003...
    const tp = convertirTasaPeriodica(24, 'anual', 'quincenal')
    expect(tp).toBeCloseTo(0.009003, 4)
  })

  it('tasa anual 24% → semanal efectiva ≈ 0.4145%', () => {
    // (1 + 0.24)^(1/52) - 1 = 0.004145...
    const tp = convertirTasaPeriodica(24, 'anual', 'semanal')
    expect(tp).toBeCloseTo(0.004145, 4)
  })
})
