import { UserJWT } from "../middlewares/authMiddleware"
import Logs from "../services/logs/save-logs.service"

interface Pagination {
  page: number
  limit: number
  Model: any
  sortBy?: string
  order?: "asc" | "desc"
  filters?: Record<string, any>
  options: {
    user?: UserJWT | null
    pathname?: string
  }
}

export async function getPagination({ page, limit, Model, order = "desc", sortBy = "created_at", filters = {}, options: optionsParam }: Pagination) {
  try {
    const sortOrder = order === "desc" ? -1 : 1

    const options = {
      page,
      limit,
      sort: { [sortBy]: sortOrder },
      options: optionsParam
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
