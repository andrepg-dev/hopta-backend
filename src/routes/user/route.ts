import { COOKIES } from '@/constants/cookie-user-name'
import { AppError } from '@/src/handlers/error-handler'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { authMiddleware } from '@/src/middlewares/authMiddleware'
import { validateRequest } from '@/src/middlewares/validate-request'
import { userModel } from '@/src/models/user'
import { validateEmailFormat } from '@/src/utils/validate-email-format'
import { createUserSchema, UserLoginSchema } from '@/src/zod/user'
import bcrypt from 'bcrypt'
import { NextFunction, Request, Response, Router } from 'express'
import jwt from 'jsonwebtoken'

interface UserI {
  name: string
  email: string
  phone: string
  password: string
}

const userRouter = Router()

userRouter.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    await userModel
      .find()
      .populate('properties')
      .then((users) => res.send(users))
  })
)

userRouter.post(
  '/register',
  validateRequest(createUserSchema),
  asyncHandler(async (req: Request<{}, {}, UserI>, res: Response, next: NextFunction) => {
    const { name, email, password, phone } = req.body

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Save user
    const user = await userModel.create({ name, email, password: hashedPassword, phone }).catch((err) => {
      throw new AppError('User already exists', 404)
    })

    // Transfer only the necessary data
    const userData = user.toObject()
    const { password: _, ...userDataWithoutPassword } = userData

    // Crear el token con json web token y enviarlo a las cookies
    const token = jwt.sign({ userDataWithoutPassword }, COOKIES.JWT_SECRET_KEY, {
      expiresIn: COOKIES.expiresIn
    })

    res
      .cookie(COOKIES.cookies_token_name, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Si está en producción, solo aceptar post mediante HTTP
        sameSite: 'strict', // La cookie solo se puede acceder del mismo domino
        maxAge: 1000 * 60 * 60 // 1 hora
      })
      .json({ success: true, user: userDataWithoutPassword, token })
  })
)

userRouter.post(
  '/login',
  validateRequest(UserLoginSchema),
  asyncHandler(async (req: Request<{}, {}, UserI>, res: Response, next: NextFunction) => {
    const { email, password } = req.body

    // verify is the user is on the database
    const user = await userModel.findOne({ email }).catch((err) => {
      throw new AppError(err, 500)
    })

    if (!user) throw new AppError('User not found', 404)
    const userPassword = await bcrypt.compare(password, user.password)

    if (user.email == email && userPassword) {
      // Transfer only the necessary data
      const userData = user.toObject()
      const { password: _, ...userDataWithoutPassword } = userData

      // Crear el token con json web token y enviarlo a las cookies
      const token = jwt.sign({ userDataWithoutPassword }, COOKIES.JWT_SECRET_KEY, {
        expiresIn: COOKIES.expiresIn
      })

      res
        .cookie(COOKIES.cookies_token_name, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // Si está en producción, solo aceptar post mediante HTTP
          sameSite: 'strict', // La cookie solo se puede acceder del mismo domino
          maxAge: 1000 * 60 * 60 // 1 hora
        })
        .json({ success: true, user: userDataWithoutPassword, token })
    }

    throw new AppError('Password or email incorrect', 404)
  })
)

userRouter.get(
  '/logout',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    res.clearCookie(COOKIES.cookies_token_name).json({ success: true })
  })
)

userRouter.delete(
  '/',
  authMiddleware,
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
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.body.email) throw new AppError('email is required.', 400)
    await userModel.updateOne({ email: req.body.email }, req.body).then((user) => res.send(user))
  })
)

export default userRouter
