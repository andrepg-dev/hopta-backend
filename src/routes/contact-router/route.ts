import { COOKIES } from '@/constants/cookies.constants'
import asyncHandler from '@/src/actions/try-catch-async-handler'
import { AppError } from '@/src/handlers/error-handler'
import { responseHandler } from '@/src/handlers/responseHandler'
import { UserJWT } from '@/src/middlewares/authMiddleware'
import { validateRequest } from '@/src/middlewares/validate-request'
import { contactModel } from '@/src/schemas/contact.schema'
import { RealStateModel } from '@/src/schemas/real-state.schemas'
import { userModel } from '@/src/schemas/user.schemas'
import { EmailService } from '@/src/services/email/email.service'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import { contactSchema } from '@/src/zod/contact-owner.zod'
import { Request, Response, Router } from 'express'

const contactRouter = Router()

// agregar validaciones con zod
contactRouter.post(
  '/',
  validateRequest(contactSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, phone, reason, comment, owner_id, property_id } = req.body

    const userOwnerData = await userModel.findById(owner_id)
    const propertyData = await RealStateModel.findById(property_id)

    if (!propertyData) throw new AppError('Property not found', 404)
    if (!userOwnerData) throw new AppError('User not found', 404)

    const ownerEmail = userOwnerData?.contact?.email_contact || userOwnerData?.email
    if (!ownerEmail) throw new AppError('Owner email not found', 404)

    const accessToken = req.cookies[COOKIES.jwt_access_token.name]
    let decoded: UserJWT | null = null

    if (accessToken) {
      decoded = TokenManager.verifyToken(accessToken) as UserJWT
    }

    // Guardar el contacto en la base de datos
    await contactModel.create({
      propertyId: property_id,
      ownerId: owner_id,
      client: {
        name,
        phone,
        email,
        id: decoded?.userId ? decoded.userId : null
      },
      reason
    })

    const emailService = new EmailService()
    emailService.sendEmail({
      to: {
        email: ownerEmail,
        name: userOwnerData?.name
      },
      provider: 'sendgrid',
      subject: `El usuario ${name} te ha contactado`,
      template: 'contact',
      dynamicTemplateData: {
        ownerName: userOwnerData?.name + ' ' + (userOwnerData?.last_name || ''),
        name,
        phone: phone || 'No proporcionado',
        reason: reason || 'No proporcionado',
        comment: comment || 'No proporcionado',
        email: email || 'No proporcionado',
        propertyId: property_id
      }
    })

    responseHandler({
      res,
      code: 200,
      message: 'Email sent succesfully'
    })
  })
)

export default contactRouter
