// components/prestamos/prestamos-table.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCOP, formatFecha, formatPorcentaje } from '@/lib/format'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { EstadoPrestamo } from '@prisma/client'

const estadoColor: Record<EstadoPrestamo, string> = {
  ACTIVO: 'bg-green-100 text-green-700',
  AL_DIA: 'bg-blue-100 text-blue-700',
  MORA: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-zinc-100 text-zinc-600',
  CASTIGADO: 'bg-orange-100 text-orange-700',
}

export async function PrestamosTable({ estado }: { estado?: EstadoPrestamo }) {
  const prestamos = await prisma.prestamo.findMany({
    where: {
      eliminadoEn: null,
      ...(estado ? { estado } : {}),
    },
    orderBy: { creadoEn: 'desc' },
    include: { cliente: true },
  })

  if (prestamos.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-8 text-center">
        No hay préstamos{estado ? ` con estado ${estado}` : ''}.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Sistema</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead className="text-right">Tasa</TableHead>
          <TableHead className="text-right">Plazo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Desembolso</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {prestamos.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <Link href={`/prestamos/${p.id}`} className="font-medium hover:underline">
                {p.cliente.nombreCompleto}
              </Link>
            </TableCell>
            <TableCell className="text-zinc-600">{p.sistema}</TableCell>
            <TableCell className="text-right">{formatCOP(p.montoCentavos)}</TableCell>
            <TableCell className="text-right">
              {formatPorcentaje(Number(p.tasaValor))} {p.tipoTasa}
            </TableCell>
            <TableCell className="text-right">{p.plazo}</TableCell>
            <TableCell>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[p.estado]}`}
              >
                {p.estado}
              </span>
            </TableCell>
            <TableCell className="text-right text-zinc-500">
              {formatFecha(p.fechaDesembolso)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
