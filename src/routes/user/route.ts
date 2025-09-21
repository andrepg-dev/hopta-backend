import { COOKIES } from '@/constants/cookies.constants'
import asyncHandler from '@/src/actions/try-catch-async-handler'
import { getIpInfo } from '@/src/actions/user/ip-info'
import { isAdmin } from '@/src/guards/isAdmin'
import { AppError } from '@/src/handlers/error-handler'
import { responseHandler } from '@/src/handlers/responseHandler'
import { authMiddleware } from '@/src/middlewares/authMiddleware'
import { validateRequest } from '@/src/middlewares/validate-request'
import { pendingUserModel } from '@/src/schemas/pending-sms-user.schemas'
import { refreshTokenModel } from '@/src/schemas/refresh-token.schemas'
import { userModel } from '@/src/schemas/user.schemas'
import { verificationCodeModel } from '@/src/schemas/verification-code.schemas'
import { hashCompare, hashGen } from '@/src/services/bcrypt/hash.service'
import { Cookies } from '@/src/services/cookies/cookies.service'
import { EmailService } from '@/src/services/email/email.service'
import Logs from '@/src/services/logs/save-logs.service'
import { SMSSender } from '@/src/services/messages-sender/sms.service'
import { getPagination } from '@/src/utils/get-pagination.utils'
import { isPhoneNumber } from '@/src/utils/is-phone-number.utils'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import RandomIntUtils from '@/src/utils/random-int.utils'
import { createUserSchema, isValidEmail, UserLoginSchema } from '@/src/zod/user.zod'
import { CreateUserI, UserI } from '@/types/login/user'
import { NextFunction, Request, Response, Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'

const userRouter = Router()

userRouter.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userModel.findOne({ _id: req.user?.userId }).catch((err) => {
      throw new AppError('User not found', 400)
    })
    if (!user) return

    const userData = user.toObject()
    const { auth: _, ...rest } = userData

    responseHandler({
      res,
      code: 200,
      data: {
        user: rest,
        ip: await getIpInfo(req.ip)
      }
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
      about
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
    const userData: UserI = {
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
      about,
      created_at: new Date(),
      updated_at: new Date()
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
      provider: 'amazon-ses',
      template: 'verification_code',
      dynamicTemplateData: {
        name: `${name}`,
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
  asyncHandler(async (req: Request<{}, {}, { email: string; code: string }>, res: Response, next: NextFunction) => {
    const { email, code } = req.body

    if (!email || !code) {
      throw new AppError('Email and code are required', 400)
    }

    const verificationData = await verificationCodeModel.findOne({
      email: email?.trim().toLowerCase(),
      code: code?.toString()
    })

    if (!verificationData) {
      throw new AppError('Invalid or expired verification code', 400)
    }

    // verificar si el usuario está logueado
    const userExists = await userModel.findOne({ email: email?.trim().toLowerCase() })

    if (userExists) {
      // Access token
      const accessToken = TokenManager.accessToken({ payload: { userId: userExists._id as string } })

      // Refresh token
      const refreshToken = TokenManager.refreshToken({ payload: { userId: userExists._id as string } })

      // Save the refresh token in the cookies with the class name of Cookies
      const cookies = new Cookies(req, res)
      cookies.saveCookie(COOKIES.jwt_refresh_token.name, refreshToken)

      // Save the acces token in cookies
      cookies.saveCookie(COOKIES.jwt_access_token.name, accessToken)

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
    cookies.saveCookie(COOKIES.jwt_access_token.name, accessToken)

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
    cookies.saveCookie(COOKIES.jwt_access_token.name, token)

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

userRouter.post(
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

    const cookies = new Cookies(req, res)
    cookies.deleteCookie(COOKIES.jwt_refresh_token.name)
    cookies.deleteCookie(COOKIES.jwt_access_token.name)

    res.json({ success: true, message: 'Account deleted successfully' })
  })
)

userRouter.patch(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body

    // Agregar validación de campos automáticos
    const blockedFields = [
      'auth.sms.verified',
      'contact.is_phone_number_verified',
      'personal_information.email_verified',
      'personal_information.phone_number_verified'
    ]

    if (blockedFields.some((field) => body[field])) {
      throw new AppError(`Cannot update automatic fields: ${blockedFields.join(', ')}`, 400)
    }

    // Validar que el email no exista en otro usuario
    if (body.email) {
      const existingUserWithEmail = await userModel.findOne({
        email: body.email,
        _id: { $ne: req.user?.userId }
      })

      if (existingUserWithEmail) {
        throw new AppError('El correo electrónico ya está en uso por otro usuario', 400)
      }
    }

    // Validar que el número de teléfono no exista en otro usuario
    if (body.contact?.phone_number) {
      const phoneNumber = body.contact.phone_number
      const existingUserWithPhone = await userModel.findOne({
        $and: [
          { _id: { $ne: req.user?.userId } },
          {
            $or: [{ 'contact.phone_number': phoneNumber }, { 'auth.sms.phoneNumber': phoneNumber }, { 'auth.sms.phoneNumber': `+504${phoneNumber}` }]
          }
        ]
      })

      if (existingUserWithPhone) {
        throw new AppError('El número de teléfono ya está en uso por otro usuario', 400)
      }
    }

    try {
      const user = await userModel.findOne({ _id: req.user?.userId })

      if (!user) {
        throw new AppError('User not found', 404)
      }

      await userModel.updateOne({ _id: req.user?.userId }, body)

      // Obtener los datos actualizados del usuario para devolverlos
      const updatedUser = await userModel.findById(req.user?.userId).select('-auth.local.password')

      responseHandler({
        res,
        code: 200,
        message: 'User updated successfully',
        data: {
          user: updatedUser
        }
      })
    } catch (error) {
      throw new AppError('Error updating user: ' + error, 500)
    }
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

    // Send the SMS
    const smsTwilioService = new SMSSender()
    await smsTwilioService.sendSMSCode({ phone }).catch((err) => {
      new Logs({
        method: 'saveErrorLogs',
        message: err
      })
      throw new AppError(`Error sending SMS`, 500)
    })

    responseHandler({
      res,
      code: 200,
      message: 'SMS sent successfully'
    })
  })
)

/**
 * @description you need to complete the profile to create the user, this just verify the phone number of the user
 *
 * @param phone
 * @param code
 */
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

    // Check if the code is valid in the twilio collection database
    const smsTwilioService = new SMSSender()
    const isUserPhoneNumber = await smsTwilioService.verifySMSCode({ phone, code })

    if (!isUserPhoneNumber) {
      throw new AppError('Invalid or expired verification code', 409)
    }

    /**
     * La lógica viene aquí, tenemos que verificar si el usuario ya existe en la collecion
     * de usuarios, o si está registrandose, si está registrandose no tiene sentido
     * que vayas al endpoint de complete profile
     */
    const user = await userModel.findOne({ 'auth.sms.phoneNumber': phone })

    if (user) {
      // Generate access token and refresh token
      const accessToken = TokenManager.accessToken({ payload: { userId: user._id as string } })
      const refreshToken = TokenManager.refreshToken({ payload: { userId: user._id as string } })

      // Save refresh token in cookies
      const cookies = new Cookies(req, res)
      cookies.saveCookie(COOKIES.jwt_refresh_token.name, refreshToken)

      // Save access token in cookies
      cookies.saveCookie(COOKIES.jwt_access_token.name, accessToken)

      // Save refresh token in database
      await TokenManager.saveRefreshTokenInDB({ payload: { userId: user._id as string } })

      const { auth: _, ...rest } = user.toObject()

      return responseHandler({
        res,
        code: 200,
        message: 'Login successfully',
        data: {
          user: rest
        }
      })
    }

    // If user doesn't exist, create a temp token to complete the profile
    const tempToken = TokenManager.tempToken({ payload: { phone } })

    // Save in cookies
    const cookies = new Cookies(req, res)
    cookies.saveCookie('tempToken', tempToken)

    // Save user in pending user to complete the profile
    await pendingUserModel.create({ phone })

    responseHandler({
      res,
      code: 200,
      message: 'Phone number verified successfully. Complete the profile with the next step to complete.'
    })
  })
)

/**
 * If user exists, we will send a verification code to the email
 */
userRouter.post(
  '/email-exists',
  validateRequest(isValidEmail),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body

    const user = await userModel.findOne({ email: email.trim().toLowerCase() })

    if (!user) {
      throw new AppError('Unregistered email', 404)
    }

    const verificationCode = RandomIntUtils.randomInt()

    const userData = {
      email: email.trim().toLowerCase(),
      code: verificationCode,
      userData: user.toObject()
    }

    await verificationCodeModel.create(userData)

    // Send verification email
    const emailService = new EmailService()
    await emailService.sendEmail({
      to: {
        email: email.trim().toLowerCase(),
        name: `${user.name} ${user.last_name}`
      },
      provider: 'amazon-ses',
      template: 'verification_code',
      dynamicTemplateData: {
        name: `${user.name}`,
        code: verificationCode,
        email: email.trim().toLowerCase()
      }
    })

    responseHandler({
      res,
      code: 200,
      message: 'Email already exists'
    })
  })
)

userRouter.post(
  '/forgot-password',
  validateRequest(isValidEmail),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body

    if (!email) {
      throw new AppError('Email is required', 400)
    }

    const user = await userModel.findOne({ email })

    if (!user) {
      throw new AppError('Unregistered email', 404)
    }

    const userData = {
      email: email.toLowerCase(),
      code: RandomIntUtils.randomInt(),
      userData: user.toObject()
    }

    await verificationCodeModel.create(userData) // add to database

    // Send verification email
    const emailService = new EmailService()
    await emailService.sendEmail({
      to: {
        email: email.trim().toLowerCase(),
        name: `${user.name} ${user.last_name}`
      },
      provider: 'amazon-ses',
      template: 'forgot_password',
      dynamicTemplateData: {
        name: `${user.name}`,
        code: userData.code,
        email: email.trim().toLowerCase()
      }
    })

    responseHandler({
      res,
      code: 200,
      message: 'Verification code sent successfully'
    })
  })
)

// Verify forgotten password code
userRouter.post(
  '/verify-forgot-password',
  asyncHandler(async (req: Request, res: Response) => {
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
      provider: 'amazon-ses'
    })

    responseHandler({
      res,
      code: 200,
      message: 'Password updated successfully'
    })
  })
)

// Resend verification code
userRouter.post(
  '/resend-verification-code',
  validateRequest(isValidEmail),
  asyncHandler(async (req: Request, res: Response) => {
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
      provider: 'amazon-ses',
      template: 'verification_code',
      dynamicTemplateData: {
        name: `${user.name}`,
        code: verificationCode,
        email: email.trim().toLowerCase()
      }
    })

    responseHandler({
      res,
      code: 200,
      message: 'Verification code sent successfully'
    })
  })
)

/**
 * @description This function create the account via SMS
 */
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
      throw new AppError('Temporary authorization token required', 401)
    }

    const decoded = TokenManager.verifyTempToken(tempToken) as unknown as { phone: string }

    console.log({ decoded, phone: decoded.phone })

    if (!decoded.phone) {
      throw new AppError('Invalid token', 401)
    }

    const pendingUser = await pendingUserModel.findOne({ phone: decoded.phone })

    new Logs({ message: pendingUser })

    if (!pendingUser) {
      throw new AppError('Invalid or expired verification', 400)
    }

    const user = await userModel
      .create({
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
      .catch((err) => {
        throw new AppError('Error creating user: ' + err, 500)
      })

    await pendingUserModel.deleteOne({ _id: pendingUser._id }).catch(() => {
      console.error('Error deleting pending user line -> 713 file user/route.ts')
    })

    const accessToken = TokenManager.accessToken({ payload: { userId: user._id } })
    const refreshToken = TokenManager.refreshToken({ payload: { userId: user._id } })

    // variable cookie already exists in the top
    cookies.saveCookie(COOKIES.jwt_refresh_token.name, refreshToken)

    // Save access token in cookies
    cookies.saveCookie(COOKIES.jwt_access_token.name, accessToken)

    await TokenManager.saveRefreshTokenInDB({ payload: { userId: user._id } })

    const { auth: _, ...userWithoutAuth } = user.toObject()

    // const smsTwilioService = new TwilioSendSMS()
    // await smsTwilioService
    //   .sendSMS({
    //     phone: decoded.phone,
    //     message: `Hi ${name} ${last_name}!, welcome to Hopta. It's time to a new adventure.`
    //   })
    //   .catch((err) => {
    //     new Logs({ message: err, method: 'saveErrorLogs' })
    //   })

    responseHandler({
      res,
      code: 200,
      message: 'Profile completed successfully',
      data: {
        user: userWithoutAuth
      }
    })
  })
)

// User properties likes
userRouter.post(
  '/likes',
  authMiddleware,
  validateRequest(z.object({ propertyId: z.string() })),
  asyncHandler(async (req: Request, res: Response) => {
    const { propertyId } = req.body

    const user = await userModel.findOne({ _id: req.user?.userId as string })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    try {
      await userModel.updateOne({ _id: req.user?.userId as string }, { $push: { favorites_properties: propertyId } })

      responseHandler({
        res,
        code: 200,
        message: 'Property liked successfully'
      })
    } catch (error) {
      throw new AppError('Error liking property', 500)
    }
  })
)

userRouter.get(
  '/likes',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userModel.findOne({ _id: req.user?.userId as string })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    try {
      responseHandler({
        res,
        code: 200,
        data: {
          likes: user?.favorites_properties
        }
      })
    } catch (error) {
      throw new AppError('Error getting likes', 500)
    }
  })
)

/**
 * Delete the like of a property
 */
userRouter.delete(
  '/likes',
  authMiddleware,
  validateRequest(z.object({ propertyId: z.string() })),
  asyncHandler(async (req: Request, res: Response) => {
    const { propertyId } = req.body

    const user = await userModel.findOne({ _id: req.user?.userId as string })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    try {
      await userModel.updateOne({ _id: req.user?.userId as string }, { $pull: { favorites_properties: propertyId } })

      responseHandler({
        res,
        code: 200,
        message: 'Property unliked successfully'
      })
    } catch (error) {
      throw new AppError('Error unliking property', 500)
    }
  })
)

// Admin endpoints

/*
/user
Eliminar usuario
Modificar usuario
Mostrar todos los usuarios con paginacion
Buscador de todos los usuarios
*/

userRouter.delete('/space/:id', authMiddleware, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id || !mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid user ID', 400)
  const user = await userModel.findByIdAndDelete(id)
  if (!user) throw new AppError('User not found', 404)

  responseHandler({
    res,
    code: 200
  })
}))

userRouter.patch('/space/:id', authMiddleware, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id || !mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid user ID', 400)
  const user = await userModel.findByIdAndUpdate(id, req.body, { new: true })
  if (!user) throw new AppError('User not found', 404)

  responseHandler({
    res,
    code: 200,
    data: user?.toObject()
  })
}))

userRouter.post('/space', authMiddleware, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const user = await userModel.create(req.body)
  if (!user) throw new AppError('User not created', 404)

  responseHandler({
    res,
    code: 200,
    data: user?.toObject()
  })
}))

userRouter.get('/space', authMiddleware, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const sortBy = (req.query.sortBy as string) || 'created_at'
  const order = (req.query.order as 'asc' | 'desc') || 'desc'

  const users = await getPagination({
    limit,
    page,
    Model: userModel,
    sortBy,
    order
  })

  if (!users) throw new AppError('Users not found', 404)

  responseHandler({
    res,
    code: 200,
    data: users
  })
}))

userRouter.get('/space/:id', authMiddleware, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id || !mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid user ID', 400)
  const user = await userModel.findById(id)
  if (!user) throw new AppError('User not found', 404)

  responseHandler({
    res,
    code: 200,
    data: user?.toObject(),
    message: 'Your admin, role got user successfully'
  })
}))

export default userRouter
