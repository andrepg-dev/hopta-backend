import z from 'zod'

export const reportPropertySchema = z.object({
  id: z.string(),
  message: z.string().optional(),
  reason: z.string().min(1, 'El motivo es requerido'),
  url: z.string().min(1, 'La URL de la propiedad es requerida')
})