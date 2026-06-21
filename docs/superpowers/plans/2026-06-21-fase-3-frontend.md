# Fase 3 — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el frontend completo de la plataforma de préstamos sobre el backend de Fase 2 ya operativo, priorizando Dashboard, Clientes y Préstamos.

**Architecture:** Next.js 14 App Router con Route Groups `(auth)` y `(dashboard)`. Server Components para lectura directa a Prisma; Client Components para formularios que llaman a las API Routes existentes con `fetch`. Tras mutación exitosa, `router.refresh()` invalida el caché del servidor y re-renderiza las páginas con datos frescos.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, react-hook-form, @hookform/resolvers, zod (ya instalado), sonner, lucide-react, Auth.js v5 (ya configurado), Prisma (ya instalado)

---

## Mapa de archivos

```
app/
├── (auth)/login/page.tsx
└── (dashboard)/
    ├── layout.tsx
    ├── page.tsx
    ├── clientes/page.tsx
    ├── clientes/nuevo/page.tsx
    ├── clientes/[id]/page.tsx
    ├── prestamos/page.tsx
    ├── prestamos/nuevo/page.tsx
    ├── prestamos/[id]/page.tsx
    ├── pagos/page.tsx
    └── perfil/page.tsx

components/
├── layout/
│   ├── providers.tsx
│   ├── sidebar.tsx
│   └── topbar.tsx
├── dashboard/
│   ├── kpi-cards.tsx
│   └── cuotas-proximas.tsx
├── clientes/
│   ├── clientes-table.tsx
│   ├── cliente-form.tsx
│   └── cliente-search.tsx
└── prestamos/
    ├── prestamos-table.tsx
    ├── prestamo-form.tsx
    ├── simulador-preview.tsx
    ├── cuotas-table.tsx
    └── pago-form.tsx

lib/
└── format.ts    (formatCOP, formatFecha, estadoVariant)
```

---

## Task 1: Rama + shadcn/ui + dependencias + providers

**Files:**
- Modify: `package.json`, `app/layout.tsx`
- Create: `components/ui/` (auto-generado por shadcn), `components/layout/providers.tsx`, `lib/format.ts`

- [ ] **Step 1: Crear rama fase-3-frontend**

```powershell
git checkout -b fase-3-frontend
```

- [ ] **Step 2: Inicializar shadcn/ui**

```powershell
npx shadcn@latest init
```

Cuando pregunte: Style → **Default**, Base color → **Slate**, CSS variables → **Yes**

- [ ] **Step 3: Instalar componentes shadcn necesarios**

```powershell
npx shadcn@latest add button input label table dialog select textarea badge card breadcrumb sonner separator avatar dropdown-menu
```

- [ ] **Step 4: Instalar dependencias de formularios**

```powershell
npm install react-hook-form @hookform/resolvers
```

- [ ] **Step 5: Crear `lib/format.ts`**

```typescript
export function formatCOP(centavos: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(centavos / 100)
}

export function formatFecha(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export const estadoVariant: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  ACTIVO: 'default',
  EN_MORA: 'destructive',
  CANCELADO: 'secondary',
  CASTIGADO: 'outline',
}
```

- [ ] **Step 6: Crear `components/layout/providers.tsx`**

```typescript
'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

- [ ] **Step 7: Actualizar `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/providers'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Gestión de Préstamos',
  description: 'Plataforma de cartera privada',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 8: Verificar typecheck**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 9: Commit**

```powershell
git add -A
git commit -m "feat: shadcn/ui + dependencias + providers + lib/format"
```

---

## Task 2: Página de login

**Files:**
- Create: `app/(auth)/login/page.tsx`

- [ ] **Step 1: Crear `app/(auth)/login/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const res = await signIn('credentials', { email, password, redirect: false })

    if (res?.error) {
      setError('Credenciales incorrectas')
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verificar typecheck**

```powershell
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```powershell
git add app/
git commit -m "feat: página de login con Auth.js Credentials"
```

---

## Task 3: Layout del dashboard (sidebar + topbar + guard de auth)

**Files:**
- Create: `components/layout/sidebar.tsx`
- Create: `components/layout/topbar.tsx`
- Create: `app/(dashboard)/layout.tsx`

- [ ] **Step 1: Crear `components/layout/sidebar.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, CreditCard, DollarSign, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/prestamos', label: 'Préstamos', icon: CreditCard },
  { href: '/pagos', label: 'Pagos', icon: DollarSign },
  { href: '/perfil', label: 'Perfil', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved) setCollapsed(JSON.parse(saved))
  }, [])

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(next))
  }

  return (
    <aside className={cn(
      'relative flex flex-col h-screen bg-slate-900 text-slate-100 transition-all duration-200',
      collapsed ? 'w-16' : 'w-56'
    )}>
      <div className={cn('flex items-center h-16 px-4 border-b border-slate-700', collapsed && 'justify-center')}>
        {!collapsed && <span className="font-semibold text-sm truncate">Gestión de Préstamos</span>}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? label : undefined}>
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      <Button variant="ghost" size="icon" onClick={toggle}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-slate-700 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800">
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </aside>
  )
}
```

- [ ] **Step 2: Crear `components/layout/topbar.tsx`**

```typescript
'use client'

import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Topbar() {
  const { data: session } = useSession()
  const nombre = session?.user?.name ?? 'Usuario'
  const initiales = nombre.slice(0, 2).toUpperCase()

  return (
    <header className="h-16 border-b bg-white flex items-center justify-end px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initiales}</AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium leading-none">{nombre}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(session?.user as { rol?: string })?.rol ?? ''}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
```

- [ ] **Step 3: Crear `app/(dashboard)/layout.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verificar typecheck**

```powershell
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```powershell
git add components/layout/ app/
git commit -m "feat: layout dashboard con sidebar colapsable + topbar + guard auth"
```

---

## Task 4: Dashboard — KPIs + cuotas próximas

**Files:**
- Create: `components/dashboard/kpi-cards.tsx`
- Create: `components/dashboard/cuotas-proximas.tsx`
- Create: `app/(dashboard)/page.tsx`
- Delete: `app/page.tsx`

- [ ] **Step 1: Crear `components/dashboard/kpi-cards.tsx`**

```typescript
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCOP } from '@/lib/format'
import { CreditCard, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'

export async function KpiCards() {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  const [carteraActiva, prestamosActivos, recaudadoMes, cuotasMora] = await Promise.all([
    prisma.prestamo.aggregate({ where: { estado: 'ACTIVO', eliminadoEn: null }, _sum: { montoCentavos: true } }),
    prisma.prestamo.count({ where: { estado: 'ACTIVO', eliminadoEn: null } }),
    prisma.pago.aggregate({ where: { fechaPago: { gte: inicioMes }, eliminadoEn: null }, _sum: { montoCentavos: true } }),
    prisma.cuota.count({ where: { fechaVencimiento: { lt: ahora }, estado: 'PENDIENTE', prestamo: { eliminadoEn: null } } }),
  ])

  const kpis = [
    { title: 'Cartera activa', value: formatCOP(carteraActiva._sum.montoCentavos ?? 0), icon: TrendingUp, description: 'Saldo total préstamos activos' },
    { title: 'Préstamos activos', value: prestamosActivos.toString(), icon: CreditCard, description: 'Préstamos en estado ACTIVO' },
    { title: 'Recaudado este mes', value: formatCOP(recaudadoMes._sum.montoCentavos ?? 0), icon: DollarSign, description: 'Pagos registrados en el mes' },
    { title: 'Cuotas en mora', value: cuotasMora.toString(), icon: AlertCircle, description: 'Cuotas vencidas sin pagar' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map(({ title, value, icon: Icon, description }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Crear `components/dashboard/cuotas-proximas.tsx`**

```typescript
import { prisma } from '@/lib/prisma'
import { formatCOP, formatFecha } from '@/lib/format'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export async function CuotasProximas() {
  const hoy = new Date()
  const en7dias = new Date(hoy)
  en7dias.setDate(hoy.getDate() + 7)

  const cuotas = await prisma.cuota.findMany({
    where: { estado: 'PENDIENTE', fechaVencimiento: { gte: hoy, lte: en7dias }, prestamo: { eliminadoEn: null, estado: 'ACTIVO' } },
    include: { prestamo: { include: { cliente: true } } },
    orderBy: { fechaVencimiento: 'asc' },
    take: 20,
  })

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Cuotas por vencer (próximos 7 días)</CardTitle></CardHeader>
      <CardContent>
        {cuotas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin cuotas pendientes en los próximos 7 días.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Total cuota</TableHead>
                <TableHead className="text-right">Días restantes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuotas.map((c) => {
                const diasRestantes = Math.ceil((c.fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.prestamo.cliente.nombreCompleto}</TableCell>
                    <TableCell>{formatFecha(c.fechaVencimiento)}</TableCell>
                    <TableCell className="text-right">{formatCOP(c.totalCentavos)}</TableCell>
                    <TableCell className="text-right">{diasRestantes}d</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Crear `app/(dashboard)/page.tsx`**

```typescript
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { CuotasProximas } from '@/components/dashboard/cuotas-proximas'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <KpiCards />
      <CuotasProximas />
    </div>
  )
}
```

- [ ] **Step 4: Eliminar `app/page.tsx` (el route group `(dashboard)` lo reemplaza en la ruta `/`)**

```powershell
Remove-Item "app/page.tsx"
```

- [ ] **Step 5: Verificar typecheck**

```powershell
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: dashboard con KPIs y cuotas próximas a vencer"
```

---

## Task 5: Módulo Clientes — lista + búsqueda

**Files:**
- Create: `components/clientes/cliente-search.tsx`
- Create: `components/clientes/clientes-table.tsx`
- Create: `app/(dashboard)/clientes/page.tsx`

- [ ] **Step 1: Crear `components/clientes/cliente-search.tsx`**

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'

export function ClienteSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const onSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value
      const params = new URLSearchParams(searchParams.toString())
      if (q) { params.set('q', q) } else { params.delete('q') }
      router.push(`/clientes?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <Input
      placeholder="Buscar por nombre o documento..."
      defaultValue={searchParams.get('q') ?? ''}
      onChange={onSearch}
      className="max-w-sm"
    />
  )
}
```

- [ ] **Step 2: Crear `components/clientes/clientes-table.tsx`**

```typescript
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatFecha } from '@/lib/format'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export async function ClientesTable({ q }: { q?: string }) {
  const clientes = await prisma.cliente.findMany({
    where: {
      eliminadoEn: null,
      ...(q ? { OR: [
        { nombreCompleto: { contains: q, mode: 'insensitive' } },
        { documento: { contains: q, mode: 'insensitive' } },
      ] } : {}),
    },
    orderBy: { creadoEn: 'desc' },
    include: { _count: { select: { prestamos: { where: { eliminadoEn: null, estado: 'ACTIVO' } } } } },
  })

  if (clientes.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No se encontraron clientes.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead className="text-right">Préstamos activos</TableHead>
          <TableHead>Fecha registro</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clientes.map((c) => (
          <TableRow key={c.id}>
            <TableCell>
              <Link href={`/clientes/${c.id}`} className="font-medium hover:underline">{c.nombreCompleto}</Link>
            </TableCell>
            <TableCell>{c.documento}</TableCell>
            <TableCell>{c.telefono ?? '—'}</TableCell>
            <TableCell className="text-right">{c._count.prestamos}</TableCell>
            <TableCell>{formatFecha(c.creadoEn)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 3: Crear `app/(dashboard)/clientes/page.tsx`**

```typescript
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { ClientesTable } from '@/components/clientes/clientes-table'
import { ClienteSearch } from '@/components/clientes/cliente-search'

export default function ClientesPage({ searchParams }: { searchParams: { q?: string } }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button asChild><Link href="/clientes/nuevo">Nuevo cliente</Link></Button>
      </div>
      <Suspense fallback={null}><ClienteSearch /></Suspense>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        <ClientesTable q={searchParams.q} />
      </Suspense>
    </div>
  )
}
```

- [ ] **Step 4: Verificar typecheck**

```powershell
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```powershell
git add components/clientes/ app/
git commit -m "feat: lista de clientes con búsqueda por nombre y documento"
```

---

## Task 6: Formulario de cliente (crear + editar)

**Files:**
- Create: `components/clientes/cliente-form.tsx`
- Create: `app/(dashboard)/clientes/nuevo/page.tsx`

- [ ] **Step 1: Crear `components/clientes/cliente-form.tsx`**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CreateClienteSchema } from '@/lib/validaciones/cliente.schema'

type FormValues = z.infer<typeof CreateClienteSchema>

interface Props {
  cliente?: { id: string; nombreCompleto: string; documento: string; telefono?: string | null; email?: string | null; direccion?: string | null }
  onSuccess?: () => void
}

export function ClienteForm({ cliente, onSuccess }: Props) {
  const router = useRouter()
  const isEdit = !!cliente

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(CreateClienteSchema),
    defaultValues: {
      nombreCompleto: cliente?.nombreCompleto ?? '',
      documento: cliente?.documento ?? '',
      telefono: cliente?.telefono ?? '',
      email: cliente?.email ?? '',
      direccion: cliente?.direccion ?? '',
    },
  })

  async function onSubmit(data: FormValues) {
    const url = isEdit ? `/api/clientes/${cliente.id}` : '/api/clientes'
    const method = isEdit ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) { toast.error((await res.json()).error ?? 'Error al guardar'); return }
    const saved = await res.json()
    toast.success(isEdit ? 'Cliente actualizado' : 'Cliente creado')
    if (onSuccess) { onSuccess(); router.refresh() } else { router.push(`/clientes/${saved.id}`) }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombreCompleto">Nombre completo *</Label>
        <Input id="nombreCompleto" {...register('nombreCompleto')} />
        {errors.nombreCompleto && <p className="text-xs text-red-500">{errors.nombreCompleto.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="documento">Documento *</Label>
        <Input id="documento" {...register('documento')} />
        {errors.documento && <p className="text-xs text-red-500">{errors.documento.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" {...register('telefono')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Textarea id="direccion" {...register('direccion')} rows={2} />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Crear `app/(dashboard)/clientes/nuevo/page.tsx`**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClienteForm } from '@/components/clientes/cliente-form'

export default function NuevoClientePage() {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nuevo cliente</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Datos del cliente</CardTitle></CardHeader>
        <CardContent><ClienteForm /></CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Verificar typecheck**

```powershell
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```powershell
git add components/clientes/cliente-form.tsx app/
git commit -m "feat: formulario crear cliente con validación Zod + react-hook-form"
```

---

## Task 7: Detalle de cliente (con modal de edición)

**Files:**
- Create: `app/(dashboard)/clientes/[id]/page.tsx`

- [ ] **Step 1: Crear `app/(dashboard)/clientes/[id]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ClienteForm } from '@/components/clientes/cliente-form'
import { formatCOP, formatFecha, estadoVariant } from '@/lib/format'

export default async function ClienteDetallePage({ params }: { params: { id: string } }) {
  const session = await auth()
  const rol = (session?.user as { rol?: string })?.rol

  const cliente = await prisma.cliente.findFirst({
    where: { id: params.id, eliminadoEn: null },
    include: {
      prestamos: {
        where: { eliminadoEn: null },
        orderBy: { creadoEn: 'desc' },
        include: {
          _count: { select: { cuotas: true } },
          cuotas: { where: { estado: 'PAGADA' }, select: { id: true } },
        },
      },
    },
  })

  if (!cliente) notFound()

  const puedeEditar = rol === 'ADMIN' || rol === 'ASESOR'

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/clientes" className="text-sm text-muted-foreground hover:underline">← Clientes</Link>
          <h1 className="text-2xl font-bold mt-1">{cliente.nombreCompleto}</h1>
        </div>
        {puedeEditar && (
          <Dialog>
            <DialogTrigger asChild><Button variant="outline">Editar</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Editar cliente</DialogTitle></DialogHeader>
              <ClienteForm cliente={cliente} onSuccess={() => {}} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Datos personales</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Documento', value: cliente.documento },
            { label: 'Teléfono', value: cliente.telefono ?? '—' },
            { label: 'Email', value: cliente.email ?? '—' },
            { label: 'Dirección', value: cliente.direccion ?? '—' },
            { label: 'Registrado', value: formatFecha(cliente.creadoEn) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-muted-foreground">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Préstamos</CardTitle></CardHeader>
        <CardContent>
          {cliente.prestamos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin préstamos registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sistema</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cuotas pagadas</TableHead>
                  <TableHead>Desembolso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cliente.prestamos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/prestamos/${p.id}`} className="hover:underline">{p.sistema}</Link>
                    </TableCell>
                    <TableCell className="text-right">{formatCOP(p.montoCentavos)}</TableCell>
                    <TableCell>
                      <Badge variant={estadoVariant[p.estado] ?? 'secondary'}>{p.estado}</Badge>
                    </TableCell>
                    <TableCell>{p.cuotas.length}/{p._count.cuotas}</TableCell>
                    <TableCell>{formatFecha(p.fechaDesembolso)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verificar typecheck**

```powershell
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```powershell
git add app/
git commit -m "feat: detalle de cliente con modal de edición"
```

---

## Task 8: Módulo Préstamos — lista con filtros

**Files:**
- Create: `components/prestamos/prestamos-table.tsx`
- Create: `app/(dashboard)/prestamos/page.tsx`

- [ ] **Step 1: Crear `components/prestamos/prestamos-table.tsx`**

```typescript
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCOP, formatFecha, estadoVariant } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { EstadoPrestamo } from '@prisma/client'

export async function PrestamosTable({ estado }: { estado?: string }) {
  const prestamos = await prisma.prestamo.findMany({
    where: { eliminadoEn: null, ...(estado ? { estado: estado as EstadoPrestamo } : {}) },
    orderBy: { creadoEn: 'desc' },
    include: { cliente: true },
  })

  if (prestamos.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No se encontraron préstamos.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Sistema</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead>Tasa</TableHead>
          <TableHead>Plazo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Desembolso</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {prestamos.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <Link href={`/prestamos/${p.id}`} className="font-medium hover:underline">{p.cliente.nombreCompleto}</Link>
            </TableCell>
            <TableCell>{p.sistema}</TableCell>
            <TableCell className="text-right">{formatCOP(p.montoCentavos)}</TableCell>
            <TableCell>{p.tasaValor}% {p.tipoTasa === 'ANUAL' ? 'EA' : 'EM'}</TableCell>
            <TableCell>{p.plazo} cuotas</TableCell>
            <TableCell><Badge variant={estadoVariant[p.estado] ?? 'secondary'}>{p.estado}</Badge></TableCell>
            <TableCell>{formatFecha(p.fechaDesembolso)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 2: Crear `app/(dashboard)/prestamos/page.tsx`**

```typescript
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { PrestamosTable } from '@/components/prestamos/prestamos-table'

const ESTADOS = ['', 'ACTIVO', 'EN_MORA', 'CANCELADO', 'CASTIGADO']

export default function PrestamosPage({ searchParams }: { searchParams: { estado?: string } }) {
  const estadoActual = searchParams.estado ?? ''
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Préstamos</h1>
        <Button asChild><Link href="/prestamos/nuevo">Nuevo préstamo</Link></Button>
      </div>
      <div className="flex gap-2">
        {ESTADOS.map((e) => (
          <Link key={e || 'todos'} href={e ? `/prestamos?estado=${e}` : '/prestamos'}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              estadoActual === e
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}>
            {e || 'Todos'}
          </Link>
        ))}
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        <PrestamosTable estado={estadoActual} />
      </Suspense>
    </div>
  )
}
```

- [ ] **Step 3: Verificar typecheck**

```powershell
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```powershell
git add components/prestamos/prestamos-table.tsx app/
git commit -m "feat: lista de préstamos con filtro por estado"
```

---

## Task 9: Nuevo préstamo (simulador + formulario 2 pasos)

**Files:**
- Create: `components/prestamos/simulador-preview.tsx`
- Create: `components/prestamos/prestamo-form.tsx`
- Create: `app/(dashboard)/prestamos/nuevo/page.tsx`

- [ ] **Step 1: Crear `components/prestamos/simulador-preview.tsx`**

```typescript
'use client'

import { simularPrestamo } from '@/lib/financiero/motor'
import { convertirTasaPeriodica, PERIODOS_POR_ANIO } from '@/lib/financiero/tasas'
import { tasaEfectivaAnual, formatearCEA } from '@/lib/financiero/cea'
import { formatCOP } from '@/lib/format'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  monto: number
  tasaValor: number
  tipoTasa: 'ANUAL' | 'MENSUAL'
  frecuencia: 'MENSUAL' | 'QUINCENAL' | 'SEMANAL'
  plazo: number
  sistema: 'TRADICIONAL' | 'PAGADIARIO' | 'FIJO'
  tipoGracia: 'NINGUNO' | 'PARCIAL' | 'TOTAL'
  periodosGracia: number
  seguro: number
}

export function SimuladorPreview(p: Props) {
  const frecuenciaLower = p.frecuencia.toLowerCase() as 'mensual' | 'quincenal' | 'semanal'
  const tipoTasaLower = p.tipoTasa.toLowerCase() as 'anual' | 'mensual'

  const tasaPeriodica = p.sistema === 'FIJO'
    ? p.tasaValor / 100
    : convertirTasaPeriodica(p.tasaValor, tipoTasaLower, frecuenciaLower)

  const resultado = simularPrestamo({
    monto: p.monto, totalPeriodos: p.plazo, tasaPeriodica,
    tipoCuota: 'auto', cuotaManual: 0,
    tipoGracia: p.tipoGracia.toLowerCase() as 'ninguno' | 'parcial' | 'total',
    periodosGracia: p.periodosGracia, abonosExtra: {},
    sistema: p.sistema.toLowerCase() as 'tradicional' | 'pagadiario' | 'fijo',
    seguro: p.seguro,
  })

  const cea = tasaEfectivaAnual(p.monto, resultado.lineas, PERIODOS_POR_ANIO[frecuenciaLower])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Cuota', value: formatCOP(resultado.cuotaAplicada * 100) },
          { label: 'Total a pagar', value: formatCOP(resultado.totalPagado * 100) },
          { label: 'Total interés', value: formatCOP(resultado.totalInteres * 100) },
          { label: 'CEA', value: formatearCEA(cea) },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-xs">{label}</p>
              <p className="font-bold text-lg">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="max-h-80 overflow-y-auto border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-white">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead className="text-right">Cuota</TableHead>
              <TableHead className="text-right">Capital</TableHead>
              <TableHead className="text-right">Interés</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultado.lineas.map((l) => (
              <TableRow key={l.num} className={l.esGracia ? 'bg-yellow-50' : ''}>
                <TableCell>{l.num}</TableCell>
                <TableCell className="text-right">{formatCOP(l.pagoMensual * 100)}</TableCell>
                <TableCell className="text-right">{formatCOP(l.abonoCapitalBase * 100)}</TableCell>
                <TableCell className="text-right">{formatCOP(l.interes * 100)}</TableCell>
                <TableCell className="text-right">{formatCOP(l.saldoRestante * 100)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear `components/prestamos/prestamo-form.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimuladorPreview } from './simulador-preview'
import { CreatePrestamoSchema } from '@/lib/validaciones/prestamo.schema'

type FormValues = z.infer<typeof CreatePrestamoSchema>
interface ClienteOption { id: string; nombreCompleto: string; documento: string }

export function PrestamoForm() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [clienteQuery, setClienteQuery] = useState('')
  const [clienteResultados, setClienteResultados] = useState<ClienteOption[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteOption | null>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(CreatePrestamoSchema),
    defaultValues: { sistema: 'TRADICIONAL', tipoTasa: 'ANUAL', frecuencia: 'MENSUAL', tipoGracia: 'NINGUNO', periodosGracia: 0, seguro: 0 },
  })

  const valores = watch()

  async function buscarCliente(q: string) {
    setClienteQuery(q)
    if (q.length < 2) { setClienteResultados([]); return }
    const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
    if (res.ok) setClienteResultados(await res.json())
  }

  async function onSubmit(data: FormValues) {
    const res = await fetch('/api/prestamos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) { toast.error((await res.json()).error ?? 'Error al crear préstamo'); return }
    const { id } = await res.json()
    toast.success('Préstamo desembolsado')
    router.push(`/prestamos/${id}`)
  }

  if (step === 1) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Cliente *</Label>
          {clienteSeleccionado ? (
            <div className="flex items-center gap-2 p-2 border rounded-md bg-slate-50">
              <span className="text-sm font-medium flex-1">{clienteSeleccionado.nombreCompleto}</span>
              <Button type="button" variant="ghost" size="sm"
                onClick={() => { setClienteSeleccionado(null); setValue('clienteId', '') }}>Cambiar</Button>
            </div>
          ) : (
            <div className="relative">
              <Input placeholder="Buscar por nombre o documento..." value={clienteQuery}
                onChange={(e) => buscarCliente(e.target.value)} />
              {clienteResultados.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1">
                  {clienteResultados.map((c) => (
                    <button key={c.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                      onClick={() => { setClienteSeleccionado(c); setValue('clienteId', c.id); setClienteResultados([]); setClienteQuery('') }}>
                      <span className="font-medium">{c.nombreCompleto}</span>
                      <span className="text-muted-foreground ml-2">{c.documento}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {errors.clienteId && <p className="text-xs text-red-500">Selecciona un cliente</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sistema *</Label>
            <Select onValueChange={(v) => setValue('sistema', v as FormValues['sistema'])} defaultValue="TRADICIONAL">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TRADICIONAL">Tradicional (francés)</SelectItem>
                <SelectItem value="PAGADIARIO">Pagadiario</SelectItem>
                <SelectItem value="FIJO">Fijo global</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Frecuencia *</Label>
            <Select onValueChange={(v) => setValue('frecuencia', v as FormValues['frecuencia'])} defaultValue="MENSUAL">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MENSUAL">Mensual</SelectItem>
                <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                <SelectItem value="SEMANAL">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Monto *</Label>
            <Input type="number" {...register('monto', { valueAsNumber: true })} placeholder="1000000" />
            {errors.monto && <p className="text-xs text-red-500">{errors.monto.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Plazo (cuotas) *</Label>
            <Input type="number" {...register('plazo', { valueAsNumber: true })} placeholder="12" />
            {errors.plazo && <p className="text-xs text-red-500">{errors.plazo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Tasa *</Label>
            <Input type="number" step="0.01" {...register('tasaValor', { valueAsNumber: true })} placeholder="2" />
            {errors.tasaValor && <p className="text-xs text-red-500">{errors.tasaValor.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Tipo de tasa *</Label>
            <Select onValueChange={(v) => setValue('tipoTasa', v as FormValues['tipoTasa'])} defaultValue="ANUAL">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ANUAL">Anual</SelectItem>
                <SelectItem value="MENSUAL">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de gracia</Label>
            <Select onValueChange={(v) => setValue('tipoGracia', v as FormValues['tipoGracia'])} defaultValue="NINGUNO">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NINGUNO">Sin gracia</SelectItem>
                <SelectItem value="PARCIAL">Parcial (solo interés)</SelectItem>
                <SelectItem value="TOTAL">Total (capital + interés)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Periodos de gracia</Label>
            <Input type="number" {...register('periodosGracia', { valueAsNumber: true })} defaultValue={0} />
          </div>
          <div className="space-y-2">
            <Label>Seguro por cuota</Label>
            <Input type="number" step="0.01" {...register('seguro', { valueAsNumber: true })} defaultValue={0} />
          </div>
          <div className="space-y-2">
            <Label>Fecha desembolso *</Label>
            <Input type="date" {...register('fechaDesembolso')} />
            {errors.fechaDesembolso && <p className="text-xs text-red-500">Fecha requerida</p>}
          </div>
        </div>

        <Button type="button" className="w-full"
          onClick={() => {
            if (!valores.clienteId) { toast.error('Selecciona un cliente'); return }
            if (!valores.monto || !valores.plazo || !valores.tasaValor || !valores.fechaDesembolso) {
              toast.error('Completa todos los campos requeridos'); return
            }
            setStep(2)
          }}>
          Ver simulación →
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Vista previa de amortización</h2>
        <Button variant="outline" type="button" onClick={() => setStep(1)}>← Volver</Button>
      </div>
      <SimuladorPreview
        monto={valores.monto} tasaValor={valores.tasaValor} tipoTasa={valores.tipoTasa}
        frecuencia={valores.frecuencia} plazo={valores.plazo} sistema={valores.sistema}
        tipoGracia={valores.tipoGracia ?? 'NINGUNO'} periodosGracia={valores.periodosGracia ?? 0}
        seguro={valores.seguro ?? 0}
      />
      <Button className="w-full" disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
        {isSubmitting ? 'Desembolsando...' : 'Confirmar y desembolsar'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Crear `app/(dashboard)/prestamos/nuevo/page.tsx`**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PrestamoForm } from '@/components/prestamos/prestamo-form'

export default function NuevoPrestamoPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nuevo préstamo</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Parámetros del préstamo</CardTitle></CardHeader>
        <CardContent><PrestamoForm /></CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Verificar typecheck**

```powershell
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```powershell
git add components/prestamos/ app/
git commit -m "feat: formulario nuevo préstamo con simulador de amortización en 2 pasos"
```

---

## Task 10: Detalle de préstamo (cuotas + registrar pago)

**Files:**
- Create: `components/prestamos/cuotas-table.tsx`
- Create: `components/prestamos/pago-form.tsx`
- Create: `app/(dashboard)/prestamos/[id]/page.tsx`

- [ ] **Step 1: Crear `components/prestamos/cuotas-table.tsx`**

```typescript
import { formatCOP, formatFecha } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Cuota } from '@prisma/client'

const estadoCuotaVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDIENTE: 'secondary',
  PAGADA: 'default',
  VENCIDA: 'destructive',
}

export function CuotasTable({ cuotas }: { cuotas: Cuota[] }) {
  return (
    <div className="max-h-96 overflow-y-auto border rounded-md">
      <Table>
        <TableHeader className="sticky top-0 bg-white">
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead className="text-right">Capital</TableHead>
            <TableHead className="text-right">Interés</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cuotas.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.numero}</TableCell>
              <TableCell>{formatFecha(c.fechaVencimiento)}</TableCell>
              <TableCell className="text-right">{formatCOP(c.capitalCentavos)}</TableCell>
              <TableCell className="text-right">{formatCOP(c.interesCentavos)}</TableCell>
              <TableCell className="text-right">{formatCOP(c.totalCentavos)}</TableCell>
              <TableCell className="text-right">{formatCOP(c.saldoCentavos)}</TableCell>
              <TableCell>
                <Badge variant={estadoCuotaVariant[c.estado] ?? 'secondary'}>{c.estado}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 2: Crear `components/prestamos/pago-form.tsx`**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PagoSchema = z.object({
  monto: z.number().positive(),
  fechaPago: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tipoPago: z.enum(['CUOTA', 'ABONO_EXTRA', 'AJUSTE', 'CASTIGO']),
  notas: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof PagoSchema>

export function PagoForm({ prestamoId }: { prestamoId: string }) {
  const router = useRouter()
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(PagoSchema),
    defaultValues: { tipoPago: 'CUOTA', fechaPago: new Date().toISOString().slice(0, 10) },
  })

  async function onSubmit(data: FormValues) {
    const res = await fetch('/api/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, prestamoId }),
    })
    if (!res.ok) { toast.error((await res.json()).error ?? 'Error al registrar pago'); return }
    toast.success('Pago registrado')
    reset()
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Monto *</Label>
          <Input type="number" step="0.01" {...register('monto', { valueAsNumber: true })} />
          {errors.monto && <p className="text-xs text-red-500">{errors.monto.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Fecha de pago *</Label>
          <Input type="date" {...register('fechaPago')} />
        </div>
        <div className="space-y-2">
          <Label>Tipo de pago</Label>
          <Select onValueChange={(v) => setValue('tipoPago', v as FormValues['tipoPago'])} defaultValue="CUOTA">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CUOTA">Cuota</SelectItem>
              <SelectItem value="ABONO_EXTRA">Abono extra</SelectItem>
              <SelectItem value="AJUSTE">Ajuste</SelectItem>
              <SelectItem value="CASTIGO">Castigo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notas</Label>
        <Textarea {...register('notas')} rows={2} placeholder="Observaciones opcionales..." />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registrando...' : 'Registrar pago'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Crear `app/(dashboard)/prestamos/[id]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CuotasTable } from '@/components/prestamos/cuotas-table'
import { PagoForm } from '@/components/prestamos/pago-form'
import { formatCOP, formatFecha, estadoVariant } from '@/lib/format'

export default async function PrestamoDetallePage({ params }: { params: { id: string } }) {
  const session = await auth()
  const rol = (session?.user as { rol?: string })?.rol

  const prestamo = await prisma.prestamo.findFirst({
    where: { id: params.id, eliminadoEn: null },
    include: {
      cliente: true,
      asesor: { select: { nombre: true } },
      cuotas: { orderBy: { numero: 'asc' } },
      pagos: {
        where: { eliminadoEn: null },
        orderBy: { fechaPago: 'desc' },
        include: { registradoPor: { select: { nombre: true } } },
      },
    },
  })

  if (!prestamo) notFound()

  const puedeRegistrarPago = ['ADMIN', 'ASESOR', 'COBRANZA'].includes(rol ?? '')

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link href="/prestamos" className="text-sm text-muted-foreground hover:underline">← Préstamos</Link>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-bold">{prestamo.cliente.nombreCompleto}</h1>
          <Badge variant={estadoVariant[prestamo.estado] ?? 'secondary'}>{prestamo.estado}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Monto', value: formatCOP(prestamo.montoCentavos) },
          { label: 'Sistema', value: prestamo.sistema },
          { label: 'Tasa', value: `${prestamo.tasaValor}% ${prestamo.tipoTasa}` },
          { label: 'Plazo', value: `${prestamo.plazo} cuotas` },
          { label: 'Frecuencia', value: prestamo.frecuencia },
          { label: 'Desembolso', value: formatFecha(prestamo.fechaDesembolso) },
          { label: 'Asesor', value: prestamo.asesor.nombre },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium text-sm mt-0.5">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Tabla de cuotas</CardTitle></CardHeader>
        <CardContent><CuotasTable cuotas={prestamo.cuotas} /></CardContent>
      </Card>

      {puedeRegistrarPago && (
        <Card>
          <CardHeader><CardTitle className="text-base">Registrar pago</CardTitle></CardHeader>
          <CardContent><PagoForm prestamoId={prestamo.id} /></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Pagos registrados</CardTitle></CardHeader>
        <CardContent>
          {prestamo.pagos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Registrado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestamo.pagos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatFecha(p.fechaPago)}</TableCell>
                    <TableCell>{p.tipoPago}</TableCell>
                    <TableCell className="text-right">{formatCOP(p.montoCentavos)}</TableCell>
                    <TableCell>{p.registradoPor.nombre}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Verificar typecheck**

```powershell
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```powershell
git add components/prestamos/ app/
git commit -m "feat: detalle de préstamo con tabla de cuotas y formulario de pago"
```

---

## Task 11: Historial de pagos + página de perfil

**Files:**
- Create: `app/(dashboard)/pagos/page.tsx`
- Create: `app/(dashboard)/perfil/page.tsx`

- [ ] **Step 1: Crear `app/(dashboard)/pagos/page.tsx`**

```typescript
import { prisma } from '@/lib/prisma'
import { formatCOP, formatFecha } from '@/lib/format'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function PagosPage({ searchParams }: { searchParams: { mes?: string; anio?: string } }) {
  const ahora = new Date()
  const anio = parseInt(searchParams.anio ?? String(ahora.getFullYear()))
  const mes = parseInt(searchParams.mes ?? String(ahora.getMonth() + 1))
  const inicio = new Date(anio, mes - 1, 1)
  const fin = new Date(anio, mes, 1)

  const pagos = await prisma.pago.findMany({
    where: { eliminadoEn: null, fechaPago: { gte: inicio, lt: fin } },
    orderBy: { fechaPago: 'desc' },
    include: {
      prestamo: { include: { cliente: true } },
      registradoPor: { select: { nombre: true } },
    },
  })

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Historial de pagos</h1>
        <div className="flex gap-2 text-sm items-center">
          <span className="text-muted-foreground">{meses[mes - 1]} {anio}</span>
          <a href={`/pagos?mes=${mes === 1 ? 12 : mes - 1}&anio=${mes === 1 ? anio - 1 : anio}`}
            className="px-2 py-1 border rounded hover:bg-slate-50">‹</a>
          <a href={`/pagos?mes=${mes === 12 ? 1 : mes + 1}&anio=${mes === 12 ? anio + 1 : anio}`}
            className="px-2 py-1 border rounded hover:bg-slate-50">›</a>
        </div>
      </div>
      {pagos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin pagos en este período.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Registrado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagos.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{formatFecha(p.fechaPago)}</TableCell>
                <TableCell>{p.prestamo.cliente.nombreCompleto}</TableCell>
                <TableCell>{p.tipoPago}</TableCell>
                <TableCell className="text-right">{formatCOP(p.montoCentavos)}</TableCell>
                <TableCell>{p.registradoPor.nombre}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Crear `app/(dashboard)/perfil/page.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function PerfilPage() {
  const session = await auth()
  const user = session?.user as { name?: string; email?: string; rol?: string } | undefined

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Mi perfil</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Datos de la cuenta</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">Nombre</p>
            <p className="font-medium">{user?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rol</p>
            <Badge variant="secondary">{user?.rol ?? '—'}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Verificar typecheck**

```powershell
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```powershell
git add app/
git commit -m "feat: historial de pagos y página de perfil"
```

---

## Task 12: Verificación final y build

- [ ] **Step 1: Ejecutar tests de Fase 2 (no deben romperse)**

```powershell
npx jest --no-coverage
```

Esperado: 34/34 tests pasan.

- [ ] **Step 2: Typecheck final**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 3: Build de producción**

```powershell
npm run build
```

Esperado: build exitoso. Páginas esperadas en el output:
- `/login`, `/` (dashboard), `/clientes`, `/clientes/nuevo`, `/clientes/[id]`
- `/prestamos`, `/prestamos/nuevo`, `/prestamos/[id]`, `/pagos`, `/perfil`

- [ ] **Step 4: Commit si hay cambios pendientes**

```powershell
git status
# Si hay cambios no commiteados:
git add -A
git commit -m "chore: verificación final Fase 3"
```
