import { COOKIES } from '@/constants/cookie-user-name'
import { AppError } from '@/src/handlers/error-handler'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { authMiddleware } from '@/src/middlewares/authMiddleware'
import { validateRequest } from '@/src/middlewares/validate-request'
import { userModel } from '@/src/models/user'

import { createUserSchema, isValidEmail, UserLoginSchema } from '@/src/zod/user'
import { CreateUserI, UserI } from '@/types/login/user'
import bcrypt from 'bcrypt'
import { NextFunction, Request, Response, Router } from 'express'
import jwt from 'jsonwebtoken'

const userRouter = Router()

userRouter.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { user } = req.session
    res.json(user)
  })
)

userRouter.post(
  '/register',
  validateRequest(createUserSchema),
  asyncHandler(async (req: Request<{}, {}, CreateUserI>, res: Response, next: NextFunction) => {
    const {
      name,
      last_name,
      email,
      password,
      contact,
      is_verified,
      social_media,
      favorites_properties,
      identity_number,
      location,
      profile_picture,
      properties
    } = req.body

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Save user
    const user = await userModel
      .create({
        name,
        email,
        password: hashedPassword,
        last_name,
        contact,
        is_verified,
        social_media,
        favorites_properties,
        identity_number,
        location,
        profile_picture,
        properties
      })
      .catch((err) => {
        throw new AppError('User already exists', 404)
      })

    // Transfer only the necessary data
    const userData = user.toObject()
    const { password: _, ...userDataWithoutPassword } = userData

    // Crear el token con json web token y enviarlo a las cookies
    const token = jwt.sign({ user: userDataWithoutPassword }, COOKIES.JWT_SECRET_KEY, {
      expiresIn: COOKIES.expiresIn.hourString
    })

    res
      .cookie(COOKIES.cookies_token_name, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Si está en producción, solo aceptar post mediante HTTP
        sameSite: 'strict', // La cookie solo se puede acceder del mismo domino
        maxAge: COOKIES.expiresIn.hourInt // 1 hora
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
      const token = jwt.sign({ user: userDataWithoutPassword }, COOKIES.JWT_SECRET_KEY, {
        expiresIn: COOKIES.expiresIn.hourString
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
  validateRequest(isValidEmail),
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.body.email) throw new AppError('email is required.', 400)
    const { email } = req.body
    await userModel.deleteOne({ email: email }).then((user) => res.send(user))
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
