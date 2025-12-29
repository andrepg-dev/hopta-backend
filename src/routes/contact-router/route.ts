import asyncHandler from "@/src/actions/try-catch-async-handler"
import { AppError } from "@/src/handlers/error-handler"
import { responseHandler } from "@/src/handlers/responseHandler"
import { authMiddleware } from "@/src/middlewares/authMiddleware"
import { validateRequest } from "@/src/middlewares/validate-request"
import { contactModel } from "@/src/schemas/contact.schema"
import { RealStateModel } from "@/src/schemas/real-state.schemas"
import { userModel } from "@/src/schemas/user.schemas"
import { EmailService } from "@/src/services/email/email.service"
import { contactFormSchema } from "@/src/zod/contact-form.zod"
import { contactSchema } from "@/src/zod/contact-owner.zod"
import { Request, Response, Router } from "express"

// First send email, and then send sms, because sending sms is not free
const contactRouter = Router()

// Get the contacts maded
contactRouter.get(
  "/",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user
    const contacts = await contactModel
      .find({ ownerId: user?.userId })
      .populate({
        path: "propertyId",
        select: "title images location price"
      })
      .populate({
        path: "client.id",
        model: "User",
        select: "_id name last_name email profile_picture"
      })
      .sort({ createdAt: -1 })

    responseHandler({
      code: 200,
      res,
      data: contacts
    })
  })
)

// <================== CLIENT -> OWNER OF THE PROPERTY ==================>

contactRouter.post(
  "/",
  validateRequest(contactSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, phone, reason, comment, propertyId } = req.body

    const user = req?.user

    const propertyData = await RealStateModel.findById(propertyId).setOptions({ user: req.user })

    const propertyOwnerId = propertyData && propertyData.owner

    // If user is the own person that is contact
    if (propertyOwnerId?.id === user?.userId) {
      responseHandler({
        code: 200,
        res,
        message: "You cannot contact yourself, skip."
      })
      return
    }

    const ownerUserData = await userModel.findById(propertyOwnerId)

    if (!propertyData) throw new AppError("Property not found", 404)
    if (!propertyData.owner) throw new AppError("User not found", 404)

    const ownerPhoneNumber = ownerUserData?.contact?.phone_number
    const ownerEmail = ownerUserData?.contact?.email_contact || ownerUserData?.email

    if (!ownerEmail && !ownerPhoneNumber) throw new AppError("Owner email and phone number not found", 404)

    // Send email
    if (ownerEmail) {
      try {
        const emailService = new EmailService()
        emailService.sendEmail({
          to: {
            email: ownerEmail,
            name: ownerUserData?.name
          },
          provider: "resend",
          subject: `El usuario ${name} te ha contactado`,
          template: "contact",
          dynamicTemplateData: {
            OWNER_NAME: ownerUserData?.name + " " + (ownerUserData?.last_name || ""),
            NAME: name,
            PHONE: phone,
            REASON: reason ?? "El usuario quiere más información",
            COMMENT: comment ?? "No proporcionado",
            EMAIL_CONTACT: email ?? "No proporcionado",
            PROPERTY_ID: propertyId,
            PROPERTY_IMAGE: propertyData.images[0] ?? "",
            DATE: (() => {
              const date = new Date()
              const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
              const dayName = days[date.getDay()]

              const formattedDate = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
              })

              return `${dayName} / ${formattedDate}`
            })(),
            HOUR: (() => {
              const date = new Date()
              return date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                second: "numeric",
                hour12: true
              })
            })()
          }
        })
      } catch (error) {
        throw new AppError("Error sending email: " + error, 500)
      }
    }

    if (ownerPhoneNumber) {
      const emailService = new EmailService()

      emailService.sendEmail({
        to: {
          email: "asponceg@gmail.com",
          name: "André Ponce"
        },
        provider: "nodemailer",
        subject: "El usuario " + name + " ha contactado un propietario!!!!!",
        html: `
        Fecha: ${new Date().toLocaleDateString()} <br>
        Hora: ${new Date().toLocaleTimeString()} <br>

        Contacta por whatsapp al propietario: ${ownerPhoneNumber} <br>

        Datos del dueño de la propiedad: <br>
        Nombre: ${ownerUserData?.name} <br>
        Email: ${ownerEmail} <br>
        Teléfono: ${ownerPhoneNumber} <br> 
        <br>

        Cliente: <br>
        Nombre: ${name} <br>
        Teléfono: ${phone || "No proporcionado"} <br>
        Razón: ${reason || "No proporcionado"} <br>
        Comentario: ${comment || "No proporcionado"} <br>
        Email: ${email || "No proporcionado"} <br>
        Propiedad: ${propertyData?.title || "No proporcionado"} <br>
        `
      })
    }

    // Guardar el contacto en la base de datos
    try {
      await contactModel.create({
        propertyId: propertyId,
        ownerId: propertyOwnerId,
        client: {
          name,
          phone,
          email,
          id: user?.userId ? user.userId : null
        },
        reason,
        createdAt: Date.now(),
        comment
      })
    } catch (error) {
      throw new AppError("Error saving contact: " + error, 500)
    }

    responseHandler({
      res,
      code: 200,
      message: "Contact succesfully sent"
    })
  })
)

// <================== Manage user ==================>
contactRouter.post(
  "/manage-clients",
  asyncHandler((req: Request, res: Response) => {
    responseHandler({ res, code: 200 })
  })
)

// <================== Dashboard contact form ==================>
contactRouter.post(
  "/contact-form",
  validateRequest(contactFormSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { agency, name, phone, who_is_the_client } = req.body

    if (!name || !phone) {
      throw new AppError("Agency, name and phone are required", 400)
    }

    const emailService = new EmailService()

    emailService.sendEmail({
      to: {
        email: "asponceg@gmail.com",
        name: "Support"
      },
      provider: "nodemailer",
      subject: "El usuario " + name + " ha contactado desde el formulario de contacto",
      html: `
      Fecha: ${new Date().toLocaleDateString()} <br>
      Hora: ${new Date().toLocaleTimeString()} <br>
      Agencia: ${agency || "No proporcionado"} <br>
      Quien es el cliente: ${who_is_the_client || "No proporcionado"} <br>
      Teléfono: ${phone || "No proporcionado"} <br>
      Razón: ${"Quiero conocer mas información"} <br>
      `
    })

    responseHandler({
      res,
      code: 200,
      message: "Email sent successfully"
    })
  })
)

export default contactRouter
