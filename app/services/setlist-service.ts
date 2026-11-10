import { apiService } from './api-service'
import { authService } from './auth-service'
import { handleServiceError } from '~/composables/error-helper'
import type { ApiResponse } from '~/types/api'
import type { Setlist, SetlistPayload } from '~/types/setlist'

export class SetlistService {
  private get authHeaders() {
    const token = authService.getStoredToken()
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  // GET ALL PUBLIC SETLISTS
  async getAll(page = 1, limit = 50, search = ''): Promise<ApiResponse<Setlist[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<Setlist[]>>(
        `/setlists?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // GET BY SLUG
  async getBySlug(slug: string): Promise<ApiResponse<Setlist>> {
    try {
      const response = await apiService.client.get<ApiResponse<Setlist>>(
        `/setlists/${encodeURIComponent(slug)}`
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // ADMIN: GET ALL SETLISTS
  async adminGetAll(page = 1, limit = 50, search = ''): Promise<ApiResponse<Setlist[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<Setlist[]>>(
        `/admin/setlists?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // ADMIN: GET BY ID
  async adminGetById(id: number): Promise<ApiResponse<Setlist>> {
    try {
      const response = await apiService.client.get<ApiResponse<Setlist>>(
        `/admin/setlists/${id}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // ADMIN: CREATE SETLIST
  async adminCreate(payload: SetlistPayload): Promise<ApiResponse<Setlist>> {
    try {
      const formData = new FormData()
      formData.append('title_id', payload.title_id)
      formData.append('title_jp', payload.title_jp)
      if (payload.image) {
        formData.append('image', payload.image)
      }

      const headers = {
        ...this.authHeaders.headers,
        'Content-Type': 'multipart/form-data'
      }

      const response = await apiService.client.post<ApiResponse<Setlist>>(
        '/admin/setlists',
        formData,
        { headers }
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // ADMIN: UPDATE SETLIST
  async adminUpdate(id: number, payload: SetlistPayload): Promise<ApiResponse<Setlist>> {
    try {
      const formData = new FormData()
      formData.append('title_id', payload.title_id)
      formData.append('title_jp', payload.title_jp)
      if (payload.image) {
        formData.append('image', payload.image)
      }

      const headers = {
        ...this.authHeaders.headers,
        'Content-Type': 'multipart/form-data'
      }

      const response = await apiService.client.put<ApiResponse<Setlist>>(
        `/admin/setlists/${id}`,
        formData,
        { headers }
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // ADMIN: DELETE SETLIST
  async adminDelete(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await apiService.client.delete<ApiResponse<null>>(
        `/admin/setlists/${id}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }
}

// Export singleton — WAJIB
export const setlistService = new SetlistService()
