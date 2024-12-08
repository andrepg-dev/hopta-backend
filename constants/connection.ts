import 'dotenv/config'
import { IConnection } from '../types/connection'

export const CONNECTIONS: IConnection = {
  PORT: process.env.PORT as unknown as number
} 