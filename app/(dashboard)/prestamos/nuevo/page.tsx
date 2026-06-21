import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { PrestamoForm } from '@/components/prestamos/prestamo-form'

export default function NuevoPrestamoPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Nuevo préstamo</h1>
      <Card>
        <CardContent className="pt-6">
          <Suspense>
            <PrestamoForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
