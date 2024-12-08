import 'dotenv/config';

import cors from 'cors';
import express from 'express';
import { CONNECTIONS } from '../constants/connection';

// routes
import mainRouter from './routes/main';

const app = express()
app.use(cors())
app.use(express.json())

const port = CONNECTIONS.PORT;

app.use('/', mainRouter)

app.listen(port, () => {
  console.log(`Server is running! http://localhost:${port}`)
})
