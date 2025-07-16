import mongoose from 'mongoose'
import { CONNECTIONS } from '../constants/connection.constants'
import Logs from '@/src/services/logs/save-logs.service'

const connectionString = `mongodb+srv://asponceg:${CONNECTIONS.PASSWORD}@hopta-01-testing.a2r5i.mongodb.net/${CONNECTIONS.DATABASE_NAME}?retryWrites=true&w=majority&appName=hopta-01-testing`

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(connectionString)

    new Logs({
      method: 'saveLogs',
      message: 'Connected to database'
    })
  } catch (error) {
    new Logs({
      method: 'saveErrorLogs',
      message: 'Error connecting to database'
    })
  }
}
