// app/(dashboard)/page.tsx
import { Suspense } from 'react'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { CuotasProximas } from '@/components/dashboard/cuotas-proximas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Suspense fallback={<p className="text-sm text-zinc-400">Cargando KPIs…</p>}>
        <KpiCards />
      </Suspense>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cuotas por vencer (próximos 7 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-zinc-400">Cargando…</p>}>
            <CuotasProximas />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
