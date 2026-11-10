import { apiService } from './api-service'
import { authService } from './auth-service'
import { handleServiceError } from '~/composables/error-helper'
import type { ApiResponse } from '~/types/api'
import type { User } from '~/types/auth'

export interface AdminUpdateUserPayload {
  name?: string
  email?: string
  phone?: string
  password?: string
  is_2fa_enabled?: boolean
}

export class AdminUserService {
  private get authHeaders() {
    const token = authService.getStoredToken()
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  // GET ALL USERS (ADMIN)
  async getAll(page = 1, limit = 10): Promise<ApiResponse<User[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<User[]>>(
        `/admin/users?page=${page}&limit=${limit}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // GET USER BY ID (ADMIN)
  async getById(id: number): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.client.get<ApiResponse<User>>(
        `/admin/users/${id}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // UPDATE USER (ADMIN)
  async update(id: number, payload: AdminUpdateUserPayload): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.client.put<ApiResponse<User>>(
        `/admin/users/${id}`,
        payload,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // DELETE USER (ADMIN)
  async delete(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await apiService.client.delete<ApiResponse<null>>(
        `/admin/users/${id}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }
}

// Export singleton — WAJIB
export const adminUserService = new AdminUserService()
