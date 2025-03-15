import { CookieOptions, Request, Response } from 'express'

export class Cookies {
  private req: Request
  private res: Response

  constructor(req: Request, res: Response) {
    this.req = req
    this.res = res
  }

  saveCookie(name: string, value: string, options?: CookieOptions) {
    this.res.cookie(
      name,
      value,
      options
        ? options
        : {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as 'strict' | 'lax' | 'none',
            maxAge: 1800000
          }
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
