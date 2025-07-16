import z from 'zod'

export const reportPropertySchema = z.object({
  id: z.string(),
  message: z.string().optional(),
  reason: z.string().min(1, 'El motivo es requerido'),
  reservationsUrl: z.string().min(1, 'La URL de reservas es requerida'),
})