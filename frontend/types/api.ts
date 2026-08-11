export interface ApiMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
  meta?: ApiMeta
}

export interface ApiErrorBody {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiErrorBody

/** A paginated list result, normalized for the frontend. */
export interface Paginated<T> {
  data: T[]
  meta: ApiMeta
}
