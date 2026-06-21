import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { z } from 'zod'

const CreatePagoSchema = z.object({
  prestamoId: z.string().cuid(),
  cuotaId: z.string().cuid().optional(),
  monto: z.number().positive(),
  fechaPago: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tipoPago: z.enum(['CUOTA', 'ABONO_EXTRA', 'AJUSTE', 'CASTIGO']).default('CUOTA'),
  notas: z.string().max(500).optional(),
})

const PESOS_A_CENTAVOS = 100

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const data = CreatePagoSchema.parse(body)

    const prestamo = await prisma.prestamo.findFirst({
      where: { id: data.prestamoId, eliminadoEn: null },
    })
    if (!prestamo) return NextResponse.json({ error: 'Prestamo no encontrado' }, { status: 404 })

    const registradoPorId = (session.user as { id?: string }).id ?? ''
    const montoCentavos = Math.round(data.monto * PESOS_A_CENTAVOS)

    const pago = await prisma.$transaction(async (tx) => {
      const p = await tx.pago.create({
        data: {
          prestamoId: data.prestamoId,
          cuotaId: data.cuotaId,
          montoCentavos,
          fechaPago: new Date(data.fechaPago),
          tipoPago: data.tipoPago,
          notas: data.notas,
          registradoPorId,
        },
      })

      await tx.auditLog.create({
        data: {
          entidad: 'Pago',
          entidadId: p.id,
          accion: 'CREATE',
          usuarioId: registradoPorId,
          prestamoId: data.prestamoId,
          valorAntes: Prisma.DbNull,
          valorDespues: p as unknown as Prisma.InputJsonValue,
        },
      })

      return p
    })

    return NextResponse.json(pago, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
