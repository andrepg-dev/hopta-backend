import { UserJWT } from "@/src/middlewares/authMiddleware"
import { RealStateModel } from "@/src/schemas/real-state.schemas"
import { Request } from "express"

export async function increaseVisit({ decoded, isVisit, id, req }: { decoded?: UserJWT | null; isVisit: string; id: string | undefined; req: Request<any> }) {
  if (decoded && isVisit) {
    console.log("El usuario si existe, está logueado: ", decoded)

    const existingVisitor = await RealStateModel.findOne({
      _id: id,
      "visitors.user": decoded.userId
    }).setOptions({ user: req.user })

    if (existingVisitor) {
      // Si el usuario ya existe, agregar nueva visita
      await RealStateModel.updateOne(
        { _id: id, "visitors.user": decoded.userId },
        {
          $push: { "visitors.$.visit_date": new Date() },
          $inc: { "stats.total_visits": 1 }
        }
      )
    } else {
      console.log("Está logueado pero no ha visitado nada")

      // Si es la primera visita del usuario, crear nueva entrada
      await RealStateModel.updateOne(
        { _id: id },
        {
          $push: {
            visitors: {
              user: decoded.userId,
              visit_date: [new Date()]
            }
          },
          $inc: { "stats.total_visits": 1 }
        }
      )
    }
  }

  // <================== IF USER DON'T EXIST, write in the database with a different approach ==================>
  if (!decoded && isVisit) {
    const existingAnonymousUser = await RealStateModel.findOne({
      _id: id,
      "visitors.user": req.ip
    }).setOptions({ user: req.user })

    if (existingAnonymousUser) {
      console.log("El usuario ya existe en visitors por IP:", req.ip)

      // Si el usuario ya existe, agregar nueva visita
      await RealStateModel.updateOne(
        { _id: id, "visitors.user": req.ip },
        {
          $push: { "visitors.$.visit_date": new Date() },
          $inc: { "stats.total_visits": 1 }
        }
      )
    } else {
      console.log("El usuario no existe en visitors por IP:", req.ip)

      // Si es la primera visita del usuario, crear nueva entrada
      await RealStateModel.updateOne(
        { _id: id },
        {
          $push: {
            visitors: {
              user: req.ip,
              visit_date: [new Date()]
            }
          },
          $inc: { "stats.total_visits": 1 }
        }
      )
    }
  }
}
