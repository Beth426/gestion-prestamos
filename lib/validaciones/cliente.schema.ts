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
