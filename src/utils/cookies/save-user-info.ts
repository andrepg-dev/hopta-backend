import { COOKIES } from '@/constants/cookies.constants'
import { Response } from 'express'

export abstract class refreshTokenCookies {
  static setRefreshCookie(res: Response, cookieName: string = COOKIES.cookies_token_name, token: string, options = {}) {
    const defaultOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as 'strict' | 'lax' | 'none',
      maxAge: COOKIES.jwt_refresh_token.expires // Convert to number
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
