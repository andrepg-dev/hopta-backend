import { AppError } from '@/src/handlers/error-handler'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { EmailService } from '@/src/modules/email/email.service'
import Logs from '@/src/modules/logs/save-logs.service'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import { Request, Response, Router } from 'express'

const supportRouter = Router()

supportRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { message, subject, email, phoneNumber } = req.body

  if (!message) {
    throw new AppError('Message is required', 400)
  }

  // Get user from token if exists
  const authHeader = req.headers.authorization
  if (!authHeader) throw new AppError('Unauthorized', 401)
  const [bearer, token] = authHeader.split(' ')
  if (bearer !== 'Bearer' || !token) throw new AppError('Invalid token format', 401)
  const decoded = TokenManager.verifyToken(token)
  const user = decoded as { userId: string; iat: number; exp: number }

  // Send email to support with the information of the user
  const emailService = new EmailService()
  const response = await emailService.sendEmail({
    to: {
      email: 'asponceg@gmail.com',
      name: 'Support'
    },
    subject: subject ? `Hopta - Support: ${subject}` : 'Hopta - Support: No subject',
    html: `${message} <br> <br> <strong>Phone Number:</strong> ${phoneNumber} <br> <strong>Email:</strong> ${email} <br> <strong>User:</strong> ${user.userId}`,
    provider: 'sendgrid'
  })

  if (!response) {
    new Logs({
      method: 'saveErrorLogs',
      message: `Error sending email: ${JSON.stringify({ phoneNumber, email, message })}`,
    })

    throw new AppError('Error sending email', 500)
  }

  res.status(200).json({ success: true, message: 'Email sent successfully to support' })
}))

export default supportRouter