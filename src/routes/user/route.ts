import { COOKIES } from '@/constants/cookies.constants'
import { AppError } from '@/src/handlers/error-handler'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { authMiddleware } from '@/src/middlewares/authMiddleware'
import { validateRequest } from '@/src/middlewares/validate-request'
import { pedingUserModel } from '@/src/schemas/pending-sms-user.schemas'
import { refreshTokenModel } from '@/src/schemas/refresh-token.schemas'
import { userModel } from '@/src/schemas/user.schemas'
import { verificationCodeModel } from '@/src/schemas/verification-code.schemas'
import { hashCompare, hashGen } from '@/src/services/bcrypt/hash.service'
import { Cookies } from '@/src/services/cookies/cookies.service'
import { EmailService } from '@/src/services/email/email.service'
import Logs from '@/src/services/logs/save-logs.service'
import { TwilioSendSMS } from '@/src/services/twilio/twilio-sms.service'
import { refreshTokenCookies } from '@/src/utils/cookies/save-user-info'
import { isPhoneNumber } from '@/src/utils/is-phone-number.utils'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import RandomIntUtils from '@/src/utils/random-int.utils'
import { createUserSchema, isValidEmail, UserLoginSchema } from '@/src/zod/user.zod'
import { CreateUserI } from '@/types/login/user'
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
    const hashedPassword = await hashGen(password)

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

    const isPasswordValid = await hashCompare(password, userPassword)
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
    // Agregar validación de campos automáticos
    const blockedFields = [
      'auth.sms.verified',
      'contact.is_phone_number_verified',
      'personal_information.email_verified',
      'personal_information.phone_number_verified'
    ]

    if (blockedFields.some(field => req.body[field])) {
      throw new AppError(`Cannot update automatic fields: ${blockedFields.join(', ')}`, 400)
    }

    await userModel.updateOne({ _id: req.user?.userId }, req.body)
      .then((user) => res.send(user))
  })
)

userRouter.post(
  '/register-sms',
  asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body

    if (!phone) {
      throw new AppError('Phone number is required', 400)
    }

    console.log(isPhoneNumber(phone), phone)

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
    await smsTwilioService.sendSMSCode({ phone }).catch((err) => {
      new Logs({
        method: 'saveErrorLogs',
        message: err
      })
      throw new AppError(`Error sending SMS`, 400)
    })

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

userRouter.post('/forgot-password', validateRequest(isValidEmail), asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body

  if (!email) {
    throw new AppError('Email is required', 400)
  }

  const user = await userModel.findOne({ email })

  if (!user) {
    throw new AppError('Unregistered email', 404)
  }

  const verificationCode = RandomIntUtils.randomInt()

  const userData = {
    email: email.toLowerCase(),
    code: verificationCode,
    userData: user.toObject()
  }

  await verificationCodeModel.create(userData)

  const emailService = new EmailService()
  await emailService.sendEmail({
    to: {
      email: email.toLowerCase(),
      name: user.name
    },
    subject: 'Forgot password',
    html: `Your verification code is ${verificationCode}`,
    provider: 'sendgrid'
  })

  res.json({
    success: true,
    message: 'Verification code sent successfully'
  })
}))

// Verify forgotten password code
userRouter.post('/verify-forgot-password', asyncHandler(async (req: Request, res: Response) => {
  const { email, code, password } = req.body

  if (!email || !code || !password) {
    throw new AppError('Email, code and password are required', 400)
  }

  const verificationCode = await verificationCodeModel.findOne({
    email: email?.toString().toLowerCase(),
    code: code?.toString()
  })

  if (!verificationCode) {
    throw new AppError('Invalid or expired verification code', 400)
  }

  const userData = verificationCode.userData
  await verificationCodeModel.deleteOne({ _id: verificationCode._id })

  if (!userData) {
    throw new AppError('User not found', 404)
  }

  // Hash the new password 
  const hashedPassword = await hashGen(password)

  await userModel.updateOne({ _id: userData._id }, { $set: { 'auth.local.password': hashedPassword } })

  // Send email to the user 
  const emailService = new EmailService()

  await emailService.sendEmail({
    to: {
      email: userData.email,
      name: userData.name
    },
    subject: 'Password updated successfully',
    html: `Your password has been updated successfully. You can now login with your new password.`,
    provider: 'sendgrid'
  })

  res.json({
    success: true,
    message: 'Password updated successfully'
  })
}))

// Resend verification code
userRouter.post('/resend-verification-code', validateRequest(isValidEmail), asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body

  if (!email) {
    throw new AppError('Email is required', 400)
  }

  const user = await userModel.findOne({ email })

  if (!user) {
    throw new AppError('Unregistered email', 404)
  }

  const verificationCode = RandomIntUtils.randomInt()

  const userData = {
    email: email.toLowerCase(),
    code: verificationCode,
    userData: user.toObject()
  }

  await verificationCodeModel.create(userData)

  const emailService = new EmailService()
  await emailService.sendEmail({
    to: {
      email: userData.email,
      name: userData.userData.name
    },
    subject: 'Verification code',
    html: `Your verification code is ${verificationCode}`,
    provider: 'sendgrid'
  })

  res.json({
    success: true,
    message: 'Verification code sent successfully'
  })
}))

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
