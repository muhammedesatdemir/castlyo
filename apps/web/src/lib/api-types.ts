export type ApiResult<T = unknown> = {
  success: boolean
  ok?: boolean
  message?: string
  data?: T
}


