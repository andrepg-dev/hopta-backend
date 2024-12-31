import { connectToDatabase } from '@/connection/connect'
import { CONNECTIONS } from '@/constants/connection'
import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import { errorHandler } from './handlers/error-handler'
import s3Router from './routes/aws/s3/s3-services'
import RealStateRouter from './routes/new-real-state-property/route'
import userRouter from './routes/user/route'

// Database connection
connectToDatabase()

// Express configuration
const app = express()

// App configuration
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const port = CONNECTIONS.PORT

app.get('/', (req, res) => {
  res.send('Hello from Hopta')
})

app.use('/s3', s3Router)
app.use('/real-state', RealStateRouter)
app.use('/user', userRouter)
app.use(errorHandler)

app.listen(port, () => {
  console.log(`Hopta server is running! http://localhost:${port}`)
})
