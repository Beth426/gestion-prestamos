// app/(dashboard)/clientes/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCOP, formatFecha } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ClienteForm } from '@/components/clientes/cliente-form'

const estadoColor: Record<string, string> = {
  ACTIVO: 'bg-green-100 text-green-700',
  AL_DIA: 'bg-blue-100 text-blue-700',
  MORA: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-zinc-100 text-zinc-600',
  CASTIGADO: 'bg-orange-100 text-orange-700',
}

export default async function ClienteDetallePage({
  params,
}: {
  params: { id: string }
}) {
  const cliente = await prisma.cliente.findFirst({
    where: { id: params.id, eliminadoEn: null },
    include: {
      prestamos: {
        where: { eliminadoEn: null },
        orderBy: { creadoEn: 'desc' },
        include: {
          _count: { select: { cuotas: true } },
          pagos: { where: { eliminadoEn: null }, select: { id: true } },
        },
      },
    },
  })

  if (!cliente) notFound()

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{cliente.nombreCompleto}</h1>
          <p className="text-zinc-500 text-sm">CC {cliente.documento}</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Editar</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar cliente</DialogTitle>
            </DialogHeader>
            <ClienteForm
              clienteId={cliente.id}
              defaultValues={{
                nombreCompleto: cliente.nombreCompleto,
                documento: cliente.documento,
                telefono: cliente.telefono ?? undefined,
                email: cliente.email ?? undefined,
                direccion: cliente.direccion ?? undefined,
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-500">Teléfono</p>
            <p>{cliente.telefono ?? '—'}</p>
          </div>
          <div>
            <p className="text-zinc-500">Email</p>
            <p>{cliente.email ?? '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-zinc-500">Dirección</p>
            <p>{cliente.direccion ?? '—'}</p>
          </div>
          <div>
            <p className="text-zinc-500">Registrado</p>
            <p>{formatFecha(cliente.creadoEn)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Préstamos</CardTitle>
          <Button asChild size="sm">
            <Link href={`/prestamos/nuevo?clienteId=${cliente.id}`}>Nuevo préstamo</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {cliente.prestamos.length === 0 ? (
            <p className="text-sm text-zinc-500">Sin préstamos registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sistema</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Plazo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Pagos</TableHead>
                  <TableHead className="text-right">Desembolso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cliente.prestamos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={`/prestamos/${p.id}`}
                        className="hover:underline font-medium"
                      >
                        {p.sistema}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCOP(p.montoCentavos)}
                    </TableCell>
                    <TableCell className="text-right">{p.plazo}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[p.estado] ?? ''}`}
                      >
                        {p.estado}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {p.pagos.length}/{p._count.cuotas}
                    </TableCell>
                    <TableCell className="text-right text-zinc-500">
                      {formatFecha(p.fechaDesembolso)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
