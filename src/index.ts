import { connectToDatabase } from '@/connection/connect'
import { CONNECTIONS } from '@/constants/connection'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { errorHandler } from './handlers/error-handler'
import { authMiddleware } from './middlewares/authMiddleware'
import Logs from './modules/logs/save-logs'
import s3Router from './routes/aws/s3/s3-services'
import RealStateRouter from './routes/new-real-state-property/route'
import userRouter from './routes/user/route'

// Database connection
connectToDatabase()

// Express configuration
const app = express()

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
)
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())

const port = CONNECTIONS.PORT

app.get('/', (req, res) => {
  res.send('Hello from Hopta')
})

app.use('/s3', authMiddleware, s3Router)
app.use('/real-state', authMiddleware, RealStateRouter)
app.use('/user', userRouter)
app.use(errorHandler)

app.listen(port, () => {
  const logger = new Logs()
  logger.saveLogs().info(`Hopta server is running! http://localhost:${port}`)
})
