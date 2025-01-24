import { NextFunction, Request, Response } from 'express'
import { AppError } from '../handlers/error-handler'
import { TokenManager } from '../utils/JWT/tokens-manager'

declare global {
  namespace Express {
    interface Request {
      session: {
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
    const decoded = TokenManager.verifyToken(token) // Verificar el access token
    req.session = { user: decoded }
    next() // <-- Continue to the next middleware
  } catch (error) {
    throw new AppError('Invalid token', 401)
  }
}
