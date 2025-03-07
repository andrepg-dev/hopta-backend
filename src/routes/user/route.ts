import { COOKIES } from '@/constants/cookies-manager'
import { envs } from '@/constants/env'
import { AppError } from '@/src/handlers/error-handler'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { authMiddleware } from '@/src/middlewares/authMiddleware'
import { validateRequest } from '@/src/middlewares/validate-request'
import { EmailService } from '@/src/modules/email/email.service'
import { refreshTokenModel } from '@/src/schemas/refresh-token.schemas'
import { userModel } from '@/src/schemas/user.schemas'
import { verificationCodeModel } from '@/src/schemas/verification-code.schemas'
import { TwilioSendSMS } from '@/src/modules/twilio/twilio-sms-servcice'
import { Cookies } from '@/src/utils/cookies/save-user-info'
import { isPhoneNumber } from '@/src/utils/is-phone-number.utils'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import RandomIntUtils from '@/src/utils/random-int.utils'
import { createUserSchema, isValidEmail, UserLoginSchema } from '@/src/zod/user.zod'
import { CreateUserI } from '@/types/login/user'
import bcrypt from 'bcrypt'
import { NextFunction, Request, Response, Router } from 'express'

const userRouter = Router()

userRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    await userModel.find().then((user) => res.json(user))
  })
)

userRouter.post(
  '/register',
  validateRequest(createUserSchema),
  asyncHandler(async (req: Request<{}, {}, CreateUserI>, res: Response, next: NextFunction) => {
    const { name, last_name, email, password, contact, social_media, favorites_properties, personal_information, location, profile_picture, properties, about } = req.body

    if (personal_information?.identity_document && !/^\d{13}$/.test(personal_information.identity_document)) {
      throw new AppError('Invalid identity document format. Must be 13 digits.', 400)
    }

    if (!password) {
      throw new AppError('Password is required', 400)
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      throw new AppError('User already exists', 400)
    }

    // Generate verification code
    const verificationCode = RandomIntUtils.randomInt()

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Store verification data
    const userData = {
      name,
      email: email.toLowerCase(),
      auth: {
        local: {
          password: hashedPassword
        }
      },
      last_name,
      contact,
      social_media,
      favorites_properties,
      personal_information,
      location,
      profile_picture,
      properties,
      about
    }

    await verificationCodeModel.create({
      email: email.toLowerCase(),
      code: verificationCode,
      userData
    })

    // Send verification email
    const emailService = new EmailService()
    await emailService.sendEmail({
      from: envs.MAILER_EMAIL,
      to: email,
      subject: 'Verify your email',
      html: `
        <h1>Welcome to Hopta!</h1>
        <p>Your verification code is: <strong>${verificationCode}</strong></p>
        <p>This code will expire in 30 minutes.</p>
      `
    })

    res.json({
      success: true,
      message: 'Verification code sent to your email'
    })
  })
)

userRouter.post(
  '/verify-email',
  asyncHandler(async (req: Request<{}, {}, { email: string, code: string }>, res: Response) => {
    const { email, code } = req.body

    const verificationData = await verificationCodeModel.findOne({
      email: email.toLowerCase(),
      code
    })

    if (!verificationData) {
      throw new AppError('Invalid or expired verification code', 400)
    }

    // Create user
    const user = await userModel.create(verificationData.userData)

    // Delete verification data
    await verificationCodeModel.deleteOne({ _id: verificationData._id })

    // Transfer only the necessary data
    const userData = user.toObject()
    const { auth: _, ...userWithoutAuth } = userData

    // Access token
    const accessToken = TokenManager.accessToken({ userId: userData._id as string })

    // Refresh token
    const refreshToken = TokenManager.refreshToken({ userId: userData._id as string })
    Cookies.setRefreshCookie(res, COOKIES.jwt_refresh_token.name, refreshToken)
    TokenManager.saveRefreshTokenInDB({ userId: userData._id as string })

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: userWithoutAuth,
      token: accessToken
    })
  })
)

userRouter.post(
  '/login',
  validateRequest(UserLoginSchema),
  asyncHandler(async (req: Request<{}, {}, { email: string, password: string }>, res: Response, next: NextFunction) => {
    let { email, password } = req.body

    email = email.toLowerCase()

    // verify is the user is on the database
    const user = await userModel.findOne({ email }).catch((err) => {
      throw new AppError(err, 500)
    })

    if (!user) throw new AppError('User not found', 404)

    const userPassword = user.auth?.local?.password
    if (!userPassword) throw new AppError('User not registered with local authentication', 404)

    const isPasswordValid = await bcrypt.compare(password, userPassword)
    if (!isPasswordValid) throw new AppError('Password or email incorrect', 404)

    // Transfer only the necessary data
    const userData = user.toObject()
    const { auth: _, ...userWithoutAuth } = userData

    // Access token
    const token = TokenManager.accessToken({ userId: userData._id as string })

    // Refresh token
    const refreshToken = TokenManager.refreshToken({ userId: userData._id as string })
    Cookies.setRefreshCookie(res, COOKIES.jwt_refresh_token.name, refreshToken)
    TokenManager.saveRefreshTokenInDB({ userId: userData._id as string })

    // Response
    res.json({ success: true, user: userWithoutAuth, token })
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

userRouter.post('/register-sms', asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body

  if (!phone) {
    throw new AppError('Phone number is required', 400)
  }

  // Check if the phone number is valid
  if (!isPhoneNumber(phone)) {
    throw new AppError('Invalid phone number format. Must be a valid international phone number.', 400)
  }

  const alreadyExists = await userModel.findOne({ phone })

  if (alreadyExists) {
    throw new AppError('An account with this phone number already exists, please login', 400)
  }

  // Send the SMS
  const smsTwilioService = new TwilioSendSMS()
  await smsTwilioService.sendSMSCode({ phone })

  res.json({ success: true, message: 'SMS sent successfully' })
}))

userRouter.post("/verify-sms", asyncHandler(async (req: Request, res: Response) => {
  let { phone, code } = req.body

  phone = phone?.toString()
  code = code?.toString()

  console.log(phone, code)

  if (!phone || !code) {
    throw new AppError('Phone and code are required', 400)
  }

  // Check if the code is a number and has 6 digits
  if (!/^\d{6}$/.test(code)) {
    throw new AppError('Invalid code format.', 400)
  }

  // Check if the phone number is valid
  if (!isPhoneNumber(phone)) {
    throw new AppError('Invalid phone number format. Must be a valid international phone number.', 400)
  }

  // Check if the code is valid
  const smsTwilioService = new TwilioSendSMS()
  const verification = await smsTwilioService.verifySMSCode({ phone, code })

  if (!verification) {
    throw new AppError('Invalid or expired verification code', 400)
  }

  await smsTwilioService.sendSMS({
    phone,
    message: `Your account has been created successfully. Welcome to Hopta :)`
  })

  res.json({ success: true, message: 'User created successfully with phone number: ' + phone })
}))

export default userRouter
