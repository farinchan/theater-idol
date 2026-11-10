import { apiService } from './api-service'
import { authService } from './auth-service'
import { handleServiceError } from '~/composables/error-helper'
import type { ApiResponse } from '~/types/api'
import type {
  SettingItem,
  ShowSettings,
  StreamSettings,
  UpdateShowSettingsPayload,
  UpdateStreamSettingsPayload
} from '~/types/setting'

export class SettingService {
  private get authHeaders() {
    const token = authService.getStoredToken()
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  // GET ALL SETTINGS (ADMIN)
  async getAll(): Promise<ApiResponse<SettingItem[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<SettingItem[]>>(
        '/admin/settings',
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // GET SHOW SETTINGS (ADMIN)
  async getShowSettings(): Promise<ApiResponse<ShowSettings>> {
    try {
      const response = await apiService.client.get<ApiResponse<ShowSettings>>(
        '/admin/settings/shows',
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // UPDATE SHOW SETTINGS (ADMIN)
  async updateShowSettings(payload: UpdateShowSettingsPayload): Promise<ApiResponse<ShowSettings>> {
    try {
      const response = await apiService.client.put<ApiResponse<ShowSettings>>(
        '/admin/settings/shows',
        payload,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // GET STREAM SETTINGS (ADMIN)
  async getStreamSettings(): Promise<ApiResponse<StreamSettings>> {
    try {
      const response = await apiService.client.get<ApiResponse<StreamSettings>>(
        '/admin/settings/streams',
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // UPDATE STREAM SETTINGS (ADMIN)
  async updateStreamSettings(payload: UpdateStreamSettingsPayload): Promise<ApiResponse<StreamSettings>> {
    try {
      const response = await apiService.client.put<ApiResponse<StreamSettings>>(
        '/admin/settings/streams',
        payload,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // UPDATE GENERIC SETTING KEY (ADMIN)
  async updateKey(key: string, value: string): Promise<ApiResponse<SettingItem>> {
    try {
      const response = await apiService.client.put<ApiResponse<SettingItem>>(
        `/admin/settings/${encodeURIComponent(key)}`,
        { value },
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }
}

// Export singleton — WAJIB
export const settingService = new SettingService()
