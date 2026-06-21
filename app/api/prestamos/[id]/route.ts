import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

const PESOS_A_CENTAVOS = 100

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth()
    const prestamo = await prisma.prestamo.findFirst({
      where: { id: params.id, eliminadoEn: null },
      include: {
        cliente: true,
        asesor: { select: { nombre: true, email: true } },
        cuotas: { orderBy: { numero: 'asc' } },
        pagos: { where: { eliminadoEn: null }, orderBy: { fechaPago: 'desc' } },
      },
    })
    if (!prestamo) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    return NextResponse.json({
      ...prestamo,
      monto: prestamo.montoCentavos / PESOS_A_CENTAVOS,
      seguro: prestamo.seguroCentavos / PESOS_A_CENTAVOS,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const prestamo = await prisma.prestamo.findFirst({ where: { id: params.id, eliminadoEn: null } })
    if (!prestamo) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    await prisma.prestamo.update({
      where: { id: params.id },
      data: { eliminadoEn: new Date() },
    })

    await prisma.auditLog.create({
      data: {
        entidad: 'Prestamo',
        entidadId: params.id,
        accion: 'DELETE',
        usuarioId: (session.user as { id?: string }).id ?? '',
        prestamoId: params.id,
        valorAntes: prestamo as unknown as Prisma.InputJsonValue,
        valorDespues: Prisma.DbNull,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
