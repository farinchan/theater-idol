export interface ChatUser {
  id: number
  name: string
  photo?: string | null
  role: string
}

export interface ChatMessage {
  id: number
  user_id: number
  user?: ChatUser
  message: string
  timestamp: string
}

export interface SendChatPayload {
  message: string
}

export interface WSEvent {
  type: 'connected' | 'chat' | 'delete' | 'error'
  data?: any
  error?: string
}
