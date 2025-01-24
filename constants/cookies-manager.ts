export const COOKIES = {
  cookies_token_name: 'access_token',
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY as string,
  expiresIn: {
    hourString: '15s',
    hourInt: 15
  },

  jwt_refresh_token: {
    name: 'refresh_token',
    SECRET_KEY: process.env.JWT_REFRESH_SECRET_KEY as string,
    dayString: '7d',
    expires: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  }
}
