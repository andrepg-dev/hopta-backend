import cors from 'cors';
import express from 'express';
import { CONNECTIONS } from '../constants/connection';

// routes
import { connectToDatabase } from '../connection/connect';

connectToDatabase()

const app = express()
app.use(cors())
app.use(express.json())

const port = CONNECTIONS.PORT;

app.use('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server is running! http://localhost:${port}`)
})
