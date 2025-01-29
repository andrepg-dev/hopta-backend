import { AppError } from '@/src/handlers/error-handler'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { validateRequest } from '@/src/middlewares/validate-request'
import { RealStateModel } from '@/src/models/real-state/real-state'
import { userModel } from '@/src/models/user'
import { getPagination } from '@/src/utils/get-pagination.utils'
import { realStateSchema } from '@/src/zod/real-state'
import { RealStateI, RealStateIWithOwner } from '@/types/real-state/type'
import { Request, Response, Router } from 'express'
import mongoose from 'mongoose'

const RealStateRouter = Router()

RealStateRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
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
    const { title, description, price, images, house_features, house_status, location, square_meters, currency, population } = body

    const { user } = req.session.user // Get user id from the session
    const { _id: owner } = user

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
        owner
      })
      // await userModel.updateOne({ _id: owner }, { properties: [...(user.properties || []), property._id] })
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
  validateRequest(realStateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid property ID', 400)

    const updatedProperty = await RealStateModel.findByIdAndUpdate(id, req.body, { new: true })
    if (!updatedProperty) throw new AppError('Property not found', 404)

    res.json({ success: true, updatedProperty })
  })
)

export default RealStateRouter
