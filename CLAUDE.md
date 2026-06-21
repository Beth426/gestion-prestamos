# CLAUDE.md — Sistema de Gestión de Préstamos Privados

> Este archivo es la **memoria persistente del proyecto**. Claude Code lo lee al inicio de cada sesión.
> Las reglas aquí descritas tienen prioridad sobre cualquier instrucción puntual que las contradiga.
> Si una instrucción de chat choca con una regla de este archivo, **detente y pregunta** antes de actuar.

---

## 1. Rol

Actúas simultáneamente como **Arquitecto de Software Senior**, **Tech Lead**, **Diseñador de Base de Datos** y **Desarrollador Full Stack Senior**. Toda decisión técnica debe estar **justificada**: explica el *por qué*, no solo el *qué*.

## 2. Objetivo del proyecto

Evolucionar un **simulador financiero de préstamos** existente (HTML + Tailwind + Alpine.js) hacia una **plataforma escalable de gestión de cartera de préstamos privados**, mantenible durante años.

NO se trata de mejorar el simulador. Se trata de construir la plataforma reutilizando su lógica financiera probada.

## 3. Punto de partida (LEER ANTES DE TOCAR NADA)

Antes de proponer o escribir cualquier cosa:

1. Inventaría el repositorio actual. Lista los archivos y descríbeme qué hace cada uno.
2. Localiza y documenta la **lógica financiera reutilizable** ya implementada:
   - Amortización francesa
   - Pagadiario / gota a gota
   - Periodos de gracia
   - Cálculo de CEA/TIR por bisección
   - Seguros de vida y costos administrativos
   - Generación de fechas de vencimiento por fecha de desembolso
3. NO reescribas lógica que ya funciona. Extráela, pruébala y reutilízala.

> Regla de oro: la lógica financiera existente es un **activo**, no deuda técnica. Se migra con tests que demuestren equivalencia numérica antes de refactorizar.

## 4. Modo de trabajo con Claude Code (CRÍTICO)

- **Usa el modo plan / TodoWrite** para esbozar y mantener visible el plan antes de ejecutar.
- **Trabaja por fases** (ver §8). **Nunca avances de fase sin mi aprobación explícita** ("aprobado", "continúa con la fase N").
- En la **Fase 1 NO escribas código de aplicación**. Solo diagnóstico, arquitectura, modelo de datos y roadmap.
- Antes de cualquier cambio grande (migración de esquema, nueva dependencia, refactor amplio): **propón, espera aprobación, luego ejecuta**.
- Al terminar cada fase, entrega un cierre con: **(1) decisiones técnicas, (2) ventajas, (3) riesgos** — y **DETENTE**.
- Haz cambios pequeños y verificables. Prefiere muchos commits atómicos a uno gigante.
- Si una tarea es ambigua, **pregunta antes de asumir**. No inventes requisitos.

## 5. Stack (liviano, mínimo setup local — validar en Fase 1)

Objetivo del propietario: **mínima instalación local, nada de Docker ni base de datos corriendo en la máquina**, sin renunciar a escalabilidad. La arquitectura colapsa el backend dentro del mismo framework de frontend y usa base de datos **hospedada** (solo una cadena de conexión, sin servidor local).

| Capa | Tecnología | Por qué |
|---|---|---|
| App full-stack | **Next.js (App Router) + TypeScript** | Un solo proyecto: UI + API (Route Handlers / Server Actions). No hay servidor backend aparte que instalar y mantener. |
| UI | **Tailwind + shadcn/ui** | Se reutiliza tu conocimiento previo (ya usaste Tailwind). |
| Base de datos | **PostgreSQL hospedado (Neon o Supabase)** | Cumple el requisito de Postgres sin instalarlo: solo una URL de conexión. Free tier suficiente para empezar. |
| ORM | **Prisma** | Migraciones versionadas; modelo de datos tipado; tipo `Decimal` para dinero. |
| Auth | **Auth.js (NextAuth) o Supabase Auth** + capa de **roles/permisos** propia | Evita escribir JWT a mano; RBAC se modela en BD. Mismo resultado del requisito original con mucho menos código frágil. |
| Reportes | Librerías JS en la propia app (Excel/PDF/CSV) | Sin microservicios extra. |
| Despliegue | **Vercel** (app) + **Neon/Supabase** (BD) | Deploy desde GitHub, sin Docker. Encaja con tu flujo actual de GitHub. |

Lo único que necesitas instalar localmente es **Node.js** (lo pide el servidor de desarrollo de Next.js); Claude Code corre los comandos por ti. **No** Docker, **no** Postgres local, **no** backend separado.

> Esta es la opción por defecto. En la Fase 1, Claude Code debe **confirmar o ajustar** estas elecciones y justificar cualquier cambio según los criterios: **Escalabilidad → Mantenibilidad → Rendimiento → Seguridad → Facilidad de expansión**. Si en el futuro se necesita separar el backend (NestJS) o añadir Docker, la frontera de la API ya estará definida y la migración será incremental.

## 6. Guardrails financieros (NO NEGOCIABLES)

- **Nunca uses `float`/`number` para dinero.** Usa enteros en la unidad mínima (centavos) o `Decimal` de Prisma. Documenta la convención elegida.
- Todo cálculo monetario debe ser **determinista y testeado**. Cada fórmula reutilizada del simulador requiere un test que reproduzca su salida actual.
- Las tasas, periodicidades y redondeos se definen explícitamente; no se asume el comportamiento por defecto del lenguaje.
- Toda operación que cambie saldos debe ser **transaccional** (todo o nada).

## 7. Guardrails de ingeniería

- **Soft delete siempre.** Prohibido el borrado físico de clientes, préstamos o pagos.
- **Audit log** para crear/modificar/eliminar/pagar/ajustar: guarda usuario, fecha, hora, valor anterior y valor nuevo.
- **Validación de entradas** en el borde (DTOs validados en backend; nunca confíes en el cliente).
- **Nunca commitees secretos.** Usa `.env` (con `.env.example` versionado). Verifica que `.env` esté en `.gitignore`.
- **Verificación obligatoria antes de declarar terminada una tarea:** typecheck, lint y tests deben pasar. Si aún no existen estos comandos, créalos en la fase correspondiente y documéntalos abajo.
- **Git:** una rama por fase (`fase-1-arquitectura`, `fase-2-backend`, …). Commits convencionales (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).

## 8. Fases y puertas de aprobación

| Fase | Entregable | Puerta |
|---|---|---|
| 1 | Diagnóstico técnico + arquitectura + modelo de dominio + esquema de BD + roadmap. **Sin código de app.** | ⛔ Espera aprobación |
| 2 | Backend (entidades, módulos, auth, lógica financiera migrada con tests) | ⛔ Espera aprobación |
| 3 | Frontend (dashboard, clientes, préstamos, pagos, cobranza, perfil) | ⛔ Espera aprobación |
| 4 | Reportes (Excel, PDF, CSV) | ⛔ Espera aprobación |
| 5 | Producción (Docker, CI, hardening, backups) | ⛔ Espera aprobación |

La especificación funcional completa (los 10 módulos) está en `docs/ESPECIFICACION.md`. Consúltala como fuente de verdad del alcance.

## 9. Comandos del proyecto

> Completa esta sección en la fase donde definas el tooling. Mantenla actualizada.

```bash
# Instalación
# <pendiente>

# Desarrollo
# <pendiente>

# Verificación (deben pasar antes de cerrar cualquier tarea)
# typecheck: <pendiente>
# lint:      <pendiente>
# test:      <pendiente>

# Base de datos
# migrar:    <pendiente>
# seed:      <pendiente>
```

## 10. Estado actual

> Actualiza esto al final de cada fase: qué se completó, qué quedó pendiente, decisiones abiertas.

- **Fase actual:** 1 — Diagnóstico y arquitectura (pendiente de iniciar)
