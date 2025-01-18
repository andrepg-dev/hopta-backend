import Logs from '../modules/logs/save-logs'

interface Pagination {
  page: number
  limit: number
  Model: any
}

export async function getPagination({ page, limit, Model }: Pagination) {
  try {
    const options = {
      page,
      limit,
      sort: { created_at: -1 }
    }

    const result = await Model.paginate({}, options)
    return result
  } catch (error) {
    const logger = new Logs()
    logger.saveLogs().error(error)
  }
}
