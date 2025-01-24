import { COOKIES } from '@/constants/cookie-user-name'
import { AppError } from '@/src/handlers/error-handler'
import { refreshTokenModel } from '@/src/models/refresh-token'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export class TokenManager {
  static accessToken({ userId }: { userId: string }) {
    return jwt.sign({ userId }, COOKIES.JWT_SECRET_KEY, {
      expiresIn: COOKIES.expiresIn.hourString
    })
  }

  static async refreshToken({ userId }: { userId: string }) {
    const refreshToken = jwt.sign({ userId }, COOKIES.jwt_refresh_token.SECRET_KEY, {
      expiresIn: COOKIES.jwt_refresh_token.dayString
    })

    // Encrypt the refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)

    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + 7)

    // Guardar en la base de datos
    await refreshTokenModel.create({
      user: userId,
      token: hashedRefreshToken,
      expires: expires_at
    })

    return refreshToken
  }

  static verifyToken(token: string) {
    return jwt.verify(token, COOKIES.JWT_SECRET_KEY)
  }

  static async verifyRefreshToken(token: string) {
    const decodedToken = jwt.verify(token, COOKIES.jwt_refresh_token.SECRET_KEY) as { userId: string }

    const storedToken = await refreshTokenModel.findOne({ user: decodedToken.userId }) // Buscar el token en la base de datos

    if (!storedToken) throw new AppError('Token not found', 404)

    const isTokenValid = await bcrypt.compare(token, storedToken.token)
    if (!isTokenValid) throw new AppError('Invalid token', 401) // El hash que el usuario envió no coincide con el hash almacenado

    if (new Date() > storedToken.expires) {
      await refreshTokenModel.findOneAndDelete({ user: decodedToken.userId })
      throw new AppError('Token expired', 401)
    }

    return decodedToken
  }

  static async revokeToken({ userId }: { userId: string }) {
    await refreshTokenModel.findOneAndDelete({ user: userId })
  }

  static async cleanExpiredTokens() {
    await refreshTokenModel.deleteMany({ expires: { $lt: new Date() } })
  }
}
