# Fase 3 — Frontend Design Spec

**Fecha:** 2026-06-21  
**Rama:** fase-3-frontend (a crear)  
**Aprobado por:** Daniel

---

## Objetivo

Construir el frontend completo de la plataforma de gestión de préstamos sobre el backend de Fase 2 ya operativo. Prioridad: Dashboard, Clientes y Préstamos. Completar con Pagos, Cobranza y Perfil.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 App Router (ya instalado) |
| UI | Tailwind CSS + shadcn/ui |
| Formularios | react-hook-form + @hookform/resolvers + zod |
| Íconos | lucide-react (viene con shadcn/ui) |
| Feedback | sonner (toast) |
| Auth | Auth.js v5 (ya configurado) |

**No se añaden:** charts, date-pickers externos, tablas virtualizadas, SWR, React Query.

---

## Arquitectura

### Patrón de datos

- **Lectura:** Server Components llaman a `prisma` directamente (sin HTTP). Rápido, sin overhead de red.
- **Escritura:** Client Components llaman a las API Routes existentes (`/api/clientes`, `/api/prestamos`, `/api/pagos`) con `fetch`. Tras éxito, `router.refresh()` invalida el caché del servidor.
- **Autenticación:** `auth()` de Auth.js en el layout de `(dashboard)` — redirige a `/login` si no hay sesión.

### Flujo de mutación

```
Formulario (Client Component)
  → fetch POST/PUT/DELETE a /api/*
  → respuesta ok → router.refresh()
  → Next.js re-ejecuta Server Components
  → datos actualizados sin recarga de página
```

---

## Estructura de rutas

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx              ← página pública de login
└── (dashboard)/
    ├── layout.tsx                 ← guard auth + sidebar + topbar
    ├── page.tsx                   ← dashboard (KPIs + cuotas próximas)
    ├── clientes/
    │   ├── page.tsx               ← lista de clientes con búsqueda
    │   ├── nuevo/
    │   │   └── page.tsx           ← formulario crear cliente
    │   └── [id]/
    │       └── page.tsx           ← detalle cliente + sus préstamos
    ├── prestamos/
    │   ├── page.tsx               ← lista de préstamos con filtro estado
    │   ├── nuevo/
    │   │   └── page.tsx           ← simulador + formulario desembolso
    │   └── [id]/
    │       └── page.tsx           ← detalle + cuotas + registrar pago
    ├── pagos/
    │   └── page.tsx               ← historial de pagos
    └── perfil/
        └── page.tsx               ← datos del usuario en sesión
```

Los route groups `(auth)` y `(dashboard)` no aparecen en la URL.

---

## Estructura de componentes

```
components/
├── layout/
│   ├── sidebar.tsx               ← "use client" — estado colapso + pathname activo
│   ├── topbar.tsx                ← nombre usuario + rol + botón logout
│   └── providers.tsx             ← SessionProvider de Auth.js
├── clientes/
│   ├── clientes-table.tsx        ← Server Component — tabla con búsqueda por searchParams
│   └── cliente-form.tsx          ← "use client" — react-hook-form + zod
├── prestamos/
│   ├── prestamos-table.tsx       ← Server Component — tabla con filtro estado
│   ├── prestamo-form.tsx         ← "use client" — 2 pasos: params + simulador preview
│   ├── cuotas-table.tsx          ← Server Component — tabla de cuotas del préstamo
│   └── pago-form.tsx             ← "use client" — registrar pago
└── dashboard/
    ├── kpi-cards.tsx             ← Server Component — 4 tarjetas KPI
    └── cuotas-proximas.tsx       ← Server Component — tabla cuotas a vencer esta semana
```

---

## Diseño de módulos

### Login (`/login`)

- Formulario: email + contraseña
- Llama a `signIn("credentials", ...)` de Auth.js
- Error inline si credenciales incorrectas
- Redirect a `/` tras éxito

### Dashboard (`/`)

**KPIs (4 tarjetas):**

| Tarjeta | Cálculo |
|---|---|
| Cartera activa | `SUM(montoCentavos)` de préstamos con `estado = ACTIVO` |
| Préstamos activos | `COUNT` de préstamos con `estado = ACTIVO` |
| Recaudado este mes | `SUM(montoCentavos)` de pagos con `fechaPago` en el mes actual |
| Cuotas en mora | `COUNT` de cuotas con `fechaVencimiento < hoy` y `estado = PENDIENTE` |

**Tabla "Cuotas por vencer (7 días)":** fecha vencimiento, cliente, monto cuota, días restantes. Ordenada por fecha ascendente.

---

### Clientes (`/clientes`)

**Lista:**
- Tabla columnas: Nombre completo, Documento, Teléfono, Préstamos activos, Fecha registro
- Búsqueda por nombre o documento vía `?q=` en URL (filtro en Server Component con `searchParams`)
- Botón "Nuevo cliente" → `/clientes/nuevo`
- Cada fila clickeable → `/clientes/[id]`

**Crear (`/clientes/nuevo`):**
- Formulario: Nombre completo, Documento, Teléfono, Email, Dirección
- Validación client-side con zod (reutiliza `CreateClienteSchema` de Fase 2)
- Submit → `POST /api/clientes` → redirect a `/clientes/[id]` del nuevo cliente

**Detalle (`/clientes/[id]`):**
- Tarjeta con datos del cliente + botón "Editar" (abre modal)
- Tabla de préstamos del cliente: sistema, monto, plazo, cuotas pagadas/total, estado
- Modal edición: mismo formulario, submit → `PUT /api/clientes/[id]` → `router.refresh()`

---

### Préstamos (`/prestamos`)

**Lista:**
- Tabla columnas: Cliente, Sistema, Monto, Tasa, Plazo, Estado, Fecha desembolso
- Filtro por estado vía `?estado=` en URL (ACTIVO / CANCELADO / EN_MORA)
- Botón "Nuevo préstamo" → `/prestamos/nuevo`
- Cada fila clickeable → `/prestamos/[id]`

**Nuevo préstamo (`/prestamos/nuevo`) — 2 pasos:**

*Paso 1 — Parámetros:*
- Búsqueda y selección de cliente (input con debounce, llama a `/api/clientes?q=...`)
- Sistema (TRADICIONAL / PAGADIARIO / FIJO)
- Monto, Tasa, Tipo de tasa (ANUAL/MENSUAL), Frecuencia, Plazo
- Tipo de gracia, Periodos de gracia, Seguro, Fecha desembolso

*Paso 2 — Simulación:*
- Al completar Paso 1, llama a `simularPrestamo()` importado directamente (función pura, corre en cliente)
- Muestra tabla de amortización completa (misma lógica que `index_1.html`)
- Totales: total a pagar, total interés, total seguro, CEA
- Botón "Confirmar y desembolsar" → `POST /api/prestamos` → redirect a `/prestamos/[id]`

**Detalle (`/prestamos/[id]`):**
- Encabezado: datos del préstamo (cliente, monto, tasa, estado)
- Tabla de cuotas: núm, fecha vencimiento, capital, interés, seguro, total, estado pago
- Sección "Registrar pago": formulario (monto, fecha, cuota asociada opcional, notas) → `POST /api/pagos`
- Lista de pagos registrados con opción de anular (soft delete, solo ADMIN)

---

### Pagos (`/pagos`)

- Tabla historial: fecha, préstamo, cliente, monto, tipo, registrado por
- Filtro por fecha (mes/año via `searchParams`)

---

### Perfil (`/perfil`)

- Nombre, email, rol (solo lectura)
- Botón "Cerrar sesión"

---

## shadcn/ui — componentes a instalar

```bash
npx shadcn@latest add button input label table dialog select textarea badge card sidebar breadcrumb sonner
```

---

## Convenciones

- Server Components no llevan `"use client"` — es el default en App Router
- Client Components siempre tienen `"use client"` como primera línea
- Nombres de archivos en kebab-case
- Los montos se muestran dividiendo centavos ÷ 100, formateados con `Intl.NumberFormat` en COP
- Estados de préstamo se muestran con `<Badge>` con color por estado:
  - ACTIVO → verde
  - EN_MORA → rojo
  - CANCELADO → gris

---

## Restricciones de rol en UI

| Acción | Roles permitidos |
|---|---|
| Ver cualquier página | ADMIN, ASESOR, COBRANZA, READONLY |
| Crear cliente / préstamo | ADMIN, ASESOR |
| Registrar pago | ADMIN, ASESOR, COBRANZA |
| Anular pago (soft delete) | ADMIN |
| Editar cliente | ADMIN, ASESOR |

Los botones de acción no permitidos se ocultan según `session.user.rol`. El backend ya rechaza las llamadas no autorizadas como segunda línea de defensa.

---

## Lo que NO está en esta fase

- Reportes Excel/PDF/CSV (Fase 4)
- Módulo de cobranza avanzada (asignación de cartera, notificaciones)
- Gráficos de cartera
- Vista móvil
