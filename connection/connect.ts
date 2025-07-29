import mongoose from 'mongoose'
import { CONNECTIONS } from '../constants/connection.constants'
import Logs from '@/src/services/logs/save-logs.service'

const connectionString = `mongodb+srv://admin:${CONNECTIONS.PASSWORD}@hopta.g94msvw.mongodb.net/${CONNECTIONS.DATABASE_NAME}?retryWrites=true&w=majority&appName=hopta`

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
