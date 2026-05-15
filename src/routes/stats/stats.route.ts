import asyncHandler from "@/src/actions/try-catch-async-handler"
import { responseHandler } from "@/src/handlers/responseHandler"
import { authMiddleware } from "@/src/middlewares/authMiddleware"
import { contactModel } from "@/src/schemas/contact.schema"
import { RealStateModel } from "@/src/schemas/real-state.schemas"
import { userModel } from "@/src/schemas/user.schemas"
import { Request, Response, Router } from "express"
import mongoose from "mongoose"

const statsRouter = Router()

type RawVisitor = {
  user?: unknown
  visit_date?: Date | Date[] | string | string[]
}

type RawSavedBy = {
  saved_at?: Date | string
}

type RawPropertyStats = {
  total_visits?: number
  total_saves?: number
}

type RawProperty = {
  _id: string
  title: string
  images?: string[]
  visitors?: RawVisitor[]
  saved_by?: RawSavedBy[]
  stats?: RawPropertyStats
}

type VisitorUser = {
  _id: string
  name?: string
  last_name?: string
  profile_picture?: string
}

const toDateOrNull = (value: unknown): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value !== "string" && typeof value !== "number") return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const resolveRangeDate = (value: unknown, fallback: Date, boundary: "start" | "end") => {
  const rawValue = Array.isArray(value) ? value[0] : value
  const parsedDate = toDateOrNull(rawValue)
  const date = parsedDate ? new Date(parsedDate) : new Date(fallback)

  if (boundary === "start") {
    date.setHours(0, 0, 0, 0)
  } else {
    date.setHours(23, 59, 59, 999)
  }

  return date
}

const getVisitorUserId = (visitorUser: unknown) => {
  if (visitorUser instanceof mongoose.Types.ObjectId) return visitorUser.toString()
  if (typeof visitorUser === "string") return visitorUser

  if (visitorUser && typeof visitorUser === "object" && "_id" in visitorUser) {
    return String((visitorUser as { _id: unknown })._id)
  }

  return ""
}

const isBetween = (date: Date, from: Date, to: Date) => date.getTime() >= from.getTime() && date.getTime() <= to.getTime()

/**
 * Analitycs of the manager
 */
statsRouter.get(
  "/",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const today = new Date()
    const prior = new Date(today)
    prior.setDate(today.getDate() - 30)

    const from = resolveRangeDate(req.query.from, prior, "start")
    const to = resolveRangeDate(req.query.to, today, "end")

    const parsedUserId = new mongoose.Types.ObjectId(req.user?.userId)

    // <================== Views & Likes system ==================>
    const properties = (await RealStateModel.find({ owner: parsedUserId })
      .select("title images stats +visitors +saved_by")
      .setOptions({ user: req.user, showVisitorsAndSavedBy: true })
      .lean()) as unknown as RawProperty[]

    const visitorUserIds = new Set<string>()

    properties.forEach((property) => {
      ;(property.visitors || []).forEach((visitor) => {
        const visitorUserId = getVisitorUserId(visitor.user)
        if (mongoose.Types.ObjectId.isValid(visitorUserId)) {
          visitorUserIds.add(visitorUserId)
        }
      })
    })

    const visitorObjectIds = Array.from(visitorUserIds).map((id) => new mongoose.Types.ObjectId(id))
    const users = visitorObjectIds.length
      ? ((await userModel.collection
          .find({ _id: { $in: visitorObjectIds } }, { projection: { _id: 1, name: 1, last_name: 1, profile_picture: 1 } })
          .toArray()) as unknown as VisitorUser[])
      : []

    const usersById = new Map(users.map((user) => [String(user._id), { ...user, _id: String(user._id) }]))

    const visits = properties.map((property) => {
      const dates: string[] = []
      const visitors = (property.visitors || [])
        .map((visitor) => {
          const rawDates = Array.isArray(visitor.visit_date) ? visitor.visit_date : visitor.visit_date ? [visitor.visit_date] : []
          const filteredDates = rawDates
            .map(toDateOrNull)
            .filter((date): date is Date => Boolean(date && isBetween(date, from, to)))
            .sort((a, b) => b.getTime() - a.getTime())

          if (!filteredDates.length) return null

          const lastVisitDate = filteredDates[0]
          if (!lastVisitDate) return null

          const visitorUserId = getVisitorUserId(visitor.user)
          const user = usersById.get(visitorUserId)
          const visitDates = filteredDates.map((date) => date.toISOString())

          dates.push(...visitDates)

          return {
            type: user ? "user" : "anonymous",
            user: user || null,
            visit_count: visitDates.length,
            last_visit_date: lastVisitDate.toISOString(),
            dates: visitDates
          }
        })
        .filter((visitor): visitor is NonNullable<typeof visitor> => visitor !== null)
        .sort((a, b) => new Date(b.last_visit_date).getTime() - new Date(a.last_visit_date).getTime())

      const likeDates = (property.saved_by || [])
        .map((savedBy) => toDateOrNull(savedBy.saved_at))
        .filter((date): date is Date => Boolean(date && isBetween(date, from, to)))
        .map((date) => date.toISOString())

      dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

      return {
        _id: property._id,
        title: property.title,
        image: property.images?.[0] || null,
        dates,
        visits: dates.length,
        likes: likeDates.length,
        like_dates: likeDates,
        total_visits: property.stats?.total_visits || dates.length,
        total_likes: property.saved_by?.length || property.stats?.total_saves || 0,
        visitors
      }
    })

    // <================== Leads ==================>

    const leads = await contactModel
      .aggregate([
        {
          $match:
            /**
             * query: The query in MQL.
             */
            {
              ownerId: parsedUserId,
              createdAt: {
                $gte: from,
                $lte: to
              }
            }
        },
        {
          $project:
            /**
             * specifications: The fields to
             *   include or exclude.
             */
            {
              client: "$client.name",
              reason: 1,
              createdAt: 1,
              propertyId: 1
            }
        },
        {
          $lookup: {
            from: "realstates",
            localField: "propertyId",
            foreignField: "_id",
            as: "property"
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
              path: "$property"
            }
        },
        {
          $project:
            /**
             * specifications: The fields to
             *   include or exclude.
             */
            {
              client: 1,
              reason: 1,
              createdAt: 1,
              property: "$property.title"
            }
        }
      ])
      .exec()

    responseHandler({
      res,
      code: 200,
      data: {
        visits_and_likes: visits,
        leads,
        from: from.toISOString(),
        to: to.toISOString()
      }
    })
  })
)

export default statsRouter
