import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/session'

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRol('ADMIN')
    const pago = await prisma.pago.findFirst({ where: { id: params.id, eliminadoEn: null } })
    if (!pago) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    await prisma.pago.update({
      where: { id: params.id },
      data: { eliminadoEn: new Date() },
    })

    await prisma.auditLog.create({
      data: {
        entidad: 'Pago',
        entidadId: params.id,
        accion: 'DELETE',
        usuarioId: (session.user as { id?: string }).id ?? '',
        prestamoId: pago.prestamoId,
        valorAntes: pago as unknown as Prisma.InputJsonValue,
        valorDespues: Prisma.DbNull,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg.includes('permisos') ? 403 : 400 })
  }
}
