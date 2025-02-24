import { COOKIES } from '@/constants/cookies-manager'
import { envs } from '@/constants/env'
import { AppError } from '@/src/handlers/error-handler'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { authMiddleware } from '@/src/middlewares/authMiddleware'
import { validateRequest } from '@/src/middlewares/validate-request'
import { refreshTokenModel } from '@/src/models/refresh-token.models'
import { userModel } from '@/src/models/user.models'
import { EmailService } from '@/src/modules/email/email.service'
import { Cookies } from '@/src/utils/cookies/save-user-info'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import { createUserSchema, isValidEmail, UserLoginSchema } from '@/src/zod/user'
import { CreateUserI, UserI } from '@/types/login/user'
import bcrypt from 'bcrypt'
import { NextFunction, Request, Response, Router } from 'express'

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
    let { name, last_name, email, password, contact, social_media, favorites_properties, identity_number, location, profile_picture, properties } = req.body

    if (identity_number && !/^\d{13}$/.test(identity_number)) {
      throw new AppError('Invalid identity number format. Must be 13 digits.', 400)
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Save user
    let user = await userModel
      .create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        last_name,
        contact,
        social_media,
        favorites_properties,
        identity_number,
        location,
        profile_picture,
        properties,
        is_verified: false
      })
      .catch((err) => {
        throw new AppError('User already exists', 404)
      })

    if (!user?.is_verified) {
      // Send email to verify the account
      const emailContent = `
        <h1>Verify your account</h1>
        <p>Click <a href="https://www.hopta.hn/verify-email/${user._id}">here</a> to verify your account</p>
      `

      const emailService = new EmailService()

      const email = await emailService.sendEmail({
        from: envs.MAILER_EMAIL,
        to: user.email,
        subject: 'Verify your account',
        html: emailContent
      })

      console.log('[*] Email sent to the user'.green)
      console.log(email)
    }

    // Transfer only the necessary data
    const userData = user.toObject()
    const { password: _, ...userWithoutPassword } = userData

    // Access token
    const accessToken = TokenManager.accessToken({ userId: userData._id as string })

    // Refresh token
    const refreshToken = TokenManager.refreshToken({ userId: userData._id as string }) // generate
    Cookies.setRefreshCookie(res, COOKIES.jwt_refresh_token.name, refreshToken)
    TokenManager.saveRefreshTokenInDB({ userId: userData._id as string })

    // Response
    res.json({ success: true, user: userWithoutPassword, token: accessToken })
  })
)

userRouter.post(
  '/login',
  validateRequest(UserLoginSchema),
  asyncHandler(async (req: Request<{}, {}, UserI>, res: Response, next: NextFunction) => {
    let { email, password } = req.body

    email = email.toLowerCase()

    // verify is the user is on the database
    const user = await userModel.findOne({ email }).catch((err) => {
      throw new AppError(err, 500)
    })

    if (!user) throw new AppError('User not found', 404)

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) throw new AppError('Password or email incorrect', 404)

    // Transfer only the necessary data
    const userData = user.toObject()

    // Access token
    const token = TokenManager.accessToken({ userId: userData._id as string })

    // Refresh token
    const refreshToken = TokenManager.refreshToken({ userId: userData._id as string })
    Cookies.setRefreshCookie(res, COOKIES.jwt_refresh_token.name, refreshToken)
    TokenManager.saveRefreshTokenInDB({ userId: userData._id as string })

    // Response
    res.json({ success: true, token })
  })
)

userRouter.delete(
  '/logout',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies[COOKIES.jwt_refresh_token.name]
    if (!token) throw new AppError('Unauthorized', 401)

    await refreshTokenModel.findOneAndDelete({ token })
    Cookies.clearCookie(res, COOKIES.jwt_refresh_token.name)
    res.json({ success: true })
  })
)

userRouter.delete(
  '/',
  validateRequest(isValidEmail),
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.body.email) throw new AppError('email is required.', 400)
    const { email } = req.body
    await userModel.findOneAndDelete({ email: email }).then((user) => res.send(user))
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
