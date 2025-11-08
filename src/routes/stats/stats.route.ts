import asyncHandler from '@/src/actions/try-catch-async-handler'
import { responseHandler } from '@/src/handlers/responseHandler'
import { authMiddleware } from '@/src/middlewares/authMiddleware'
import { contactModel } from '@/src/schemas/contact.schema'
import { RealStateModel } from '@/src/schemas/real-state.schemas'
import { Request, Response, Router } from 'express'

const statsRouter = Router()

/*
New structure of the saved_by


"saved_by": [
{
"user": "68dcae9302b73ac239e19f8b",
"saved_at": "2025-11-08T12:04:26.277Z",
"_id": "690f31ca4896f31f2a767b2f"
},
{
"user": "68de0e2a77c7df323a171add",
"saved_at": "2025-11-08T12:09:48.014Z",
"_id": "690f330c87813a2fb808bab8"
}
]

 */

/**
 * Analitycs of the manager
 */
statsRouter.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user

    const today = new Date()
    const priorDate = new Date(new Date().setDate(today.getDate() - 35))

    const { from = priorDate, to = today } = req.query as any

    const fromDate = new Date(from)
    const toDate = new Date(to)

    // Get from the database all the properties and leads of the owner
    const properties = await RealStateModel.find({
      owner: user?.userId,
      visitors: {
        $elemMatch: {
          visit_date: { $elemMatch: { $gte: fromDate, $lt: toDate } }
        }
      }
    })

    const leads = await contactModel.find({ ownerId: user?.userId, createdAt: { $gte: fromDate, $lt: toDate } })

    // <================== Likes system ==================>
    const likes = getLikes(properties)

    // <================== Leads ==================>
    const leadsVisits = leads.map((value) => value.createdAt)

    // <================== Views system ==================>
    const visits = getVisits(properties)

    responseHandler({
      res,
      code: 200,
      data: { visits, leads: leadsVisits, likes, count: { visits: visits.length, leads: leadsVisits.length, likes: likes.length }, from, to }
    })
  })
)

function getLikes(properties: any) {
  const visits = properties.map((property: any) => {
    return property.saved_by
  }) as any

  let dates = []
  for (let i = 0; i < visits.length; i++) {
    dates = visits[i]?.map((value: any) => {
      return value.saved_at
    })
  }

  return dates.filter(Boolean)
}

function getVisits(properties: any) {
  const visits = properties.map((property: any) => {
    return property.visitors
  })

  let result = []
  for (let i = 0; i < visits.length; i++) {
    for (let j = 0; j < visits.length; j++) {
      if (visits[j] === undefined) continue
      result = visits[j]?.map((value: any) => value.visit_date).flat() as any[]
    }
  }

  return result.filter(Boolean)
}

export default statsRouter
