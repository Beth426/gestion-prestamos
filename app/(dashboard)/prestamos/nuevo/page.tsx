import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { PrestamoForm } from '@/components/prestamos/prestamo-form'
import { prisma } from '@/lib/prisma'

export default async function NuevoPrestamoPage() {
  const clientes = await prisma.cliente.findMany({
    where: { eliminadoEn: null },
    select: { id: true, nombreCompleto: true, documento: true },
    orderBy: { nombreCompleto: 'asc' },
  })

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Nuevo préstamo</h1>
      <Card>
        <CardContent className="pt-6">
          <Suspense>
            <PrestamoForm clientes={clientes} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
