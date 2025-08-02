import { COOKIES } from '@/constants/cookies.constants'
import { CookieOptions, Request, Response } from 'express'

export class Cookies {
  private req: Request
  private res: Response

  constructor(req: Request, res: Response) {
    this.req = req
    this.res = res
  }

  saveCookie(name: string, value: string, options?: CookieOptions) {

    let body = {
      name,
      value,
      options: options ? options
        : {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict' as 'strict' | 'lax' | 'none'
        }
    }

    if (name === COOKIES.jwt_access_token.name) {
      body.options.maxAge = 1000 * 60 * 60 * 24 * 1 // 1 día
    }

    if (name === COOKIES.jwt_refresh_token.name) {
      body.options.maxAge = 1000 * 60 * 60 * 24 * 30 // 30 días
    }

    this.res.cookie(
      body.name,
      body.value,
      body.options
    )
  }

  getCookie(name: string) {
    return this.req.cookies[name]
  }

  deleteCookie(name: string) {
    this.res.clearCookie(name)
  }

  deleteAllCookies() {
    Object.keys(this.req.cookies).forEach((key) => {
      this.res.clearCookie(key)
    })
  }
}
