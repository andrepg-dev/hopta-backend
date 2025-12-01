import { COOKIES } from "@/constants/cookies.constants"
import { NextFunction, Request, Response } from "express"
import { AppError } from "../handlers/error-handler"
import { TokenManager } from "../utils/JWT/tokens-manager"

export interface UserJWT {
  userId: string
  iat: number
  exp: number
}

declare global {
  namespace Express {
    interface User extends UserJWT {}
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies[COOKIES.jwt_access_token.name]
  if (!accessToken) throw new AppError("Unauthorized", 401)

  try {
    const decoded = TokenManager.verifyToken(accessToken) as UserJWT

    // if token gived is expired, throw error
    if (decoded.exp < Date.now() / 1000) {
      throw new AppError("Refresh token expired", 401)
    }

    req.user = decoded as UserJWT
    next()
  } catch (error) {
    throw new AppError("Invalid token", 401)
  }
}
