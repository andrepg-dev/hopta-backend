import validator from "validator"
import z from "zod"

export const contactSchema = z.object({
  email: z.string().optional(),
  name: z.string().min(3, "Name must be at least 3 characters long.").max(120),
  phone: z.string().refine((v) => validator.isMobilePhone(v, "any"), { message: "invalid" }),
  reason: z.string().max(2000).min(5),
  comment: z.string().max(2000).optional(),
  owner_id: z.string().optional(),
  propertyId: z.string()
})
