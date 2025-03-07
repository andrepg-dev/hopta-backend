export const COOKIES = {
  cookies_token_name: 'access_token',
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY as string,

  general: {
    name: 'general_cookies',
    SECRET_KEY: process.env.GENERAL_COOKIES_SECRET_KEY as string,
    expiresIn: {
      hourString: '1h',
      hourInt: 1 * 60 * 60 * 1000
    },
  },
  expiresIn: {
    hourString: '60m',
    hourInt: 60 * 60 * 1000
  },

  jwt_refresh_token: {
    name: 'refresh_token',
    SECRET_KEY: process.env.JWT_REFRESH_SECRET_KEY as string,
    dayString: '14d',
    expires: 14 * 24 * 60 * 60 * 1000 // 14 días
  }
}
