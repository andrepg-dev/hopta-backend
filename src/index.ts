import { connectToDatabase } from '@/connection/connect'
import { CONNECTIONS } from '@/constants/connection'
import { CORS_OPTIONS, RATE_LIMIT } from '@/constants/express-security'
import Logs from '@/src/modules/logs/save-logs.service'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import passport from 'passport'
import { errorHandler } from './handlers/error-handler'
import { authMiddleware } from './middlewares/authMiddleware'
import './routes/auth/google/google-auth.config' // Import Google Strategy configuration
import googleRouter from './routes/auth/google/google.route'
import s3Router from './routes/aws/s3/s3-services'
import RealStateRouter from './routes/real-state/route'
import stripeRouter from './routes/stripe/route'
import tokenRouter from './routes/token/route'
import userRouter from './routes/user/route'

// Database connection
connectToDatabase()

// Express configuration
export const app = express()

// Middlewares
app.use(RATE_LIMIT)
app.use(cors(CORS_OPTIONS))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())

// Initialize Passport
app.use(passport.initialize())

// Security middleware
app.use(helmet())
app.set('trust proxy', 1)

const port = CONNECTIONS.PORT

app.use('/s3', authMiddleware, s3Router)
app.use('/real-state', authMiddleware, RealStateRouter)
app.use('/user', userRouter)
app.use('/auth/google', googleRouter)
app.use('/stripe', stripeRouter)
app.use('/token', tokenRouter)
app.use(errorHandler)

app.listen(port, () => {
  const logger = new Logs()
  logger.saveLogs().info(`Hopta server is running! http://localhost:${port}`)
})
