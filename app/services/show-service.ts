import { apiService } from './api-service'
import { authService } from './auth-service'
import { handleServiceError } from '~/composables/error-helper'
import type { ApiResponse } from '~/types/api'
import type { Show, ShowListItem, ShowPayload } from '~/types/show'

export class ShowService {
  private get authHeaders() {
    const token = authService.getStoredToken()
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  // GET ALL PUBLIC SHOWS (Replay list)
  async getAll(page = 1, limit = 50, search = '', setlistId = 0): Promise<ApiResponse<ShowListItem[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<ShowListItem[]>>(
        `/shows?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&setlist_id=${setlistId}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // GET SCHEDULE (Upcoming shows)
  async getSchedule(page = 1, limit = 50, search = '', setlistId = 0): Promise<ApiResponse<ShowListItem[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<ShowListItem[]>>(
        `/shows/schedule?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&setlist_id=${setlistId}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // GET SHOW DETAIL BY UUID (Contains replay_url if permitted)
  async getById(id: string): Promise<ApiResponse<Show>> {
    try {
      const response = await apiService.client.get<ApiResponse<Show>>(
        `/shows/${encodeURIComponent(id)}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // ADMIN: GET ALL SHOWS
  async adminGetAll(page = 1, limit = 50, search = '', setlistId = 0): Promise<ApiResponse<Show[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<Show[]>>(
        `/admin/shows?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&setlist_id=${setlistId}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // ADMIN: GET BY ID
  async adminGetById(id: string): Promise<ApiResponse<Show>> {
    try {
      const response = await apiService.client.get<ApiResponse<Show>>(
        `/admin/shows/${encodeURIComponent(id)}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // ADMIN: CREATE SHOW
  async adminCreate(payload: ShowPayload): Promise<ApiResponse<Show>> {
    try {
      const response = await apiService.client.post<ApiResponse<Show>>(
        '/admin/shows',
        payload,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // ADMIN: UPDATE SHOW
  async adminUpdate(id: string, payload: ShowPayload): Promise<ApiResponse<Show>> {
    try {
      const response = await apiService.client.put<ApiResponse<Show>>(
        `/admin/shows/${encodeURIComponent(id)}`,
        payload,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // ADMIN: DELETE SHOW
  async adminDelete(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await apiService.client.delete<ApiResponse<null>>(
        `/admin/shows/${encodeURIComponent(id)}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }
}

// Export singleton — WAJIB
export const showService = new ShowService()
