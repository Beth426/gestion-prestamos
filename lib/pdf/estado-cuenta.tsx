import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer'
import { formatCOP, formatFecha } from '@/lib/format'
import type {
  SistemaCredito,
  EstadoPrestamo,
  TipoTasa,
  Frecuencia,
  TipoPago,
} from '@prisma/client'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    color: '#18181b',
  },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  headerMeta: { fontSize: 8, color: '#71717a' },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  row: { flexDirection: 'row', marginBottom: 4 },
  col2: { width: '50%' },
  col4: { width: '25%' },
  label: { color: '#71717a', marginBottom: 1 },
  value: { fontFamily: 'Helvetica-Bold' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e4e4e7',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e4e4e7',
    backgroundColor: '#fafafa',
  },
  colNum: { width: '5%' },
  colFecha: { width: '14%' },
  colCapital: { width: '16%', textAlign: 'right' },
  colInteres: { width: '16%', textAlign: 'right' },
  colTotal: { width: '16%', textAlign: 'right' },
  colSaldo: { width: '18%', textAlign: 'right' },
  colEstado: { width: '15%', textAlign: 'center' },
  colPagoFecha: { width: '20%' },
  colPagoMonto: { width: '25%', textAlign: 'right' },
  colPagoTipo: { width: '25%' },
  colPagoRegistrado: { width: '30%' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  summaryLabel: { color: '#71717a' },
  summaryValue: { fontFamily: 'Helvetica-Bold' },
  estadoPagada: { color: '#16a34a' },
  estadoMora: { color: '#dc2626' },
  estadoPendiente: { color: '#71717a' },
})

type CuotaData = {
  numero: number
  fechaVencimiento: Date
  capitalCentavos: number
  interesCentavos: number
  totalCentavos: number
  saldoCentavos: number
  pagos: Array<{ eliminadoEn: Date | null }>
}

type PagoData = {
  montoCentavos: number
  fechaPago: Date
  tipoPago: TipoPago
  registradoPor: { nombre: string }
}

type EstadoCuentaProps = {
  prestamo: {
    id: string
    sistema: SistemaCredito
    estado: EstadoPrestamo
    montoCentavos: number
    tasaValor: string
    tipoTasa: TipoTasa
    frecuencia: Frecuencia
    plazo: number
    fechaDesembolso: Date
    cliente: {
      nombreCompleto: string
      documento: string
      telefono: string | null
      email: string | null
    }
    cuotas: CuotaData[]
    pagos: PagoData[]
  }
  generadoEn: string
}

function estadoCuota(cuota: CuotaData, hoy: Date): { label: string; style: object } {
  const pagada = cuota.pagos.some((p) => p.eliminadoEn === null)
  if (pagada) return { label: 'Pagada', style: styles.estadoPagada }
  if (cuota.fechaVencimiento < hoy) return { label: 'Mora', style: styles.estadoMora }
  return { label: 'Pendiente', style: styles.estadoPendiente }
}

export function EstadoCuentaPDF({ prestamo, generadoEn }: EstadoCuentaProps) {
  const hoy = new Date()
  const idCorto = prestamo.id.slice(0, 8).toUpperCase()

  const cuotasPagadas = prestamo.cuotas.filter((c) =>
    c.pagos.some((p) => p.eliminadoEn === null),
  ).length
  const totalPagado = prestamo.pagos.reduce((acc, p) => acc + p.montoCentavos, 0)
  const saldoPendiente = prestamo.cuotas
    .filter((c) => !c.pagos.some((p) => p.eliminadoEn === null))
    .reduce((acc, c) => acc + c.totalCentavos, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Estado de Cuenta</Text>
          <Text style={styles.headerMeta}>
            Préstamo #{idCorto} · Generado el {generadoEn}
          </Text>
        </View>

        {/* Datos del cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Cliente</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Text style={styles.label}>Nombre</Text>
              <Text style={styles.value}>{prestamo.cliente.nombreCompleto}</Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.label}>Documento</Text>
              <Text style={styles.value}>{prestamo.cliente.documento}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Text style={styles.label}>Teléfono</Text>
              <Text style={styles.value}>{prestamo.cliente.telefono ?? '—'}</Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{prestamo.cliente.email ?? '—'}</Text>
            </View>
          </View>
        </View>

        {/* Parámetros del préstamo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parámetros del Préstamo</Text>
          <View style={styles.row}>
            <View style={styles.col4}>
              <Text style={styles.label}>Sistema</Text>
              <Text style={styles.value}>{prestamo.sistema}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Monto</Text>
              <Text style={styles.value}>{formatCOP(prestamo.montoCentavos)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Tasa</Text>
              <Text style={styles.value}>
                {Number(prestamo.tasaValor).toFixed(2)}% {prestamo.tipoTasa}
              </Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Frecuencia</Text>
              <Text style={styles.value}>{prestamo.frecuencia}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col4}>
              <Text style={styles.label}>Plazo</Text>
              <Text style={styles.value}>{prestamo.plazo} periodos</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Desembolso</Text>
              <Text style={styles.value}>{formatFecha(prestamo.fechaDesembolso)}</Text>
            </View>
            <View style={styles.col4}>
              <Text style={styles.label}>Estado</Text>
              <Text style={styles.value}>{prestamo.estado}</Text>
            </View>
            <View style={styles.col4} />
          </View>
        </View>

        {/* Tabla de amortización */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Tabla de Amortización ({prestamo.cuotas.length} cuotas)
          </Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colNum}>#</Text>
            <Text style={styles.colFecha}>Vencimiento</Text>
            <Text style={styles.colCapital}>Capital</Text>
            <Text style={styles.colInteres}>Interés</Text>
            <Text style={styles.colTotal}>Total</Text>
            <Text style={styles.colSaldo}>Saldo</Text>
            <Text style={styles.colEstado}>Estado</Text>
          </View>
          {prestamo.cuotas.map((c, i) => {
            const { label, style } = estadoCuota(c, hoy)
            const rowStyle = i % 2 === 0 ? styles.tableRow : styles.tableRowAlt
            return (
              <View key={c.numero} style={rowStyle}>
                <Text style={styles.colNum}>{c.numero}</Text>
                <Text style={styles.colFecha}>{formatFecha(c.fechaVencimiento)}</Text>
                <Text style={styles.colCapital}>{formatCOP(c.capitalCentavos)}</Text>
                <Text style={styles.colInteres}>{formatCOP(c.interesCentavos)}</Text>
                <Text style={styles.colTotal}>{formatCOP(c.totalCentavos)}</Text>
                <Text style={styles.colSaldo}>{formatCOP(c.saldoCentavos)}</Text>
                <Text style={{ ...styles.colEstado, ...style }}>{label}</Text>
              </View>
            )
          })}
        </View>

        {/* Historial de pagos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Historial de Pagos ({prestamo.pagos.length})
          </Text>
          {prestamo.pagos.length === 0 ? (
            <Text style={{ color: '#71717a' }}>Sin pagos registrados.</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={styles.colPagoFecha}>Fecha</Text>
                <Text style={styles.colPagoMonto}>Monto</Text>
                <Text style={styles.colPagoTipo}>Tipo</Text>
                <Text style={styles.colPagoRegistrado}>Registrado por</Text>
              </View>
              {prestamo.pagos.map((p, i) => {
                const rowStyle = i % 2 === 0 ? styles.tableRow : styles.tableRowAlt
                return (
                  <View key={i} style={rowStyle}>
                    <Text style={styles.colPagoFecha}>{formatFecha(p.fechaPago)}</Text>
                    <Text style={styles.colPagoMonto}>{formatCOP(p.montoCentavos)}</Text>
                    <Text style={styles.colPagoTipo}>{p.tipoPago}</Text>
                    <Text style={styles.colPagoRegistrado}>{p.registradoPor.nombre}</Text>
                  </View>
                )
              })}
            </>
          )}
        </View>

        {/* Resumen */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total pagado</Text>
            <Text style={styles.summaryValue}>{formatCOP(totalPagado)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Saldo pendiente</Text>
            <Text style={styles.summaryValue}>{formatCOP(saldoPendiente)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cuotas pagadas</Text>
            <Text style={styles.summaryValue}>
              {cuotasPagadas} / {prestamo.cuotas.length}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
