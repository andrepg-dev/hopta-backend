import mongoose from 'mongoose'
import { CONNECTIONS } from '../constants/connection'
import Logs from '@/src/modules/logs/save-logs.service'

const connectionString = `mongodb+srv://asponceg:${CONNECTIONS.PASSWORD}@hopta-01-testing.a2r5i.mongodb.net/${CONNECTIONS.DATABASE_NAME}?retryWrites=true&w=majority&appName=hopta-01-testing`

export const connectToDatabase = async () => {
  const logger = new Logs()

  try {
    await mongoose.connect(connectionString)
    logger.saveLogs().info('Connected to database')
  } catch (error) {
    logger.saveLogs().error('Error connecting to database', error)
  }
}
