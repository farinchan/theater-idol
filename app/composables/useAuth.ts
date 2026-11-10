import { reactive, computed } from 'vue'
import { apiService } from '~/services/api-service'
import { authService } from '~/services/auth-service'
import type { User } from '~/types/auth'

interface AuthState {
  token: string | null
  user: User | null
  isInitialized: boolean
}

const state = reactive<AuthState>({
  token: null,
  user: null,
  isInitialized: false
})

export const clearAuthState = () => {
  state.token = null
  state.user = null
}

// Hook into apiService logout events
apiService.onLogout(() => {
  clearAuthState()
})

export const useAuth = () => {
  const syncFromStorage = () => {
    if (import.meta.client) {
      state.token = authService.getStoredToken()
      state.user = authService.getStoredUser()
      state.isInitialized = true
    }
  }

  if (import.meta.client && !state.isInitialized) {
    syncFromStorage()
  }

  const isLoggedIn = computed(() => Boolean(state.token && state.user))
  const isAdmin = computed(() => state.user?.role === 'admin')
  const isPremium = computed(() => {
    if (isAdmin.value) return true
    if (!state.user) return false
    return Boolean(state.user.is_member)
  })

  const setUser = (user: User | null) => {
    state.user = user
    if (import.meta.client) {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      } else {
        localStorage.removeItem('user')
      }
    }
  }

  const setToken = (token: string | null) => {
    state.token = token
    if (import.meta.client) {
      if (token) {
        localStorage.setItem('accessToken', token)
      } else {
        localStorage.removeItem('accessToken')
      }
    }
  }

  const logout = () => {
    clearAuthState()
    authService.logout()
  }

  return {
    state: {
      get token() {
        return state.token
      },
      get user() {
        return state.user
      },
      isLoggedIn,
      isAdmin,
      isPremium,
      isInitialized: computed(() => state.isInitialized)
    },
    service: authService,
    setUser,
    setToken,
    logout,
    syncFromStorage
  }
}
