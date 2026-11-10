import { apiService } from './api-service'
import { handleServiceError } from '~/composables/error-helper'
import type { ApiResponse } from '~/types/api'
import type {
  User,
  LoginPayload,
  RegisterPayload,
  GoogleLoginPayload,
  Verify2FAPayload,
  ForgotPasswordPayload,
  VerifyResetTokenPayload,
  ResetPasswordPayload,
  AuthResponseData
} from '~/types/auth'

export class AuthService {
  private get authHeaders() {
    const token = this.getStoredToken()
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  // LOGIN
  async login(payload: LoginPayload): Promise<ApiResponse<AuthResponseData>> {
    try {
      const response = await apiService.client.post<ApiResponse<AuthResponseData>>(
        '/auth/login',
        payload
      )
      const data = response.data
      if (data.data?.token && data.data?.user) {
        this.setSession(data.data.token, data.data.user, data.data.token)
      }
      return data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // REGISTER
  async register(payload: RegisterPayload): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.client.post<ApiResponse<User>>(
        '/auth/register',
        payload
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // GOOGLE LOGIN
  async google(payload: GoogleLoginPayload): Promise<ApiResponse<AuthResponseData>> {
    try {
      const response = await apiService.client.post<ApiResponse<AuthResponseData>>(
        '/auth/google',
        payload
      )
      const data = response.data
      if (data.data?.token && data.data?.user) {
        this.setSession(data.data.token, data.data.user, data.data.token)
      }
      return data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // VERIFY 2FA
  async verify2FA(payload: Verify2FAPayload): Promise<ApiResponse<AuthResponseData>> {
    try {
      const response = await apiService.client.post<ApiResponse<AuthResponseData>>(
        '/auth/verify-2fa',
        payload
      )
      const data = response.data
      if (data.data?.token && data.data?.user) {
        this.setSession(data.data.token, data.data.user, data.data.token)
      }
      return data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // FORGOT PASSWORD
  async forgotPassword(payload: ForgotPasswordPayload): Promise<ApiResponse<null>> {
    try {
      const response = await apiService.client.post<ApiResponse<null>>(
        '/auth/forgot-password',
        payload
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // VERIFY RESET TOKEN
  async verifyResetToken(payload: VerifyResetTokenPayload): Promise<ApiResponse<null>> {
    try {
      const response = await apiService.client.post<ApiResponse<null>>(
        '/auth/verify-reset-token',
        payload
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // RESET PASSWORD
  async resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse<null>> {
    try {
      const response = await apiService.client.post<ApiResponse<null>>(
        '/auth/reset-password',
        payload
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // REFRESH TOKEN
  async refreshToken(token: string): Promise<ApiResponse<AuthResponseData>> {
    try {
      const response = await apiService.client.post<ApiResponse<AuthResponseData>>(
        '/auth/refresh-token',
        { token }
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // SESSION MANAGEMENT
  setSession(token: string, user: User, refreshToken?: string) {
    if (import.meta.client) {
      localStorage.setItem('accessToken', token)
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      localStorage.setItem('user', JSON.stringify(user))
    }
  }

  clearSession() {
    if (import.meta.client) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  }

  getStoredToken(): string | null {
    if (import.meta.client) {
      return localStorage.getItem('accessToken')
    }
    return null
  }

  getStoredRefreshToken(): string | null {
    if (import.meta.client) {
      return localStorage.getItem('refreshToken')
    }
    return null
  }

  getStoredUser(): User | null {
    if (import.meta.client) {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          return JSON.parse(userStr)
        } catch {
          return null
        }
      }
    }
    return null
  }

  logout() {
    this.clearSession()
    if (import.meta.client) {
      window.location.href = '/login'
    }
  }
}

// Export singleton — WAJIB
export const authService = new AuthService()
