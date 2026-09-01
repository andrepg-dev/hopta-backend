import { NextFunction, Request, Response } from "express"
import { EmailService } from "../services/email/email.service"
import Logs from "../services/logs/save-logs.service"

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
  const message = err.message || "Internal server error"

  new Logs({
    method: "saveErrorLogs",
    message: message
  })

  if (statusCode == 500) {
    if (process.env.NODE_ENV !== "development") {
      const email = new EmailService()
      email.sendEmail({
        provider: "nodemailer",
        to: {
          email: "asponceg@gmail.com",
          name: "André Ponce"
        },
        subject: "ALERTA! Errores en producción activos! 🚨",
        html: `El servidor está teniendo errores: <br>${err}</b>`
      }).catch((emailError: unknown) => {
        console.error("Failed to send error alert email:", emailError)
      })
    }

    res.status(statusCode).json({ success: false, error: process.env.NODE_ENV === "development" ? message : "Internal server error" })
    return
  }

  res.status(statusCode).json({ success: false, error: message })
}
