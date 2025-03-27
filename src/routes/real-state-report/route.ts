import RealStateReport from '@/src/schemas/real-state-reports.schemas'
import { Request, RequestHandler, Response, Router } from 'express'

const realStateReportRouter = Router()

realStateReportRouter.post('/', (async (req: Request, res: Response) => {
  const { realStateId, userId, message } = req.body

  if (!realStateId || !userId || !message) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  const realStateReport = await RealStateReport.create({ realStateId, userId, message })

  res.status(201).json(realStateReport)
}) as RequestHandler)


// TODO: Do not show the reports of the real state, only admin can see them.

realStateReportRouter.get('/', (async (req: Request, res: Response) => {
  const realStateReports = await RealStateReport.find()
  res.status(200).json(realStateReports)
}) as RequestHandler)

export default realStateReportRouter
