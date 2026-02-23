import { AppResponse } from "@/types/response/app-response"
import { Response } from "express"

export const attactExpressResponse = (res: Response) => {
  res.sender = function (payload: AppResponse) {
    return res.status(payload.code ?? 200).json({ success: true, data: payload.data, message: payload?.message })
  }
}
