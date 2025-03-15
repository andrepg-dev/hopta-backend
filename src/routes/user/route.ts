import { COOKIES } from '@/constants/cookies.constants'
import { AppError } from '@/src/handlers/error-handler'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { authMiddleware } from '@/src/middlewares/authMiddleware'
import { validateRequest } from '@/src/middlewares/validate-request'
import { Cookies } from '@/src/modules/cookies/cookies.service'
import { EmailService } from '@/src/modules/email/email.service'
import Logs from '@/src/modules/logs/save-logs.service'
import { TwilioSendSMS } from '@/src/modules/twilio/twilio-sms.service'
import { pedingUserModel } from '@/src/schemas/pending-sms-user.schemas'
import { refreshTokenModel } from '@/src/schemas/refresh-token.schemas'
import { userModel } from '@/src/schemas/user.schemas'
import { verificationCodeModel } from '@/src/schemas/verification-code.schemas'
import { refreshTokenCookies } from '@/src/utils/cookies/save-user-info'
import { isPhoneNumber } from '@/src/utils/is-phone-number.utils'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import RandomIntUtils from '@/src/utils/random-int.utils'
import { createUserSchema, UserLoginSchema } from '@/src/zod/user.zod'
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
    const {
      name,
      last_name,
      email,
      password,
      contact,
      social_media,
      favorites_properties,
      personal_information,
      location,
      profile_picture,
      properties,
      about
    } = req.body

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
      to: {
        email: email.toLowerCase(),
        name: `${name} ${last_name}`
      },
      provider: 'sendgrid',
      template: 'verification_code',
      dynamicTemplateData: {
        name: `${name} ${last_name}`,
        code: verificationCode,
        email: email.toLowerCase()
      }
    })

    res.json({
      success: true,
      message: 'Verification code sent, please check your email.'
    })
  })
)

userRouter.get(
  '/verify-email',
  asyncHandler(async (req: Request<{}, {}, {}, { email: string; code: string }>, res: Response) => {
    const { email, code } = req.query

    if (!email || !code) {
      throw new AppError('Email and code are required', 400)
    }

    const verificationData = await verificationCodeModel.findOne({
      email: email?.toString().toLowerCase(),
      code: code?.toString()
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
    const accessToken = TokenManager.accessToken({ payload: { userId: userData._id as string } })

    // Refresh token
    const refreshToken = TokenManager.refreshToken({ payload: { userId: userData._id as string } })
    refreshTokenCookies.setRefreshCookie({
      res,
      token: refreshToken
    })
    TokenManager.saveRefreshTokenInDB({ payload: { userId: userData._id as string } })

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
  asyncHandler(async (req: Request<{}, {}, { email: string; password: string }>, res: Response, next: NextFunction) => {
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
    const token = TokenManager.accessToken({ payload: { userId: userData._id as string } })

    // Refresh token
    const refreshToken = TokenManager.refreshToken({ payload: { userId: userData._id as string } })
    refreshTokenCookies.setRefreshCookie({
      res,
      token: refreshToken
    })
    TokenManager.saveRefreshTokenInDB({ payload: { userId: userData._id as string } })

    // Response
    res.json({ success: true, user: userWithoutAuth, token })
  })
)

userRouter.get(
  '/logout',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    await refreshTokenModel.findOneAndDelete({ userId: req.user?.userId })
    refreshTokenCookies.clearCookie(res, COOKIES.jwt_refresh_token.name)
    res.json({ success: true, message: 'Logged out successfully' })
  })
)

userRouter.delete(
  '/delete-account',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    await userModel.findOneAndDelete({ _id: req.user?.userId })
    res.json({ success: true, message: 'Account deleted successfully' })
  })
)

userRouter.put(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    await userModel.updateOne({ _id: req.user?.userId }, req.body).then((user) => res.send(user))
  })
)

userRouter.post(
  '/register-sms',
  asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body

    if (!phone) {
      throw new AppError('Phone number is required', 400)
    }

    // Check if the phone number is valid
    if (!isPhoneNumber(phone)) {
      throw new AppError('Invalid phone number format. Must be a valid international phone number.', 400)
    }

    const alreadyExists = await userModel.findOne({ 'auth.sms.phoneNumber': phone })

    if (alreadyExists) {
      throw new AppError('An account with this phone number already exists, please login', 400)
    }

    // Send the SMS
    const smsTwilioService = new TwilioSendSMS()
    await smsTwilioService.sendSMSCode({ phone })

    res.json({ success: true, message: 'SMS sent successfully' })
  })
)

userRouter.post(
  '/verify-sms',
  asyncHandler(async (req: Request, res: Response) => {
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

    const tempToken = TokenManager.tempToken({ payload: { phone } })

    // Save in cookies
    const cookies = new Cookies(req, res)
    cookies.saveCookie('tempToken', tempToken)

    // Save user in pending user to complete the profile
    await pedingUserModel.create({ phone })

    await smsTwilioService
      .sendSMS({
        phone,
        message: `Phone number verified successfully. Complete the profile with the next step to complete.`
      })
      .catch((err) => {
        new Logs({ message: err, method: 'saveErrorLogs' })
      })

    res.json({
      success: true,
      message: 'Phone number verified successfully. Complete the profile with the next step to complete.'
    })
  })
)

userRouter.post(
  '/complete-profile',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, last_name } = req.body

    const cookies = new Cookies(req, res)
    const tempToken = cookies.getCookie('tempToken')

    console.log({ tempToken, name, last_name })

    new Logs({ message: { tempToken, cookies, name, last_name } })

    if (!name || !last_name) {
      throw new AppError('name and last name are required', 400)
    }

    if (!tempToken) {
      throw new AppError('Authorization token required', 401)
    }

    const decoded = TokenManager.verifyTempToken(tempToken) as unknown as { phone: string }

    console.log({ decoded, phone: decoded.phone })

    if (!decoded.phone) {
      throw new AppError('Invalid token', 401)
    }

    const pendingUser = await pedingUserModel.findOne({ phone: decoded.phone })

    new Logs({ message: pendingUser })

    if (!pendingUser) {
      throw new AppError('Invalid or expired verification', 400)
    }

    const user = await userModel.create({
      name,
      last_name,
      auth: {
        sms: {
          phoneNumber: decoded.phone,
          verified: true
        }
      },
      contact: {
        phone_number: decoded.phone,
        is_phone_number_verified: true
      }
    })

    await pedingUserModel.deleteOne({ _id: pendingUser._id })

    const accessToken = TokenManager.accessToken({ payload: { userId: user._id } })
    const refreshToken = TokenManager.refreshToken({ payload: { userId: user._id } })

    refreshTokenCookies.setRefreshCookie({
      res,
      token: refreshToken
    })

    await TokenManager.saveRefreshTokenInDB({ payload: { userId: user._id } })

    const { auth: _, ...userWithoutAuth } = user.toObject()

    const smsTwilioService = new TwilioSendSMS()
    await smsTwilioService
      .sendSMS({
        phone: decoded.phone,
        message: `Hi ${name} ${last_name}, welcome to Hopta :)`
      })
      .catch((err) => {
        new Logs({ message: err, method: 'saveErrorLogs' })
      })

    res.json({
      success: true,
      message: 'Profile completed successfully',
      user: userWithoutAuth,
      token: accessToken
    })
  })
)

export default userRouter
