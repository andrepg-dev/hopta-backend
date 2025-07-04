import { COOKIES } from '@/constants/cookies.constants'
import { AppError } from '@/src/handlers/error-handler'
import { Cookies } from '@/src/services/cookies/cookies.service'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import { Response, Router } from 'express'
import passport from 'passport'

const googleRouter = Router()

googleRouter.get('/', passport.authenticate('google', { scope: ['profile', 'email'] }))

googleRouter.get('/callback',
  passport.authenticate('google',
    {
      failureRedirect: 'https://www.hopta.hn/error-signin'
    }),
  async (req: any, res: Response) => {
    const { user } = req

    if (!req.user || !req.user._id) {
      throw new AppError('Authentication failed', 401)
    }

    const accessToken = TokenManager.accessToken({ payload: { userId: user._id as string } })
    const refreshToken = TokenManager.refreshToken({ payload: { userId: user._id as string } })

    const cookies = new Cookies(req, res)

    cookies.saveCookie(COOKIES.jwt_refresh_token.name, refreshToken)
    cookies.saveCookie(COOKIES.jwt_access_token.name, accessToken)

    return res.redirect(`${process.env.FRONTEND_URL}/dashboard`)
  })

export default googleRouter
