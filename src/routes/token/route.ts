import { COOKIES } from "@/constants/cookies.constants";
import { AppError } from "@/src/handlers/error-handler";
import asyncHandler from "@/src/helpers/try-catch-async-handler";
import Logs from "@/src/modules/logs/save-logs.service";
import { TokenManager } from "@/src/utils/JWT/tokens-manager";
import { refreshTokenI } from "@/types/refresh-token/types";
import { Request, Response, Router } from "express";

const tokenRouter = Router()

tokenRouter.get("/", asyncHandler(async (req: Request, res: Response) => {
  // Verificar si el formato del header es el correcto
  const token = req.cookies[COOKIES.jwt_refresh_token.name]
  if (!token) throw new AppError('Unauthorized', 401)

  new Logs({
    method: 'saveLogs',
    message: `Token: ${token}`
  })

  try {
    // Verificar el access token
    const user = TokenManager.verifyRefreshToken(token) as refreshTokenI
    const refreshToken = await TokenManager.findRefreshTokenInDB({ token, userId: user.userId })

    if (!refreshToken) throw new AppError('Token not found', 404) // we dont gonna refresh a token that is not in the database
    const accessToken = TokenManager.accessToken({ userId: user.userId })
    res.json({ accessToken })
  } catch (error) {
    throw new AppError('Invalid token ' + error, 401)
  }
}))

export default tokenRouter
