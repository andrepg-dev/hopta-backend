import { COOKIES } from "@/constants/cookies.constants"
import { Cookies } from "@/src/services/cookies/cookies.service"
import { Request, Response } from "express"
import { TokenManager } from "./tokens-manager"

export function saveRefreshToken({ userId, req, res }: { userId: string; req: Request; res: Response }) {
  const cookies = new Cookies(req, res)
  const refreshToken = TokenManager.refreshToken({ payload: { userId } })
  TokenManager.saveRefreshTokenInDB({ payload: { userId } })
  cookies.saveCookie(COOKIES.jwt_refresh_token.name, refreshToken)
  return refreshToken
}

export function saveAccessToken({ userId, req, res }: { userId: string; req: Request; res: Response }) {
  const cookies = new Cookies(req, res)
  const accessToken = TokenManager.accessToken({ payload: { userId } })
  cookies.saveCookie(COOKIES.jwt_access_token.name, accessToken)
  return accessToken
}

export function saveAccessTokenAndRefreshToken({ userId, req, res }: { userId: string; req: Request; res: Response }) {
  const access_token = saveAccessToken({ userId, req, res })
  const refresh_token = saveRefreshToken({ userId, req, res })
  return { access_token, refresh_token }
}
