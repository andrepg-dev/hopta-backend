import { COOKIES } from '@/constants/cookies.constants'
import asyncHandler from '@/src/actions/try-catch-async-handler'
import { AppError } from '@/src/handlers/error-handler'
import { responseHandler } from '@/src/handlers/responseHandler'
import { authMiddleware, UserJWT } from '@/src/middlewares/authMiddleware'
import { validateRequest } from '@/src/middlewares/validate-request'
import { contactModel } from '@/src/schemas/contact.schema'
import { RealStateModel } from '@/src/schemas/real-state.schemas'
import { userModel } from '@/src/schemas/user.schemas'
import { EmailService } from '@/src/services/email/email.service'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import { contactSchema } from '@/src/zod/contact-owner.zod'
import { Request, Response, Router } from 'express'

// First send email, and then send sms, because sending sms is not free
const contactRouter = Router()

// Get the contacts maded
contactRouter.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user
    if (!user?.userId) return responseHandler({ code: 404, res, message: 'You are not log in.' })
    const contacts = await contactModel.find({ ownerId: user?.userId })

    responseHandler({
      code: 200,
      res,
      data: contacts
    })
  })
)

// agregar validaciones con zod
contactRouter.post(
  '/',
  validateRequest(contactSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, phone, reason, comment, owner_id, property_id } = req.body

    const accessToken = req.cookies[COOKIES.jwt_access_token.name]
    let decoded: UserJWT | null = null

    if (accessToken) {
      decoded = TokenManager.verifyToken(accessToken) as UserJWT
    }

    if (owner_id === decoded?.userId) {
      return responseHandler({
        code: 200,
        res,
        message: 'You should not contact yourself, skip.'
      })
    }

    const userOwnerData = await userModel.findById(owner_id)
    const propertyData = await RealStateModel.findById(property_id)

    if (!propertyData) throw new AppError('Property not found', 404)
    if (!userOwnerData) throw new AppError('User not found', 404)

    const ownerPhoneNumber = userOwnerData?.contact?.phone_number
    const ownerEmail = userOwnerData?.contact?.email_contact || userOwnerData?.email

    if (!ownerEmail && !ownerPhoneNumber) throw new AppError('Owner email and phone number not found', 404)

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
          provider: 'amazon-ses',
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

        console.log('Email sent successfully')
      } catch (error) {
        throw new AppError('Error sending email: ' + error, 500)
      }
    }

    if (ownerPhoneNumber) {
      const emailService = new EmailService()

      emailService.sendEmail({
        to: {
          email: 'asponceg@gmail.com',
          name: 'André Ponce'
        },
        provider: 'amazon-ses',
        subject: 'El usuario ' + name + ' ha contactado un propietario!!!!!',
        html: `
        Fecha: ${new Date().toLocaleDateString()} <br>
        Hora: ${new Date().toLocaleTimeString()} <br>

        Contacta por whatsapp al propietario: ${ownerPhoneNumber} <br>

        Datos del dueño del alquiler: <br>
        Nombre: ${userOwnerData?.name} <br>
        Email: ${ownerEmail} <br>
        Teléfono: ${ownerPhoneNumber} <br> 
        <br>

        Cliente: <br>
        Nombre: ${name} <br>
        Teléfono: ${phone || 'No proporcionado'} <br>
        Razón: ${reason || 'No proporcionado'} <br>
        Comentario: ${comment || 'No proporcionado'} <br>
        Email: ${email || 'No proporcionado'} <br>
        Propiedad: ${propertyData?.title || 'No proporcionado'} <br>
        `
      })
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
        reason,
        createdAt: Date.now()
      })
    } catch (error) {
      throw new AppError('Error saving contact: ' + error, 500)
    }

    responseHandler({
      res,
      code: 200,
      message: 'Contact succesfully sent'
    })
  })
)

export default contactRouter
