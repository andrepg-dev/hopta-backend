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
    const priorDate = new Date(new Date().setDate(today.getDate() - 30))

    const { from = priorDate, to = today } = req.query as any

    const fromDate = new Date(from)
    const toDate = new Date(to)

    // Get from the database all the properties and leads of the owner
    const properties = await RealStateModel.find({
      owner: user?.userId
    })

    const leads = await contactModel.find({ ownerId: user?.userId, createdAt: { $gte: fromDate, $lt: toDate } })

    // <================== Likes system ==================>
    const likes = getLikes(properties)

    // <================== Leads ==================>
    const leadsContactDate = leads.map((value) => value.createdAt)

    // <================== Views system ==================>
    const visits = getVisits(properties)

    responseHandler({
      res,
      code: 200,
      data: {
        visits,
        leads: leadsContactDate,
        likes,
        count: { visits: visits.length, leads: leadsContactDate.length, likes: likes.length },
        visitsWithFormat: getVisistsWithFormat(visits),
        from,
        to
      }
    })
  })
)

export function getLikes(properties: any) {
  const visits = properties.map((property: any) => {
    return property.saved_by
  }) as any

  let dates = []
  for (let i = 0; i < visits.length; i++) {
    dates.push(
      visits[i]?.map((value: any) => {
        return value.saved_at
      })
    )
  }

  return dates.flat().filter(Boolean)
}

export function getVisistsWithFormat(visits: Array<string | Date>) {
  const map: Record<string, { date: string; count: number }> = {}

  for (const iso of visits) {
    const dateString = iso instanceof Date ? iso.toISOString() : String(iso)
    const date = dateString.split('T')[0] as keyof typeof map

    if (!map[date]) {
      map[date] = { date, count: 0 }
    }

    map[date].count++
  }

  const result = Object.values(map)
  return result
}

/**
 * Array of visits with dates
 *
 * Takes all the properties, and return an array of dates, you can set only one propertie or an array of properties
 *
 * @param properties
 *
 * @returns ["xxxx-xx-xx", "xxxx-xx-xx"]
 */
export function getVisits(properties: any) {
  let visits = []

  if (Array.isArray(properties)) {
    visits = properties.map((property: any) => {
      return property.visitors
    })
  } else {
    visits = properties.visitors
  }

  let result: any[] = []
  for (let i = 0; i < visits.length; i++) {
    if (visits[i] === undefined) continue
    if (Array.isArray(visits[i])) {
      result.push(visits[i]?.map((value: any) => value.visit_date).flat())
    } else {
      result = visits?.map((value: any) => value.visit_date).flat() as any[]
    }
  }

  return filterDates(Array.isArray(result) ? result.flat().filter(Boolean) : []).sort((a: any, b: any) => a - b)
}

function filterDates(dates: string[]) {
  const to = new Date()
  const from = new Date(new Date().setDate(to.getDate() - 30))
  return dates.map((d) => new Date(d)).filter((dates) => dates <= to && dates >= from)
}

export default statsRouter
