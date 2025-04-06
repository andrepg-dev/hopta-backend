import { AppError } from '@/src/handlers/error-handler'
import { refreshTokenCookies } from '@/src/utils/cookies/save-user-info'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import { Response, Router } from 'express'
import passport from 'passport'
import { responseHandler } from '@/src/handlers/responseHandler'

const googleRouter = Router()

googleRouter.get('/', passport.authenticate('google', { scope: ['profile', 'email'] }))

googleRouter.get('/callback',
  passport.authenticate('google',
    {
      failureRedirect: 'https://www.hopta.hn/error-signin',
    }),
  async (req: any, res: Response) => {
    const { user } = req

    if (!req.user || !req.user._id) {
      throw new AppError('Authentication failed', 401)
    }

    const token = TokenManager.accessToken({ payload: { userId: user._id as string } })
    const refreshToken = TokenManager.refreshToken({ payload: { userId: user._id as string } })
    refreshTokenCookies.setRefreshCookie({
      res,
      token: refreshToken
    })

    responseHandler({
      res,
      code: 200,
      data: { user: req.user, token }
    })
  })

export default googleRouter
