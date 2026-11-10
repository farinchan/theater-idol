import axios, { type AxiosInstance } from 'axios'

export class ApiService {
  public client: AxiosInstance
  private isRefreshing = false
  private refreshSubscribers: Array<(token: string) => void> = []
  private logoutCallbacks: Array<() => void> = []
  private baseURL: string = 'http://localhost:8080/api/v1'

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 20000,
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'id'
      }
    })

    this.setupInterceptors()
  }

  public setBaseUrl(url: string) {
    if (url) {
      this.baseURL = url
      this.client.defaults.baseURL = url
    }
  }

  public getBaseUrl(): string {
    return this.baseURL
  }

  public onLogout(callback: () => void) {
    this.logoutCallbacks.push(callback)
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token))
    this.refreshSubscribers = []
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback)
  }

  private setupInterceptors() {
    // Request Interceptor: Attach Bearer Token if available
    this.client.interceptors.request.use(
      (config) => {
        if (import.meta.client) {
          const token = localStorage.getItem('accessToken')
          if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`
          }
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response Interceptor: Handle 401 auto-refresh & 403 forbidden
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        // 401 Unauthorized handling with refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (!import.meta.client) {
            return Promise.reject(error)
          }

          // Do not retry refresh-token or login requests
          if (
            originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/refresh') ||
            originalRequest.url?.includes('/auth/register')
          ) {
            return Promise.reject(error)
          }

          const accessToken = localStorage.getItem('accessToken')
          const refreshToken = localStorage.getItem('refreshToken')

          // If user was never logged in (no tokens stored), this is a guest visiting an endpoint that requires auth.
          // Do NOT force a browser redirect to /login - reject so the page/component can handle it gracefully.
          if (!accessToken && !refreshToken) {
            return Promise.reject(error)
          }

          if (!refreshToken) {
            this.handleLogoutAndRedirect()
            return Promise.reject(error)
          }

          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.addRefreshSubscriber((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`
                resolve(this.client(originalRequest))
              })
            })
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            const refreshResponse = await axios.post(`${this.baseURL}/auth/refresh-token`, {
              token: refreshToken
            })

            const newToken = refreshResponse.data?.data?.token
            if (newToken) {
              localStorage.setItem('accessToken', newToken)
              this.client.defaults.headers.common.Authorization = `Bearer ${newToken}`
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              this.onRefreshed(newToken)
              return this.client(originalRequest)
            } else {
              this.handleLogoutAndRedirect()
              return Promise.reject(error)
            }
          } catch (refreshErr) {
            this.handleLogoutAndRedirect()
            return Promise.reject(refreshErr)
          } finally {
            this.isRefreshing = false
          }
        }

        // 403 Forbidden auto-redirect
        if (error.response?.status === 403 && import.meta.client) {
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/'
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private handleLogoutAndRedirect() {
    if (import.meta.client) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')

      this.logoutCallbacks.forEach((cb) => {
        try {
          cb()
        } catch {}
      })

      const currentPath = window.location.pathname
      if (currentPath !== '/login' && !currentPath.startsWith('/auth')) {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
      }
    }
  }
}

// Singleton instance
export const apiService = new ApiService()
