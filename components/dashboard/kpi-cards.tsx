// components/dashboard/kpi-cards.tsx
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCOP } from '@/lib/format'
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

export async function KpiCards() {
  const hoy = new Date()
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

  const [cartera, recaudado, mora] = await Promise.all([
    prisma.prestamo.aggregate({
      where: { estado: 'ACTIVO', eliminadoEn: null },
      _sum: { montoCentavos: true },
      _count: true,
    }),
    prisma.pago.aggregate({
      where: { fechaPago: { gte: inicioMes }, eliminadoEn: null },
      _sum: { montoCentavos: true },
    }),
    prisma.cuota.count({
      where: {
        fechaVencimiento: { lt: hoy },
        pagos: { none: { eliminadoEn: null } },
        prestamo: { eliminadoEn: null },
      },
    }),
  ])

  const items = [
    {
      title: 'Cartera activa',
      value: formatCOP(cartera._sum.montoCentavos ?? 0),
      sub: `${cartera._count} préstamos`,
      icon: DollarSign,
    },
    {
      title: 'Préstamos activos',
      value: String(cartera._count),
      sub: 'en estado ACTIVO',
      icon: TrendingUp,
    },
    {
      title: 'Recaudado este mes',
      value: formatCOP(recaudado._sum.montoCentavos ?? 0),
      sub: 'pagos registrados',
      icon: CheckCircle,
    },
    {
      title: 'Cuotas en mora',
      value: String(mora),
      sub: 'vencidas sin pago',
      icon: AlertTriangle,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map(({ title, value, sub, icon: Icon }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">{title}</CardTitle>
            <Icon size={16} className="text-zinc-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-zinc-500 mt-1">{sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
