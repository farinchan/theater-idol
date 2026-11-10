export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  total_pages: number
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
  meta?: PaginationMeta
  error?: any
}
