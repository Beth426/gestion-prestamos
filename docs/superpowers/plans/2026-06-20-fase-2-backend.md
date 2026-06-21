# Fase 2 — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el backend completo: Next.js + Prisma + Neon, lógica financiera migrada con tests de equivalencia numérica, Auth.js con RBAC, y API REST para clientes, préstamos y pagos.

**Architecture:** Next.js 14 App Router como monolito full-stack; Route Handlers para la API REST; Prisma como ORM con PostgreSQL hospedado en Neon; Auth.js v5 con Credentials provider y tabla de sesiones en BD. Todos los montos se almacenan en centavos (Int); las tasas como Decimal(18,8).

**Tech Stack:** Next.js 14, TypeScript, Prisma 5, Neon (PostgreSQL), Auth.js v5, Jest + ts-jest, Zod (validación), bcryptjs

---

## Mapa de archivos

```
/
├── prisma/
│   └── schema.prisma               # esquema completo de BD
├── lib/
│   ├── prisma.ts                   # singleton del cliente Prisma
│   ├── auth.ts                     # config Auth.js
│   ├── financiero/
│   │   ├── fechas.ts               # parseLocalDate, addMonths, addPeriods, formatDate
│   │   ├── tasas.ts                # calcularCuotaFrancesa, convertirTasaPeriodica
│   │   ├── motor.ts                # simularPrestamo (motor principal)
│   │   └── cea.ts                  # tasaEfectivaAnual (TIR por bisección)
│   └── validaciones/
│       ├── cliente.schema.ts       # Zod schemas para Cliente
│       └── prestamo.schema.ts      # Zod schemas para Préstamo
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   │   └── route.ts            # handler Auth.js
│   │   ├── clientes/
│   │   │   ├── route.ts            # GET (list), POST (create)
│   │   │   └── [id]/route.ts       # GET, PUT, DELETE (soft)
│   │   ├── prestamos/
│   │   │   ├── route.ts            # GET (list), POST (create + genera cuotas)
│   │   │   └── [id]/route.ts       # GET, PUT, DELETE (soft)
│   │   └── pagos/
│   │       ├── route.ts            # POST (registrar pago)
│   │       └── [id]/route.ts       # DELETE (soft)
│   └── layout.tsx                  # root layout con SessionProvider
├── __tests__/
│   ├── financiero/
│   │   ├── tasas.test.ts
│   │   ├── fechas.test.ts
│   │   ├── motor.test.ts
│   │   └── cea.test.ts
│   └── api/
│       └── clientes.test.ts        # tests de integración (opcional Fase 2)
├── .env.example
├── .env                            # NO versionado
├── jest.config.ts
└── tsconfig.json
```

---

## Task 1: Git init + Next.js scaffold

**Files:**
- Create: `.gitignore`
- Create: `package.json` (generado por create-next-app)
- Create: `.env.example`

- [ ] **Step 1: Inicializar git y crear rama de fase**

```powershell
cd "C:\Users\danie\OneDrive\Desktop\proyecto de prrestamos"
git init
git add CLAUDE.md index_1.html
git commit -m "docs: punto de partida — simulador HTML + CLAUDE.md"
git checkout -b fase-2-backend
```

- [ ] **Step 2: Crear el proyecto Next.js en el directorio actual**

```powershell
npx create-next-app@14 . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

Cuando pregunte si deseas continuar en el directorio existente: **Y**. Opciones adicionales: sin `--turbo`, sin `--experimental-app` (App Router ya está en stable en v14).

- [ ] **Step 3: Verificar que el proyecto arranca**

```powershell
npm run dev
```

Abrir `http://localhost:3000`. Debe mostrar la página por defecto de Next.js. Ctrl+C para parar.

- [ ] **Step 4: Crear .env.example**

Crear archivo `.env.example` con este contenido exacto:

```env
# Base de datos (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Auth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-con: openssl rand -base64 32"
```

- [ ] **Step 5: Crear .env local (NO commitear)**

Copiar `.env.example` a `.env` y rellenar con las credenciales reales de Neon y un secret generado.

Para el secret:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Verificar que `.env` está en `.gitignore` (create-next-app lo añade por defecto). Si no está:
```
echo ".env" >> .gitignore
```

- [ ] **Step 6: Commit del scaffold**

```powershell
git add -A
git commit -m "feat: scaffold Next.js 14 + TypeScript + Tailwind"
```

---

## Task 2: Prisma + esquema de BD

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`

- [ ] **Step 1: Instalar Prisma**

```powershell
npm install prisma @prisma/client
npx prisma init --datasource-provider postgresql
```

Esto crea `prisma/schema.prisma` y añade `DATABASE_URL` al `.env`.

- [ ] **Step 2: Reemplazar schema.prisma con el esquema completo**

Reemplazar el contenido de `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL")
}

model Usuario {
  id           String    @id @default(cuid())
  email        String    @unique
  nombre       String
  rol          Rol       @default(ASESOR)
  passwordHash String?
  creadoEn     DateTime  @default(now())
  eliminadoEn  DateTime?

  prestamos Prestamo[]
  auditLogs AuditLog[]
  sesiones  Session[]
}

enum Rol {
  ADMIN
  ASESOR
  COBRANZA
  READONLY
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  usuarioId    String
  expires      DateTime
  usuario      Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Cliente {
  id             String    @id @default(cuid())
  nombreCompleto String
  documento      String    @unique
  telefono       String?
  email          String?
  direccion      String?
  creadoEn       DateTime  @default(now())
  actualizadoEn  DateTime  @updatedAt
  eliminadoEn    DateTime?

  prestamos Prestamo[]
}

model Prestamo {
  id              String         @id @default(cuid())
  clienteId       String
  asesorId        String
  sistema         SistemaCredito
  estado          EstadoPrestamo @default(ACTIVO)
  montoCentavos   Int
  tasaValor       Decimal        @db.Decimal(18, 8)
  tipoTasa        TipoTasa
  frecuencia      Frecuencia
  plazo           Int
  tipoGracia      TipoGracia     @default(NINGUNO)
  periodosGracia  Int            @default(0)
  seguroCentavos  Int            @default(0)
  fechaDesembolso DateTime
  creadoEn        DateTime       @default(now())
  actualizadoEn   DateTime       @updatedAt
  eliminadoEn     DateTime?

  cliente   Cliente    @relation(fields: [clienteId], references: [id])
  asesor    Usuario    @relation(fields: [asesorId], references: [id])
  cuotas    Cuota[]
  pagos     Pago[]
  auditLogs AuditLog[]
}

enum SistemaCredito {
  TRADICIONAL
  PAGADIARIO
  FIJO
}

enum EstadoPrestamo {
  ACTIVO
  AL_DIA
  MORA
  CANCELADO
  CASTIGADO
}

enum TipoTasa {
  ANUAL
  MENSUAL
}

enum Frecuencia {
  MENSUAL
  QUINCENAL
  SEMANAL
}

enum TipoGracia {
  NINGUNO
  PARCIAL
  TOTAL
}

model Cuota {
  id               String   @id @default(cuid())
  prestamoId       String
  numero           Int
  fechaVencimiento DateTime
  capitalCentavos  Int
  interesCentavos  Int
  seguroCentavos   Int      @default(0)
  totalCentavos    Int
  saldoCentavos    Int
  esGracia         Boolean  @default(false)

  prestamo Prestamo @relation(fields: [prestamoId], references: [id])
  pagos    Pago[]
}

model Pago {
  id              String    @id @default(cuid())
  prestamoId      String
  cuotaId         String?
  montoCentavos   Int
  fechaPago       DateTime
  tipoPago        TipoPago  @default(CUOTA)
  notas           String?
  registradoPorId String
  creadoEn        DateTime  @default(now())
  eliminadoEn     DateTime?

  prestamo Prestamo @relation(fields: [prestamoId], references: [id])
  cuota    Cuota?   @relation(fields: [cuotaId], references: [id])
}

enum TipoPago {
  CUOTA
  ABONO_EXTRA
  AJUSTE
  CASTIGO
}

model AuditLog {
  id           String   @id @default(cuid())
  entidad      String
  entidadId    String
  accion       String
  usuarioId    String
  valorAntes   Json?
  valorDespues Json?
  creadoEn     DateTime @default(now())

  usuario  Usuario  @relation(fields: [usuarioId], references: [id])
  prestamo Prestamo? @relation(fields: [entidadId], references: [id], map: "audit_prestamo")
}
```

- [ ] **Step 3: Ejecutar la migración**

```powershell
npx prisma migrate dev --name init
```

Esperado: migración creada y aplicada. Si falla por `DATABASE_URL` vacía, verificar `.env`.

- [ ] **Step 4: Crear el singleton de Prisma**

Crear `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 5: Verificar que Prisma genera los tipos correctamente**

```powershell
npx prisma generate
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 6: Commit**

```powershell
git add prisma/ lib/prisma.ts .env.example
git commit -m "feat: esquema Prisma completo + migración init + singleton"
```

---

## Task 3: Configurar Jest + ts-jest

**Files:**
- Create: `jest.config.ts`
- Modify: `package.json` (scripts de test)

- [ ] **Step 1: Instalar dependencias de test**

```powershell
npm install -D jest ts-jest @types/jest
```

- [ ] **Step 2: Crear jest.config.ts**

```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['lib/**/*.ts'],
}

export default config
```

- [ ] **Step 3: Añadir scripts a package.json**

En `package.json`, dentro de `"scripts"`, añadir:

```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

- [ ] **Step 4: Crear directorio de tests**

```powershell
mkdir -p __tests__/financiero
```

- [ ] **Step 5: Verificar que Jest encuentra la config**

```powershell
npx jest --listTests
```

Esperado: lista vacía (aún no hay tests). Sin errores de configuración.

- [ ] **Step 6: Commit**

```powershell
git add jest.config.ts package.json
git commit -m "feat: configuración Jest + ts-jest"
```

---

## Task 4: Migrar lógica de fechas (`lib/financiero/fechas.ts`)

**Files:**
- Create: `lib/financiero/fechas.ts`
- Create: `__tests__/financiero/fechas.test.ts`

- [ ] **Step 1: Escribir los tests primero**

Crear `__tests__/financiero/fechas.test.ts`:

```typescript
import { parseLocalDate, addMonths, addPeriods } from '@/lib/financiero/fechas'

describe('parseLocalDate', () => {
  it('parsea yyyy-mm-dd sin corrimiento de zona horaria', () => {
    const d = parseLocalDate('2024-01-15')
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(0) // enero = 0
    expect(d.getDate()).toBe(15)
  })

  it('maneja fecha vacía devolviendo fecha actual sin explotar', () => {
    const d = parseLocalDate('')
    expect(d).toBeInstanceOf(Date)
  })
})

describe('addMonths', () => {
  it('suma 1 mes normal', () => {
    const base = new Date(2024, 0, 15) // 15-ene-2024
    const result = addMonths(base, 1)
    expect(result.getMonth()).toBe(1) // febrero
    expect(result.getDate()).toBe(15)
  })

  it('ajusta al último día si el mes destino es más corto', () => {
    const base = new Date(2024, 0, 31) // 31-ene-2024
    const result = addMonths(base, 1)
    expect(result.getMonth()).toBe(1) // febrero
    expect(result.getDate()).toBe(29) // 2024 es bisiesto
  })

  it('suma 12 meses → mismo día del año siguiente', () => {
    const base = new Date(2024, 0, 15)
    const result = addMonths(base, 12)
    expect(result.getFullYear()).toBe(2025)
    expect(result.getMonth()).toBe(0)
    expect(result.getDate()).toBe(15)
  })
})

describe('addPeriods', () => {
  it('mensual llama addMonths', () => {
    const base = new Date(2024, 0, 15)
    const result = addPeriods(base, 3, 'mensual')
    expect(result.getMonth()).toBe(3) // abril
    expect(result.getDate()).toBe(15)
  })

  it('quincenal suma 30 días (2 periodos)', () => {
    const base = new Date(2024, 0, 1)
    const result = addPeriods(base, 2, 'quincenal')
    // 1 enero + 30 días = 31 enero
    expect(result.getDate()).toBe(31)
    expect(result.getMonth()).toBe(0)
  })

  it('semanal suma 7 días por periodo', () => {
    const base = new Date(2024, 0, 1)
    const result = addPeriods(base, 1, 'semanal')
    expect(result.getDate()).toBe(8)
  })
})
```

- [ ] **Step 2: Ejecutar tests — deben FALLAR**

```powershell
npx jest __tests__/financiero/fechas.test.ts --no-coverage
```

Esperado: FAIL — "Cannot find module '@/lib/financiero/fechas'"

- [ ] **Step 3: Implementar `lib/financiero/fechas.ts`**

```typescript
export type Frecuencia = 'mensual' | 'quincenal' | 'semanal'

export function parseLocalDate(str: string): Date {
  if (!str) return new Date()
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addMonths(date: Date, n: number): Date {
  const d = new Date(date.getTime())
  const day = d.getDate()
  d.setMonth(d.getMonth() + n)
  if (d.getDate() < day) d.setDate(0) // desbordó de mes → último día del mes objetivo
  return d
}

export function addPeriods(baseDate: Date, n: number, frecuencia: Frecuencia): Date {
  if (frecuencia === 'mensual') return addMonths(baseDate, n)
  const d = new Date(baseDate.getTime())
  d.setDate(d.getDate() + n * (frecuencia === 'quincenal' ? 15 : 7))
  return d
}

export function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}
```

- [ ] **Step 4: Ejecutar tests — deben PASAR**

```powershell
npx jest __tests__/financiero/fechas.test.ts --no-coverage
```

Esperado: PASS — 8 tests passed.

- [ ] **Step 5: Commit**

```powershell
git add lib/financiero/fechas.ts __tests__/financiero/fechas.test.ts
git commit -m "feat: migrar lógica de fechas con tests"
```

---

## Task 5: Migrar cálculo de tasas y cuota francesa (`lib/financiero/tasas.ts`)

**Files:**
- Create: `lib/financiero/tasas.ts`
- Create: `__tests__/financiero/tasas.test.ts`

- [ ] **Step 1: Escribir los tests primero**

Crear `__tests__/financiero/tasas.test.ts`:

```typescript
import { calcularCuotaFrancesa, convertirTasaPeriodica } from '@/lib/financiero/tasas'

describe('calcularCuotaFrancesa', () => {
  it('tasa 2% mensual, 12 periodos, monto 1000000 → ≈ 94560.44', () => {
    const cuota = calcularCuotaFrancesa(0.02, 12, 1_000_000)
    expect(cuota).toBeCloseTo(94560.44, 0) // tolerancia ±0.5
  })

  it('tasa 0 → monto / periodos', () => {
    const cuota = calcularCuotaFrancesa(0, 12, 1_200_000)
    expect(cuota).toBeCloseTo(100_000, 2)
  })

  it('1 periodo → devuelve el monto entero', () => {
    const cuota = calcularCuotaFrancesa(0.05, 1, 500_000)
    // cuota = 500000 * 0.05 * 1.05 / (1.05 - 1) = 500000 * 0.05 * 1.05 / 0.05 = 525000
    expect(cuota).toBeCloseTo(525_000, 0)
  })
})

describe('convertirTasaPeriodica', () => {
  it('tasa anual 24% → mensual efectiva ≈ 1.808%', () => {
    // (1 + 0.24)^(1/12) - 1 = 0.01808
    const tp = convertirTasaPeriodica(24, 'anual', 'mensual')
    expect(tp).toBeCloseTo(0.01808, 4)
  })

  it('tasa mensual 2% → mensual efectiva = 2%', () => {
    const tp = convertirTasaPeriodica(2, 'mensual', 'mensual')
    expect(tp).toBeCloseTo(0.02, 6)
  })

  it('tasa anual 24% → quincenal efectiva ≈ 0.8989%', () => {
    // (1 + 0.24)^(1/24) - 1
    const tp = convertirTasaPeriodica(24, 'anual', 'quincenal')
    expect(tp).toBeCloseTo(0.008989, 5)
  })

  it('tasa anual 24% → semanal efectiva ≈ 0.4154%', () => {
    // (1 + 0.24)^(1/52) - 1
    const tp = convertirTasaPeriodica(24, 'anual', 'semanal')
    expect(tp).toBeCloseTo(0.004154, 5)
  })
})
```

- [ ] **Step 2: Ejecutar tests — deben FALLAR**

```powershell
npx jest __tests__/financiero/tasas.test.ts --no-coverage
```

Esperado: FAIL — "Cannot find module '@/lib/financiero/tasas'"

- [ ] **Step 3: Implementar `lib/financiero/tasas.ts`**

```typescript
import type { Frecuencia } from './fechas'

const PERIODOS_POR_ANIO: Record<Frecuencia, number> = {
  mensual: 12,
  quincenal: 24,
  semanal: 52,
}

const PERIODOS_POR_MES: Record<Frecuencia, number> = {
  mensual: 1,
  quincenal: 2,
  semanal: 52 / 12,
}

export function calcularCuotaFrancesa(tasa: number, periodos: number, monto: number): number {
  if (periodos <= 0) return monto
  if (tasa === 0) return monto / periodos
  if (Math.abs(tasa + 1) < 0.0001) return monto / periodos

  const potencia = Math.pow(1 + tasa, periodos)
  const denominador = potencia - 1
  if (Math.abs(denominador) < 0.0001) return monto / periodos

  return (monto * tasa * potencia) / denominador
}

export function convertirTasaPeriodica(
  valorPorcentual: number,
  tipoTasa: 'anual' | 'mensual',
  frecuencia: Frecuencia
): number {
  const valor = valorPorcentual / 100
  if (tipoTasa === 'anual') {
    return Math.pow(1 + valor, 1 / PERIODOS_POR_ANIO[frecuencia]) - 1
  }
  // mensual → convertir a la frecuencia indicada
  return Math.pow(1 + valor, 1 / PERIODOS_POR_MES[frecuencia]) - 1
}

export { PERIODOS_POR_ANIO }
```

- [ ] **Step 4: Ejecutar tests — deben PASAR**

```powershell
npx jest __tests__/financiero/tasas.test.ts --no-coverage
```

Esperado: PASS — 7 tests passed.

- [ ] **Step 5: Commit**

```powershell
git add lib/financiero/tasas.ts __tests__/financiero/tasas.test.ts
git commit -m "feat: migrar cuota francesa + conversión de tasas con tests"
```

---

## Task 6: Migrar el motor de amortización (`lib/financiero/motor.ts`)

**Files:**
- Create: `lib/financiero/motor.ts`
- Create: `__tests__/financiero/motor.test.ts`

- [ ] **Step 1: Escribir los tests primero**

Los valores esperados se calculan a partir del simulador original en `index_1.html`. Se verifican las primeras 3 líneas y los totales.

Crear `__tests__/financiero/motor.test.ts`:

```typescript
import { simularPrestamo, type ParametrosSimulacion } from '@/lib/financiero/motor'

// Caso base: $1.000.000 al 2% mensual, 12 meses, sistema tradicional, sin gracia
const casoBase: ParametrosSimulacion = {
  monto: 1_000_000,
  totalPeriodos: 12,
  tasaPeriodica: 0.02,
  tipoCuota: 'auto',
  cuotaManual: 0,
  tipoGracia: 'ninguno',
  periodosGracia: 0,
  abonosExtra: {},
  sistema: 'tradicional',
  seguro: 0,
}

describe('simularPrestamo — sistema tradicional', () => {
  it('genera 12 líneas', () => {
    const r = simularPrestamo(casoBase)
    expect(r.lineas).toHaveLength(12)
  })

  it('primera cuota: interés ≈ 20000', () => {
    const r = simularPrestamo(casoBase)
    expect(r.lineas[0].interes).toBeCloseTo(20_000, 0)
  })

  it('cuota aplicada ≈ 94560.44', () => {
    const r = simularPrestamo(casoBase)
    expect(r.cuotaAplicada).toBeCloseTo(94_560.44, 0)
  })

  it('saldo final = 0 (totalmente cancelado)', () => {
    const r = simularPrestamo(casoBase)
    expect(r.saldoFinal).toBe(0)
  })

  it('saldo de la última línea = 0', () => {
    const r = simularPrestamo(casoBase)
    const ultima = r.lineas[r.lineas.length - 1]
    expect(ultima.saldoRestante).toBe(0)
  })

  it('total intereses = totalPagado − monto', () => {
    const r = simularPrestamo(casoBase)
    expect(r.totalInteres).toBeCloseTo(r.totalPagado - 1_000_000, 0)
  })

  it('amortizacionNegativa = false con cuota auto', () => {
    const r = simularPrestamo(casoBase)
    expect(r.amortizacionNegativa).toBe(false)
  })
})

describe('simularPrestamo — gracia parcial', () => {
  it('periodo de gracia: esGracia=true y capital=0', () => {
    const r = simularPrestamo({
      ...casoBase,
      tipoGracia: 'parcial',
      periodosGracia: 2,
    })
    expect(r.lineas[0].esGracia).toBe(true)
    expect(r.lineas[0].abonoCapitalBase).toBe(0)
    expect(r.lineas[1].esGracia).toBe(true)
    expect(r.lineas[2].esGracia).toBe(false)
  })
})

describe('simularPrestamo — gracia total', () => {
  it('capitaliza interés en gracia total: saldo crece', () => {
    const r = simularPrestamo({
      ...casoBase,
      tipoGracia: 'total',
      periodosGracia: 2,
    })
    // Con gracia total, el saldo después del periodo 1 debe ser mayor al original
    expect(r.lineas[0].saldoRestante).toBeGreaterThan(1_000_000)
  })
})

describe('simularPrestamo — sistema pagadiario', () => {
  it('interés constante en todos los periodos (sobre capital original)', () => {
    const r = simularPrestamo({ ...casoBase, sistema: 'pagadiario' })
    const intereses = r.lineas.map(l => Math.round(l.interes))
    const primero = intereses[0]
    expect(intereses.every(i => i === primero)).toBe(true)
  })
})

describe('simularPrestamo — sistema fijo', () => {
  it('interés distribuido uniformemente por periodo', () => {
    const r = simularPrestamo({
      ...casoBase,
      sistema: 'fijo',
      tasaPeriodica: 0.24, // 24% global
    })
    const intereses = r.lineas.map(l => Math.round(l.interes))
    const primero = intereses[0]
    expect(intereses.every(i => i === primero)).toBe(true)
  })
})

describe('simularPrestamo — seguro', () => {
  it('seguro aparece en cada línea y se acumula en totalSeguro', () => {
    const r = simularPrestamo({ ...casoBase, seguro: 5_000 })
    expect(r.lineas[0].seguro).toBe(5_000)
    expect(r.totalSeguro).toBe(5_000 * 12)
  })
})

describe('simularPrestamo — monto 0', () => {
  it('devuelve lineas vacías', () => {
    const r = simularPrestamo({ ...casoBase, monto: 0 })
    expect(r.lineas).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Ejecutar tests — deben FALLAR**

```powershell
npx jest __tests__/financiero/motor.test.ts --no-coverage
```

Esperado: FAIL — "Cannot find module '@/lib/financiero/motor'"

- [ ] **Step 3: Implementar `lib/financiero/motor.ts`**

```typescript
import { calcularCuotaFrancesa } from './tasas'

export type SistemaCredito = 'tradicional' | 'pagadiario' | 'fijo'
export type TipoGracia = 'ninguno' | 'parcial' | 'total'
export type TipoCuota = 'auto' | 'manual'

export interface ParametrosSimulacion {
  monto: number
  totalPeriodos: number
  tasaPeriodica: number
  tipoCuota: TipoCuota
  cuotaManual: number
  tipoGracia: TipoGracia
  periodosGracia: number
  abonosExtra: Record<number, number>
  sistema: SistemaCredito
  seguro: number
}

export interface LineaAmortizacion {
  num: number
  pagoMensual: number
  abonoCapitalBase: number
  interes: number
  abonoExtra: number
  seguro: number
  saldoRestante: number
  esNegativo: boolean
  esGracia: boolean
}

export interface ResultadoSimulacion {
  cuotaAplicada: number
  totalPagado: number
  totalInteres: number
  totalSeguro: number
  saldoFinal: number
  periodosTotales: number
  amortizacionNegativa: boolean
  lineas: LineaAmortizacion[]
}

export function simularPrestamo(p: ParametrosSimulacion): ResultadoSimulacion {
  let monto = Math.max(0, p.monto || 0)
  const totalPeriodos = Math.max(1, p.totalPeriodos || 1)
  const tasaPeriodica = Math.max(0, p.tasaPeriodica || 0)
  let periodosGracia = Math.max(0, p.periodosGracia || 0)
  const seguro = Math.max(0, p.seguro || 0)

  if (monto === 0) {
    return { cuotaAplicada: 0, totalPagado: 0, totalInteres: 0, totalSeguro: 0, saldoFinal: 0, periodosTotales: 0, amortizacionNegativa: false, lineas: [] }
  }

  let saldo = monto
  let totalPagado = 0
  let totalInteres = 0
  let totalSeguro = 0
  let amortizacionNegativa = false
  const lineas: LineaAmortizacion[] = []

  let periodosAmortizables = totalPeriodos - periodosGracia
  if (periodosAmortizables <= 0) periodosAmortizables = 1

  let cuotaFija = 0
  if (p.sistema === 'fijo') {
    const interesTotal = monto * tasaPeriodica
    cuotaFija = p.tipoCuota === 'auto' ? (monto + interesTotal) / totalPeriodos : p.cuotaManual
  } else if (p.sistema === 'pagadiario') {
    const interesFijo = monto * tasaPeriodica
    cuotaFija = p.tipoCuota === 'auto' ? (monto + interesFijo * totalPeriodos) / totalPeriodos : p.cuotaManual
  } else {
    cuotaFija = p.tipoCuota === 'auto' ? calcularCuotaFrancesa(tasaPeriodica, periodosAmortizables, monto) : p.cuotaManual
  }

  for (let i = 1; i <= totalPeriodos; i++) {
    let interesMes: number
    if (p.sistema === 'fijo') interesMes = (monto * tasaPeriodica) / totalPeriodos
    else if (p.sistema === 'pagadiario') interesMes = monto * tasaPeriodica
    else interesMes = saldo * tasaPeriodica

    let cuotaReal = 0
    let abonoCapitalBase = 0
    let abonoExtra = p.abonosExtra[i] || 0
    let enGracia = false

    if (i <= periodosGracia && p.tipoGracia !== 'ninguno') {
      enGracia = true
      if (p.tipoGracia === 'parcial') {
        cuotaReal = interesMes
        abonoCapitalBase = 0
      } else {
        cuotaReal = 0
        abonoCapitalBase = -interesMes
      }
    } else {
      if (i === periodosGracia + 1 && p.tipoCuota === 'auto' && saldo > 0 && p.sistema !== 'fijo') {
        const periodosRestantes = totalPeriodos - periodosGracia
        if (periodosRestantes > 0) {
          if (p.sistema === 'pagadiario') {
            cuotaFija = Math.max(0.01, saldo) / periodosRestantes + monto * tasaPeriodica
          } else {
            cuotaFija = calcularCuotaFrancesa(tasaPeriodica, periodosRestantes, Math.max(0.01, saldo))
          }
        }
      }
      cuotaReal = cuotaFija
      abonoCapitalBase = cuotaReal - interesMes
    }

    if (abonoCapitalBase < 0 && !enGracia) amortizacionNegativa = true

    abonoExtra = Math.min(abonoExtra, Math.max(0, saldo - abonoCapitalBase))
    let abonoTotalCapital = abonoCapitalBase + abonoExtra

    if (saldo <= abonoTotalCapital && !enGracia) {
      abonoTotalCapital = saldo
      abonoCapitalBase = Math.max(0, saldo - abonoExtra)
      cuotaReal = abonoCapitalBase + interesMes
      saldo = 0
    } else {
      saldo -= abonoTotalCapital
    }

    totalPagado += cuotaReal + abonoExtra + seguro
    totalInteres += interesMes
    totalSeguro += seguro

    if (saldo < 0.01) saldo = 0

    lineas.push({
      num: i,
      pagoMensual: cuotaReal,
      abonoCapitalBase,
      interes: interesMes,
      abonoExtra,
      seguro,
      saldoRestante: saldo,
      esNegativo: abonoCapitalBase < 0 && !enGracia,
      esGracia: enGracia,
    })

    if (saldo <= 0 && !enGracia) break
  }

  return { cuotaAplicada: cuotaFija, totalPagado, totalInteres, totalSeguro, saldoFinal: saldo, periodosTotales: lineas.length, amortizacionNegativa, lineas }
}
```

- [ ] **Step 4: Ejecutar tests — deben PASAR**

```powershell
npx jest __tests__/financiero/motor.test.ts --no-coverage
```

Esperado: PASS — todos los tests.

- [ ] **Step 5: Commit**

```powershell
git add lib/financiero/motor.ts __tests__/financiero/motor.test.ts
git commit -m "feat: migrar motor de amortización con tests de equivalencia"
```

---

## Task 7: Migrar CEA/TIR (`lib/financiero/cea.ts`)

**Files:**
- Create: `lib/financiero/cea.ts`
- Create: `__tests__/financiero/cea.test.ts`

- [ ] **Step 1: Escribir los tests**

Crear `__tests__/financiero/cea.test.ts`:

```typescript
import { tasaEfectivaAnual, formatearCEA } from '@/lib/financiero/cea'
import { simularPrestamo } from '@/lib/financiero/motor'

describe('tasaEfectivaAnual', () => {
  it('para préstamo al 2% mensual CEA > 24% (capitalización compuesta)', () => {
    const r = simularPrestamo({
      monto: 1_000_000,
      totalPeriodos: 12,
      tasaPeriodica: 0.02,
      tipoCuota: 'auto',
      cuotaManual: 0,
      tipoGracia: 'ninguno',
      periodosGracia: 0,
      abonosExtra: {},
      sistema: 'tradicional',
      seguro: 0,
    })
    const tea = tasaEfectivaAnual(1_000_000, r.lineas, 12)
    // 2% mensual efectivo → 26.82% E.A.
    expect(tea).toBeCloseTo(0.2682, 3)
  })

  it('con seguro el CEA es mayor que sin seguro', () => {
    const sinSeguro = simularPrestamo({ monto: 1_000_000, totalPeriodos: 12, tasaPeriodica: 0.02, tipoCuota: 'auto', cuotaManual: 0, tipoGracia: 'ninguno', periodosGracia: 0, abonosExtra: {}, sistema: 'tradicional', seguro: 0 })
    const conSeguro = simularPrestamo({ monto: 1_000_000, totalPeriodos: 12, tasaPeriodica: 0.02, tipoCuota: 'auto', cuotaManual: 0, tipoGracia: 'ninguno', periodosGracia: 0, abonosExtra: {}, sistema: 'tradicional', seguro: 10_000 })
    const teaSin = tasaEfectivaAnual(1_000_000, sinSeguro.lineas, 12)
    const teaCon = tasaEfectivaAnual(1_000_000, conSeguro.lineas, 12)
    expect(teaCon).toBeGreaterThan(teaSin)
  })

  it('monto 0 → devuelve 0', () => {
    expect(tasaEfectivaAnual(0, [], 12)).toBe(0)
  })

  it('sin lineas → devuelve 0', () => {
    expect(tasaEfectivaAnual(1_000_000, [], 12)).toBe(0)
  })
})

describe('formatearCEA', () => {
  it('formatea como porcentaje con 1 decimal', () => {
    expect(formatearCEA(0.2682)).toBe('26.8%')
  })

  it('Infinity → "∞"', () => {
    expect(formatearCEA(Infinity)).toBe('∞')
  })
})
```

- [ ] **Step 2: Ejecutar tests — deben FALLAR**

```powershell
npx jest __tests__/financiero/cea.test.ts --no-coverage
```

- [ ] **Step 3: Implementar `lib/financiero/cea.ts`**

```typescript
import type { LineaAmortizacion } from './motor'

export function tasaEfectivaAnual(
  monto: number,
  lineas: LineaAmortizacion[],
  periodosPorAnio: number
): number {
  if (monto <= 0 || !lineas || lineas.length === 0) return 0
  const pagos = lineas.map(l => (l.pagoMensual || 0) + (l.abonoExtra || 0) + (l.seguro || 0))
  const totalPagos = pagos.reduce((a, b) => a + b, 0)
  if (totalPagos <= monto) return 0

  const npv = (r: number) =>
    monto - pagos.reduce((acc, p, idx) => acc + p / Math.pow(1 + r, idx + 1), 0)

  let lo = 0,
    hi = 10
  if (npv(hi) < 0) return Infinity
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2
    if (npv(mid) > 0) hi = mid
    else lo = mid
  }
  const rPeriodica = (lo + hi) / 2
  return Math.pow(1 + rPeriodica, periodosPorAnio) - 1
}

export function formatearCEA(tea: number): string {
  if (tea === Infinity) return '∞'
  return (tea * 100).toFixed(1) + '%'
}
```

- [ ] **Step 4: Ejecutar todos los tests financieros**

```powershell
npx jest __tests__/financiero/ --no-coverage
```

Esperado: PASS — todos los tests del directorio `financiero/`.

- [ ] **Step 5: Commit**

```powershell
git add lib/financiero/cea.ts __tests__/financiero/cea.test.ts
git commit -m "feat: migrar CEA/TIR por bisección con tests"
```

---

## Task 8: Configurar Auth.js v5

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Modify: `app/layout.tsx`
- Create: `lib/session.ts`

- [ ] **Step 1: Instalar dependencias de Auth**

```powershell
npm install next-auth@beta bcryptjs @auth/prisma-adapter
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Crear `lib/auth.ts`**

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import type { Rol } from '@prisma/client'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email as string, eliminadoEn: null },
        })
        if (!usuario || !usuario.passwordHash) return null

        const ok = await bcrypt.compare(credentials.password as string, usuario.passwordHash)
        if (!ok) return null

        return { id: usuario.id, email: usuario.email, name: usuario.nombre, rol: usuario.rol }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.rol = (user as { rol: Rol }).rol
      return token
    },
    session({ session, token }) {
      if (session.user) (session.user as { rol?: Rol }).rol = token.rol as Rol
      return session
    },
  },
})
```

- [ ] **Step 3: Crear el route handler**

Crear `app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

- [ ] **Step 4: Crear helper de sesión del servidor**

Crear `lib/session.ts`:

```typescript
import { auth } from '@/lib/auth'
import type { Rol } from '@prisma/client'

export async function getSession() {
  return auth()
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('No autenticado')
  }
  return session
}

export async function requireRol(...roles: Rol[]) {
  const session = await requireAuth()
  const userRol = (session.user as { rol?: Rol }).rol
  if (!userRol || !roles.includes(userRol)) {
    throw new Error('Sin permisos suficientes')
  }
  return session
}
```

- [ ] **Step 5: Añadir tipos extendidos de Auth.js**

Crear `types/next-auth.d.ts`:

```typescript
import type { Rol } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    rol: Rol
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    rol: Rol
  }
}
```

- [ ] **Step 6: Verificar typecheck**

```powershell
npx tsc --noEmit
```

Esperado: 0 errores relacionados con Auth.

- [ ] **Step 7: Commit**

```powershell
git add lib/auth.ts lib/session.ts app/api/auth/ types/
git commit -m "feat: Auth.js v5 con Credentials + JWT + roles"
```

---

## Task 9: Schemas de validación Zod

**Files:**
- Create: `lib/validaciones/cliente.schema.ts`
- Create: `lib/validaciones/prestamo.schema.ts`

- [ ] **Step 1: Instalar Zod**

```powershell
npm install zod
```

- [ ] **Step 2: Crear `lib/validaciones/cliente.schema.ts`**

```typescript
import { z } from 'zod'

export const CreateClienteSchema = z.object({
  nombreCompleto: z.string().min(3).max(200),
  documento: z.string().min(5).max(20),
  telefono: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  direccion: z.string().max(500).optional(),
})

export const UpdateClienteSchema = CreateClienteSchema.partial()

export type CreateClienteInput = z.infer<typeof CreateClienteSchema>
export type UpdateClienteInput = z.infer<typeof UpdateClienteSchema>
```

- [ ] **Step 3: Crear `lib/validaciones/prestamo.schema.ts`**

```typescript
import { z } from 'zod'

export const CreatePrestamoSchema = z.object({
  clienteId: z.string().cuid(),
  sistema: z.enum(['TRADICIONAL', 'PAGADIARIO', 'FIJO']),
  // Monto en pesos (se convierte a centavos en el handler)
  monto: z.number().positive().max(999_999_999),
  tasaValor: z.number().positive().max(100),
  tipoTasa: z.enum(['ANUAL', 'MENSUAL']),
  frecuencia: z.enum(['MENSUAL', 'QUINCENAL', 'SEMANAL']),
  plazo: z.number().int().min(1).max(360),
  tipoGracia: z.enum(['NINGUNO', 'PARCIAL', 'TOTAL']).default('NINGUNO'),
  periodosGracia: z.number().int().min(0).max(120).default(0),
  // Seguro en pesos por cuota
  seguro: z.number().min(0).default(0),
  fechaDesembolso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export type CreatePrestamoInput = z.infer<typeof CreatePrestamoSchema>
```

- [ ] **Step 4: Verificar typecheck**

```powershell
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```powershell
git add lib/validaciones/
git commit -m "feat: schemas Zod para Cliente y Préstamo"
```

---

## Task 10: API de Clientes

**Files:**
- Create: `app/api/clientes/route.ts`
- Create: `app/api/clientes/[id]/route.ts`

- [ ] **Step 1: Crear `app/api/clientes/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { CreateClienteSchema } from '@/lib/validaciones/cliente.schema'

export async function GET() {
  try {
    await requireAuth()
    const clientes = await prisma.cliente.findMany({
      where: { eliminadoEn: null },
      orderBy: { creadoEn: 'desc' },
      include: { _count: { select: { prestamos: { where: { eliminadoEn: null } } } } },
    })
    return NextResponse.json(clientes)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'No autenticado' ? 401 : 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const data = CreateClienteSchema.parse(body)

    const cliente = await prisma.cliente.create({ data })

    await prisma.auditLog.create({
      data: {
        entidad: 'Cliente',
        entidadId: cliente.id,
        accion: 'CREATE',
        usuarioId: (session.user as { id?: string }).id ?? '',
        valorAntes: null,
        valorDespues: cliente as unknown as Record<string, unknown>,
      },
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Documento ya registrado' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: msg === 'No autenticado' ? 401 : 400 })
  }
}
```

- [ ] **Step 2: Crear `app/api/clientes/[id]/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { UpdateClienteSchema } from '@/lib/validaciones/cliente.schema'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth()
    const cliente = await prisma.cliente.findFirst({
      where: { id: params.id, eliminadoEn: null },
      include: { prestamos: { where: { eliminadoEn: null }, orderBy: { creadoEn: 'desc' } } },
    })
    if (!cliente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(cliente)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const data = UpdateClienteSchema.parse(body)

    const antes = await prisma.cliente.findFirst({ where: { id: params.id, eliminadoEn: null } })
    if (!antes) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const cliente = await prisma.cliente.update({ where: { id: params.id }, data })

    await prisma.auditLog.create({
      data: {
        entidad: 'Cliente',
        entidadId: cliente.id,
        accion: 'UPDATE',
        usuarioId: (session.user as { id?: string }).id ?? '',
        valorAntes: antes as unknown as Record<string, unknown>,
        valorDespues: cliente as unknown as Record<string, unknown>,
      },
    })

    return NextResponse.json(cliente)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const cliente = await prisma.cliente.findFirst({ where: { id: params.id, eliminadoEn: null } })
    if (!cliente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    await prisma.cliente.update({
      where: { id: params.id },
      data: { eliminadoEn: new Date() },
    })

    await prisma.auditLog.create({
      data: {
        entidad: 'Cliente',
        entidadId: params.id,
        accion: 'DELETE',
        usuarioId: (session.user as { id?: string }).id ?? '',
        valorAntes: cliente as unknown as Record<string, unknown>,
        valorDespues: null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
```

- [ ] **Step 3: Verificar typecheck**

```powershell
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```powershell
git add app/api/clientes/
git commit -m "feat: API REST /clientes (GET, POST, PUT, DELETE soft)"
```

---

## Task 11: API de Préstamos (con generación de cuotas)

**Files:**
- Create: `app/api/prestamos/route.ts`
- Create: `app/api/prestamos/[id]/route.ts`

- [ ] **Step 1: Crear `app/api/prestamos/route.ts`**

La creación de un préstamo genera las cuotas de amortización en la misma transacción.

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { CreatePrestamoSchema } from '@/lib/validaciones/prestamo.schema'
import { simularPrestamo } from '@/lib/financiero/motor'
import { convertirTasaPeriodica, PERIODOS_POR_ANIO } from '@/lib/financiero/tasas'
import { parseLocalDate, addPeriods } from '@/lib/financiero/fechas'

const PESOS_A_CENTAVOS = 100

export async function GET() {
  try {
    await requireAuth()
    const prestamos = await prisma.prestamo.findMany({
      where: { eliminadoEn: null },
      orderBy: { creadoEn: 'desc' },
      include: { cliente: true, asesor: { select: { nombre: true } } },
    })
    // Convertir centavos a pesos en la respuesta
    return NextResponse.json(prestamos.map(p => ({
      ...p,
      monto: p.montoCentavos / PESOS_A_CENTAVOS,
      seguro: p.seguroCentavos / PESOS_A_CENTAVOS,
    })))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const data = CreatePrestamoSchema.parse(body)

    const frecuenciaLower = data.frecuencia.toLowerCase() as 'mensual' | 'quincenal' | 'semanal'
    const tipoTasaLower = data.tipoTasa.toLowerCase() as 'anual' | 'mensual'

    const tasaPeriodica = data.sistema === 'FIJO'
      ? data.tasaValor / 100
      : convertirTasaPeriodica(data.tasaValor, tipoTasaLower, frecuenciaLower)

    const simulacion = simularPrestamo({
      monto: data.monto,
      totalPeriodos: data.plazo,
      tasaPeriodica,
      tipoCuota: 'auto',
      cuotaManual: 0,
      tipoGracia: (data.tipoGracia?.toLowerCase() ?? 'ninguno') as 'ninguno' | 'parcial' | 'total',
      periodosGracia: data.periodosGracia ?? 0,
      abonosExtra: {},
      sistema: data.sistema.toLowerCase() as 'tradicional' | 'pagadiario' | 'fijo',
      seguro: data.seguro ?? 0,
    })

    const baseDate = parseLocalDate(data.fechaDesembolso)
    const montoCentavos = Math.round(data.monto * PESOS_A_CENTAVOS)
    const seguroCentavos = Math.round((data.seguro ?? 0) * PESOS_A_CENTAVOS)
    const asesorId = (session.user as { id?: string }).id ?? ''

    const prestamo = await prisma.$transaction(async (tx) => {
      const p = await tx.prestamo.create({
        data: {
          clienteId: data.clienteId,
          asesorId,
          sistema: data.sistema,
          montoCentavos,
          tasaValor: data.tasaValor,
          tipoTasa: data.tipoTasa,
          frecuencia: data.frecuencia,
          plazo: data.plazo,
          tipoGracia: data.tipoGracia ?? 'NINGUNO',
          periodosGracia: data.periodosGracia ?? 0,
          seguroCentavos,
          fechaDesembolso: new Date(data.fechaDesembolso),
        },
      })

      await tx.cuota.createMany({
        data: simulacion.lineas.map((l) => ({
          prestamoId: p.id,
          numero: l.num,
          fechaVencimiento: addPeriods(baseDate, l.num, frecuenciaLower),
          capitalCentavos: Math.round(l.abonoCapitalBase * PESOS_A_CENTAVOS),
          interesCentavos: Math.round(l.interes * PESOS_A_CENTAVOS),
          seguroCentavos,
          totalCentavos: Math.round((l.pagoMensual + (data.seguro ?? 0)) * PESOS_A_CENTAVOS),
          saldoCentavos: Math.round(l.saldoRestante * PESOS_A_CENTAVOS),
          esGracia: l.esGracia,
        })),
      })

      await tx.auditLog.create({
        data: {
          entidad: 'Prestamo',
          entidadId: p.id,
          accion: 'CREATE',
          usuarioId: asesorId,
          valorAntes: null,
          valorDespues: { ...p, cuotas: simulacion.periodosTotales } as unknown as Record<string, unknown>,
        },
      })

      return p
    })

    return NextResponse.json({ id: prestamo.id }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
```

- [ ] **Step 2: Crear `app/api/prestamos/[id]/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

const PESOS_A_CENTAVOS = 100

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth()
    const prestamo = await prisma.prestamo.findFirst({
      where: { id: params.id, eliminadoEn: null },
      include: {
        cliente: true,
        asesor: { select: { nombre: true, email: true } },
        cuotas: { orderBy: { numero: 'asc' } },
        pagos: { where: { eliminadoEn: null }, orderBy: { fechaPago: 'desc' } },
      },
    })
    if (!prestamo) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    return NextResponse.json({
      ...prestamo,
      monto: prestamo.montoCentavos / PESOS_A_CENTAVOS,
      seguro: prestamo.seguroCentavos / PESOS_A_CENTAVOS,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const prestamo = await prisma.prestamo.findFirst({ where: { id: params.id, eliminadoEn: null } })
    if (!prestamo) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    await prisma.prestamo.update({
      where: { id: params.id },
      data: { eliminadoEn: new Date() },
    })

    await prisma.auditLog.create({
      data: {
        entidad: 'Prestamo',
        entidadId: params.id,
        accion: 'DELETE',
        usuarioId: (session.user as { id?: string }).id ?? '',
        valorAntes: prestamo as unknown as Record<string, unknown>,
        valorDespues: null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
```

- [ ] **Step 3: Verificar typecheck**

```powershell
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```powershell
git add app/api/prestamos/
git commit -m "feat: API REST /prestamos con generación transaccional de cuotas"
```

---

## Task 12: API de Pagos

**Files:**
- Create: `app/api/pagos/route.ts`
- Create: `app/api/pagos/[id]/route.ts`

- [ ] **Step 1: Crear `app/api/pagos/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { z } from 'zod'

const CreatePagoSchema = z.object({
  prestamoId: z.string().cuid(),
  cuotaId: z.string().cuid().optional(),
  // Monto en pesos
  monto: z.number().positive(),
  fechaPago: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tipoPago: z.enum(['CUOTA', 'ABONO_EXTRA', 'AJUSTE', 'CASTIGO']).default('CUOTA'),
  notas: z.string().max(500).optional(),
})

const PESOS_A_CENTAVOS = 100

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const data = CreatePagoSchema.parse(body)

    const prestamo = await prisma.prestamo.findFirst({
      where: { id: data.prestamoId, eliminadoEn: null },
    })
    if (!prestamo) return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 })

    const registradoPorId = (session.user as { id?: string }).id ?? ''
    const montoCentavos = Math.round(data.monto * PESOS_A_CENTAVOS)

    const pago = await prisma.$transaction(async (tx) => {
      const p = await tx.pago.create({
        data: {
          prestamoId: data.prestamoId,
          cuotaId: data.cuotaId,
          montoCentavos,
          fechaPago: new Date(data.fechaPago),
          tipoPago: data.tipoPago,
          notas: data.notas,
          registradoPorId,
        },
      })

      await tx.auditLog.create({
        data: {
          entidad: 'Pago',
          entidadId: p.id,
          accion: 'CREATE',
          usuarioId: registradoPorId,
          valorAntes: null,
          valorDespues: p as unknown as Record<string, unknown>,
        },
      })

      return p
    })

    return NextResponse.json(pago, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
```

- [ ] **Step 2: Crear `app/api/pagos/[id]/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRol } from '@/lib/session'

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    // Solo ADMIN puede anular pagos
    const session = await requireRol('ADMIN')
    const pago = await prisma.pago.findFirst({ where: { id: params.id, eliminadoEn: null } })
    if (!pago) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    await prisma.pago.update({
      where: { id: params.id },
      data: { eliminadoEn: new Date() },
    })

    await prisma.auditLog.create({
      data: {
        entidad: 'Pago',
        entidadId: params.id,
        accion: 'DELETE',
        usuarioId: (session.user as { id?: string }).id ?? '',
        valorAntes: pago as unknown as Record<string, unknown>,
        valorDespues: null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg.includes('permisos') ? 403 : 400 })
  }
}
```

- [ ] **Step 3: Verificar typecheck y tests**

```powershell
npx tsc --noEmit
npx jest --no-coverage
```

Esperado: 0 errores de tipo. Todos los tests en PASS.

- [ ] **Step 4: Commit**

```powershell
git add app/api/pagos/
git commit -m "feat: API REST /pagos con soft delete restringido a ADMIN"
```

---

## Task 13: Script de seed (usuario admin inicial)

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json`

- [ ] **Step 1: Instalar ts-node para seed**

```powershell
npm install -D ts-node
```

- [ ] **Step 2: Añadir config de seed a package.json**

En `package.json` añadir a nivel raíz:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

- [ ] **Step 3: Crear `prisma/seed.ts`**

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12)

  await prisma.usuario.upsert({
    where: { email: 'admin@prestamos.local' },
    update: {},
    create: {
      email: 'admin@prestamos.local',
      nombre: 'Administrador',
      rol: 'ADMIN',
      passwordHash,
    },
  })

  console.log('Seed completado. Usuario: admin@prestamos.local / admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 4: Ejecutar el seed**

```powershell
npx prisma db seed
```

Esperado: "Seed completado. Usuario: admin@prestamos.local / admin123"

- [ ] **Step 5: Verificación final de Phase 2**

```powershell
npx tsc --noEmit
npx jest --no-coverage
npm run build
```

Esperado: 0 errores TypeScript, todos los tests en PASS, build exitoso.

- [ ] **Step 6: Commit final de fase**

```powershell
git add prisma/seed.ts package.json
git commit -m "feat: seed inicial con usuario ADMIN"
git push -u origin fase-2-backend
```

---

## Checklist de cierre de Fase 2

- [ ] `npx tsc --noEmit` — 0 errores
- [ ] `npx jest --no-coverage` — todos los tests pasan (fechas, tasas, motor, cea)
- [ ] `npm run build` — build de producción sin errores
- [ ] Migración aplicada en Neon
- [ ] Seed ejecutado (usuario admin accesible)
- [ ] Todos los commits son atómicos y convencionales
- [ ] `.env` NO versionado
- [ ] Rama `fase-2-backend` pusheada

