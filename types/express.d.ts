import { UserJWT } from "@/src/middlewares/authMiddleware"
import { AppResponse } from "./response/app-response"

interface AppSend {
  sender(payload: AppResponse): this
}

declare global {
  namespace Express {
    interface Response extends AppSend {}
    interface User extends UserJWT {}
  }
}
