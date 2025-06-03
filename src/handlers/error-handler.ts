import { NextFunction, Request, Response } from 'express'
import Logs from '../services/logs/save-logs.service'

export class AppError extends Error {
  /**
   * @description The status code of the error
   * @default 500
   * 
   * Explanation of status codes:
   * 500: Internal server error
   * 400: Bad request
   * 401: Unauthorized
   * 403: Forbidden
   * 404: Not found
   */
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

  new Logs({
    method: 'saveErrorLogs',
    message: message
  })

  if (statusCode == 500) {
    res.status(statusCode).json({ success: false, error: process.env.NODE_ENV === 'development' ? message : 'Internal server error' })
  }

  res.status(statusCode).json({ success: false, error: message })
}
