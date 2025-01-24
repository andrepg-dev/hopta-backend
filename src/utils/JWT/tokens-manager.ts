import { COOKIES } from '@/constants/cookies-manager'
import { refreshTokenModel } from '@/src/models/refresh-token'
import { refreshTokenI } from '@/types/refresh-token/types'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

export class TokenManager {
  static accessToken({ userId }: { userId: string }) {
    return jwt.sign({ userId }, COOKIES.JWT_SECRET_KEY, {
      expiresIn: COOKIES.expiresIn.hourString
    })
  }

  static refreshToken({ userId }: { userId: string }) {
    const refreshToken = jwt.sign({ userId }, COOKIES.jwt_refresh_token.SECRET_KEY, {
      expiresIn: COOKIES.jwt_refresh_token.dayString
    })

    return refreshToken
  }

  static async saveRefreshTokenInDB({ userId }: { userId: string }) {
    const token = this.refreshToken({ userId })

    // Encriptar el refresh token en la base de datos
    const hashed = bcrypt.hashSync(token, 10)

    await refreshTokenModel.create({
      userId,
      token: hashed,
      expires: new Date(Date.now() + COOKIES.jwt_refresh_token.expires)
    })

    return token
  }

  static async findRefreshTokenInDB({ ...params }: { [key: string]: any }) {
    // Desencriptar el token
    const token = params.token
    const hashed = bcrypt.hashSync(token, 10)

    if (token) return await refreshTokenModel.findOne({ token: hashed })
    return await refreshTokenModel.findOne({ ...params })
  }

  static verifyToken(token: string) {
    return jwt.verify(token, COOKIES.JWT_SECRET_KEY)
  }

  static verifyRefreshToken(token: string) {
    return jwt.verify(token, COOKIES.jwt_refresh_token.SECRET_KEY) as { userId: string }
  }

  static async revokeToken({ userId }: { userId: string }) {
    await refreshTokenModel.findOneAndDelete({ user: userId })
  }

  // Create a cron job to clean the expired tokens
  static async cleanExpiredTokens() {
    await refreshTokenModel.deleteMany({ expires: { $lt: new Date() } })
  }
}
