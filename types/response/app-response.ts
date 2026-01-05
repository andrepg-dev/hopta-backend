export interface AppResponse<T = unknown> {
  code?: number
  message?: string
  data?: T
}
