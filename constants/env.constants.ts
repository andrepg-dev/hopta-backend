import 'dotenv/config'

export const envs = {
  NODE_ENV: process.env.NODE_ENV as string,
  // Node mailer
  MAILER_SERVICE: process.env.MAILER_SERVICE as string,
  MAILER_EMAIL: process.env.MAILER_EMAIL as string,
  MAILER_PASSWORD: process.env.MAILER_PASSWORD as string,

  // Cookie
  COOKIE_SECRET: process.env.COOKIE_SECRET as string
}
