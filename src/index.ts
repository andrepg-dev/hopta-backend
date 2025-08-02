import { connectToDatabase } from '@/connection/connect'
import { CONNECTIONS } from '@/constants/connection.constants'
import { CORS_OPTIONS, RATE_LIMIT } from '@/constants/express-security.constants'
import Logs from '@/src/services/logs/save-logs.service'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Request, Response } from 'express'
import session from 'express-session'
import helmet from 'helmet'
import passport from 'passport'
import { errorHandler } from './handlers/error-handler'
import aiRouter from './routes/ai/route'
import './routes/auth/google/google-auth.config'
import googleRouter from './routes/auth/google/google.route'
import s3UploadImageRouter from './routes/aws/s3/s3.route'
import facebookRouter from './routes/facebook/facebook.route'
import healthRouter from './routes/healt/route'
import realStateReportRouter from './routes/real-state-report/route'
import RealStateRouter from './routes/real-state/route'
import stripeRouter from './routes/stripe/route'
import supportRouter from './routes/support/route'
import suscribeRouter from './routes/suscribe/route'
import tokenRouter from './routes/token/route'
import userRouter from './routes/user/route'
import stripeWebhookRouter from './routes/webhooks/stripe/payments.routes'
import contactRouter from './routes/contact-router/route'

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
app.use(
  session({
    secret: process.env.GOOGLE_SECRET_KEY!,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    }
  })
)

// Initialize Passport
app.use(passport.initialize())

// Security middleware
app.use(helmet())

// app.set('trust proxy', true)

const port = CONNECTIONS.PORT

app.get('/', (_: Request, res: Response) => {
  res.status(200).send('Welcome to Hopta')
})
app.use('/health', healthRouter)
app.use('/upload-image', s3UploadImageRouter)
app.use('/real-state', RealStateRouter)
app.use('/user', userRouter)
app.use('/auth/google', googleRouter)
app.use('/auth/facebook', facebookRouter)
app.use('/payments', stripeRouter)
app.use('/refresh-token', tokenRouter)
app.use('/webhooks/stripe/payments', stripeWebhookRouter)
app.use('/reports', realStateReportRouter)
app.use('/support', supportRouter)
app.use('/suscribe', suscribeRouter)
app.use('/contact', contactRouter)
app.use('/ai', aiRouter)

app.use(errorHandler)

function main(port: number) {
  const server = app.listen(port)
  server.on('error', (error: Error) => {
    if (error.message.includes('EADDRINUSE')) {
      console.warn(`Port ${port} is already in use, trying with another port...`)
      const newPort = port + 1
      server.close()
      main(newPort)
    }
  })

  server.on('listening', () => {
    new Logs({
      method: 'saveLogs',
      message: `Hopta server is running! http://localhost:${port}`
    })
  })
}

main(Number(port))
