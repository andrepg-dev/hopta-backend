import { stripe } from '@/constants/stripe/config.constants'
import { AppError } from '@/src/handlers/error-handler'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { EmailService } from '@/src/services/email/email.service'
import Logs from '@/src/services/logs/save-logs.service'
import { userModel } from '@/src/schemas/user.schemas'
import { Request, Response, Router } from 'express'
import Stripe from 'stripe'
import { responseHandler } from '@/src/handlers/responseHandler'

const stripeWebhookRouter = Router()

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
const emailService = new EmailService()

stripeWebhookRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature']
    let event: Stripe.Event

    try {
      if (!sig) throw new AppError('No signature', 400)
      if (!endpointSecret) throw new AppError('No endpoint secret', 500)

      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    } catch (error) {
      throw new AppError('Webhook error', 400)
    }

    const session = event.data.object as Stripe.Checkout.Session
    const user = await userModel.findOne({ email: session.customer_email })
    if (!user) throw new AppError('User not found', 404)

    switch (event.type) {
      case 'checkout.session.completed':
        console.log('✅ Pago completado:', session)
        break
      case 'invoice.paid':
        console.log('✅ Factura pagada:', event.data.object)

        await userModel.findByIdAndUpdate(user._id, {
          suscription: 'MONTHLY'
        })

        // Send email to user
        try {
          await emailService.sendEmail({
            to: { email: user.email, name: user.name },
            provider: 'sendgrid',
            subject: `Hola ${user.name}! Tu plan ha sido actualizado correctamente`,
            html: `
        <h1>Hola ${user.name}!</h1>
        <p>Tu plan ha sido actualizado correctamente</p>
        <p>Ahora puedes disfrutar de todos los beneficios de tu nuevo plan</p>
        <p>Gracias por tu compra</p>
        <p>Equipo de Hopta</p>
        `
          })
        } catch (error) {
          new Logs({
            message: `Error al enviar el email: ${error}`,
            method: 'saveErrorLogs'
          })
          throw new AppError('Error sending email', 500)
        }

        new Logs({
          message: `User ${user._id} updated suscription to MONTHLY`,
          method: 'saveLogs'
        })
        break

      case 'invoice.payment_failed':
        console.log('❌ Pago de factura fallido:', event.data.object)

        try {
          await emailService.sendEmail({
            to: { email: user.email, name: user.name },
            provider: 'sendgrid',
            subject: `Tu suscripción no pudo ser actualizada`,
            html: `
        <h3>Hola ${user.name}! Tu suscripción no pudo ser actualizada</h3>
        <p>Por favor, intenta nuevamente, o contacta directamente a nuestro equipo dando clic en el siguiente enlace: <a href="https://wa.me/573178000000">Contactar</a></p>
        <p>Equipo de Hopta</p>
        `
          })
        } catch (error) {
          new Logs({
            message: `Error al enviar el email: ${error}`,
            method: 'saveErrorLogs'
          })
          throw new AppError('Error sending email', 500)
        }
        break

      default:
        console.log('❌ Evento no manejado:', event.type)
        break
    }
    responseHandler({
      res,
      code: 200,
      message: 'Webhook received'
    })
  })
)

export default stripeWebhookRouter
