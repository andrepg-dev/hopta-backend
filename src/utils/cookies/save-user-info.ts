import { COOKIES } from '@/constants/cookies.constants'
import { CookieOptions, Response } from 'express'

export abstract class refreshTokenCookies {
  static setRefreshCookie({
    res,
    cookieName = COOKIES.jwt_refresh_token.name,
    token,
    options = {}
  }: {
    res: Response
    cookieName?: string
    token: string
    options?: CookieOptions
  }) {
    const defaultOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as 'strict' | 'lax' | 'none',
      maxAge: COOKIES.jwt_refresh_token.expires
    }

    const cookieOptions = { ...defaultOptions, ...options }

    res.cookie(cookieName, token, cookieOptions)
  }

  static clearCookie(res: Response, cookieName: string) {
    res.clearCookie(cookieName)
  }

  static clearAllCookies(res: Response, cookies: string[]) {
    cookies.forEach((cookie) => res.clearCookie(cookie))
  }
}
