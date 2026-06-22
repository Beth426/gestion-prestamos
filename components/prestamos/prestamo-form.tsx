'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CreatePrestamoSchema,
  type CreatePrestamoOutput,
} from '@/lib/validaciones/prestamo.schema'
import type { Resolver } from 'react-hook-form'

// Use the output type (with defaults applied) as the form's field values type
type FormValues = CreatePrestamoOutput
import { simularPrestamo, type ResultadoSimulacion } from '@/lib/financiero/motor'
import { convertirTasaPeriodica } from '@/lib/financiero/tasas'
import { formatCOP } from '@/lib/format'

// ─── helpers ────────────────────────────────────────────────────────────────

function toSistemaMotor(s: FormValues['sistema']) {
  return s.toLowerCase() as 'tradicional' | 'pagadiario' | 'fijo'
}

function toTipoGraciaMotor(t: FormValues['tipoGracia']) {
  return t.toLowerCase() as 'ninguno' | 'parcial' | 'total'
}

function toFrecuenciaMotor(f: FormValues['frecuencia']) {
  return f.toLowerCase() as 'mensual' | 'quincenal' | 'semanal'
}

function toTipoTasaMotor(t: FormValues['tipoTasa']) {
  return t.toLowerCase() as 'anual' | 'mensual'
}

function calcularSimulacion(data: FormValues): ResultadoSimulacion {
  const sistema = toSistemaMotor(data.sistema)
  const frecuencia = toFrecuenciaMotor(data.frecuencia)

  let tasaPeriodica: number
  if (sistema === 'fijo') {
    // For FIJO, the rate is already periodic — divide by 100
    tasaPeriodica = data.tasaValor / 100
  } else {
    tasaPeriodica = convertirTasaPeriodica(
      data.tasaValor,
      toTipoTasaMotor(data.tipoTasa),
      frecuencia
    )
  }

  return simularPrestamo({
    monto: data.monto,
    totalPeriodos: data.plazo,
    tasaPeriodica,
    tipoCuota: 'auto',
    cuotaManual: 0,
    tipoGracia: toTipoGraciaMotor(data.tipoGracia),
    periodosGracia: data.periodosGracia,
    abonosExtra: {},
    sistema,
    seguro: data.seguro,
  })
}

// ─── component ──────────────────────────────────────────────────────────────

type ClienteOption = { id: string; nombreCompleto: string; documento: string }

export function PrestamoForm({ clientes = [] }: { clientes?: ClienteOption[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledClienteId = searchParams.get('clienteId') ?? ''

  const [step, setStep] = useState<1 | 2>(1)
  const [simulacion, setSimulacion] = useState<ResultadoSimulacion | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(CreatePrestamoSchema) as Resolver<FormValues>,
    defaultValues: {
      clienteId: prefilledClienteId,
      sistema: 'TRADICIONAL',
      tipoTasa: 'MENSUAL',
      frecuencia: 'MENSUAL',
      tipoGracia: 'NINGUNO',
      periodosGracia: 0,
      seguro: 0,
      fechaDesembolso: new Date().toISOString().slice(0, 10),
    },
  })

  // ── Step 1: simulate ──────────────────────────────────────────────────────
  function onStep1Submit(data: FormValues) {
    try {
      const result = calcularSimulacion(data)
      setSimulacion(result)
      setStep(2)
    } catch (e) {
      toast.error('Error al simular el préstamo')
      console.error(e)
    }
  }

  // ── Step 2: confirm & POST ────────────────────────────────────────────────
  async function onConfirm() {
    setIsConfirming(true)
    const data = getValues()
    try {
      const res = await fetch('/api/prestamos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? 'Error al crear el préstamo')
        return
      }
      const saved = await res.json()
      toast.success('Préstamo creado correctamente')
      router.push(`/prestamos/${saved.id}`)
      router.refresh()
    } finally {
      setIsConfirming(false)
    }
  }

  // ── render step 1 ─────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-5">
        {/* Cliente */}
        <div className="space-y-2">
          <Label>Cliente *</Label>
          {prefilledClienteId ? (
            <Input value={clientes.find(c => c.id === prefilledClienteId)?.nombreCompleto ?? prefilledClienteId} readOnly className="bg-muted" />
          ) : (
            <Select
              onValueChange={(v) => setValue('clienteId', v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombreCompleto} — {c.documento}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.clienteId && (
            <p className="text-xs text-red-600">{errors.clienteId.message}</p>
          )}
        </div>

        {/* Sistema */}
        <div className="space-y-2">
          <Label>Sistema de crédito *</Label>
          <Select
            defaultValue="TRADICIONAL"
            onValueChange={(v) =>
              setValue('sistema', v as FormValues['sistema'], { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona sistema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TRADICIONAL">Tradicional (cuota fija francesa)</SelectItem>
              <SelectItem value="PAGADIARIO">Pagadiario / gota a gota</SelectItem>
              <SelectItem value="FIJO">Fijo (interés plano)</SelectItem>
            </SelectContent>
          </Select>
          {errors.sistema && (
            <p className="text-xs text-red-600">{errors.sistema.message}</p>
          )}
        </div>

        {/* Monto */}
        <div className="space-y-2">
          <Label htmlFor="monto">Monto (pesos) *</Label>
          <Input
            id="monto"
            type="number"
            min={1000}
            step={1000}
            {...register('monto', { valueAsNumber: true })}
            placeholder="1000000"
          />
          {errors.monto && (
            <p className="text-xs text-red-600">{errors.monto.message}</p>
          )}
        </div>

        {/* Tasa */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tasaValor">Tasa (%) *</Label>
            <Input
              id="tasaValor"
              type="number"
              min={0.01}
              max={100}
              step={0.01}
              {...register('tasaValor', { valueAsNumber: true })}
              placeholder="2.5"
            />
            {errors.tasaValor && (
              <p className="text-xs text-red-600">{errors.tasaValor.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Tipo de tasa</Label>
            <Select
              defaultValue="MENSUAL"
              onValueChange={(v) =>
                setValue('tipoTasa', v as FormValues['tipoTasa'], { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MENSUAL">Mensual</SelectItem>
                <SelectItem value="ANUAL">Anual efectiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Frecuencia y plazo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Frecuencia de pago</Label>
            <Select
              defaultValue="MENSUAL"
              onValueChange={(v) =>
                setValue('frecuencia', v as FormValues['frecuencia'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MENSUAL">Mensual</SelectItem>
                <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                <SelectItem value="SEMANAL">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="plazo">Plazo (períodos) *</Label>
            <Input
              id="plazo"
              type="number"
              min={1}
              max={360}
              {...register('plazo', { valueAsNumber: true })}
              placeholder="12"
            />
            {errors.plazo && (
              <p className="text-xs text-red-600">{errors.plazo.message}</p>
            )}
          </div>
        </div>

        {/* Gracia */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Período de gracia</Label>
            <Select
              defaultValue="NINGUNO"
              onValueChange={(v) =>
                setValue('tipoGracia', v as FormValues['tipoGracia'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NINGUNO">Sin gracia</SelectItem>
                <SelectItem value="PARCIAL">Parcial (solo interés)</SelectItem>
                <SelectItem value="TOTAL">Total (sin pago)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="periodosGracia">Períodos de gracia</Label>
            <Input
              id="periodosGracia"
              type="number"
              min={0}
              max={120}
              {...register('periodosGracia', { valueAsNumber: true })}
              placeholder="0"
            />
          </div>
        </div>

        {/* Seguro */}
        <div className="space-y-2">
          <Label htmlFor="seguro">Seguro por período (pesos)</Label>
          <Input
            id="seguro"
            type="number"
            min={0}
            step={1000}
            {...register('seguro', { valueAsNumber: true })}
            placeholder="0"
          />
        </div>

        {/* Fecha de desembolso */}
        <div className="space-y-2">
          <Label htmlFor="fechaDesembolso">Fecha de desembolso *</Label>
          <Input
            id="fechaDesembolso"
            type="date"
            {...register('fechaDesembolso')}
          />
          {errors.fechaDesembolso && (
            <p className="text-xs text-red-600">{errors.fechaDesembolso.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full">
          Simular préstamo →
        </Button>
      </form>
    )
  }

  // ── render step 2 ─────────────────────────────────────────────────────────
  if (step === 2 && simulacion) {
    const data = getValues()
    return (
      <div className="space-y-6">
        {/* Resumen */}
        <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Resumen de la simulación
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <span className="text-muted-foreground">Monto desembolsado</span>
            <span className="font-medium text-right">{formatCOP(data.monto * 100)}</span>

            <span className="text-muted-foreground">Cuota</span>
            <span className="font-medium text-right">
              {formatCOP(simulacion.cuotaAplicada * 100)}
            </span>

            <span className="text-muted-foreground">Total a pagar</span>
            <span className="font-medium text-right">
              {formatCOP(simulacion.totalPagado * 100)}
            </span>

            <span className="text-muted-foreground">Total intereses</span>
            <span className="font-medium text-right">
              {formatCOP(simulacion.totalInteres * 100)}
            </span>

            {simulacion.totalSeguro > 0 && (
              <>
                <span className="text-muted-foreground">Total seguros</span>
                <span className="font-medium text-right">
                  {formatCOP(simulacion.totalSeguro * 100)}
                </span>
              </>
            )}

            <span className="text-muted-foreground">Períodos</span>
            <span className="font-medium text-right">{simulacion.periodosTotales}</span>
          </div>

          {simulacion.amortizacionNegativa && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠ La cuota no cubre todos los intereses en algunos períodos (amortización negativa).
            </p>
          )}
        </div>

        {/* Tabla de amortización */}
        <div>
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
            Tabla de amortización
          </h2>
          <div className="overflow-auto max-h-72 rounded border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-background border-b">
                <tr className="text-right">
                  <th className="text-left px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Cuota</th>
                  <th className="px-3 py-2 font-medium">Capital</th>
                  <th className="px-3 py-2 font-medium">Interés</th>
                  {data.seguro > 0 && (
                    <th className="px-3 py-2 font-medium">Seguro</th>
                  )}
                  <th className="px-3 py-2 font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {simulacion.lineas.map((l) => (
                  <tr
                    key={l.num}
                    className={[
                      'text-right border-b last:border-0',
                      l.esGracia ? 'bg-blue-50 dark:bg-blue-950/30' : '',
                      l.esNegativo ? 'bg-amber-50 dark:bg-amber-950/30' : '',
                    ].join(' ')}
                  >
                    <td className="text-left px-3 py-1.5 tabular-nums text-muted-foreground">
                      {l.num}
                    </td>
                    <td className="px-3 py-1.5 tabular-nums">
                      {formatCOP(l.pagoMensual * 100)}
                    </td>
                    <td className="px-3 py-1.5 tabular-nums">
                      {formatCOP(l.abonoCapitalBase * 100)}
                    </td>
                    <td className="px-3 py-1.5 tabular-nums">
                      {formatCOP(l.interes * 100)}
                    </td>
                    {data.seguro > 0 && (
                      <td className="px-3 py-1.5 tabular-nums">
                        {formatCOP(l.seguro * 100)}
                      </td>
                    )}
                    <td className="px-3 py-1.5 tabular-nums">
                      {formatCOP(l.saldoRestante * 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
            ← Editar parámetros
          </Button>
          <Button
            className="flex-1"
            disabled={isConfirming}
            onClick={onConfirm}
          >
            {isConfirming ? 'Creando…' : 'Confirmar y crear préstamo'}
          </Button>
        </div>
      </div>
    )
  }

  return null
}
