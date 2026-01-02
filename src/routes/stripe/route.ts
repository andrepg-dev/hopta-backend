import { stripe } from "@/constants/stripe/config.constants"
import { line_items } from "@/constants/stripe/session.constants"
import asyncHandler from "@/src/actions/try-catch-async-handler"
import { AppError } from "@/src/handlers/error-handler"
import { responseHandler } from "@/src/handlers/responseHandler"
import { authMiddleware } from "@/src/middlewares/authMiddleware"
import { userModel } from "@/src/schemas/user.schemas"
import RandomIntUtils from "@/src/utils/random-int.utils"
import { Request, Response, Router } from "express"
import Stripe from "stripe"

const paymentRouter = Router()

paymentRouter.post(
  "/create-checkout-session",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const code = RandomIntUtils.randomInt()

    const { plan } = req.body

    if (!plan) {
      throw new AppError('query plan is required, choose between "monthly" or "yearly"', 400)
    }

    if (!line_items[plan as keyof typeof line_items]) {
      throw new AppError('Plan is not valid, choose between "monthly" or "yearly"', 400)
    }

    const line_item = line_items[plan as keyof typeof line_items]

    if (!line_item) {
      throw new AppError("Line item not found for the selected plan", 400)
    }

    const user = await userModel.findById(req.user?.userId)
    if (!user) {
      throw new AppError("User not found", 404)
    }

    let createPaymentObject: Stripe.Checkout.SessionCreateParams = {
      line_items: [line_item],
      success_url: `${process.env.FRONTEND_URL}/payments/success?code=${code}`,
      cancel_url: `${process.env.FRONTEND_URL}/payments/cancel?code=${code}`,
      mode: "subscription",
      billing_address_collection: "auto",
      allow_promotion_codes: true
    }

    // Verify if the user has email registered
    if (user?.email) {
      createPaymentObject.customer_email = user.email
    }

    const session = await stripe.checkout.sessions.create(createPaymentObject)
    responseHandler({
      res,
      code: 201,
      data: session
    })
  })
)

paymentRouter.get("/success", (req, res) => {
  responseHandler({
    res,
    code: 200,
    message: "Gracias por tu compra!"
  })
})

paymentRouter.get("/cancel", (req, res) => {
  responseHandler({
    res,
    code: 200,
    message: "Que lo que pasó crack, por qué cancelaste el plan? NOOOOOOOOOOOOOOOOOOOOOOO"
  })
})

export default paymentRouter
