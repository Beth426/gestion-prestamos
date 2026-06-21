// app/(dashboard)/clientes/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientesTable } from '@/components/clientes/clientes-table'

export default function ClientesPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const q = searchParams.q?.trim() || undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button asChild>
          <Link href="/clientes/nuevo">Nuevo cliente</Link>
        </Button>
      </div>
      <form className="flex gap-2 max-w-sm">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o documento…"
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>
      <Suspense fallback={<p className="text-sm text-zinc-400">Cargando…</p>}>
        <ClientesTable q={q} />
      </Suspense>
    </div>
  )
}
