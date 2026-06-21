import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCOP, formatFecha, formatPorcentaje } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CuotasTable } from '@/components/prestamos/cuotas-table'
import { PagoForm } from '@/components/prestamos/pago-form'
import { Separator } from '@/components/ui/separator'

const estadoColor: Record<string, string> = {
  ACTIVO: 'bg-green-100 text-green-700',
  AL_DIA: 'bg-blue-100 text-blue-700',
  MORA: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-zinc-100 text-zinc-600',
  CASTIGADO: 'bg-orange-100 text-orange-700',
}

export default async function PrestamoDetallePage({
  params,
}: {
  params: { id: string }
}) {
  const prestamo = await prisma.prestamo.findFirst({
    where: { id: params.id, eliminadoEn: null },
    include: {
      cliente: true,
      asesor: { select: { nombre: true } },
      cuotas: {
        orderBy: { numero: 'asc' },
        include: { pagos: { select: { id: true, eliminadoEn: true } } },
      },
      pagos: {
        where: { eliminadoEn: null },
        orderBy: { fechaPago: 'desc' },
        include: { registradoPor: { select: { nombre: true } } },
      },
    },
  })

  if (!prestamo) notFound()

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Préstamo —{' '}
            <Link href={`/clientes/${prestamo.clienteId}`} className="hover:underline">
              {prestamo.cliente.nombreCompleto}
            </Link>
          </h1>
          <p className="text-zinc-500 text-sm">{prestamo.sistema} · {prestamo.frecuencia}</p>
        </div>
        <span
          className={`text-sm px-3 py-1 rounded-full font-medium ${estadoColor[prestamo.estado] ?? ''}`}
        >
          {prestamo.estado}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        {[
          { label: 'Monto', value: formatCOP(prestamo.montoCentavos) },
          { label: 'Tasa', value: `${formatPorcentaje(Number(prestamo.tasaValor))} ${prestamo.tipoTasa}` },
          { label: 'Plazo', value: `${prestamo.plazo} periodos` },
          { label: 'Desembolso', value: formatFecha(prestamo.fechaDesembolso) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-50 rounded p-3">
            <p className="text-zinc-500">{label}</p>
            <p className="font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Tabla de cuotas ({prestamo.cuotas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CuotasTable cuotas={prestamo.cuotas} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registrar pago</CardTitle>
            </CardHeader>
            <CardContent>
              <PagoForm prestamoId={prestamo.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Pagos registrados ({prestamo.pagos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prestamo.pagos.length === 0 ? (
                <p className="text-sm text-zinc-500">Sin pagos aún.</p>
              ) : (
                prestamo.pagos.map((p) => (
                  <div key={p.id} className="text-sm border-b pb-2 last:border-0">
                    <div className="flex justify-between">
                      <span className="font-medium">{formatCOP(p.montoCentavos)}</span>
                      <span className="text-zinc-500">{formatFecha(p.fechaPago)}</span>
                    </div>
                    <p className="text-zinc-500 text-xs">
                      {p.tipoPago} · {p.registradoPor.nombre}
                    </p>
                    {p.notas && <p className="text-zinc-400 text-xs italic">{p.notas}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
