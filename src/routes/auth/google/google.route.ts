import { AppError } from "@/src/handlers/error-handler"
import { saveAccessTokenAndRefreshToken } from "@/src/utils/JWT/save-token"
import { Response, Router } from "express"
import passport from "passport"

const googleRouter = Router()

googleRouter.get("/", (req, res, next) => {
  const { callbackUrl } = req.query

  const authenticator = passport.authenticate("google", {
    scope: ["profile", "email"],
    state: callbackUrl as string
  })

  authenticator(req, res, next)
})

googleRouter.get(
  "/callback",
  passport.authenticate("google", {
    failureRedirect: "https://www.hopta.hn/"
  }),
  async (req: any, res: Response) => {
    const user = req.user
    const callbackUrl = req.query.state as string

    const URL_TO_REDIRECT = ["/user/dashboard", "/publicar"]
    const finalCallbackUrl = callbackUrl || "/user/dashboard"

    if (!URL_TO_REDIRECT.includes(finalCallbackUrl)) {
      throw new AppError("Invalid URL", 400)
    }

    if (!req.user || !req.user._id) {
      throw new AppError("Authentication failed", 401)
    }

    saveAccessTokenAndRefreshToken({ userId: user._id, req, res })

    return res.redirect(`${process.env.FRONTEND_URL}${finalCallbackUrl}`)
  }
)

export default googleRouter
