import { parseLocalDate, addMonths, addPeriods } from '@/lib/financiero/fechas'

describe('parseLocalDate', () => {
  it('parsea yyyy-mm-dd sin corrimiento de zona horaria', () => {
    const d = parseLocalDate('2024-01-15')
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(0) // enero = 0
    expect(d.getDate()).toBe(15)
  })

  it('maneja fecha vacía devolviendo fecha actual sin explotar', () => {
    const d = parseLocalDate('')
    expect(d).toBeInstanceOf(Date)
  })
})

describe('addMonths', () => {
  it('suma 1 mes normal', () => {
    const base = new Date(2024, 0, 15) // 15-ene-2024
    const result = addMonths(base, 1)
    expect(result.getMonth()).toBe(1) // febrero
    expect(result.getDate()).toBe(15)
  })

  it('ajusta al último día si el mes destino es más corto', () => {
    const base = new Date(2024, 0, 31) // 31-ene-2024
    const result = addMonths(base, 1)
    expect(result.getMonth()).toBe(1) // febrero
    expect(result.getDate()).toBe(29) // 2024 es bisiesto
  })

  it('suma 12 meses → mismo día del año siguiente', () => {
    const base = new Date(2024, 0, 15)
    const result = addMonths(base, 12)
    expect(result.getFullYear()).toBe(2025)
    expect(result.getMonth()).toBe(0)
    expect(result.getDate()).toBe(15)
  })
})

describe('addPeriods', () => {
  it('mensual llama addMonths', () => {
    const base = new Date(2024, 0, 15)
    const result = addPeriods(base, 3, 'mensual')
    expect(result.getMonth()).toBe(3) // abril
    expect(result.getDate()).toBe(15)
  })

  it('quincenal suma 30 días (2 periodos)', () => {
    const base = new Date(2024, 0, 1)
    const result = addPeriods(base, 2, 'quincenal')
    // 1 enero + 30 días = 31 enero
    expect(result.getDate()).toBe(31)
    expect(result.getMonth()).toBe(0)
  })

  it('semanal suma 7 días por periodo', () => {
    const base = new Date(2024, 0, 1)
    const result = addPeriods(base, 1, 'semanal')
    expect(result.getDate()).toBe(8)
  })
})
