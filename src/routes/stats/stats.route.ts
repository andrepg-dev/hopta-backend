import asyncHandler from "@/src/actions/try-catch-async-handler"
import { responseHandler } from "@/src/handlers/responseHandler"
import { authMiddleware } from "@/src/middlewares/authMiddleware"
import { contactModel } from "@/src/schemas/contact.schema"
import { RealStateModel } from "@/src/schemas/real-state.schemas"
import { Request, Response, Router } from "express"
import mongoose from "mongoose"

const statsRouter = Router()

/**
 * Analitycs of the manager
 */
statsRouter.get(
  "/",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user

    const today = new Date()
    const prior = new Date(new Date().setDate(today.getDate() - 30))

    const { from = prior, to = today } = req.query as any

    const newMongooseObjectId = new mongoose.Types.ObjectId(req.user?.userId)

    // <================== Views & Likes system ==================>
    const visits = await RealStateModel.aggregate([
      {
        $match: {
          owner: newMongooseObjectId
        }
      },
      {
        $unwind: {
          path: "$visitors"
        }
      },
      {
        $unwind:
          /**
           * path: Path to the array field.
           * includeArrayIndex: Optional name for index.
           * preserveNullAndEmptyArrays: Optional
           *   toggle to unwind null and empty values.
           */
          {
            path: "$visitors.visit_date"
          }
      },
      {
        $addFields:
          /**
           * newField: The new field name.
           * expression: The new field expression.
           */
          {
            visit_day: "$visitors.visit_date",
            saved_by_count: {
              $cond: {
                if: {
                  $isArray: "$saved_by"
                },
                then: {
                  $size: "$saved_by"
                },
                else: 0
              }
            }
          }
      },
      {
        $group:
          /**
           * _id: The id of the group.
           * fieldN: The first field name.
           */
          {
            _id: "$title",
            dates: {
              $push: "$visit_day"
            },
            visits: {
              $sum: 1
            },
            likes: {
              $first: "$saved_by_count"
            }
          }
      }
    ]).exec()

    // <================== Leads ==================>
    const leads = await contactModel.find({ ownerId: user?.userId, createdAt: { $gte: new Date(from), $lt: new Date(to) } })
    const leadsContactDate = leads.map((value) => value.createdAt)

    responseHandler({
      res,
      code: 200,
      data: {
        visits_and_likes: visits,
        leads: leadsContactDate,
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

export function getVisistsWithFormat(visits: Array<string | Date>) {
  const map: Record<string, { date: string; count: number }> = {}

  for (const iso of visits) {
    const dateString = iso instanceof Date ? iso.toISOString() : String(iso)
    const date = dateString.split("T")[0] as keyof typeof map

    if (!map[date]) {
      map[date] = { date, count: 0 }
    }

    map[date].count++
  }

  const result = Object.values(map)
  return result
}

function filterDates(dates: string[]) {
  const to = new Date()
  const from = new Date(new Date().setDate(to.getDate() - 30))
  return dates.map((d) => new Date(d)).filter((dates) => dates <= to && dates >= from)
}

export default statsRouter
