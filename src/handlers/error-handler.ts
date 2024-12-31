import { NextFunction, Request, Response } from 'express'

export class AppError extends Error {
  statusCode: number

  constructor(message: any, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'

  res.status(statusCode).json({ success: false, error: message })
}
