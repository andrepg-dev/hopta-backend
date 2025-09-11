import { AppError } from "@/src/handlers/error-handler";
import { NextFunction, Request, Response } from "express";
import { UserDocument, userModel } from "../schemas/user.schemas";

interface userAdmin extends UserDocument {
  role?: 'admin'
}

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401)
  }

  const user: userAdmin | null = await userModel.findOne({ _id: req.user?.userId }).catch((err) => {
    throw new AppError(process.env.NODE_ENV === 'development' ? err : 'Error finding user', 400)
  }).catch((err) => {
    throw new AppError(process.env.NODE_ENV === 'development' ? err : 'Error finding user', 400)
  })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (user.role !== 'admin') {
    throw new AppError('Unauthorized', 401)
  }

  next()
}
