import { authMiddleware } from '@/src/middlewares/authMiddleware'
import RealStateReport from '@/src/schemas/real-state-reports.schemas'
import { RealStateModel } from '@/src/schemas/real-state.schemas'
import { Request, RequestHandler, Response, Router } from 'express'
import { responseHandler } from '@/src/handlers/responseHandler'
import { AppError } from '@/src/handlers/error-handler'

const reportsRouter = Router()

reportsRouter.post('/real-state', authMiddleware, (async (req: Request, res: Response) => {
  const { propertyId: realStateId, message } = req.body

  const realState = await RealStateModel.findById(realStateId)

  if (!realState) {
    throw new AppError('Real state not found', 404)
  }

  if (!realStateId || !message) {
    throw new AppError('Missing required fields', 400)
  }

  const userId = req.user?.userId

  if (!userId) {
    throw new AppError('Unauthorized', 401)
  }

  try {
    await RealStateReport.create({ realStateId, userId: userId, message })
    responseHandler({
      res,
      code: 201,
      message: 'Real state report created successfully'
    })
  } catch (error) {
    throw new AppError('Error creating real state report', 500)
  }
}) as RequestHandler)

// TODO: Do not show the reports of the real state, only admin can see them.

reportsRouter.get('/real-state', (async (req: Request, res: Response) => {
  const realStateReports = await RealStateReport.find()
  responseHandler({
    res,
    code: 200,
    data: realStateReports
  })
}) as RequestHandler)

export default reportsRouter
