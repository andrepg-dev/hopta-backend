import { AppError } from '@/src/handlers/error-handler'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { validateRequest } from '@/src/middlewares/validate-request'
import { RealStateModel } from '@/src/models/real-state/real-state'
import { userModel } from '@/src/models/user'
import { realStateSchema } from '@/src/zod/real-state'
import { Request, Response, Router } from 'express'

const RealStateRouter = Router()

RealStateRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { user } = req.session.user // Get user id from the session
    const { _id } = user

    // Sending all properties
    const properties = await RealStateModel.find({ owner: _id }).populate('owner', 'name email phone')
    if (!properties) throw new AppError('Properties not found', 404)
    res.json(properties)
  })
)

RealStateRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const property = await RealStateModel.findById(id).populate('owner', 'name email phone')
    if (!property) throw new AppError('Property not found', 404)
    res.json(property)
  })
)

RealStateRouter.post(
  '/',
  validateRequest(realStateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { body } = req
    const { title, description, price, images, city, location } = body

    const { user } = req.session.user // Get user id from the session
    const { _id: owner } = user

    const foundUser = await userModel.findById(owner)
    if (!foundUser) throw new AppError('User not found', 404)

    try {
      const property = await RealStateModel.create({ price, location, city, description, images, title, owner })
      await userModel.updateOne({ _id: owner }, { properties: [...(user.properties || []), property._id] })
      res.status(201).send(property)
    } catch (error) {
      throw new AppError('Sorry, there is a server error creating your property.', 500)
    }
  })
)

RealStateRouter.delete('/', (req, res) => {
  res.send({ success: true })
})

RealStateRouter.put('/', (req, res) => {
  res.send({ success: true })
})

export default RealStateRouter
