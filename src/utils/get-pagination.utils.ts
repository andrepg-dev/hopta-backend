import { UserJWT } from "../middlewares/authMiddleware"
import Logs from "../services/logs/save-logs.service"

interface Pagination {
  page: number
  limit: number
  Model: any
  sortBy?: string
  order?: "asc" | "desc"
  filters?: Record<string, any>
  user?: UserJWT | null
}

export async function getPagination({ page, limit, Model, order = "desc", sortBy = "created_at", filters = {}, user }: Pagination) {
  try {
    const sortOrder = order === "desc" ? -1 : 1

    const options = {
      page,
      limit,
      sort: { [sortBy]: sortOrder },
      options: { user }
    }

    const result = await Model.paginate(filters, options)
    return result
  } catch (error) {
    new Logs({
      method: "saveErrorLogs",
      message: error
    })
  }
}
