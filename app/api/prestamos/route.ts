import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { CreatePrestamoSchema } from '@/lib/validaciones/prestamo.schema'
import { simularPrestamo } from '@/lib/financiero/motor'
import { convertirTasaPeriodica } from '@/lib/financiero/tasas'
import { parseLocalDate, addPeriods } from '@/lib/financiero/fechas'

const PESOS_A_CENTAVOS = 100

export async function GET() {
  try {
    await requireAuth()
    const prestamos = await prisma.prestamo.findMany({
      where: { eliminadoEn: null },
      orderBy: { creadoEn: 'desc' },
      include: { cliente: true, asesor: { select: { nombre: true } } },
    })
    return NextResponse.json(prestamos.map(p => ({
      ...p,
      monto: p.montoCentavos / PESOS_A_CENTAVOS,
      seguro: p.seguroCentavos / PESOS_A_CENTAVOS,
    })))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const data = CreatePrestamoSchema.parse(body)

    const frecuenciaLower = data.frecuencia.toLowerCase() as 'mensual' | 'quincenal' | 'semanal'
    const tipoTasaLower = data.tipoTasa.toLowerCase() as 'anual' | 'mensual'

    const tasaPeriodica = data.sistema === 'FIJO'
      ? data.tasaValor / 100
      : convertirTasaPeriodica(data.tasaValor, tipoTasaLower, frecuenciaLower)

    const simulacion = simularPrestamo({
      monto: data.monto,
      totalPeriodos: data.plazo,
      tasaPeriodica,
      tipoCuota: 'auto',
      cuotaManual: 0,
      tipoGracia: (data.tipoGracia?.toLowerCase() ?? 'ninguno') as 'ninguno' | 'parcial' | 'total',
      periodosGracia: data.periodosGracia ?? 0,
      abonosExtra: {},
      sistema: data.sistema.toLowerCase() as 'tradicional' | 'pagadiario' | 'fijo',
      seguro: data.seguro ?? 0,
    })

    const baseDate = parseLocalDate(data.fechaDesembolso)
    const montoCentavos = Math.round(data.monto * PESOS_A_CENTAVOS)
    const seguroCentavos = Math.round((data.seguro ?? 0) * PESOS_A_CENTAVOS)
    const asesorId = (session.user as { id?: string }).id ?? ''

    const prestamo = await prisma.$transaction(async (tx) => {
      const p = await tx.prestamo.create({
        data: {
          clienteId: data.clienteId,
          asesorId,
          sistema: data.sistema,
          montoCentavos,
          tasaValor: data.tasaValor,
          tipoTasa: data.tipoTasa,
          frecuencia: data.frecuencia,
          plazo: data.plazo,
          tipoGracia: data.tipoGracia ?? 'NINGUNO',
          periodosGracia: data.periodosGracia ?? 0,
          seguroCentavos,
          fechaDesembolso: new Date(data.fechaDesembolso),
        },
      })

      await tx.cuota.createMany({
        data: simulacion.lineas.map((l) => ({
          prestamoId: p.id,
          numero: l.num,
          fechaVencimiento: addPeriods(baseDate, l.num, frecuenciaLower),
          capitalCentavos: Math.round(l.abonoCapitalBase * PESOS_A_CENTAVOS),
          interesCentavos: Math.round(l.interes * PESOS_A_CENTAVOS),
          seguroCentavos,
          totalCentavos: Math.round((l.pagoMensual + (data.seguro ?? 0)) * PESOS_A_CENTAVOS),
          saldoCentavos: Math.round(l.saldoRestante * PESOS_A_CENTAVOS),
          esGracia: l.esGracia,
        })),
      })

      await tx.auditLog.create({
        data: {
          entidad: 'Prestamo',
          entidadId: p.id,
          accion: 'CREATE',
          usuarioId: asesorId,
          prestamoId: p.id,
          valorAntes: Prisma.DbNull,
          valorDespues: { id: p.id, cuotas: simulacion.periodosTotales } as unknown as Prisma.InputJsonValue,
        },
      })

      return p
    })

    return NextResponse.json({ id: prestamo.id }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
