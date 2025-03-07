import { COOKIES } from "@/constants/cookies.constants";
import { AppError } from "@/src/handlers/error-handler";
import { refreshTokenCookies } from "@/src/utils/cookies/save-user-info";
import { TokenManager } from "@/src/utils/JWT/tokens-manager";
import { Response, Router } from "express";
import passport from "passport";

const googleRouter = Router()

googleRouter.get('/', passport.authenticate('google', { scope: ['profile', 'email'] }))

googleRouter.get('/callback', passport.authenticate('google', { failureRedirect: 'https://www.hopta.hn/error-signin' }), async (req: any, res: Response) => {

  const { user } = req

  const token = TokenManager.accessToken({ userId: user._id as string })
  const refreshToken = TokenManager.refreshToken({ userId: user._id as string })
  refreshTokenCookies.setRefreshCookie(res, COOKIES.jwt_refresh_token.name, refreshToken)

  if (!req.user) {
    throw new AppError('Authentication failed', 401)
  }

  res.json({ user: req.user, token })
})

export default googleRouter
