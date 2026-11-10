import { apiService } from './api-service'
import { authService } from './auth-service'
import { handleServiceError } from '~/composables/error-helper'
import type { ApiResponse } from '~/types/api'
import type { User } from '~/types/auth'
import type {
  UpdateProfilePayload,
  Toggle2FAPayload,
  ChangePasswordPayload
} from '~/types/profile'

export class ProfileService {
  private get authHeaders() {
    const token = authService.getStoredToken()
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  // GET PROFILE
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.client.get<ApiResponse<User>>(
        '/profile',
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // UPDATE PROFILE
  async updateProfile(payload: UpdateProfilePayload): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.client.put<ApiResponse<User>>(
        '/profile',
        payload,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // TOGGLE 2FA
  async toggle2FA(payload: Toggle2FAPayload): Promise<ApiResponse<{ is_2fa_enabled: boolean }>> {
    try {
      const response = await apiService.client.patch<ApiResponse<{ is_2fa_enabled: boolean }>>(
        '/profile/2fa',
        payload,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // UPDATE PHOTO (MULTIPART)
  async updatePhoto(file: File): Promise<ApiResponse<{ photo: string }>> {
    try {
      const formData = new FormData()
      formData.append('photo', file)

      const headers = {
        ...this.authHeaders.headers,
        'Content-Type': 'multipart/form-data'
      }

      const response = await apiService.client.patch<ApiResponse<{ photo: string }>>(
        '/profile/photo',
        formData,
        { headers }
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // CHANGE PASSWORD
  async changePassword(payload: ChangePasswordPayload): Promise<ApiResponse<null>> {
    try {
      const response = await apiService.client.patch<ApiResponse<null>>(
        '/profile/change-password',
        payload,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }
}

// Export singleton — WAJIB
export const profileService = new ProfileService()
