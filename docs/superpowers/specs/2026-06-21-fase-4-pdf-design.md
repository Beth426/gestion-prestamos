# Fase 4 — Reporte PDF: Estado de Cuenta de Préstamo

## Resumen

Generar un PDF descargable del estado de cuenta de un préstamo individual, accesible desde la página de detalle del préstamo. Sin branding corporativo. Solo datos.

---

## Alcance

Un único reporte: **Estado de cuenta de un préstamo**.

No se implementan reportes de cartera, paz y salvo, ni recaudo del mes.

---

## Arquitectura

### Flujo

1. El usuario abre `/prestamos/[id]` en la app.
2. Hace clic en el botón "Descargar PDF".
3. El navegador navega a `GET /api/prestamos/[id]/pdf`.
4. El Route Handler consulta Prisma, renderiza el componente PDF con `@react-pdf/renderer`, y devuelve el stream con `Content-Type: application/pdf`.
5. El navegador abre/descarga el PDF de forma nativa.

No hay estado de carga en el cliente. No se necesita `fetch` ni `useState`. El botón es un `<a href>` simple.

### Archivos

| Archivo | Responsabilidad |
|---|---|
| `lib/pdf/estado-cuenta.tsx` | Componente React-PDF que describe el layout del documento. Sin lógica de BD; recibe todos los datos por props. |
| `app/api/prestamos/[id]/pdf/route.ts` | Route Handler: valida sesión, consulta Prisma, invoca `renderToBuffer()`, devuelve el stream. |
| `app/(dashboard)/prestamos/[id]/page.tsx` | Modificar: añadir botón "Descargar PDF" (`<a>` que apunta al Route Handler). |

---

## Contenido del PDF

### 1. Encabezado
- Título: "Estado de Cuenta"
- ID del préstamo: `#<id corto>`
- Fecha de generación: fecha y hora en zona horaria Colombia (America/Bogota)

### 2. Datos del cliente
- Nombre completo
- Número de documento
- Teléfono
- Email

### 3. Parámetros del préstamo
- Sistema (TRADICIONAL / PAGADIARIO / FIJO)
- Monto desembolsado
- Tasa y frecuencia
- Plazo (en periodos)
- Fecha de desembolso
- Estado actual (ACTIVO / MORA / CANCELADO / etc.)

### 4. Tabla de amortización
Columnas: `#` · `Vencimiento` · `Capital` · `Interés` · `Total cuota` · `Saldo` · `Estado`

Estado de cada cuota (derivado, no campo en BD):
- **Pagada** — tiene al menos un pago con `eliminadoEn = null`
- **Mora** — no tiene pagos activos y `fechaVencimiento < hoy`
- **Pendiente** — no tiene pagos activos y `fechaVencimiento >= hoy`

### 5. Historial de pagos
Columnas: `Fecha` · `Monto` · `Tipo` · `Registrado por`

Solo pagos con `eliminadoEn = null` (soft-delete respetado).

### 6. Resumen
- Total pagado
- Saldo pendiente (suma de cuotas no pagadas)
- Cuotas pagadas / total

---

## Seguridad

- El Route Handler llama a `auth()` (Auth.js v5). Si no hay sesión activa, devuelve `401`.
- Todos los roles autenticados pueden descargar el PDF (no se restringe por rol — el préstamo ya es visible en la UI para el usuario que lo consulta).
- El `id` del préstamo se valida con Prisma; si no existe se devuelve `404`.

---

## Librería: `@react-pdf/renderer`

- Renderizado servidor (Node.js) via `renderToBuffer()`.
- No usa HTML ni Tailwind — usa primitivas propias: `<Document>`, `<Page>`, `<View>`, `<Text>`, `<StyleSheet.create()>`.
- Fuentes: usa las fuentes embebidas por defecto (Helvetica). No se cargan fuentes externas.
- Tamaño de página: A4.

---

## Formato de moneda y fechas

- Moneda: las cuotas y pagos se almacenan en **centavos** (enteros). Dividir por 100 y formatear con separadores colombianos antes de pasarlos al componente PDF.
- Fechas: `Intl.DateTimeFormat` con `timeZone: 'America/Bogota'` para evitar el desfase UTC.

---

## No incluido en esta fase

- Reportes de cartera activa
- Reportes de recaudo del mes
- Paz y salvo / certificado
- Logo o nombre de empresa
- Envío por email
- Reportes Excel o CSV
