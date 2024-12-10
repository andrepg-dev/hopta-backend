import { AppError } from '@/src/handlers/error-handler';
import asyncHandler from '@/src/helpers/try-catch-async-handler';
import { userModel } from '@/src/models/user';
import { Request, Response, Router } from 'express';

const userRouter = Router();

userRouter.get('/', asyncHandler((req: Request, res: Response) => {
  userModel.find().then(users => res.send({ users, success: true }))
}))

userRouter.post('/', asyncHandler((req: Request, res: Response) => {
  console.log(req.body)

  if (!req.body.name || !req.body.email || !req.body.phone) throw new AppError('name, email and phone are required.', 400);
  userModel.create(req.body).then(user => res.send({ user, success: true }))
}))

export default userRouter;