import { AppError } from "@/src/handlers/error-handler";
import asyncHandler from "@/src/helpers/try-catch-async-handler";
import { RealStateModel } from "@/src/models/real-state";
import { userModel } from "@/src/models/user";
import { Request, Response, Router } from "express";

const RealStateRouter = Router();

RealStateRouter.get('/', asyncHandler(async (req: Request, res: Response) => {

  // Sending all properties
  await RealStateModel.find().then(properties => {
    res.send(properties)
  })
}))

RealStateRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { body } = req;
  const { title, description, address, price, images, city, owner } = body;
  if (!title || !description || !address || !price || !images || !city || !owner) throw new AppError('Missing required fields', 400)

  const user = await userModel.findById(owner);
  if (!user) throw new AppError('User not found', 404)

  try {
    const property = await RealStateModel.create({ price, address, city, description, images, title, owner })

    await userModel.updateOne(
      { _id: owner },
      { properties: [...user.properties || [], property._id] }
    );

    res.status(201).send(property)
  } catch (error) {
    throw new AppError('Error creating property', 500)
  }
}))

RealStateRouter.delete('/', (req, res) => {
  
})

RealStateRouter.put('/', (req, res) => {
  res.send({ success: true })
})


export default RealStateRouter;
