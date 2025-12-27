import { COOKIES } from "@/constants/cookies.constants"
import asyncHandler from "@/src/actions/try-catch-async-handler"
import { AppError } from "@/src/handlers/error-handler"
import { responseHandler } from "@/src/handlers/responseHandler"
import { saveAccessToken } from "@/src/utils/JWT/save-token"
import { TokenManager } from "@/src/utils/JWT/tokens-manager"
import { Request, Response, Router } from "express"

const tokenRouter = Router()

tokenRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies[COOKIES.jwt_refresh_token.name]

    if (!token) throw new AppError("refresh token needed.", 404)

    try {
      const decodedToken = TokenManager.verifyRefreshToken(token)

      const refreshToken = await TokenManager.findRefreshTokenInDB({
        token,
        payload: { userId: decodedToken.userId }
      })

      if (!refreshToken) throw new AppError("Refresh token not found in DB", 404)

      const access_token = saveAccessToken({ userId: decodedToken.userId, req, res })

      /**
       * Send access token to server
       */
      responseHandler({
        res,
        code: 200,
        data: { access_token }
      })
    } catch (error) {
      throw new AppError("Invalid token there is an error" + error, 401)
    }
  })
)

export default tokenRouter
