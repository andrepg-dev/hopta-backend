import { AppError } from "@/src/handlers/error-handler"
import { NextFunction, Request, Response } from "express"
import asyncHandler from "../actions/try-catch-async-handler"
import { userModel } from "../schemas/user.schemas"

export const isAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401)
  }

  const user = await userModel.findOne({ _id: req.user.userId })

  if (!user) {
    throw new AppError("User not found", 404)
  }

  if (user.role !== "admin") {
    throw new AppError("Unauthorized", 401)
  }

  next()
})
