import { NextFunction, Request, Response } from "express"
import { userModel } from "../schemas/user.schemas"

// Map para almacenar el timestamp de la última actualización por usuario
const lastUpdateMap = new Map<string, number>()

const UPDATE_INTERVAL_MS = 5 * 60 * 1000 // 120,000 ms

export default async function LastSeen(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    const userId = req.user.userId
    const now = Date.now()
    const lastUpdate = lastUpdateMap.get(userId)

    // Si no hay registro previo o han pasado 2 minutos, actualizar
    if (!lastUpdate || now - lastUpdate >= UPDATE_INTERVAL_MS) {
      await userModel.findByIdAndUpdate(userId, {
        last_seen: new Date()
      })
      // Actualizar el timestamp en el Map
      lastUpdateMap.set(userId, now)
    }
  }
  next()
}
