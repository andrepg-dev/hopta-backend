import { NextFunction, Request, Response } from 'express'
import z from 'zod'

export const validateRequest = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body)
    next()
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message
      }))
      res.status(400).json({ success: false, errors: formattedErrors })
      return
    }

    next(error)
  }
}
