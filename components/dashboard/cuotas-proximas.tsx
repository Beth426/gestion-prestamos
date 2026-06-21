// components/dashboard/cuotas-proximas.tsx
import { prisma } from '@/lib/prisma'
import { formatCOP, formatFecha } from '@/lib/format'

export async function CuotasProximas() {
  const hoy = new Date()
  const sieteDias = new Date(hoy)
  sieteDias.setDate(hoy.getDate() + 7)

  const cuotas = await prisma.cuota.findMany({
    where: {
      fechaVencimiento: { gte: hoy, lte: sieteDias },
      pagos: { none: { eliminadoEn: null } },
      prestamo: { eliminadoEn: null },
    },
    include: { prestamo: { include: { cliente: true } } },
    orderBy: { fechaVencimiento: 'asc' },
    take: 20,
  })

  if (cuotas.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-4">
        No hay cuotas por vencer en los próximos 7 días.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-zinc-500">
            <th className="pb-2 font-medium">Vencimiento</th>
            <th className="pb-2 font-medium">Cliente</th>
            <th className="pb-2 font-medium text-right">Monto</th>
            <th className="pb-2 font-medium text-right">Días</th>
          </tr>
        </thead>
        <tbody>
          {cuotas.map((c) => {
            const dias = Math.ceil(
              (c.fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
            )
            return (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-2">{formatFecha(c.fechaVencimiento)}</td>
                <td className="py-2">{c.prestamo.cliente.nombreCompleto}</td>
                <td className="py-2 text-right">{formatCOP(c.totalCentavos)}</td>
                <td className="py-2 text-right">
                  <span
                    className={
                      dias <= 2 ? 'text-red-600 font-medium' : 'text-zinc-600'
                    }
                  >
                    {dias}d
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
