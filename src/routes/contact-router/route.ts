import asyncHandler from '@/src/actions/try-catch-async-handler'
import { AppError } from '@/src/handlers/error-handler'
import { responseHandler } from '@/src/handlers/responseHandler'
import { validateRequest } from '@/src/middlewares/validate-request'
import { RealStateModel } from '@/src/schemas/real-state.schemas'
import { userModel } from '@/src/schemas/user.schemas'
import { EmailService } from '@/src/services/email/email.service'
import { contactOwnerSchema } from '@/src/zod/contact-owner.zod'
import { Request, Response, Router } from 'express'

const contactRouter = Router()

// agregar validaciones con zod
contactRouter.post(
  '/',
  validateRequest(contactOwnerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, phone, reason, comment, owner_id, property_id } = req.body

    const userOwnerData = await userModel.findById(owner_id)
    const propertyData = await RealStateModel.findById(property_id)

    if (!propertyData) throw new AppError('Property not found', 404)
    if (!userOwnerData) throw new AppError('User not found', 404)

    const ownerEmail = userOwnerData?.contact?.email_contact || userOwnerData?.email
    if (!ownerEmail) throw new AppError('Owner email not found', 404)

    const emailService = new EmailService()
    emailService.sendEmail({
      to: {
        email: ownerEmail,
        name: userOwnerData?.name
      },
      provider: 'sendgrid',
      subject: `El usuario ${name} te ha contactado`,
      html: `El usuario ${name} te ha contactado, ${phone}, ${reason}, ${comment}, ${email} y quiere saber informacion de la propiedad ${propertyData}`
    })

    responseHandler({
      res,
      code: 200,
      message: 'Email sent succesfully'
    })
  })
)

export default contactRouter
