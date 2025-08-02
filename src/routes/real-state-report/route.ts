import { COOKIES } from '@/constants/cookies.constants'
import asyncHandler from '@/src/actions/try-catch-async-handler'
import { AppError } from '@/src/handlers/error-handler'
import { responseHandler } from '@/src/handlers/responseHandler'
import { UserJWT } from '@/src/middlewares/authMiddleware'
import { validateRequest } from '@/src/middlewares/validate-request'
import RealStateReport from '@/src/schemas/real-state-reports.schemas'
import { RealStateModel } from '@/src/schemas/real-state.schemas'
import { userModel } from '@/src/schemas/user.schemas'
import { EmailService } from '@/src/services/email/email.service'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import { reportPropertySchema } from '@/src/zod/report-property'
import { Request, Response, Router } from 'express'

const reportsRouter = Router()

reportsRouter.post('/real-state',
  validateRequest(reportPropertySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id, message, reason, reservationsUrl } = req.body

    const realState = await RealStateModel.findById(id)

    if (!realState) {
      throw new AppError('Real state not found', 404)
    }

    const accessToken = req.cookies[COOKIES.jwt_access_token.name]
    let decoded: UserJWT | null = null

    if (accessToken) {
      decoded = TokenManager.verifyToken(accessToken) as UserJWT
    }

    const emailService = new EmailService()

    if (decoded) {
      const user = await userModel.findById(decoded.userId)
      if (user?.email) {
        await emailService.sendEmail({
          provider: 'sendgrid',
          to: {
            email: user.email,
            name: user.name
          },
          subject: 'Reporte de propiedad',
          html: `
            <h1>Hola ${user.name},</h1>
            <p>Hemos recibido un reporte de propiedad por el motivo de ${reason}.</p>
            <p>De la siguiente URL: ${reservationsUrl}</p>
            <p>Gracias por tu ayuda. Revisaremos la propiedad lo antes posible y la eliminaremos si es necesario.</p>
          `
        })
      }
    }

    emailService.sendEmail({
      provider: 'nodemailer',
      to: {
        email: 'asponceg@gmail.com',
        name: 'André Ponce CEO & Founder'
      },
      subject: 'Reporte de propiedad',
      html: `
        <p>Hola mi poderisisimo fundador, </p>
        <p>Un usuario ha reportado la propiedad <strong>${realState.title}</strong> por el motivo de <strong>${reason}</strong> dijo: <pre>${message}</pre></p>
        <p>De la siguiente URL: ${reservationsUrl}</p>
      `,
    })

    try {
      await RealStateReport.create({
        realStateId: id,
        userId: decoded?.userId,
        message,
        reason,
        reservationsUrl
      })
      responseHandler({
        res,
        code: 201,
        message: 'Real state report created successfully'
      })
    } catch (error: any) {
      console.error('Error creating real state report:', error)
      throw new AppError(error.message || 'Error creating real state report', 500)
    }
  }))

/* reportsRouter.get('/real-state', (async (req: Request, res: Response) => {
  const realStateReports = await RealStateReport.find()
  responseHandler({
    res,
    code: 200,
    data: realStateReports
  })
}) as RequestHandler) */

export default reportsRouter
