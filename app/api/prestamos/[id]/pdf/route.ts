import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EstadoCuentaPDF } from '@/lib/pdf/estado-cuenta'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  const prestamo = await prisma.prestamo.findFirst({
    where: { id: params.id, eliminadoEn: null },
    include: {
      cliente: {
        select: {
          nombreCompleto: true,
          documento: true,
          telefono: true,
          email: true,
        },
      },
      cuotas: {
        orderBy: { numero: 'asc' },
        include: { pagos: { select: { eliminadoEn: true } } },
      },
      pagos: {
        where: { eliminadoEn: null },
        orderBy: { fechaPago: 'desc' },
        include: { registradoPor: { select: { nombre: true } } },
      },
    },
  })

  if (!prestamo) {
    return new NextResponse('Préstamo no encontrado', { status: 404 })
  }

  const generadoEn = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  }).format(new Date())

  const element = React.createElement(EstadoCuentaPDF, {
    prestamo: {
      ...prestamo,
      tasaValor: prestamo.tasaValor.toString(),
    },
    generadoEn,
  }) as React.ReactElement

  const buffer = await renderToBuffer(element)

  const idCorto = prestamo.id.slice(0, 8).toUpperCase()

  return new NextResponse(buffer.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="estado-cuenta-${idCorto}.pdf"`,
    },
  })
}
