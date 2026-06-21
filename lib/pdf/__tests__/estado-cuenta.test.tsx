import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { EstadoCuentaPDF } from '../estado-cuenta'

const mockData = {
  prestamo: {
    id: 'test-id-001',
    sistema: 'TRADICIONAL' as const,
    estado: 'ACTIVO' as const,
    montoCentavos: 500000_00,
    tasaValor: '1.50000000',
    tipoTasa: 'MENSUAL' as const,
    frecuencia: 'MENSUAL' as const,
    plazo: 12,
    fechaDesembolso: new Date('2026-01-15'),
    cliente: {
      nombreCompleto: 'Juan Pérez',
      documento: '12345678',
      telefono: '3001234567',
      email: 'juan@test.com',
    },
    cuotas: [
      {
        numero: 1,
        fechaVencimiento: new Date('2026-02-15'),
        capitalCentavos: 38_000_00,
        interesCentavos: 7_500_00,
        totalCentavos: 45_500_00,
        saldoCentavos: 462_000_00,
        pagos: [{ eliminadoEn: null }],
      },
      {
        numero: 2,
        fechaVencimiento: new Date('2026-03-15'),
        capitalCentavos: 38_570_00,
        interesCentavos: 6_930_00,
        totalCentavos: 45_500_00,
        saldoCentavos: 423_430_00,
        pagos: [],
      },
    ],
    pagos: [
      {
        montoCentavos: 45_500_00,
        fechaPago: new Date('2026-02-14'),
        tipoPago: 'CUOTA' as const,
        registradoPor: { nombre: 'Admin' },
      },
    ],
  },
  generadoEn: '21/06/2026 10:30 a. m.',
}

describe('EstadoCuentaPDF', () => {
  it('renderiza a buffer sin errores', async () => {
    const buffer = await renderToBuffer(<EstadoCuentaPDF {...mockData} />)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })
})
