import { AppError } from '@/src/handlers/error-handler'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { userModel } from '@/src/models/user'
import { validateEmailFormat } from '@/src/utils/validate-email-format'
import { NextFunction, Request, Response, Router } from 'express'
import z from 'zod'

const userRouter = Router()

const createUserSchema = z.object({
  name: z.string().min(8, 'Name must be at least 8 characters long.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  phone: z.string().min(6, 'Phone number must be at least 6 characters long.')
})

const validateRequest = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body)
    next()
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message
      }))
      res.status(400).json({ success: false, errors: formattedErrors })
      return
    }

    next(error)
  }
}

userRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    await userModel
      .find()
      .populate('properties')
      .then((users) => res.send(users))
  })
)

userRouter.post(
  '/',
  validateRequest(createUserSchema),
  asyncHandler(async (req: Request<{}, {}, { name: string; email: string; phone: string; password: string }>, res: Response) => {
    const { name, email, password, phone } = req.body

    await userModel.create({ name, email, password, phone }).then((user) => res.send(user))
  })
)

userRouter.delete(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.body.email) throw new AppError('email is required.', 400)
    const { email } = req.body

    const isValid = validateEmailFormat(email)
    if (isValid === false) throw new AppError('Your email address is invalid', 404)

    await userModel.deleteOne({ email: req.body.email }).then((user) => res.send(user))
  })
)

userRouter.put(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.body.email) throw new AppError('email is required.', 400)
    await userModel.updateOne({ email: req.body.email }, req.body).then((user) => res.send(user))
  })
)

export default userRouter
