import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from '../handlers/error-handler'
import { COOKIES } from '@/constants/cookie-user-name'
import { TokenManager } from '../utils/JWT/tokens-manager'

declare global {
  // no-dd-sa:typescript-best-practices/no-namespace
  namespace Express {
    interface Request {
      session: {
        // no-dd-sa:typescript-best-practices/no-explicit-any
        user: any
      }
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader) throw new AppError('Unauthorized', 401)

  const [bearer, token] = authHeader.split(' ')
  if (bearer !== 'Bearer' || !token) throw new AppError('Invalid token format', 401)

  try {
    const decoded = TokenManager.verifyRefreshToken(token)
    console.log({ deadeado: decoded })

    req.session = { user: decoded }
    next() // <-- Continue to the next middleware
  } catch (error) {
    throw new AppError('Invalid token', 401)
  }
}
