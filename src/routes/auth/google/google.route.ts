import { COOKIES } from '@/constants/cookies.constants'
import { AppError } from '@/src/handlers/error-handler'
import { Cookies } from '@/src/services/cookies/cookies.service'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import { Response, Router } from 'express'
import passport from 'passport'

const googleRouter = Router()

googleRouter.get('/', (req, res, next) => {
  const { callbackUrl } = req.query

  const authenticator = passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: callbackUrl as string,

  })

  authenticator(req, res, next)
})

googleRouter.get('/callback',
  passport.authenticate('google',
    {
      failureRedirect: 'https://www.hopta.hn/'
    }),
  async (req: any, res: Response) => {
    const user = req.user
    const callbackUrl = req.query.state as string

    const URL_TO_REDIRECT = ["/user/dashboard", "/publicar-propiedad"]
    const finalCallbackUrl = callbackUrl || "/user/dashboard" // default url

    if (!URL_TO_REDIRECT.includes(finalCallbackUrl)) {
      throw new AppError('Invalid URL', 400)
    }

    if (!req.user || !req.user._id) {
      throw new AppError('Authentication failed', 401)
    }

    const accessToken = TokenManager.accessToken({ payload: { userId: user._id as string } })
    const refreshToken = TokenManager.refreshToken({ payload: { userId: user._id as string } })

    const cookies = new Cookies(req, res)

    cookies.saveCookie(COOKIES.jwt_refresh_token.name, refreshToken)
    cookies.saveCookie(COOKIES.jwt_access_token.name, accessToken)

    return res.redirect(`${process.env.FRONTEND_URL}${finalCallbackUrl}`)
  })

export default googleRouter
