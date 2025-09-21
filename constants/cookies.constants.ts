export const COOKIES = {
  general: {
    name: 'general_cookies',
    SECRET_KEY: process.env.GENERAL_COOKIES_SECRET_KEY ?? (() => { throw new Error('GENERAL_COOKIES_SECRET_KEY IS MISSING') })(),
    expiresIn: {
      hourString: '1h',
      hourInt: 1 * 60 * 60 * 1000
    }
  },
  expiresIn: {
    hourString: '60m',
    hourInt: 60 * 60 * 1000
  },
  jwt_refresh_token: {
    name: 'refresh_token',
    SECRET_KEY: process.env.JWT_REFRESH_SECRET_KEY ?? (() => { throw new Error('JWT_REFRESH_SECRET_KEY IS MISSING') })(),
    dayString: '14d',
    expires: 14 * 24 * 60 * 60 * 1000 // 14 días
  },
  jwt_access_token: {
    name: 'access_token',
    SECRET_KEY: process.env.JWT_ACCESS_SECRET_KEY ?? (() => { throw new Error('JWT_ACCESS_SECRET_KEY IS MISSING') })(),
    dayString: '7d',
    expires: 7 * 24 * 60 * 60 * 1000 // 7 días
  }
}
