// app/(dashboard)/pagos/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCOP, formatFecha } from '@/lib/format'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function PagosPage({
  searchParams,
}: {
  searchParams: { mes?: string; anio?: string }
}) {
  const hoy = new Date()
  const mes = Number(searchParams.mes ?? hoy.getMonth() + 1)
  const anio = Number(searchParams.anio ?? hoy.getFullYear())

  const desde = new Date(anio, mes - 1, 1)
  const hasta = new Date(anio, mes, 1)

  const pagos = await prisma.pago.findMany({
    where: {
      eliminadoEn: null,
      fechaPago: { gte: desde, lt: hasta },
    },
    orderBy: { fechaPago: 'desc' },
    include: {
      prestamo: { include: { cliente: true } },
      registradoPor: { select: { nombre: true } },
    },
  })

  const total = pagos.reduce((s, p) => s + p.montoCentavos, 0)

  const meses = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pagos</h1>
        <p className="text-sm text-zinc-500">
          Total: <span className="font-semibold text-zinc-900">{formatCOP(total)}</span>
        </p>
      </div>

      <form className="flex gap-2">
        <select name="mes" defaultValue={mes} className="border rounded px-2 py-1 text-sm">
          {meses.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <select name="anio" defaultValue={anio} className="border rounded px-2 py-1 text-sm">
          {[anio - 1, anio, anio + 1].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button type="submit" className="border rounded px-3 py-1 text-sm hover:bg-zinc-50">
          Filtrar
        </button>
      </form>

      {pagos.length === 0 ? (
        <p className="text-sm text-zinc-500 py-8 text-center">
          Sin pagos en {meses[mes - 1]} {anio}.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Registrado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagos.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{formatFecha(p.fechaPago)}</TableCell>
                <TableCell>
                  <Link
                    href={`/prestamos/${p.prestamoId}`}
                    className="hover:underline font-medium"
                  >
                    {p.prestamo.cliente.nombreCompleto}
                  </Link>
                </TableCell>
                <TableCell className="text-zinc-600">{p.tipoPago}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCOP(p.montoCentavos)}
                </TableCell>
                <TableCell className="text-zinc-500">{p.registradoPor.nombre}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
