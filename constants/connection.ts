import 'dotenv/config'

export const CONNECTIONS = {
  PORT: process.env.PORT ?? 3000,
  PASSWORD: process.env.PASSWORD || '',
  DATABASE_NAME: process.env.DATABASE_NAME || 'test',
}
