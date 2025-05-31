import { AppError } from '@/src/handlers/error-handler'
import { refreshTokenModel } from '@/src/schemas/refresh-token.schemas'
import { hashCompare, hashGen } from '@/src/services/bcrypt/hash.service'
import jwt, { SignOptions } from 'jsonwebtoken'

export const COOKIES = {
  cookies_token_name: 'access_token',
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,

  general: {
    name: 'general_cookies',
    SECRET_KEY: process.env.GENERAL_COOKIES_SECRET_KEY,
    expiresIn: {
      seconds: 3600, // 1 hour in seconds
      hourInt: 1 * 60 * 60 * 1000
    }
  },
  expiresIn: {
    seconds: 3600, // 1 hour in seconds
    hourInt: 60 * 60 * 1000
  },

  jwt_refresh_token: {
    name: 'refresh_token',
    SECRET_KEY: process.env.JWT_REFRESH_SECRET_KEY,
    seconds: 1209600, // 14 days in seconds (14 * 24 * 60 * 60)
    expires: 14 * 24 * 60 * 60 * 1000 // 14 días
  }
}


export class TokenManager {
  static accessToken({ payload }: { payload: any }) {
    const options: SignOptions = {
      expiresIn: COOKIES.expiresIn.seconds
    }
    return jwt.sign(payload, COOKIES.JWT_SECRET_KEY ?? '', options)
  }

  static refreshToken({ payload }: { payload: any }) {
    const options: SignOptions = {
      expiresIn: COOKIES.jwt_refresh_token.seconds
    }
    const refreshToken = jwt.sign(payload, COOKIES.jwt_refresh_token.SECRET_KEY ?? '', options)

    return refreshToken
  }

  static async saveRefreshTokenInDB({ payload }: { payload: any }) {
    const token = this.refreshToken({ payload })

    const hashed = await hashGen(token)

    await refreshTokenModel.create({
      userId: payload.userId,
      token: hashed,
      expires: new Date(Date.now() + COOKIES.jwt_refresh_token.expires)
    })

    return token
  }

  static async findRefreshTokenInDB({ payload, token }: { payload: { userId: string }; token: string }) {
    if (!token) throw new AppError('Token not provided', 404)

    const storedToken = await refreshTokenModel.findOne(payload)
    if (!storedToken) throw new AppError('Token not found', 404)

    const isTokenValid = await hashCompare(token, storedToken.token)
    return isTokenValid
  }

  static verifyToken(token: string) {
    return jwt.verify(token, COOKIES.JWT_SECRET_KEY ?? '')
  }

  static verifyRefreshToken(token: string) {
    return jwt.verify(token, COOKIES.jwt_refresh_token.SECRET_KEY ?? '') as { userId: string; iat: number; exp: number }
  }

  static async revokeToken({ payload }: { payload: any }) {
    await refreshTokenModel.findOneAndDelete({ payload })
  }

  static async cleanExpiredTokens() {
    await refreshTokenModel.deleteMany({ expires: { $lt: new Date() } })
  }

  static tempToken({ payload }: { payload: any }) {
    const options: SignOptions = {
      expiresIn: COOKIES.general.expiresIn.seconds
    }
    return jwt.sign(payload, COOKIES.general.SECRET_KEY ?? '', options)
  }

  static verifyTempToken(token: string) {
    return jwt.verify(token, COOKIES.general.SECRET_KEY ?? '')
  }
}