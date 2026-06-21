# Fase 3 — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el frontend completo de la plataforma de gestión de préstamos: layout, login, dashboard, clientes, préstamos, pagos y perfil.

**Architecture:** App Router con Server Components para lectura directa desde Prisma; Client Components con react-hook-form para formularios que llaman a las API Routes de Fase 2; `router.refresh()` sincroniza datos tras mutaciones. Route group `(dashboard)` protegido por auth guard en layout.tsx.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, react-hook-form, @hookform/resolvers, zod (ya instalado), lucide-react, sonner

---

## Mapa de archivos

```
app/
├── layout.tsx                              ← MODIFICAR: añadir Providers + Toaster
├── (auth)/
│   └── login/
│       └── page.tsx                        ← CREAR: página login
└── (dashboard)/
    ├── layout.tsx                          ← CREAR: auth guard + sidebar + topbar
    ├── page.tsx                            ← CREAR: dashboard (sustituye app/page.tsx)
    ├── clientes/
    │   ├── page.tsx                        ← CREAR: lista clientes
    │   ├── nuevo/page.tsx                  ← CREAR: formulario crear cliente
    │   └── [id]/page.tsx                   ← CREAR: detalle cliente
    ├── prestamos/
    │   ├── page.tsx                        ← CREAR: lista préstamos
    │   ├── nuevo/page.tsx                  ← CREAR: simulador + formulario desembolso
    │   └── [id]/page.tsx                   ← CREAR: detalle + cuotas + pago
    ├── pagos/
    │   └── page.tsx                        ← CREAR: historial pagos
    └── perfil/
        └── page.tsx                        ← CREAR: datos sesión

components/
├── layout/
│   ├── providers.tsx                       ← CREAR: SessionProvider (use client)
│   ├── sidebar.tsx                         ← CREAR: sidebar colapsable (use client)
│   └── topbar.tsx                          ← CREAR: barra superior + logout
├── clientes/
│   ├── clientes-table.tsx                  ← CREAR: tabla Server Component
│   └── cliente-form.tsx                    ← CREAR: formulario use client
├── prestamos/
│   ├── prestamos-table.tsx                 ← CREAR: tabla Server Component
│   ├── prestamo-form.tsx                   ← CREAR: 2 pasos + simulador use client
│   ├── cuotas-table.tsx                    ← CREAR: tabla cuotas Server Component
│   └── pago-form.tsx                       ← CREAR: registrar pago use client
└── dashboard/
    ├── kpi-cards.tsx                       ← CREAR: 4 tarjetas Server Component
    └── cuotas-proximas.tsx                 ← CREAR: tabla cuotas esta semana

lib/
└── format.ts                               ← CREAR: formatCOP, formatFecha
```

**Nota:** `app/page.tsx` se elimina en Task 3 (el dashboard pasa a `app/(dashboard)/page.tsx`).

---

## Task 1: Setup — rama, shadcn/ui, librerías, utilidades de formato

**Files:**
- Create: `lib/format.ts`

- [ ] **Step 1: Crear rama fase-3-frontend**

```powershell
cd "C:\Users\danie\OneDrive\Desktop\proyecto de prrestamos"
git checkout master
git pull origin master
git checkout -b fase-3-frontend
```

- [ ] **Step 2: Inicializar shadcn/ui con valores por defecto**

```powershell
npx shadcn@latest init -d
```

Esto crea `components.json` con estilo New York, color zinc, CSS variables activadas. Si pregunta algo, responde con los defaults (Enter).

- [ ] **Step 3: Agregar componentes shadcn/ui necesarios**

```powershell
npx shadcn@latest add button input label table dialog select textarea badge card breadcrumb sonner separator
```

Esto crea los archivos en `components/ui/`.

- [ ] **Step 4: Instalar react-hook-form y @hookform/resolvers**

```powershell
npm install react-hook-form @hookform/resolvers
```

- [ ] **Step 5: Crear lib/format.ts**

```typescript
// lib/format.ts
export function formatCOP(centavos: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(centavos / 100)
}

export function formatFecha(date: Date | string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatPorcentaje(valor: number): string {
  return `${Number(valor).toFixed(2)}%`
}
```

- [ ] **Step 6: Verificar typecheck**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 7: Commit**

```powershell
git add -A
git commit -m "feat: setup shadcn/ui, react-hook-form y utilidades de formato"
```

---

## Task 2: Layout base — Providers, Sidebar, Topbar, Root Layout

**Files:**
- Create: `components/layout/providers.tsx`
- Create: `components/layout/sidebar.tsx`
- Create: `components/layout/topbar.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Crear components/layout/providers.tsx**

```typescript
// components/layout/providers.tsx
'use client'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster richColors position="top-right" />
    </SessionProvider>
  )
}
```

- [ ] **Step 2: Crear components/layout/sidebar.tsx**

```typescript
// components/layout/sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  CreditCard,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/prestamos', label: 'Préstamos', icon: DollarSign },
  { href: '/pagos', label: 'Pagos', icon: CreditCard },
  { href: '/perfil', label: 'Perfil', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) setCollapsed(saved === 'true')
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      localStorage.setItem('sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-white transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex h-14 items-center justify-between px-3 border-b">
        {!collapsed && (
          <span className="text-sm font-semibold truncate">Préstamos</span>
        )}
        <button
          onClick={toggle}
          className="ml-auto p-1 rounded hover:bg-gray-100"
          aria-label={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      <nav className="flex-1 py-2 space-y-1 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                active
                  ? 'bg-zinc-100 font-medium text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3: Crear components/layout/topbar.tsx**

```typescript
// components/layout/topbar.tsx
'use client'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Session } from 'next-auth'

export function Topbar({ session }: { session: Session }) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium leading-none">{session.user?.name}</p>
          <p className="text-xs text-zinc-500">{(session.user as { rol?: string }).rol}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: '/login' })}
          aria-label="Cerrar sesión"
        >
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Modificar app/layout.tsx para añadir Providers**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from '@/components/layout/providers'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Sistema de Gestión de Préstamos',
  description: 'Plataforma de gestión de cartera de préstamos privados',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Verificar typecheck**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: layout base — Providers, Sidebar colapsable, Topbar"
```

---

## Task 3: Auth guard — (dashboard)/layout.tsx + eliminar app/page.tsx

**Files:**
- Delete: `app/page.tsx`
- Create: `app/(dashboard)/layout.tsx`
- Create: `app/(dashboard)/page.tsx` (placeholder, se completa en Task 5)

- [ ] **Step 1: Eliminar app/page.tsx**

```powershell
Remove-Item "app\page.tsx"
```

- [ ] **Step 2: Crear app/(dashboard)/layout.tsx**

```typescript
// app/(dashboard)/layout.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar session={session} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Crear app/(dashboard)/page.tsx provisional**

```typescript
// app/(dashboard)/page.tsx
export default function DashboardPage() {
  return <p className="text-zinc-500">Cargando dashboard…</p>
}
```

- [ ] **Step 4: Verificar que no hay conflicto de rutas y typecheck pasa**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: auth guard en layout de dashboard"
```

---

## Task 4: Login page

**Files:**
- Create: `app/(auth)/login/page.tsx`

- [ ] **Step 1: Crear app/(auth)/login/page.tsx**

```typescript
// app/(auth)/login/page.tsx
'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const data = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: data.get('email') as string,
      password: data.get('password') as string,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('Email o contraseña incorrectos')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm space-y-6 p-8 bg-white rounded-xl shadow-sm border">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Iniciar sesión</h1>
          <p className="text-sm text-zinc-500">Sistema de Gestión de Préstamos</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar typecheck**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat: página de login"
```

---

## Task 5: Dashboard — KPI cards + cuotas próximas

**Files:**
- Create: `components/dashboard/kpi-cards.tsx`
- Create: `components/dashboard/cuotas-proximas.tsx`
- Modify: `app/(dashboard)/page.tsx`

- [ ] **Step 1: Crear components/dashboard/kpi-cards.tsx**

```typescript
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
```

- [ ] **Step 2: Crear components/dashboard/cuotas-proximas.tsx**

```typescript
// components/dashboard/cuotas-proximas.tsx
import { prisma } from '@/lib/prisma'
import { formatCOP, formatFecha } from '@/lib/format'

export async function CuotasProximas() {
  const hoy = new Date()
  const sieteDias = new Date(hoy)
  sieteDias.setDate(hoy.getDate() + 7)

  const cuotas = await prisma.cuota.findMany({
    where: {
      fechaVencimiento: { gte: hoy, lte: sieteDias },
      pagos: { none: { eliminadoEn: null } },
      prestamo: { eliminadoEn: null },
    },
    include: { prestamo: { include: { cliente: true } } },
    orderBy: { fechaVencimiento: 'asc' },
    take: 20,
  })

  if (cuotas.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-4">
        No hay cuotas por vencer en los próximos 7 días.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-zinc-500">
            <th className="pb-2 font-medium">Vencimiento</th>
            <th className="pb-2 font-medium">Cliente</th>
            <th className="pb-2 font-medium text-right">Monto</th>
            <th className="pb-2 font-medium text-right">Días</th>
          </tr>
        </thead>
        <tbody>
          {cuotas.map((c) => {
            const dias = Math.ceil(
              (c.fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
            )
            return (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-2">{formatFecha(c.fechaVencimiento)}</td>
                <td className="py-2">{c.prestamo.cliente.nombreCompleto}</td>
                <td className="py-2 text-right">{formatCOP(c.totalCentavos)}</td>
                <td className="py-2 text-right">
                  <span
                    className={
                      dias <= 2 ? 'text-red-600 font-medium' : 'text-zinc-600'
                    }
                  >
                    {dias}d
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Actualizar app/(dashboard)/page.tsx**

```typescript
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
```

- [ ] **Step 4: Verificar typecheck**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: dashboard con KPIs y cuotas próximas"
```

---

## Task 6: Clientes — lista con búsqueda

**Files:**
- Create: `components/clientes/clientes-table.tsx`
- Create: `app/(dashboard)/clientes/page.tsx`

- [ ] **Step 1: Crear components/clientes/clientes-table.tsx**

```typescript
// components/clientes/clientes-table.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatFecha } from '@/lib/format'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export async function ClientesTable({ q }: { q?: string }) {
  const clientes = await prisma.cliente.findMany({
    where: {
      eliminadoEn: null,
      ...(q
        ? {
            OR: [
              { nombreCompleto: { contains: q, mode: 'insensitive' } },
              { documento: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { creadoEn: 'desc' },
    include: {
      _count: {
        select: { prestamos: { where: { eliminadoEn: null, estado: 'ACTIVO' } } },
      },
    },
  })

  if (clientes.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-8 text-center">
        {q ? `Sin resultados para "${q}"` : 'No hay clientes registrados.'}
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead className="text-right">Préstamos activos</TableHead>
          <TableHead className="text-right">Registro</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clientes.map((c) => (
          <TableRow key={c.id} className="cursor-pointer hover:bg-zinc-50">
            <TableCell>
              <Link href={`/clientes/${c.id}`} className="font-medium hover:underline">
                {c.nombreCompleto}
              </Link>
            </TableCell>
            <TableCell className="text-zinc-600">{c.documento}</TableCell>
            <TableCell className="text-zinc-600">{c.telefono ?? '—'}</TableCell>
            <TableCell className="text-right">{c._count.prestamos}</TableCell>
            <TableCell className="text-right text-zinc-500">
              {formatFecha(c.creadoEn)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 2: Crear app/(dashboard)/clientes/page.tsx**

```typescript
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
```

- [ ] **Step 3: Verificar typecheck**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "feat: lista de clientes con búsqueda"
```

---

## Task 7: Clientes — formulario crear + página nuevo

**Files:**
- Create: `components/clientes/cliente-form.tsx`
- Create: `app/(dashboard)/clientes/nuevo/page.tsx`

- [ ] **Step 1: Crear components/clientes/cliente-form.tsx**

```typescript
// components/clientes/cliente-form.tsx
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
  clienteId?: string        // si se pasa → modo edición (PUT), si no → crear (POST)
  onSuccess?: () => void    // llamado tras éxito (ej: cerrar modal)
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
```

- [ ] **Step 2: Crear app/(dashboard)/clientes/nuevo/page.tsx**

```typescript
// app/(dashboard)/clientes/nuevo/page.tsx
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
```

- [ ] **Step 3: Verificar typecheck**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "feat: formulario y página de crear cliente"
```

---

## Task 8: Clientes — detalle con modal de edición

**Files:**
- Create: `app/(dashboard)/clientes/[id]/page.tsx`

- [ ] **Step 1: Crear app/(dashboard)/clientes/[id]/page.tsx**

```typescript
// app/(dashboard)/clientes/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCOP, formatFecha } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ClienteForm } from '@/components/clientes/cliente-form'

const estadoColor: Record<string, string> = {
  ACTIVO: 'bg-green-100 text-green-700',
  AL_DIA: 'bg-blue-100 text-blue-700',
  MORA: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-zinc-100 text-zinc-600',
  CASTIGADO: 'bg-orange-100 text-orange-700',
}

export default async function ClienteDetallePage({
  params,
}: {
  params: { id: string }
}) {
  const cliente = await prisma.cliente.findFirst({
    where: { id: params.id, eliminadoEn: null },
    include: {
      prestamos: {
        where: { eliminadoEn: null },
        orderBy: { creadoEn: 'desc' },
        include: {
          _count: { select: { cuotas: true } },
          pagos: { where: { eliminadoEn: null }, select: { id: true } },
        },
      },
    },
  })

  if (!cliente) notFound()

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{cliente.nombreCompleto}</h1>
          <p className="text-zinc-500 text-sm">CC {cliente.documento}</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Editar</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar cliente</DialogTitle>
            </DialogHeader>
            <ClienteForm
              clienteId={cliente.id}
              defaultValues={{
                nombreCompleto: cliente.nombreCompleto,
                documento: cliente.documento,
                telefono: cliente.telefono ?? undefined,
                email: cliente.email ?? undefined,
                direccion: cliente.direccion ?? undefined,
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-500">Teléfono</p>
            <p>{cliente.telefono ?? '—'}</p>
          </div>
          <div>
            <p className="text-zinc-500">Email</p>
            <p>{cliente.email ?? '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-zinc-500">Dirección</p>
            <p>{cliente.direccion ?? '—'}</p>
          </div>
          <div>
            <p className="text-zinc-500">Registrado</p>
            <p>{formatFecha(cliente.creadoEn)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Préstamos</CardTitle>
          <Button asChild size="sm">
            <Link href={`/prestamos/nuevo?clienteId=${cliente.id}`}>Nuevo préstamo</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {cliente.prestamos.length === 0 ? (
            <p className="text-sm text-zinc-500">Sin préstamos registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sistema</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Plazo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Pagos</TableHead>
                  <TableHead className="text-right">Desembolso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cliente.prestamos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={`/prestamos/${p.id}`}
                        className="hover:underline font-medium"
                      >
                        {p.sistema}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCOP(p.montoCentavos)}
                    </TableCell>
                    <TableCell className="text-right">{p.plazo}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[p.estado] ?? ''}`}
                      >
                        {p.estado}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {p.pagos.length}/{p._count.cuotas}
                    </TableCell>
                    <TableCell className="text-right text-zinc-500">
                      {formatFecha(p.fechaDesembolso)}
                    </TableCell>
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

Esperado: 0 errores.

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat: detalle de cliente con modal de edición"
```

---

## Task 9: Préstamos — lista con filtro por estado

**Files:**
- Create: `components/prestamos/prestamos-table.tsx`
- Create: `app/(dashboard)/prestamos/page.tsx`

- [ ] **Step 1: Crear components/prestamos/prestamos-table.tsx**

```typescript
// components/prestamos/prestamos-table.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCOP, formatFecha, formatPorcentaje } from '@/lib/format'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { EstadoPrestamo } from '@prisma/client'

const estadoColor: Record<EstadoPrestamo, string> = {
  ACTIVO: 'bg-green-100 text-green-700',
  AL_DIA: 'bg-blue-100 text-blue-700',
  MORA: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-zinc-100 text-zinc-600',
  CASTIGADO: 'bg-orange-100 text-orange-700',
}

export async function PrestamosTable({ estado }: { estado?: EstadoPrestamo }) {
  const prestamos = await prisma.prestamo.findMany({
    where: {
      eliminadoEn: null,
      ...(estado ? { estado } : {}),
    },
    orderBy: { creadoEn: 'desc' },
    include: { cliente: true },
  })

  if (prestamos.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-8 text-center">
        No hay préstamos{estado ? ` con estado ${estado}` : ''}.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Sistema</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead className="text-right">Tasa</TableHead>
          <TableHead className="text-right">Plazo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Desembolso</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {prestamos.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <Link href={`/prestamos/${p.id}`} className="font-medium hover:underline">
                {p.cliente.nombreCompleto}
              </Link>
            </TableCell>
            <TableCell className="text-zinc-600">{p.sistema}</TableCell>
            <TableCell className="text-right">{formatCOP(p.montoCentavos)}</TableCell>
            <TableCell className="text-right">
              {formatPorcentaje(Number(p.tasaValor))} {p.tipoTasa}
            </TableCell>
            <TableCell className="text-right">{p.plazo}</TableCell>
            <TableCell>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[p.estado]}`}
              >
                {p.estado}
              </span>
            </TableCell>
            <TableCell className="text-right text-zinc-500">
              {formatFecha(p.fechaDesembolso)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 2: Crear app/(dashboard)/prestamos/page.tsx**

```typescript
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
```

- [ ] **Step 3: Verificar typecheck**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "feat: lista de préstamos con filtro por estado"
```

---

## Task 10: Préstamos — nuevo préstamo con simulador (2 pasos)

**Files:**
- Create: `components/prestamos/prestamo-form.tsx`
- Create: `app/(dashboard)/prestamos/nuevo/page.tsx`

- [ ] **Step 1: Crear components/prestamos/prestamo-form.tsx**

```typescript
// components/prestamos/prestamo-form.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreatePrestamoSchema, type CreatePrestamoInput } from '@/lib/validaciones/prestamo.schema'
import { simularPrestamo } from '@/lib/financiero/motor'
import { convertirTasaPeriodica } from '@/lib/financiero/tasas'
import { formatCOP, formatPorcentaje } from '@/lib/format'
import type { ResultadoSimulacion } from '@/lib/financiero/motor'

export function PrestamoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paso, setPaso] = useState<1 | 2>(1)
  const [simulacion, setSimulacion] = useState<ResultadoSimulacion | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreatePrestamoInput>({
    resolver: zodResolver(CreatePrestamoSchema),
    defaultValues: {
      clienteId: searchParams.get('clienteId') ?? '',
      sistema: 'TRADICIONAL',
      tipoTasa: 'ANUAL',
      frecuencia: 'MENSUAL',
      tipoGracia: 'NINGUNO',
      periodosGracia: 0,
      seguro: 0,
      fechaDesembolso: new Date().toISOString().slice(0, 10),
    },
  })

  function calcularSimulacion(data: CreatePrestamoInput): ResultadoSimulacion {
    const frecLower = data.frecuencia.toLowerCase() as 'mensual' | 'quincenal' | 'semanal'
    const tipoTasaLower = data.tipoTasa.toLowerCase() as 'anual' | 'mensual'
    const sistemaLower = data.sistema.toLowerCase() as 'tradicional' | 'pagadiario' | 'fijo'

    const tasaPeriodica =
      sistemaLower === 'fijo'
        ? data.tasaValor / 100
        : convertirTasaPeriodica(data.tasaValor, tipoTasaLower, frecLower)

    return simularPrestamo({
      monto: data.monto,
      totalPeriodos: data.plazo,
      tasaPeriodica,
      tipoCuota: 'auto',
      cuotaManual: 0,
      tipoGracia: (data.tipoGracia?.toLowerCase() ?? 'ninguno') as 'ninguno' | 'parcial' | 'total',
      periodosGracia: data.periodosGracia ?? 0,
      abonosExtra: {},
      sistema: sistemaLower,
      seguro: data.seguro ?? 0,
    })
  }

  function onSiguiente(data: CreatePrestamoInput) {
    const sim = calcularSimulacion(data)
    setSimulacion(sim)
    setPaso(2)
  }

  async function onConfirmar(data: CreatePrestamoInput) {
    setSubmitting(true)
    const res = await fetch('/api/prestamos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSubmitting(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? 'Error al crear préstamo')
      return
    }
    const saved = await res.json()
    toast.success('Préstamo desembolsado correctamente')
    router.push(`/prestamos/${saved.id}`)
    router.refresh()
  }

  if (paso === 2 && simulacion) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setPaso(1)}>← Volver</Button>
          <h2 className="text-lg font-semibold">Paso 2 — Tabla de amortización</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div className="bg-zinc-50 rounded p-3">
            <p className="text-zinc-500">Cuota</p>
            <p className="font-bold">{formatCOP(simulacion.cuotaAplicada * 100)}</p>
          </div>
          <div className="bg-zinc-50 rounded p-3">
            <p className="text-zinc-500">Total a pagar</p>
            <p className="font-bold">{formatCOP(simulacion.totalPagado * 100)}</p>
          </div>
          <div className="bg-zinc-50 rounded p-3">
            <p className="text-zinc-500">Total interés</p>
            <p className="font-bold">{formatCOP(simulacion.totalInteres * 100)}</p>
          </div>
          <div className="bg-zinc-50 rounded p-3">
            <p className="text-zinc-500">Periodos</p>
            <p className="font-bold">{simulacion.periodosTotales}</p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white border-b">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-right">Cuota</th>
                <th className="px-3 py-2 text-right">Capital</th>
                <th className="px-3 py-2 text-right">Interés</th>
                <th className="px-3 py-2 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {simulacion.lineas.map((l) => (
                <tr key={l.num} className={l.esGracia ? 'bg-yellow-50' : 'even:bg-zinc-50'}>
                  <td className="px-3 py-1">{l.num}</td>
                  <td className="px-3 py-1 text-right">{formatCOP(l.pagoMensual * 100)}</td>
                  <td className="px-3 py-1 text-right">{formatCOP(l.abonoCapitalBase * 100)}</td>
                  <td className="px-3 py-1 text-right">{formatCOP(l.interes * 100)}</td>
                  <td className="px-3 py-1 text-right">{formatCOP(l.saldoRestante * 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleSubmit(onConfirmar)}>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Desembolsando…' : 'Confirmar y desembolsar'}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSiguiente)} className="space-y-4">
      <h2 className="text-lg font-semibold">Paso 1 — Parámetros del préstamo</h2>

      <div className="space-y-2">
        <Label htmlFor="clienteId">ID del cliente *</Label>
        <Input id="clienteId" {...register('clienteId')} placeholder="cuid del cliente" />
        {errors.clienteId && <p className="text-xs text-red-600">{errors.clienteId.message}</p>}
        <p className="text-xs text-zinc-500">Copia el ID desde la página de detalle del cliente.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sistema *</Label>
          <Select
            defaultValue="TRADICIONAL"
            onValueChange={(v) => setValue('sistema', v as CreatePrestamoInput['sistema'])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TRADICIONAL">Tradicional (francés)</SelectItem>
              <SelectItem value="PAGADIARIO">Pagadiario (plano)</SelectItem>
              <SelectItem value="FIJO">Fijo (global)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Frecuencia *</Label>
          <Select
            defaultValue="MENSUAL"
            onValueChange={(v) => setValue('frecuencia', v as CreatePrestamoInput['frecuencia'])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MENSUAL">Mensual</SelectItem>
              <SelectItem value="QUINCENAL">Quincenal</SelectItem>
              <SelectItem value="SEMANAL">Semanal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monto">Monto (pesos) *</Label>
          <Input id="monto" type="number" step="1000" {...register('monto', { valueAsNumber: true })} />
          {errors.monto && <p className="text-xs text-red-600">{errors.monto.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="plazo">Plazo (periodos) *</Label>
          <Input id="plazo" type="number" {...register('plazo', { valueAsNumber: true })} />
          {errors.plazo && <p className="text-xs text-red-600">{errors.plazo.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tasaValor">Tasa (%) *</Label>
          <Input id="tasaValor" type="number" step="0.01" {...register('tasaValor', { valueAsNumber: true })} />
          {errors.tasaValor && <p className="text-xs text-red-600">{errors.tasaValor.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Tipo de tasa *</Label>
          <Select
            defaultValue="ANUAL"
            onValueChange={(v) => setValue('tipoTasa', v as CreatePrestamoInput['tipoTasa'])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ANUAL">Anual</SelectItem>
              <SelectItem value="MENSUAL">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de gracia</Label>
          <Select
            defaultValue="NINGUNO"
            onValueChange={(v) => setValue('tipoGracia', v as CreatePrestamoInput['tipoGracia'])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NINGUNO">Ninguno</SelectItem>
              <SelectItem value="PARCIAL">Parcial</SelectItem>
              <SelectItem value="TOTAL">Total</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="periodosGracia">Periodos de gracia</Label>
          <Input id="periodosGracia" type="number" {...register('periodosGracia', { valueAsNumber: true })} defaultValue={0} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="seguro">Seguro por periodo (pesos)</Label>
          <Input id="seguro" type="number" step="1000" {...register('seguro', { valueAsNumber: true })} defaultValue={0} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fechaDesembolso">Fecha desembolso *</Label>
          <Input id="fechaDesembolso" type="date" {...register('fechaDesembolso')} />
          {errors.fechaDesembolso && <p className="text-xs text-red-600">{errors.fechaDesembolso.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full">Ver simulación →</Button>
    </form>
  )
}
```

- [ ] **Step 2: Crear app/(dashboard)/prestamos/nuevo/page.tsx**

```typescript
// app/(dashboard)/prestamos/nuevo/page.tsx
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
```

**Nota:** `PrestamoForm` usa `useSearchParams()` que requiere `<Suspense>` en Next.js 14.

- [ ] **Step 3: Verificar typecheck**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "feat: formulario nuevo préstamo con simulador de amortización"
```

---

## Task 11: Préstamos — detalle, tabla de cuotas y registrar pago

**Files:**
- Create: `components/prestamos/cuotas-table.tsx`
- Create: `components/prestamos/pago-form.tsx`
- Create: `app/(dashboard)/prestamos/[id]/page.tsx`

- [ ] **Step 1: Crear components/prestamos/cuotas-table.tsx**

```typescript
// components/prestamos/cuotas-table.tsx
import { formatCOP, formatFecha } from '@/lib/format'
import type { Cuota, Pago } from '@prisma/client'

type CuotaConPagos = Cuota & { pagos: Pick<Pago, 'id' | 'eliminadoEn'>[] }

export function CuotasTable({ cuotas }: { cuotas: CuotaConPagos[] }) {
  const hoy = new Date()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-zinc-500">
            <th className="pb-2 font-medium">#</th>
            <th className="pb-2 font-medium">Vencimiento</th>
            <th className="pb-2 font-medium text-right">Capital</th>
            <th className="pb-2 font-medium text-right">Interés</th>
            <th className="pb-2 font-medium text-right">Total</th>
            <th className="pb-2 font-medium text-right">Saldo</th>
            <th className="pb-2 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {cuotas.map((c) => {
            const pagada = c.pagos.some((p) => !p.eliminadoEn)
            const vencida = !pagada && c.fechaVencimiento < hoy
            return (
              <tr key={c.id} className={c.esGracia ? 'bg-yellow-50' : 'even:bg-zinc-50'}>
                <td className="py-1.5 px-1">{c.numero}</td>
                <td className="py-1.5">{formatFecha(c.fechaVencimiento)}</td>
                <td className="py-1.5 text-right">{formatCOP(c.capitalCentavos)}</td>
                <td className="py-1.5 text-right">{formatCOP(c.interesCentavos)}</td>
                <td className="py-1.5 text-right font-medium">{formatCOP(c.totalCentavos)}</td>
                <td className="py-1.5 text-right text-zinc-500">{formatCOP(c.saldoCentavos)}</td>
                <td className="py-1.5">
                  {pagada ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Pagada
                    </span>
                  ) : vencida ? (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      Mora
                    </span>
                  ) : (
                    <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                      Pendiente
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Crear components/prestamos/pago-form.tsx**

```typescript
// components/prestamos/pago-form.tsx
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
```

- [ ] **Step 3: Crear app/(dashboard)/prestamos/[id]/page.tsx**

```typescript
// app/(dashboard)/prestamos/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCOP, formatFecha, formatPorcentaje } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CuotasTable } from '@/components/prestamos/cuotas-table'
import { PagoForm } from '@/components/prestamos/pago-form'
import { Separator } from '@/components/ui/separator'

const estadoColor: Record<string, string> = {
  ACTIVO: 'bg-green-100 text-green-700',
  AL_DIA: 'bg-blue-100 text-blue-700',
  MORA: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-zinc-100 text-zinc-600',
  CASTIGADO: 'bg-orange-100 text-orange-700',
}

export default async function PrestamoDetallePage({
  params,
}: {
  params: { id: string }
}) {
  const prestamo = await prisma.prestamo.findFirst({
    where: { id: params.id, eliminadoEn: null },
    include: {
      cliente: true,
      asesor: { select: { nombre: true } },
      cuotas: {
        orderBy: { numero: 'asc' },
        include: { pagos: { select: { id: true, eliminadoEn: true } } },
      },
      pagos: {
        where: { eliminadoEn: null },
        orderBy: { fechaPago: 'desc' },
        include: { registradoPor: { select: { nombre: true } } },
      },
    },
  })

  if (!prestamo) notFound()

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Préstamo —{' '}
            <Link href={`/clientes/${prestamo.clienteId}`} className="hover:underline">
              {prestamo.cliente.nombreCompleto}
            </Link>
          </h1>
          <p className="text-zinc-500 text-sm">{prestamo.sistema} · {prestamo.frecuencia}</p>
        </div>
        <span
          className={`text-sm px-3 py-1 rounded-full font-medium ${estadoColor[prestamo.estado] ?? ''}`}
        >
          {prestamo.estado}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        {[
          { label: 'Monto', value: formatCOP(prestamo.montoCentavos) },
          { label: 'Tasa', value: `${formatPorcentaje(Number(prestamo.tasaValor))} ${prestamo.tipoTasa}` },
          { label: 'Plazo', value: `${prestamo.plazo} periodos` },
          { label: 'Desembolso', value: formatFecha(prestamo.fechaDesembolso) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-50 rounded p-3">
            <p className="text-zinc-500">{label}</p>
            <p className="font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Tabla de cuotas ({prestamo.cuotas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CuotasTable cuotas={prestamo.cuotas} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registrar pago</CardTitle>
            </CardHeader>
            <CardContent>
              <PagoForm prestamoId={prestamo.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Pagos registrados ({prestamo.pagos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prestamo.pagos.length === 0 ? (
                <p className="text-sm text-zinc-500">Sin pagos aún.</p>
              ) : (
                prestamo.pagos.map((p) => (
                  <div key={p.id} className="text-sm border-b pb-2 last:border-0">
                    <div className="flex justify-between">
                      <span className="font-medium">{formatCOP(p.montoCentavos)}</span>
                      <span className="text-zinc-500">{formatFecha(p.fechaPago)}</span>
                    </div>
                    <p className="text-zinc-500 text-xs">
                      {p.tipoPago} · {p.registradoPor.nombre}
                    </p>
                    {p.notas && <p className="text-zinc-400 text-xs italic">{p.notas}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verificar typecheck**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: detalle de préstamo con cuotas y registro de pagos"
```

---

## Task 12: Pagos — historial

**Files:**
- Create: `app/(dashboard)/pagos/page.tsx`

- [ ] **Step 1: Crear app/(dashboard)/pagos/page.tsx**

```typescript
// app/(dashboard)/pagos/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCOP, formatFecha } from '@/lib/format'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function PagosPage({
  searchParams,
}: {
  searchParams: { mes?: string; anio?: string }
}) {
  const hoy = new Date()
  const mes = Number(searchParams.mes ?? hoy.getMonth() + 1)
  const anio = Number(searchParams.anio ?? hoy.getFullYear())

  const desde = new Date(anio, mes - 1, 1)
  const hasta = new Date(anio, mes, 1)

  const pagos = await prisma.pago.findMany({
    where: {
      eliminadoEn: null,
      fechaPago: { gte: desde, lt: hasta },
    },
    orderBy: { fechaPago: 'desc' },
    include: {
      prestamo: { include: { cliente: true } },
      registradoPor: { select: { nombre: true } },
    },
  })

  const total = pagos.reduce((s, p) => s + p.montoCentavos, 0)

  const meses = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pagos</h1>
        <p className="text-sm text-zinc-500">
          Total: <span className="font-semibold text-zinc-900">{formatCOP(total)}</span>
        </p>
      </div>

      <form className="flex gap-2">
        <select name="mes" defaultValue={mes} className="border rounded px-2 py-1 text-sm">
          {meses.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <select name="anio" defaultValue={anio} className="border rounded px-2 py-1 text-sm">
          {[anio - 1, anio, anio + 1].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button type="submit" className="border rounded px-3 py-1 text-sm hover:bg-zinc-50">
          Filtrar
        </button>
      </form>

      {pagos.length === 0 ? (
        <p className="text-sm text-zinc-500 py-8 text-center">
          Sin pagos en {meses[mes - 1]} {anio}.
        </p>
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
                <TableCell>
                  <Link
                    href={`/prestamos/${p.prestamoId}`}
                    className="hover:underline font-medium"
                  >
                    {p.prestamo.cliente.nombreCompleto}
                  </Link>
                </TableCell>
                <TableCell className="text-zinc-600">{p.tipoPago}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCOP(p.montoCentavos)}
                </TableCell>
                <TableCell className="text-zinc-500">{p.registradoPor.nombre}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar typecheck**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat: historial de pagos con filtro por mes"
```

---

## Task 13: Perfil

**Files:**
- Create: `app/(dashboard)/perfil/page.tsx`

- [ ] **Step 1: Crear app/(dashboard)/perfil/page.tsx**

```typescript
// app/(dashboard)/perfil/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SignOutButton } from './_sign-out-button'
import type { Rol } from '@prisma/client'

export default async function PerfilPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const rol = (session.user as { rol?: Rol }).rol

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Mi perfil</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de sesión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-zinc-500">Nombre</p>
            <p className="font-medium">{session.user?.name}</p>
          </div>
          <div>
            <p className="text-zinc-500">Email</p>
            <p>{session.user?.email}</p>
          </div>
          <div>
            <p className="text-zinc-500">Rol</p>
            <p className="font-medium">{rol}</p>
          </div>
        </CardContent>
      </Card>
      <SignOutButton />
    </div>
  )
}
```

- [ ] **Step 2: Crear app/(dashboard)/perfil/_sign-out-button.tsx**

```typescript
// app/(dashboard)/perfil/_sign-out-button.tsx
'use client'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => signOut({ callbackUrl: '/login' })}
    >
      Cerrar sesión
    </Button>
  )
}
```

- [ ] **Step 3: Verificar typecheck**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "feat: página de perfil"
```

---

## Task 14: Restricciones de rol en UI

Ocultar botones de acción según `session.user.rol`. El backend rechaza llamadas no autorizadas como segunda línea de defensa.

| Acción | Roles permitidos |
|---|---|
| Crear/editar cliente | ADMIN, ASESOR |
| Crear préstamo | ADMIN, ASESOR |
| Registrar pago | ADMIN, ASESOR, COBRANZA |
| Botón "Anular pago" | ADMIN |

**Files:**
- Modify: `app/(dashboard)/clientes/page.tsx`
- Modify: `app/(dashboard)/clientes/[id]/page.tsx`
- Modify: `app/(dashboard)/prestamos/page.tsx`
- Modify: `app/(dashboard)/prestamos/[id]/page.tsx`

- [ ] **Step 1: Modificar app/(dashboard)/clientes/page.tsx — ocultar "Nuevo cliente" para roles sin permiso**

Añadir al inicio de la función `ClientesPage`:
```typescript
import { auth } from '@/lib/auth'
import type { Rol } from '@prisma/client'
// ...dentro de ClientesPage:
const session = await auth()
const rol = (session?.user as { rol?: Rol })?.rol
const puedeCrear = rol === 'ADMIN' || rol === 'ASESOR'
```

Y cambiar el botón:
```typescript
{puedeCrear && (
  <Button asChild>
    <Link href="/clientes/nuevo">Nuevo cliente</Link>
  </Button>
)}
```

- [ ] **Step 2: Modificar app/(dashboard)/clientes/[id]/page.tsx — ocultar "Editar" y "Nuevo préstamo"**

Añadir al inicio de `ClienteDetallePage` (después del `findFirst`):
```typescript
const session = await auth()
const rol = (session?.user as { rol?: Rol })?.rol
const puedeEditar = rol === 'ADMIN' || rol === 'ASESOR'
```

Envolver el botón "Editar" con `{puedeEditar && <Dialog>...</Dialog>}` y el botón "Nuevo préstamo" con `{puedeEditar && <Button asChild>...</Button>}`.

- [ ] **Step 3: Modificar app/(dashboard)/prestamos/page.tsx — ocultar "Nuevo préstamo"**

Mismo patrón:
```typescript
const session = await auth()
const rol = (session?.user as { rol?: Rol })?.rol
const puedeCrear = rol === 'ADMIN' || rol === 'ASESOR'
// ...
{puedeCrear && <Button asChild><Link href="/prestamos/nuevo">Nuevo préstamo</Link></Button>}
```

- [ ] **Step 4: Modificar app/(dashboard)/prestamos/[id]/page.tsx — ocultar PagoForm para READONLY**

Añadir al inicio (después del `findFirst`):
```typescript
const session = await auth()
const rol = (session?.user as { rol?: Rol })?.rol
const puedeRegistrarPago = rol === 'ADMIN' || rol === 'ASESOR' || rol === 'COBRANZA'
```

Envolver `<PagoForm>` con `{puedeRegistrarPago && <Card>...<PagoForm /></Card>}`.

- [ ] **Step 5: Verificar typecheck**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: restricciones de rol en botones de acción"
```

---

## Task 15: Verificación final

- [ ] **Step 1: Typecheck completo**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 2: Tests financieros (no deben haber regresionado)**

```powershell
npx jest --no-coverage
```

Esperado: 34/34 passing.

- [ ] **Step 3: Build de producción**

```powershell
npm run build
```

Esperado: compilación exitosa. Revisar warnings pero no deben haber errores.

- [ ] **Step 4: Push de la rama**

```powershell
git push -u origin fase-3-frontend
```

- [ ] **Step 5: Commit final si hay cambios residuales**

```powershell
git status
# Si hay cambios: git add -A && git commit -m "fix: ajustes post-verificación"
```

---

> **Nota de implementación:** `simularPrestamo` y `convertirTasaPeriodica` son funciones puras sin dependencias de servidor — pueden importarse libremente en Client Components (`"use client"`). El parámetro `clienteId` en `PrestamoForm` se pre-rellena desde `?clienteId=` en la URL (el botón "Nuevo préstamo" en la página de detalle del cliente lo incluye automáticamente).
