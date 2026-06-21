'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  CreateClienteSchema,
  type CreateClienteInput,
} from '@/lib/validaciones/cliente.schema'

type Props = {
  defaultValues?: Partial<CreateClienteInput>
  clienteId?: string        // if passed → edit mode (PUT), otherwise → create (POST)
  onSuccess?: () => void    // called after success (e.g. close modal)
}

export function ClienteForm({ defaultValues, clienteId, onSuccess }: Props) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateClienteInput>({
    resolver: zodResolver(CreateClienteSchema),
    defaultValues,
  })

  async function onSubmit(data: CreateClienteInput) {
    const url = clienteId ? `/api/clientes/${clienteId}` : '/api/clientes'
    const method = clienteId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? 'Error al guardar')
      return
    }
    const saved = await res.json()
    toast.success(clienteId ? 'Cliente actualizado' : 'Cliente creado')
    if (onSuccess) {
      onSuccess()
      router.refresh()
    } else {
      router.push(`/clientes/${saved.id}`)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombreCompleto">Nombre completo *</Label>
        <Input id="nombreCompleto" {...register('nombreCompleto')} />
        {errors.nombreCompleto && (
          <p className="text-xs text-red-600">{errors.nombreCompleto.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="documento">Documento *</Label>
        <Input id="documento" {...register('documento')} />
        {errors.documento && (
          <p className="text-xs text-red-600">{errors.documento.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" {...register('telefono')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Textarea id="direccion" {...register('direccion')} rows={2} />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Guardando…' : clienteId ? 'Actualizar' : 'Crear cliente'}
      </Button>
    </form>
  )
}
