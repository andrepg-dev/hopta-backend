import asyncHandler from '@/src/actions/try-catch-async-handler'
import { responseHandler } from '@/src/handlers/responseHandler'
import suscribeModel from '@/src/schemas/suscribe.schemas'
import { Request, Response, Router } from 'express'

const suscribeRouter = Router()

suscribeRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { email, phone } = req.body

  if (!email && !phone) {
    return responseHandler({
      res,
      code: 400,
      message: 'Email or phone is required'
    })
  }

  const suscribe = await suscribeModel.create({ email, phone })

  responseHandler({
    res,
    code: 200,
    message: 'Suscribed successfully',
    data: suscribe
  })
}))



export default suscribeRouter