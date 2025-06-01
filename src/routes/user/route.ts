import { COOKIES } from '@/constants/cookies.constants'
import asyncHandler from '@/src/actions/try-catch-async-handler'
import { VerificationCode } from '@/src/actions/user/send-verification-code.action'
import { AppError } from '@/src/handlers/error-handler'
import { responseHandler } from '@/src/handlers/responseHandler'
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
import { isPhoneNumber } from '@/src/utils/is-phone-number.utils'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import RandomIntUtils from '@/src/utils/random-int.utils'
import { createUserSchema, isValidEmail, UserLoginSchema } from '@/src/zod/user.zod'
import { CreateUserI } from '@/types/login/user'
import { NextFunction, Request, Response, Router } from 'express'
import { getIpInfo } from '@/src/actions/user/ip-info'

const userRouter = Router()

userRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const users = await userModel.find()
    responseHandler({
      res,
      code: 200,
      data: users
    })
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
      about,
      // TODO: Add birth date
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
      throw new AppError('User already exists', 409)
    }

    // Generate verification code
    const verificationCode = RandomIntUtils.randomInt()

    // Hash password
    const hashedPassword = await hashGen(password)

    // Store verification data
    const userData = {
      name,
      email: email.trim().toLowerCase(),
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
      email: email.trim().toLowerCase(),
      code: verificationCode,
      userData
    })

    // Send verification email
    const emailService = new EmailService()
    await emailService.sendEmail({
      to: {
        email: email.trim().toLowerCase(),
        name: `${name} ${last_name}`
      },
      provider: 'sendgrid',
      template: 'verification_code',
      dynamicTemplateData: {
        name: `${name} ${last_name}`,
        code: verificationCode,
        email: email.trim().toLowerCase()
      }
    })

    responseHandler({
      res,
      code: 200,
      message: 'Verification code sent, please check your email.',
      data: {
        ip: await getIpInfo(req.ip)
      }
    })
  })
)

userRouter.post(
  '/verify-email',
  asyncHandler(async (req: Request<{}, {}, { email: string; code: string }>, res: Response) => {
    const { email, code } = req.body

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

    // verificar si el usuario está logueado
    const userExists = await userModel.findOne({ email: email?.toString().toLowerCase() })

    if (userExists) {
      // Access token
      const accessToken = TokenManager.accessToken({ payload: { userId: userExists._id as string } })

      // Refresh token
      const refreshToken = TokenManager.refreshToken({ payload: { userId: userExists._id as string } })


      // Save the refresh token in the cookies with the class name of Cookies
      const cookies = new Cookies(req, res)
      cookies.saveCookie(COOKIES.jwt_refresh_token.name, refreshToken)

      // Save the acces token in cookies
      cookies.saveCookie(
        COOKIES.jwt_access_token.name,
        accessToken,
        {
          expires: new Date(Date.now() + COOKIES.jwt_access_token.expiresIn.hourInt)
        }
      )

      TokenManager.saveRefreshTokenInDB({ payload: { userId: userExists._id as string } })

      // Delete verification data from database
      await verificationCodeModel.deleteOne({ _id: verificationData._id })

      // user without credentials
      const { auth: _, ...rest } = userExists.toObject()

      responseHandler({
        res,
        code: 200,
        message: 'User logged in successfully',
        data: {
          user: rest,
          token: accessToken,
          ip: await getIpInfo(req.ip)
        }
      })

      // Stop the execution
      return
    }

    // Create user
    const user = await userModel.create(verificationData.userData)

    // Transfer only the necessary data
    const userData = user.toObject()
    const { auth: _, ...rest } = userData

    // Delete verification data from database
    await verificationCodeModel.deleteOne({ _id: verificationData._id })

    // Access token
    const accessToken = TokenManager.accessToken({ payload: { userId: userData._id as string } })

    // Refresh token
    const refreshToken = TokenManager.refreshToken({ payload: { userId: userData._id as string } })

    // Save refresh token in cookies
    const cookies = new Cookies(req, res)
    cookies.saveCookie(COOKIES.jwt_refresh_token.name, refreshToken)

    // Save access token in cookies
    cookies.saveCookie(
      COOKIES.jwt_access_token.name,
      accessToken,
      {
        expires: new Date(Date.now() + COOKIES.jwt_access_token.expiresIn.hourInt)
      })

    TokenManager.saveRefreshTokenInDB({ payload: { userId: userData._id as string } })

    responseHandler({
      res,
      code: 200,
      message: 'Email verified successfully',
      data: {
        user: rest,
        token: accessToken,
        ip: await getIpInfo(req.ip)
      }
    })
  })
)

userRouter.post(
  '/login',
  validateRequest(UserLoginSchema),
  asyncHandler(async (req: Request<{}, {}, { email: string; password: string }>, res: Response, next: NextFunction) => {
    let { email, password } = req.body

    email = email.trim().toLowerCase()

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

    // Save refresh token in cookies
    const cookies = new Cookies(req, res)
    cookies.saveCookie(COOKIES.jwt_refresh_token.name, refreshToken)

    // Save access token in cookies
    cookies.saveCookie(
      COOKIES.jwt_access_token.name,
      token,
      {
        expires: new Date(Date.now() + COOKIES.jwt_access_token.expiresIn.hourInt)
      })

    TokenManager.saveRefreshTokenInDB({ payload: { userId: userData._id as string } })

    responseHandler({
      res,
      code: 200,
      message: 'User logged in successfully',
      data: {
        user: userWithoutAuth,
        token,
        ip: await getIpInfo(req.ip)
      }
    })
  })
)

userRouter.get(
  '/logout',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    await refreshTokenModel.findOneAndDelete({ userId: req.user?.userId })

    const cookies = new Cookies(req, res)
    cookies.deleteCookie(COOKIES.jwt_refresh_token.name)
    cookies.deleteCookie(COOKIES.jwt_access_token.name)

    responseHandler({
      res,
      code: 200,
      message: 'Logged out successfully'
    })
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

    responseHandler({
      res,
      code: 200,
      message: 'SMS sent successfully',
      data: {
        ip: await getIpInfo(req.ip)
      }
    })
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

userRouter.post('/email-exists',
  validateRequest(isValidEmail),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body

    const user = await userModel.findOne({ email: email.trim().toLowerCase() })

    if (!user) {
      throw new AppError('Unregistered email', 404)
    }

    await VerificationCode.SendGmailVerificationCode(email, user, 'Hi')

    responseHandler({
      res,
      code: 200,
      message: 'Email already exists'
    })
  }))

userRouter.post('/forgot-password', validateRequest(isValidEmail), asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body

  if (!email) {
    throw new AppError('Email is required', 400)
  }

  const user = await userModel.findOne({ email })

  if (!user) {
    throw new AppError('Unregistered email', 404)
  }

  await VerificationCode.SendGmailVerificationCode(email, user)

  responseHandler({
    res,
    code: 200,
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

  responseHandler({
    res,
    code: 200,
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

  responseHandler({
    res,
    code: 200,
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

    // variable cookie already exists in the top
    cookies.saveCookie(COOKIES.jwt_refresh_token.name, refreshToken)

    // Save access token in cookies
    cookies.saveCookie(COOKIES.jwt_access_token.name, accessToken)

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

    responseHandler({
      res,
      code: 200,
      message: 'Profile completed successfully',
      data: {
        user: userWithoutAuth,
        token: accessToken
      }
    })
  })
)

export default userRouter
