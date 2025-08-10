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
import { WhatsAppMSGSender } from '@/src/services/messages-sender/send-whatsapp-msg.service'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import { contactSchema } from '@/src/zod/contact-owner.zod'
import { Request, Response, Router } from 'express'

// First send email, and then send sms, because sending sms is not free

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

    const ownerPhoneNumber = userOwnerData?.contact?.phone_number
    const ownerEmail = userOwnerData?.contact?.email_contact || userOwnerData?.email

    if (!ownerEmail && !ownerPhoneNumber) throw new AppError('Owner email and phone number not found', 404)

    const accessToken = req.cookies[COOKIES.jwt_access_token.name]
    let decoded: UserJWT | null = null

    if (accessToken) {
      decoded = TokenManager.verifyToken(accessToken) as UserJWT
    }

    // Send email
    if (ownerEmail) {
      try {
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
      } catch (error) {
        throw new AppError('Error sending email: ' + error, 500)
      }
    }

    if (ownerPhoneNumber) {
      try {
        const whatsappSender = new WhatsAppMSGSender(ownerPhoneNumber)

        let message = `Hola ${userOwnerData?.name}!, el usuario ${name} te ha contactado, puedes contacta con el por WhatsApp! ${phone} o por correo electrónico! ${email}`
        if (phone) message = `Hola ${userOwnerData?.name}!, el usuario ${name} te ha contactado, puedes contacta con el por WhatsApp! ${phone}`
        if (email) message = `Hola ${userOwnerData?.name}!, el usuario ${name} te ha contactado, puedes contacta con el por correo electrónico! ${email}`

        await whatsappSender.sendWhatsAppMSG({
          message
        })
      } catch (error) {
        throw new AppError('Error sending whatsapp message: ' + error, 500)
      }
    }

    // Guardar el contacto en la base de datos
    try {
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
    } catch (error) {
      throw new AppError('Error saving contact: ' + error, 500)
    }

    responseHandler({
      res,
      code: 200,
      message: 'Contact saved succesfully'
    })
  })
)

export default contactRouter
