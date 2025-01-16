export const COOKIES = {
  cookies_token_name: 'access_token',
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY as string,
  expiresIn: {
    hourString: '1h',
    hourInt: 1000 * 60 * 60
  }
}
