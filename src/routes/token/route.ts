import { COOKIES } from '@/constants/cookies.constants'
import { AppError } from '@/src/handlers/error-handler'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import Logs from '@/src/services/logs/save-logs.service'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import { refreshTokenI } from '@/types/refresh-token/types'
import { Request, Response, Router } from 'express'
import { responseHandler } from '@/src/handlers/responseHandler'

const tokenRouter = Router()

tokenRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    // Verificar si el formato del header es el correcto
    const token = req.cookies[COOKIES.jwt_refresh_token.name]
    if (!token) throw new AppError('Unauthorized', 401)

    new Logs({
      method: 'saveLogs',
      message: `Token: ${token}`
    })

    try {
      // Verificar el access token
      const decodedToken = TokenManager.verifyRefreshToken(token)

      new Logs({
        method: 'saveLogs',
        message: `Decoded token: ${JSON.stringify(decodedToken)}`
      })

      const refreshToken = await TokenManager.findRefreshTokenInDB({
        token,
        payload: { userId: decodedToken.userId }
      })

      new Logs({
        method: 'saveLogs',
        message: `Refresh token: ${refreshToken}`
      })

      if (!refreshToken) throw new AppError('Token not found', 404)
      const accessToken = TokenManager.accessToken({ payload: { userId: decodedToken.userId } })

      new Logs({
        method: 'saveLogs',
        message: `Access token: ${accessToken}`
      })

      responseHandler({
        res,
        code: 200,
        data: { accessToken }
      })
    } catch (error) {
      throw new AppError('Invalid token ' + error, 401)
    }
  })
)

export default tokenRouter
