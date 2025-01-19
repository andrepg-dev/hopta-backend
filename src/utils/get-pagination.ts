import Logs from '../modules/logs/save-logs'

interface Pagination {
  page: number
  limit: number
  Model: any
  sortBy?: string
  order?: 'asc' | 'desc'
}

export async function getPagination({ page, limit, Model, order = 'desc', sortBy = 'created_at' }: Pagination) {
  try {
    const sortOrder = order === 'desc' ? -1 : 1

    const options = {
      page,
      limit,
      sort: { [sortBy]: sortOrder }
    }

    const result = await Model.paginate({}, options)
    return result
  } catch (error) {
    const logger = new Logs()
    logger.saveLogs().error(error)
  }
}
