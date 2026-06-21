'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type Props = { prestamoId: string }

export function PagoForm({ prestamoId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tipoPago, setTipoPago] = useState('CUOTA')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const data = new FormData(e.currentTarget)
    const body = {
      prestamoId,
      monto: Number(data.get('monto')),
      fechaPago: data.get('fechaPago') as string,
      tipoPago,
      notas: (data.get('notas') as string) || undefined,
    }
    const res = await fetch('/api/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      toast.error(b.error ?? 'Error al registrar pago')
      return
    }
    toast.success('Pago registrado')
    ;(e.target as HTMLFormElement).reset()
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monto">Monto (pesos) *</Label>
          <Input id="monto" name="monto" type="number" step="1000" required min={1} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fechaPago">Fecha de pago *</Label>
          <Input
            id="fechaPago"
            name="fechaPago"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Tipo de pago</Label>
        <Select defaultValue="CUOTA" onValueChange={setTipoPago}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="CUOTA">Cuota regular</SelectItem>
            <SelectItem value="ABONO_EXTRA">Abono extra</SelectItem>
            <SelectItem value="AJUSTE">Ajuste</SelectItem>
            <SelectItem value="CASTIGO">Castigo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" name="notas" rows={2} />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Registrando…' : 'Registrar pago'}
      </Button>
    </form>
  )
}
