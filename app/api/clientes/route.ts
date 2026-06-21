import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { CreateClienteSchema } from '@/lib/validaciones/cliente.schema'

export async function GET() {
  try {
    await requireAuth()
    const clientes = await prisma.cliente.findMany({
      where: { eliminadoEn: null },
      orderBy: { creadoEn: 'desc' },
      include: { _count: { select: { prestamos: { where: { eliminadoEn: null } } } } },
    })
    return NextResponse.json(clientes)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'No autenticado' ? 401 : 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const data = CreateClienteSchema.parse(body)

    const cliente = await prisma.cliente.create({ data })

    await prisma.auditLog.create({
      data: {
        entidad: 'Cliente',
        entidadId: cliente.id,
        accion: 'CREATE',
        usuarioId: (session.user as { id?: string }).id ?? '',
        valorAntes: Prisma.DbNull,
        valorDespues: cliente as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Documento ya registrado' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: msg === 'No autenticado' ? 401 : 400 })
  }
}
