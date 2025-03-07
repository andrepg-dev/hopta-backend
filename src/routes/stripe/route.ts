import { stripe } from '@/constants/stripe/config.constants'
import { line_items } from '@/constants/stripe/session.constants'
import { AppError } from '@/src/handlers/error-handler'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import Logs from '@/src/modules/logs/save-logs.service'
import RandomIntUtils from '@/src/utils/random-int.utils'
import { Request, Response, Router } from 'express'

const paymentRouter = Router()

paymentRouter.get('/create-checkout-session', asyncHandler(async (req: Request, res: Response) => {
  const code = RandomIntUtils.randomInt()

  const { plan } = req.query

  if (!plan) {
    throw new AppError('query plan is required, choose between "monthly" or "yearly"', 400)
  }

  if (!line_items[plan as keyof typeof line_items]) {
    throw new AppError('Plan is not valid, choose between "monthly" or "yearly"', 400)
  }

  const line_item = line_items[plan as keyof typeof line_items]
  console.log(line_item)

  new Logs({
    method: 'saveLogs',
    message: `Creating checkout session for ${req?.user?.email} with plan ${plan}`
  })

  new Logs({
    method: 'saveLogs',
    message: req.user ? req.user : 'No user found'
  })

  const session = await stripe.checkout.sessions.create({
    line_items: new Array(line_item),
    success_url: `${process.env.FRONTEND_URL}/payments/success?code=${code}`,
    cancel_url: `${process.env.FRONTEND_URL}/payments/cancel?code=${code}`,
    mode: 'subscription',
    customer_email: req?.user?.email,
    billing_address_collection: 'auto',
    allow_promotion_codes: true,
  })

  res.json(session)
}))

paymentRouter.get('/success', (req, res) => {
  res.send('Gracias por tu compra!')
})

paymentRouter.get('/cancel', (req, res) => {
  res.send(
    'Que lo que pasó crack, por qué cancelaste el plan? NOOOOOOOOOOOOOOOOOOOOOOO',
  )
})

export default paymentRouter
