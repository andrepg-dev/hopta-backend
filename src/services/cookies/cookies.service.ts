import { COOKIES } from '@/constants/cookies.constants'
import { CookieOptions, Request, Response } from 'express'

export class Cookies {
  private req: Request
  private res: Response
  private isProd: boolean
  private baseOptions: CookieOptions

  constructor(req: Request, res: Response) {
    this.req = req
    this.res = res
    this.isProd = process.env.NODE_ENV === 'production'

    this.baseOptions = {
      httpOnly: true,
      secure: this.isProd, // HTTPS obligatorio en prod
      sameSite: this.isProd ? 'none' : 'lax', // 'none' permite subdominios / cross-site
      domain: this.isProd ? '.hopta.hn' : undefined,
      path: '/' // válido para todo el sitio
    }
  }

  saveCookie(name: string, value: string, options?: CookieOptions) {
    let finalOptions: CookieOptions = {
      ...this.baseOptions,
      ...(options || {})
    }

    if (name === COOKIES.jwt_access_token.name) {
      finalOptions.maxAge = 1000 * 60 * 60 * 24 * 1 // 1 día
    }

    if (name === COOKIES.jwt_refresh_token.name) {
      finalOptions.maxAge = 1000 * 60 * 60 * 24 * 30 // 30 días
    }

    this.res.cookie(name, value, finalOptions)
  }

  getCookie(name: string) {
    return this.req.cookies[name]
  }

  deleteCookie(name: string) {
    this.res.clearCookie(name, this.baseOptions)
  }

  deleteAllCookies() {
    Object.keys(this.req.cookies).forEach((key) => {
      this.res.clearCookie(key, this.baseOptions)
    })
  }
}
