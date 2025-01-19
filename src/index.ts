import { connectToDatabase } from '@/connection/connect'
import { CONNECTIONS } from '@/constants/connection'
import { CORS_OPTIONS, RATE_LIMIT } from '@/constants/express-security'
import Logs from '@/src/modules/logs/save-logs'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { errorHandler } from './handlers/error-handler'
import { authMiddleware } from './middlewares/authMiddleware'
import { EmailService } from './modules/email/email.service'
import s3Router from './routes/aws/s3/s3-services'
import RealStateRouter from './routes/new-real-state-property/route'
import userRouter from './routes/user/route'

// Database connection
connectToDatabase()

// Express configuration
const app = express()

app.use(helmet())

// Middlewares
app.use(RATE_LIMIT)
app.use(cors(CORS_OPTIONS))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())

const port = CONNECTIONS.PORT

app.get('/', async (req, res) => {
  const emailService = new EmailService()

  const response = await emailService
    .sendEmail({
      to: ['andreponce417@gmail.com', 'asponceg@gmail.com'],
      subject: 'Que lo que mi loco',
      html: '<h1>Logs de sistema NOC</h1> <p>Se ha generado un nuevo log de sistema</p>',
      from: 'admin@hopta.hn',
      attachments: [
        {
          filename: 'app-2025-01-18.log',
          path: './logs/app-2025-01-18.log'
        },
        {
          filename: 'app-2025-01-16.log',
          path: './logs/app-2025-01-16.log'
        }
      ]
    })
    .catch((err) => console.log(err))

  res.json(response)
})

app.use('/s3', authMiddleware, s3Router)
app.use('/real-state', authMiddleware, RealStateRouter)
app.use('/user', userRouter)
app.use(errorHandler)

app.listen(port, () => {
  const logger = new Logs()
  logger.saveLogs().info(`Hopta server is running! http://localhost:${port}`)
})
