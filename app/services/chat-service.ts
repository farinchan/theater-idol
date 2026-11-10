import { apiService } from './api-service'
import { authService } from './auth-service'
import { handleServiceError } from '~/composables/error-helper'
import type { ApiResponse } from '~/types/api'
import type { ChatMessage, SendChatPayload } from '~/types/chat'

export class ChatService {
  private wsUrl: string = 'ws://localhost:8080/api/v1/chat/ws'

  public setWsUrl(url: string) {
    if (url) {
      this.wsUrl = url
    }
  }

  private get authHeaders() {
    const token = authService.getStoredToken()
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  // GET RECENT MESSAGES (REST)
  async getMessages(limit = 50): Promise<ApiResponse<ChatMessage[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<ChatMessage[]>>(
        `/chat/messages?limit=${limit}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // SEND MESSAGE (REST)
  async sendMessage(payload: SendChatPayload): Promise<ApiResponse<ChatMessage>> {
    try {
      const response = await apiService.client.post<ApiResponse<ChatMessage>>(
        '/chat/messages',
        payload,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // DELETE MESSAGE (REST)
  async deleteMessage(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await apiService.client.delete<ApiResponse<null>>(
        `/chat/messages/${id}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // GET WEBSOCKET URL
  getWebSocketUrl(customToken?: string): string {
    const token = customToken || authService.getStoredToken()

    if (token) {
      return `${this.wsUrl}?token=${encodeURIComponent(token)}`
    }
    return this.wsUrl
  }
}

// Export singleton — WAJIB
export const chatService = new ChatService()
