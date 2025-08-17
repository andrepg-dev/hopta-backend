import { AppError } from '@/src/handlers/error-handler'
import { NextFunction, Request, Response } from 'express'
import z from 'zod'

export const validateRequest = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body)
    next()
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code
      }))

      // Crear un mensaje de error más legible
      const errorMessages = formattedErrors.map(err => `${err.field}: ${err.message}`).join(', ')

      throw new AppError(`Error de validación: ${errorMessages}`, 400)
    }

    next(error)
  }
}
