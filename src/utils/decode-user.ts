import { COOKIES } from "@/constants/cookies.constants"
import { NextFunction, Request, Response } from "express"
import { UserJWT } from "../middlewares/authMiddleware"
import { TokenManager } from "./JWT/tokens-manager"

/**
 * Extract user token if exits, otherwise, ignore it
 */
export function decodeUserToken(req: Request, _: Response, next: NextFunction) {
  const accessToken = req.cookies[COOKIES.jwt_access_token.name]
  let decoded: UserJWT | null = null

  try {
    if (accessToken) {
      decoded = TokenManager.verifyToken(accessToken) as UserJWT
      req.user = decoded as UserJWT | undefined
    }
  } catch (error) {
    return
  } finally {
    next()
  }
}
