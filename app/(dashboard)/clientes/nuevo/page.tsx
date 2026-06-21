import { ClienteForm } from '@/components/clientes/cliente-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NuevoClientePage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Nuevo cliente</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ClienteForm />
        </CardContent>
      </Card>
    </div>
  )
}
