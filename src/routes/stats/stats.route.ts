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
    const today = new Date()
    const prior = new Date(new Date().setDate(today.getDate() - 30))

    const { from = prior, to = today } = req.query as any

    const parsedUserId = new mongoose.Types.ObjectId(req.user?.userId)

    // <================== Views & Likes system ==================>
    const visits = await RealStateModel.aggregate(
      [
        {
          $match: {
            owner: parsedUserId
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
      ],
      {
        user: req.user
      }
    ).exec()

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
                $gte: new Date(from),
                $lte: new Date(to)
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
          $addFields:
            /**
             * newField: The new field name.
             * expression: The new field expression.
             */
            {
              propertyId: {
                $toObjectId: "$propertyId"
              }
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
        from,
        to
      }
    })
  })
)

export default statsRouter
