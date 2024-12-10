import { AppError } from "@/src/handlers/error-handler";
import asyncHandler from "@/src/helpers/try-catch-async-handler";
import { RealStateModel } from "@/src/models/real-state";
import { Request, Response, Router } from "express";

const RealStateRouter = Router();

RealStateRouter.get('/', asyncHandler((req: Request, res: Response) => {

  // Sending all properties
  RealStateModel.find().then(properties => {
    res.send(properties)
  })
}))

RealStateRouter.post('/', asyncHandler((req: Request, res: Response) => {

  const { body } = req;
  const { title, description, address, price, images, city, owner } = body;
  if (!title || !description || !address || !price || !images || !city || !owner) throw new AppError('Missing required fields', 400)

  const insert = {
    title,
    description,
    address,
    price,
    images,
    city,
    owner
  }

  RealStateModel.create(insert).then(property => res.send(property))
}))

RealStateRouter.delete('/', (req, res) => {

})

RealStateRouter.put('/', (req, res) => {
  res.send({ success: true })
})


export default RealStateRouter;
