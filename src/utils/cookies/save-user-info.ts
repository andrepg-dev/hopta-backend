import { COOKIES } from '@/constants/cookie-user-name'
import { Response } from 'express'

export class Cookies {
  static setCookie(res: Response, cookieName: string = COOKIES.cookies_token_name, token: string, options = {}) {
    const defaultOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as 'strict' | 'lax' | 'none',
      maxAge: COOKIES.expiresIn.hourInt // 1 hora por defecto
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
