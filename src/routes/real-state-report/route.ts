import { COOKIES } from '@/constants/cookies.constants'
import asyncHandler from '@/src/actions/try-catch-async-handler'
import { AppError } from '@/src/handlers/error-handler'
import { responseHandler } from '@/src/handlers/responseHandler'
import { UserJWT } from '@/src/middlewares/authMiddleware'
import { validateRequest } from '@/src/middlewares/validate-request'
import RealStateReport from '@/src/schemas/real-state-reports.schemas'
import { RealStateModel } from '@/src/schemas/real-state.schemas'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import { reportPropertySchema } from '@/src/zod/report-property'
import { Request, Response, Router } from 'express'

const reportsRouter = Router()

reportsRouter.post('/real-state',
  validateRequest(reportPropertySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id, message, reason, reservationsUrl } = req.body

    const realState = await RealStateModel.findById(id)

    if (!realState) {
      throw new AppError('Real state not found', 404)
    }

    const accessToken = req.cookies[COOKIES.jwt_access_token.name]
    let decoded: UserJWT | null = null

    if (accessToken) {
      decoded = TokenManager.verifyToken(accessToken) as UserJWT
    }

    try {
      await RealStateReport.create({
        realStateId: id,
        userId: decoded?.userId,
        message,
        reason,
        reservationsUrl
      })
      responseHandler({
        res,
        code: 201,
        message: 'Real state report created successfully'
      })
    } catch (error: any) {
      console.error('Error creating real state report:', error)
      throw new AppError(error.message || 'Error creating real state report', 500)
    }
  }))

/* reportsRouter.get('/real-state', (async (req: Request, res: Response) => {
  const realStateReports = await RealStateReport.find()
  responseHandler({
    res,
    code: 200,
    data: realStateReports
  })
}) as RequestHandler) */

export default reportsRouter
