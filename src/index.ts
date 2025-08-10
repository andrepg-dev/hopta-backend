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
import { AppError, errorHandler } from './handlers/error-handler'
import { responseHandler } from './handlers/responseHandler'
import aiRouter from './routes/ai/route'
import './routes/auth/google/google-auth.config'
import googleRouter from './routes/auth/google/google.route'
import s3UploadImageRouter from './routes/aws/s3/s3.route'
import contactRouter from './routes/contact-router/route'
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
import { EmailService } from './services/email/email.service'
import { WhatsAppMSGSender } from './services/messages-sender/send-whatsapp-msg.service'

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

app.get('/', async (_: Request, res: Response) => {
  // res.status(200).send('Welcome to Hopta')

  console.log('Entroooooo')

  const whatsappSender = new WhatsAppMSGSender('+50488011529')

  try {
    const response = await whatsappSender.sendWhatsAppMSG({
      message: 'Hola, este es un mensaje de prueba'
    })

    responseHandler({
      res,
      code: 200,
      message: 'Mensaje enviado correctamente',
      data: response
    })
  } catch (error) {
    throw new AppError('Error al enviar el mensaje: ' + error, 500)
  }
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

app.get('/queloque', (req: Request, res: Response) => {
  const emailService = new EmailService()
  emailService.sendEmail({
    to: {
      email: 'asponceg@gmail.com',
      name: 'André Ponce'
    },
    provider: 'amazon-ses',
    subject:
      'estoy enviando este correo desde queloque usando amazon ses service claro que si soy el puto amo aunque da igual alv me siento mal la puta madre aunque eso no importa',
    html: '<h1>Hola, este es un correo de prueba</h1>'
  })

  res.status(200).send('Queloque is working!' + JSON.stringify(req.query))
})

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
