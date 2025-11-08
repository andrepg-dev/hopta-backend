import { Router } from 'express'

const healthRouter = Router()

healthRouter.get('/', (_, res) => {
  res.status(200).json({
    status: 'ok',
  })
})

export default healthRouter
