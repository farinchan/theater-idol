import { apiService } from './api-service'
import { authService } from './auth-service'
import { handleServiceError } from '~/composables/error-helper'
import type { ApiResponse } from '~/types/api'
import type {
  MembershipPlan,
  MembershipTransaction,
  MembershipStatus,
  CheckoutPayload,
  CheckoutResponseData
} from '~/types/membership'

export class MembershipService {
  private get authHeaders() {
    const token = authService.getStoredToken()
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  // GET PLANS (PUBLIC)
  async getPlans(): Promise<ApiResponse<MembershipPlan[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<MembershipPlan[]>>(
        '/memberships/plans'
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // CHECKOUT (AUTH)
  async checkout(payload: CheckoutPayload): Promise<ApiResponse<CheckoutResponseData>> {
    try {
      const response = await apiService.client.post<ApiResponse<CheckoutResponseData>>(
        '/memberships/checkout',
        payload,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // GET STATUS (AUTH)
  async getStatus(): Promise<ApiResponse<MembershipStatus>> {
    try {
      const response = await apiService.client.get<ApiResponse<MembershipStatus>>(
        '/memberships/status',
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // GET USER HISTORY (AUTH)
  async getHistory(page = 1, limit = 10, status = ''): Promise<ApiResponse<MembershipTransaction[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<MembershipTransaction[]>>(
        `/memberships/history?page=${page}&limit=${limit}&status=${encodeURIComponent(status)}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // GET USER TRANSACTION BY ORDER ID (AUTH)
  async getTransaction(orderId: string): Promise<ApiResponse<MembershipTransaction>> {
    try {
      const response = await apiService.client.get<ApiResponse<MembershipTransaction>>(
        `/memberships/transactions/${encodeURIComponent(orderId)}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // ADMIN: GET ALL TRANSACTIONS (AUTH ADMIN)
  async adminGetAllTransactions(page = 1, limit = 10, status = '', search = ''): Promise<ApiResponse<MembershipTransaction[]>> {
    try {
      const response = await apiService.client.get<ApiResponse<MembershipTransaction[]>>(
        `/admin/memberships?page=${page}&limit=${limit}&status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }

  // ADMIN: GET SINGLE TRANSACTION BY ORDER ID
  async adminGetTransaction(orderId: string): Promise<ApiResponse<MembershipTransaction>> {
    try {
      const response = await apiService.client.get<ApiResponse<MembershipTransaction>>(
        `/admin/memberships/${encodeURIComponent(orderId)}`,
        this.authHeaders
      )
      return response.data
    } catch (error: any) {
      return handleServiceError(error)
    }
  }
}

// Export singleton — WAJIB
export const membershipService = new MembershipService()
