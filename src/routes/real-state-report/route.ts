import { authMiddleware } from '@/src/middlewares/authMiddleware'
import RealStateReport from '@/src/schemas/real-state-reports.schemas'
import { RealStateModel } from '@/src/schemas/real-state.schemas'
import { Request, RequestHandler, Response, Router } from 'express'

const reportsRouter = Router()

reportsRouter.post('/real-state', authMiddleware, (async (req: Request, res: Response) => {
  const { propertyId: realStateId, message } = req.body

  const realState = await RealStateModel.findById(realStateId)

  if (!realState) {
    return res.status(404).json({ message: 'Real state not found' })
  }

  if (!realStateId || !message) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  const userId = req.user?.userId

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    await RealStateReport.create({ realStateId, userId: userId, message })
    res.status(201).json({ success: true, message: 'Real state report created successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating real state report' })
  }
}) as RequestHandler)

// TODO: Do not show the reports of the real state, only admin can see them.

reportsRouter.get('/real-state', (async (req: Request, res: Response) => {
  const realStateReports = await RealStateReport.find()
  res.status(200).json(realStateReports)
}) as RequestHandler)

export default reportsRouter
