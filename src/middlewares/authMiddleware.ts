import { UserI } from '@/types/login/user'
import { NextFunction, Request, Response } from 'express'
import { AppError } from '../handlers/error-handler'
import { TokenManager } from '../utils/JWT/tokens-manager'

declare global {
  namespace Express {
    interface User extends UserI {}
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader) throw new AppError('Unauthorized', 401)

  const [bearer, token] = authHeader.split(' ')
  if (bearer !== 'Bearer' || !token) throw new AppError('Invalid token format', 401)

  try {
    const decoded = TokenManager.verifyToken(token)
    req.user = decoded as { userId: string; iat: number; exp: number }
    next()
  } catch (error) {
    throw new AppError('Invalid token', 401)
  }
}
