import { AppError } from '@/src/handlers/error-handler'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { validateRequest } from '@/src/middlewares/validate-request'
import { RealStateModel } from '@/src/models/real-state.models'
import { userModel } from '@/src/models/user.models'
import { getPagination } from '@/src/utils/get-pagination.utils'
import { realStateSchema, realStateUpdateSchema } from '@/src/zod/real-state.zod'
import { RealStateI, RealStateIWithOwner } from '@/types/real-state/types.real-state'
import { Request, Response, Router } from 'express'
import mongoose from 'mongoose'
import { algoliasearch } from 'algoliasearch'
import Logs from '@/src/modules/logs/save-logs.service'

const RealStateRouter = Router()

RealStateRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {

    const client = algoliasearch('48NSHQPNAV', 'bcc0fa0f9d66506d7f90adb452cc582f');


    const processRecords = async () => {
      const datasetRequest = await RealStateModel.find().lean()

      const objects = datasetRequest.map(doc => ({
        objectID: doc._id.toString(),
        ...doc
      }))

      new Logs({
        method: 'saveLogs',
        message: objects
      })

      return await client.saveObjects({ indexName: 'real_state_index', objects })
    }

    processRecords().then((response) => {
      new Logs({
        method: 'saveLogs',
        message: "Records processed successfully"
      })
    }).catch((error) => {
      new Logs({
        method: 'saveErrorLogs',
        message: error
      })
    })

    // Get all properties from the user with pagination
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
    res.json(paginatedData)
    return
  })
)

RealStateRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid property ID', 400)

    const property = await RealStateModel.findById(id).populate('owner', 'name last_name email phone')
    if (!property) throw new AppError('Property not found', 404)
    res.json(property)
  })
)

RealStateRouter.post(
  '/',
  validateRequest(realStateSchema),
  asyncHandler(async (req: Request<{}, {}, RealStateI>, res: Response) => {
    const { body } = req
    const {
      title,
      description,
      price,
      images,
      house_features,
      house_status,
      location,
      square_meters,
      currency,
      population,
      stats,
      rating_summary
    } = body

    const { user } = req as any
    const { userId: owner } = user

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
        stats: stats || { total_visits: 0, total_saves: 0 },
        rating_summary: rating_summary || { average_rating: 0, total_ratings: 0 },
        visitors: [],
        saved_by: [],
        ratings: []
      })

      await userModel.updateOne({ _id: owner }, { $push: { properties: property._id } })
      res.status(201).send(property)
    } catch (error: any) {
      throw new AppError(error.message || 'Server error creating property', 500)
    }
  })
)

RealStateRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid property ID', 400)

    const deletedProperty = await RealStateModel.findByIdAndDelete(id)
    if (!deletedProperty) throw new AppError('Property not found', 404)

    // Ahora TypeScript reconocerá `owner`
    await userModel.updateOne({ _id: (deletedProperty as unknown as RealStateIWithOwner).owner }, { $pull: { properties: id } })
    res.json({ success: true, message: 'Property deleted successfully' })
  })
)

RealStateRouter.put(
  '/:id',
  validateRequest(realStateUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    if (!id) throw new AppError('Property ID is required', 400)
    if (!req.body) throw new AppError('No data to update', 400)

    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid property ID', 400)

    // Verify property exists and user has permission to update it
    const property = await RealStateModel.findById(id).lean() as any
    if (!property) throw new AppError('Property not found', 404)

    // Optional: Check if user is the owner
    const { user } = req as any
    if (property.owner.toString() !== user.userId) {
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

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: updatedProperty
    })
  })
)

export default RealStateRouter
