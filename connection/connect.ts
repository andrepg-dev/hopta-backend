import mongoose from "mongoose";
import { CONNECTIONS } from "../constants/connection";

const connectionString =
  `mongodb+srv://asponceg:${CONNECTIONS.PASSWORD}@hopta-01-testing.a2r5i.mongodb.net/${CONNECTIONS.DATABASE_NAME}?retryWrites=true&w=majority&appName=hopta-01-testing`

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(connectionString)
    console.log('Connected to database')
  } catch (error) {
    console.error('Error connecting to database', error)
  }
}

