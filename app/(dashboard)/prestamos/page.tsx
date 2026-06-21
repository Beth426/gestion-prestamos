// app/(dashboard)/prestamos/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PrestamosTable } from '@/components/prestamos/prestamos-table'
import type { EstadoPrestamo } from '@prisma/client'

const ESTADOS: EstadoPrestamo[] = ['ACTIVO', 'AL_DIA', 'MORA', 'CANCELADO', 'CASTIGADO']

export default function PrestamosPage({
  searchParams,
}: {
  searchParams: { estado?: string }
}) {
  const estado = ESTADOS.includes(searchParams.estado as EstadoPrestamo)
    ? (searchParams.estado as EstadoPrestamo)
    : undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Préstamos</h1>
        <Button asChild>
          <Link href="/prestamos/nuevo">Nuevo préstamo</Link>
        </Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/prestamos"
          className={`text-sm px-3 py-1 rounded-full border ${!estado ? 'bg-zinc-900 text-white border-zinc-900' : 'hover:bg-zinc-50'}`}
        >
          Todos
        </Link>
        {ESTADOS.map((e) => (
          <Link
            key={e}
            href={`/prestamos?estado=${e}`}
            className={`text-sm px-3 py-1 rounded-full border ${estado === e ? 'bg-zinc-900 text-white border-zinc-900' : 'hover:bg-zinc-50'}`}
          >
            {e}
          </Link>
        ))}
      </div>
      <Suspense fallback={<p className="text-sm text-zinc-400">Cargando…</p>}>
        <PrestamosTable estado={estado} />
      </Suspense>
    </div>
  )
}
