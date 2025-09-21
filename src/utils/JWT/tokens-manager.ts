import { AppError } from '@/src/handlers/error-handler'
import { refreshTokenModel } from '@/src/schemas/refresh-token.schemas'
import { hashCompare, hashGen } from '@/src/services/bcrypt/hash.service'
import jwt from 'jsonwebtoken'

const COOKIES = {
  general: {
    name: 'general_cookies',
    SECRET_KEY: process.env.GENERAL_COOKIES_SECRET_KEY ?? (() => { throw new Error('GENERAL_COOKIES_SECRET_KEY IS MISSING') })(),
    expiresIn: {
      hourString: '1h',
      hourInt: 1 * 60 * 60 * 1000
    }
  },
  expiresIn: {
    hourString: '60m',
    hourInt: 60 * 60 * 1000
  },
  jwt_refresh_token: {
    name: 'refresh_token',
    SECRET_KEY: process.env.JWT_REFRESH_SECRET_KEY ?? (() => { throw new Error('JWT_REFRESH_SECRET_KEY IS MISSING') })(),
    dayString: '14d',
    expires: 14 * 24 * 60 * 60 * 1000 // 14 días
  },
  jwt_access_token: {
    name: 'access_token',
    SECRET_KEY: process.env.JWT_ACCESS_SECRET_KEY ?? (() => { throw new Error('JWT_ACCESS_SECRET_KEY IS MISSING') })(),
    dayString: '7d',
    expires: 7 * 24 * 60 * 60 * 1000 // 7 días
  }
}

export class TokenManager {
  /**
   * 
   * @description Generate a access token
   * 
   * @param payload
   * @returns string
   */
  static accessToken({ payload }: { payload: any }) {
    const options = {
      expiresIn: COOKIES.jwt_access_token.dayString
    }
    return jwt.sign(payload, COOKIES.jwt_access_token.SECRET_KEY ?? '', options)
  }

  /**
 * 
 * @description Generate a refresh token
 * 
 * @param payload
 * @returns string
 */
  static refreshToken({ payload }: { payload: any }) {
    const options = {
      expiresIn: COOKIES.jwt_refresh_token.dayString
    }
    const refreshToken = jwt.sign(payload, COOKIES.jwt_refresh_token.SECRET_KEY ?? '', options)
    return refreshToken
  }

  /**
   * 
   * @description Save a refresh token in the database
   * 
   * @param payload
   * @returns string
   */
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
    if (!token) throw new AppError('Refresh token not provided', 404)

    const storedToken = await refreshTokenModel.findOne(payload)
    if (!storedToken) throw new AppError('Refresh token not found', 404)

    const isTokenValid = await hashCompare(token, storedToken.token)
    return isTokenValid
  }

  static verifyToken(token: string) {
    return jwt.verify(token, COOKIES.jwt_access_token.SECRET_KEY ?? '')
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
    const options = {
      expiresIn: COOKIES.general.expiresIn.hourString
    }
    return jwt.sign(payload, COOKIES.general.SECRET_KEY ?? '', options)
  }

  static verifyTempToken(token: string) {
    return jwt.verify(token, COOKIES.general.SECRET_KEY ?? '')
  }
}