import { COOKIES } from '@/constants/cookies.constants'
import asyncHandler from '@/src/actions/try-catch-async-handler'
import { AppError } from '@/src/handlers/error-handler'
import { responseHandler } from '@/src/handlers/responseHandler'
import { Cookies } from '@/src/services/cookies/cookies.service'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import { Request, Response, Router } from 'express'

const tokenRouter = Router()

tokenRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    console.log({ req })

    const token = req.cookies[COOKIES.jwt_refresh_token.name]

    if (!token) throw new AppError('Refresh token not found', 404)

    try {
      const decodedToken = TokenManager.verifyRefreshToken(token)

      const refreshToken = await TokenManager.findRefreshTokenInDB({
        token,
        payload: { userId: decodedToken.userId }
      })

      if (!refreshToken) throw new AppError('Refresh token not found', 404)
      const accessToken = TokenManager.accessToken({ payload: { userId: decodedToken.userId } })

      // Save in the cookies
      const cookies = new Cookies(req, res)
      cookies.saveCookie(COOKIES.jwt_access_token.name, accessToken)

      responseHandler({
        res,
        code: 200,
        message: 'Access token refreshed successfully'
      })
    } catch (error) {
      throw new AppError('Invalid token ' + error, 401)
    }
  })
)

export default tokenRouter
