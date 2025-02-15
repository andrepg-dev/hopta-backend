import { COOKIES } from '@/constants/cookies-manager'
import { AppError } from '@/src/handlers/error-handler'
import { refreshTokenModel } from '@/src/models/refresh-token.models'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

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

  static async findRefreshTokenInDB({ userId, token }: { userId: string; token: string }) {
    if (!token) throw new AppError('Token not provided', 404)

    const storedToken = await refreshTokenModel.findOne({ userId })
    if (!storedToken) throw new AppError('Token not found', 404)

    const isTokenValid = await bcrypt.compare(token, storedToken.token)
    return isTokenValid
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
