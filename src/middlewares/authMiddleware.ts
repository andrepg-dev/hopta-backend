import { COOKIES } from '@/constants/cookies.constants'
import { NextFunction, Request, Response } from 'express'
import { AppError } from '../handlers/error-handler'
import { TokenManager } from '../utils/JWT/tokens-manager'

interface UserJWT {
  userId: string
  iat: number
  exp: number
}

declare global {
  namespace Express {
    interface User extends UserJWT { }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies[COOKIES.jwt_access_token.name]
  if (!accessToken) throw new AppError('Unauthorized', 401)

  try {
    const decoded = TokenManager.verifyToken(accessToken)
    console.log({ decoded })
    req.user = decoded as UserJWT
    next()
  } catch (error) {
    throw new AppError('Invalid token', 401)
  }
}
