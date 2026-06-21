// components/clientes/clientes-table.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatFecha } from '@/lib/format'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export async function ClientesTable({ q }: { q?: string }) {
  const clientes = await prisma.cliente.findMany({
    where: {
      eliminadoEn: null,
      ...(q
        ? {
            OR: [
              { nombreCompleto: { contains: q, mode: 'insensitive' } },
              { documento: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { creadoEn: 'desc' },
    include: {
      _count: {
        select: { prestamos: { where: { eliminadoEn: null, estado: 'ACTIVO' } } },
      },
    },
  })

  if (clientes.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-8 text-center">
        {q ? `Sin resultados para "${q}"` : 'No hay clientes registrados.'}
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead className="text-right">Préstamos activos</TableHead>
          <TableHead className="text-right">Registro</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clientes.map((c) => (
          <TableRow key={c.id} className="cursor-pointer hover:bg-zinc-50">
            <TableCell>
              <Link href={`/clientes/${c.id}`} className="font-medium hover:underline">
                {c.nombreCompleto}
              </Link>
            </TableCell>
            <TableCell className="text-zinc-600">{c.documento}</TableCell>
            <TableCell className="text-zinc-600">{c.telefono ?? '—'}</TableCell>
            <TableCell className="text-right">{c._count.prestamos}</TableCell>
            <TableCell className="text-right text-zinc-500">
              {formatFecha(c.creadoEn)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
