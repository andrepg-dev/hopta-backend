import { AppError } from '@/src/handlers/error-handler';
import asyncHandler from '@/src/helpers/try-catch-async-handler';
import { userModel } from '@/src/models/user';
import { Request, Response, Router } from 'express';
import { validateEmailFormat } from '@/src/utils/validate-email-format'

const userRouter = Router();

userRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  await userModel.find().populate('properties').then(users => res.send(users))
}))

userRouter.post('/', asyncHandler(async (req: Request<{}, {}, { name: string, email: string, phone: string }>, res: Response) => {
  if (!req.body.name || !req.body.email || !req.body.phone) throw new AppError('name, email and phone are required.', 400);

  const { name, email, phone } = req.body

  // Crear validaciones para el usuario con email, nombre y telefono 
  if (name.length <= 8, phone.length <= 6) throw new AppError('Check the password or phone length, the minimum password length is 8 and the phone number is 6 ', 404)

  const isValid = validateEmailFormat(email)
  if (isValid === false) return

  await userModel.create(req.body).then(user => res.send(user))
}))

userRouter.delete('/', asyncHandler(async (req: Request, res: Response) => {
  if (!req.body.email) throw new AppError('email is required.', 400);
  await userModel.deleteOne({ email: req.body.email }).then(user => res.send(user))
}))

userRouter.put('/', asyncHandler(async (req: Request, res: Response) => {
  if (!req.body.email) throw new AppError('email is required.', 400);
  await userModel.updateOne({ email: req.body.email }, req.body).then(user => res.send(user))
}))

export default userRouter;