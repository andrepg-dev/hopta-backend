import validator from 'validator'
import z from 'zod'

export const contactFormSchema = z.object({
  agency: z.string().min(3, 'Agency must be at least 3 characters long.').max(120),
  name: z.string().min(3, 'Name must be at least 3 characters long.').max(120),
  phone: z
    .string()
    .max(30)
    .refine((v) => validator.isMobilePhone(v, 'any'), { message: 'invalid' })
})
