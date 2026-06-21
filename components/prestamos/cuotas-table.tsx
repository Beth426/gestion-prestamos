import { formatCOP, formatFecha } from '@/lib/format'
import type { Cuota, Pago } from '@prisma/client'

type CuotaConPagos = Cuota & { pagos: Pick<Pago, 'id' | 'eliminadoEn'>[] }

export function CuotasTable({ cuotas }: { cuotas: CuotaConPagos[] }) {
  const hoy = new Date()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-zinc-500">
            <th className="pb-2 font-medium">#</th>
            <th className="pb-2 font-medium">Vencimiento</th>
            <th className="pb-2 font-medium text-right">Capital</th>
            <th className="pb-2 font-medium text-right">Interés</th>
            <th className="pb-2 font-medium text-right">Total</th>
            <th className="pb-2 font-medium text-right">Saldo</th>
            <th className="pb-2 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {cuotas.map((c) => {
            const pagada = c.pagos.some((p) => !p.eliminadoEn)
            const vencida = !pagada && c.fechaVencimiento < hoy
            return (
              <tr key={c.id} className={c.esGracia ? 'bg-yellow-50' : 'even:bg-zinc-50'}>
                <td className="py-1.5 px-1">{c.numero}</td>
                <td className="py-1.5">{formatFecha(c.fechaVencimiento)}</td>
                <td className="py-1.5 text-right">{formatCOP(c.capitalCentavos)}</td>
                <td className="py-1.5 text-right">{formatCOP(c.interesCentavos)}</td>
                <td className="py-1.5 text-right font-medium">{formatCOP(c.totalCentavos)}</td>
                <td className="py-1.5 text-right text-zinc-500">{formatCOP(c.saldoCentavos)}</td>
                <td className="py-1.5">
                  {pagada ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Pagada
                    </span>
                  ) : vencida ? (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      Mora
                    </span>
                  ) : (
                    <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                      Pendiente
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
