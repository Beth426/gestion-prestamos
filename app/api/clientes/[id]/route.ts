import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { UpdateClienteSchema } from '@/lib/validaciones/cliente.schema'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth()
    const cliente = await prisma.cliente.findFirst({
      where: { id: params.id, eliminadoEn: null },
      include: { prestamos: { where: { eliminadoEn: null }, orderBy: { creadoEn: 'desc' } } },
    })
    if (!cliente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(cliente)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const data = UpdateClienteSchema.parse(body)

    const antes = await prisma.cliente.findFirst({ where: { id: params.id, eliminadoEn: null } })
    if (!antes) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const cliente = await prisma.cliente.update({ where: { id: params.id }, data })

    await prisma.auditLog.create({
      data: {
        entidad: 'Cliente',
        entidadId: cliente.id,
        accion: 'UPDATE',
        usuarioId: (session.user as { id?: string }).id ?? '',
        valorAntes: antes as unknown as Prisma.InputJsonValue,
        valorDespues: cliente as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json(cliente)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const cliente = await prisma.cliente.findFirst({ where: { id: params.id, eliminadoEn: null } })
    if (!cliente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    await prisma.cliente.update({
      where: { id: params.id },
      data: { eliminadoEn: new Date() },
    })

    await prisma.auditLog.create({
      data: {
        entidad: 'Cliente',
        entidadId: params.id,
        accion: 'DELETE',
        usuarioId: (session.user as { id?: string }).id ?? '',
        valorAntes: cliente as unknown as Prisma.InputJsonValue,
        valorDespues: Prisma.DbNull,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
