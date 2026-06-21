import { z } from 'zod'

export const CreatePrestamoSchema = z.object({
  clienteId: z.string().cuid(),
  sistema: z.enum(['TRADICIONAL', 'PAGADIARIO', 'FIJO']),
  monto: z.number().positive().max(999_999_999),
  tasaValor: z.number().positive().max(100),
  tipoTasa: z.enum(['ANUAL', 'MENSUAL']),
  frecuencia: z.enum(['MENSUAL', 'QUINCENAL', 'SEMANAL']),
  plazo: z.number().int().min(1).max(360),
  tipoGracia: z.enum(['NINGUNO', 'PARCIAL', 'TOTAL']).default('NINGUNO'),
  periodosGracia: z.number().int().min(0).max(120).default(0),
  seguro: z.number().min(0).default(0),
  fechaDesembolso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export type CreatePrestamoInput = z.infer<typeof CreatePrestamoSchema>
