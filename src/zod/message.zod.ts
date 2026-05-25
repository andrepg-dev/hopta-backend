import { ObjectIdSchema } from "@/src/zod/validations/mongoose-id.validation"
import z from "zod"

export const sendMessageSchema = z.object({
  conversationId: ObjectIdSchema,
  body: z.string().trim().min(1).max(2000)
})
