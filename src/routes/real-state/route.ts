import { COOKIES } from '@/constants/cookies.constants'
import asyncHandler from '@/src/actions/try-catch-async-handler'
import { AppError } from '@/src/handlers/error-handler'
import { responseHandler } from '@/src/handlers/responseHandler'
import { authMiddleware, UserJWT } from '@/src/middlewares/authMiddleware'
import { validateRequest } from '@/src/middlewares/validate-request'
import { RealStateModel } from '@/src/schemas/real-state.schemas'
import { userModel } from '@/src/schemas/user.schemas'
import Logs from '@/src/services/logs/save-logs.service'
import { getPagination } from '@/src/utils/get-pagination.utils'
import { TokenManager } from '@/src/utils/JWT/tokens-manager'
import { realStateSchema, realStateUpdateSchema } from '@/src/zod/real-state.zod'
import { RealStateI, RealStateIWithOwner } from '@/types/real-state/types.real-state'
import { Request, Response, Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'

const RealStateRouter = Router()

/**
 * @description get all real state properties available
 */
RealStateRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const sortBy = (req.query.sortBy as string) || 'created_at'
    const order = (req.query.order as 'asc' | 'desc') || 'desc'

    const paginatedData = await getPagination({
      limit,
      page,
      Model: RealStateModel,
      sortBy,
      order
    })

    if (!paginatedData) throw new AppError('Properties not found', 404)
    responseHandler({
      res,
      code: 200,
      data: paginatedData
    })
  })
)

RealStateRouter.get(
  '/my-properties',
  authMiddleware,
  asyncHandler(async (req: Request<{}, {}, {}, { page: string; limit: string; sortBy: string; order: 'asc' | 'desc' }>, res: Response) => {
    const user = req.user

    if (!user) throw new AppError('User not found', 404)

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const sortBy = (req.query.sortBy as string) || 'created_at'
    const order = (req.query.order as 'asc' | 'desc') || 'desc'

    const paginatedData = await RealStateModel.paginate({ owner: user.userId }, { page, limit, sortBy, order })

    responseHandler({
      res,
      code: 200,
      data: paginatedData
    })
  })
)

RealStateRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid property ID', 400)

    // Actualizar las visitas de una propiedad
    const accessToken = req.cookies[COOKIES.jwt_access_token.name]
    let decoded: UserJWT | null = null

    if (accessToken) {
      decoded = TokenManager.verifyToken(accessToken) as UserJWT
    }

    if (decoded) {
      await RealStateModel.updateOne({ _id: id }, { $push: { visitors: { user: decoded.userId, visit_date: new Date() } } })
    }

    await RealStateModel.updateOne({ _id: id }, { $inc: { 'stats.total_visits': 1 } })

    const property = await RealStateModel.findById(id).populate('owner', 'name last_name email phone contact profile_picture created_at social_media about')
    if (!property) throw new AppError('Property not found', 404)
    responseHandler({
      res,
      code: 200,
      data: property
    })
  })
)

RealStateRouter.post(
  '/',
  authMiddleware,
  validateRequest(realStateSchema),
  asyncHandler(async (req: Request<{}, {}, RealStateI, {}>, res: Response) => {
    const { body } = req
    const {
      title,
      description,
      price,
      house_features,
      images,
      house_status,
      location,
      square_meters,
      currency,
      population,
      additional_cost,
      previous_payment_required
    } = body

    const owner = req?.user?.userId

    const foundUser = await userModel.findById(owner)
    if (!foundUser) throw new AppError('User not found', 404)

    try {
      const property = await RealStateModel.create({
        price,
        location,
        house_status,
        house_features,
        population,
        currency,
        square_meters,
        description,
        images,
        title,
        owner,
        stats: { total_visits: 0, total_saves: 0 },
        rating_summary: { average_rating: 0, total_ratings: 0 },
        visitors: [],
        saved_by: [],
        ratings: [],
        additional_cost,
        previous_payment_required
      })

      await userModel.updateOne({ _id: owner }, { $push: { properties: property._id } })

      responseHandler({
        res,
        code: 201,
        data: property
      })
    } catch (error: any) {
      throw new AppError(error.message || 'Server error creating property', 500)
    }
  })
)

RealStateRouter.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid property ID', 400)

    const { user } = req as any
    const { userId: owner } = user

    const foundUser = await userModel.findById(owner)
    if (!foundUser) throw new AppError('User not found', 404)

    const property = (await RealStateModel.findById(id)) as unknown as RealStateIWithOwner
    if (!property) throw new AppError('Property not found', 404)

    new Logs({
      method: 'saveLogs',
      message: property
    })

    if (property.owner.toString() !== owner) throw new AppError('You are not the owner of this property', 403)

    const deletedProperty = await RealStateModel.findByIdAndDelete(id)
    if (!deletedProperty) throw new AppError('Property not found', 404)

    await userModel.updateOne({ _id: (deletedProperty as unknown as RealStateIWithOwner).owner }, { $pull: { properties: id } })

    responseHandler({
      res,
      code: 200,
      message: 'Property deleted successfully'
    })
  })
)

RealStateRouter.patch(
  '/:id',
  authMiddleware,
  validateRequest(realStateUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    if (!id) throw new AppError('Property ID is required', 400)
    if (!req.body) throw new AppError('No data to update', 400)

    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid property ID', 400)

    // Verify property exists and user has permission to update it
    const property = (await RealStateModel.findById(id).lean()) as any
    if (!property) throw new AppError('Property not found', 404)

    // Optional: Check if user is the owner
    const { userId } = req.user as UserJWT
    if (property.owner.toString() !== userId) {
      throw new AppError('Not authorized to update this property', 403)
    }

    // Prohibed fields to update
    const blocked = ['owner', 'created_at', 'updated_at', 'visitors', 'saved_by', 'ratings', 'stats', 'rating_summary']
    if (blocked.some((field) => req.body[field])) {
      throw new AppError(`Not allowed to update these fields: ${blocked.join(', ')}`, 400)
    }

    const updatedProperty = await RealStateModel.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updated_at: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    )

    responseHandler({
      res,
      data: updatedProperty,
      code: 200,
      message: 'Property updated successfully'
    })
  })
)

// Show real state by array of object ids
const recommendedPropertySchema = z.object({
  property_ids: z.array(z.string().min(1).max(100))
})

RealStateRouter.post(
  '/show-by-ids',
  authMiddleware,
  validateRequest(recommendedPropertySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { property_ids } = req.body
    if (!property_ids) throw new AppError('Property IDs are required', 400)

    const propertyIds = property_ids.map((id: string) => new mongoose.Types.ObjectId(id))
    const properties = await RealStateModel.find({
      _id: { $in: propertyIds }
    }).select('-owner -created_at -updated_at -visitors -saved_by -ratings -stats -rating_summary')

    const propertiesMap = new Map(properties.map((p: any) => [p._id.toString(), p]))
    const sortedProperties = property_ids.map((id: string) => propertiesMap.get(id)).filter(Boolean)

    if (!sortedProperties) throw new AppError('Properties not found', 404)

    responseHandler({
      res,
      data: sortedProperties,
      code: 200
    })
  })
)

export default RealStateRouter
