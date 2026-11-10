import { apiService } from './api-service'
import { authService } from './auth-service'
import { handleServiceError } from '~/composables/error-helper'
import type { ApiResponse } from '~/types/api'
import type { StreamInfo } from '~/types/stream'

export class StreamService {
  private baseURL = ''

  public setBaseUrl(url: string) {
    this.baseURL = url
  }

  private get authHeaders() {
    const token = authService.getStoredToken()
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  // GET STREAM INFO
  async getInfo(): Promise<ApiResponse<StreamInfo>> {
    try {
      const response = await apiService.client.get<ApiResponse<StreamInfo>>(
        '/stream/info',
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // HELPER: BUILD STREAM PLAYBACK URL WITH TOKEN
  getLiveStreamUrl(customToken?: string): string {
    const baseURL = this.baseURL || apiService.getBaseUrl()
    const token = customToken || authService.getStoredToken()

    if (token) {
      return `${baseURL}/stream?token=${encodeURIComponent(token)}`
    }
    return `${baseURL}/stream`
  }
}

// Export singleton — WAJIB
export const streamService = new StreamService()
