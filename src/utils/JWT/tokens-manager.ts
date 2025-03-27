import { COOKIES } from '@/constants/cookies.constants'
import { AppError } from '@/src/handlers/error-handler'
import { hashGen, hashCompare } from '@/src/modules/bcrypt/hash'
import { refreshTokenModel } from '@/src/schemas/refresh-token.schemas'
import jwt from 'jsonwebtoken'

export class TokenManager {
  static accessToken({ payload }: { payload: any }) {
    return jwt.sign(payload, COOKIES.JWT_SECRET_KEY, {
      expiresIn: COOKIES.expiresIn.hourString
    })
  }

  static refreshToken({ payload }: { payload: any }) {
    const refreshToken = jwt.sign(payload, COOKIES.jwt_refresh_token.SECRET_KEY, {
      expiresIn: COOKIES.jwt_refresh_token.dayString
    })

    return refreshToken
  }

  static async saveRefreshTokenInDB({ payload }: { payload: any }) {
    const token = this.refreshToken({ payload })

    // Encriptar el refresh token en la base de datos
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
    return jwt.verify(token, COOKIES.JWT_SECRET_KEY)
  }

  static verifyRefreshToken(token: string) {
    return jwt.verify(token, COOKIES.jwt_refresh_token.SECRET_KEY) as { userId: string; iat: number; exp: number }
  }

  static async revokeToken({ payload }: { payload: any }) {
    await refreshTokenModel.findOneAndDelete({ payload })
  }

  // Create a cron job to clean the expired tokens
  static async cleanExpiredTokens() {
    await refreshTokenModel.deleteMany({ expires: { $lt: new Date() } })
  }

  static tempToken({ payload }: { payload: any }) {
    return jwt.sign(payload, COOKIES.general.SECRET_KEY, {
      expiresIn: COOKIES.general.expiresIn.hourString
    })
  }

  static verifyTempToken(token: string) {
    return jwt.verify(token, COOKIES.general.SECRET_KEY)
  }
}
