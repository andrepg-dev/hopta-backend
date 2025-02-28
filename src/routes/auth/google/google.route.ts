import { AppError } from "@/src/handlers/error-handler";
import { Response, Router } from "express";
import passport from "passport";

const googleRouter = Router()

googleRouter.get('/', passport.authenticate('google', { scope: ['profile', 'email'] }))

googleRouter.get('/callback', passport.authenticate('google', { failureRedirect: 'https://www.hopta.hn/error-signin' }), (req: any, res: Response) => {

  if (!req.user) {
    throw new AppError('Authentication failed', 401)
  }

  res.json({ user: req.user, token: req.user.token ?? req.token })

  res.redirect('https://www.hopta.hn/login-success')
})

export default googleRouter
