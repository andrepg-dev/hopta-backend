import { connectToDatabase } from '@/connection/connect'
import { CONNECTIONS } from '@/constants/connection.constants'
import { CORS_OPTIONS, RATE_LIMIT } from '@/constants/express-security.constants'
import Logs from '@/src/modules/logs/save-logs.service'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import passport from 'passport'
import { errorHandler } from './handlers/error-handler'
import { authMiddleware } from './middlewares/authMiddleware'
import { EmailService } from './modules/email/email.service'
import './routes/auth/google/google-auth.config'; // n
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
app.use(session({ // This is necessary for the Google Strategy but it's not used for the JWT
  secret: process.env.GOOGLE_SECRET_KEY!,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}))

// Initialize Passport
app.use(passport.initialize())

// Security middleware
app.use(helmet())
app.set('trust proxy', 1)

const port = CONNECTIONS.PORT

app.use('/s3', authMiddleware, s3Router)
app.use('/real-state', RealStateRouter)
app.use('/user', userRouter)
app.use('/auth/google', googleRouter)
app.use('/payments', stripeRouter)
app.use('/refresh-token', tokenRouter)

app.get("/email", async (req, res) => {
  const email = new EmailService()
  const response = await email.sendEmail({
    to: {
      email: 'asponceg@gmail.com'
    },
    subject: 'Test email',
    html: 'Test email'
  })
  res.send(response)
})

app.use(errorHandler)

app.listen(port, () => {
  new Logs({
    method: 'saveLogs',
    message: `Hopta server is running! http://localhost:${port}`
  })
})
