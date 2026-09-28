import type { Models } from 'appwrite'
import { account, ID } from '~/appwrite'

export interface UserPreferences {
  avatar?: string
  bio?: string
  [key: string]: any
}

export type AppwriteUser = Models.User<UserPreferences>

export const useAppwriteAuth = () => {
  const user = useState<AppwriteUser | null>('appwrite_user', () => null)
  const isLoading = useState<boolean>('appwrite_auth_loading', () => false)
  const isInitialized = useState<boolean>('appwrite_auth_initialized', () => false)
  const authError = ref<string | null>(null)

  // Check current session from Appwrite
  const checkSession = async () => {
    // Only run session verification in client environment
    if (!import.meta.client) return null

    isLoading.value = true
    authError.value = null
    try {
      const currentUser = await account.get<UserPreferences>()
      user.value = currentUser
      return currentUser
    } catch (err: any) {
      // 401 means unauthenticated guest, which is expected
      user.value = null
      return null
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  // Login using Email & Password
  const login = async (email: string, password: string) => {
    isLoading.value = true
    authError.value = null

    try {
      await account.createEmailPasswordSession(email, password)
      const currentUser = await account.get<UserPreferences>()
      user.value = currentUser
      return { success: true, user: currentUser }
    } catch (err: any) {
      const message = err?.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.'
      authError.value = message
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }

  // Register a new user
  const register = async (email: string, password: string, name: string) => {
    isLoading.value = true
    authError.value = null

    try {
      // 1. Create account
      await account.create(ID.unique(), email, password, name)
      // 2. Automatically create session
      await account.createEmailPasswordSession(email, password)
      // 3. Fetch user info
      const currentUser = await account.get<UserPreferences>()
      user.value = currentUser
      return { success: true, user: currentUser }
    } catch (err: any) {
      const message = err?.message || 'Pendaftaran gagal. Pastikan kata sandi minimal 8 karakter dan email valid.'
      authError.value = message
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }

  // Logout current session
  const logout = async () => {
    isLoading.value = true
    authError.value = null

    try {
      await account.deleteSession('current')
      user.value = null
      return { success: true }
    } catch (err: any) {
      user.value = null
      return { success: true }
    } finally {
      isLoading.value = false
    }
  }

  // Get active sessions
  const getSessions = async () => {
    if (!import.meta.client) return []
    try {
      const res = await account.listSessions()
      return res.sessions
    } catch (err: any) {
      return []
    }
  }

  // Revoke a specific session
  const revokeSession = async (sessionId: string) => {
    if (!import.meta.client) return { success: false }
    try {
      await account.deleteSession(sessionId)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal mengakhiri sesi.' }
    }
  }

  // Revoke all other sessions
  const revokeAllOtherSessions = async () => {
    if (!import.meta.client) return { success: false }
    try {
      const res = await account.listSessions()
      const others = res.sessions.filter(s => !s.current)
      for (const s of others) {
        await account.deleteSession(s.$id)
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal mengakhiri sesi lainnya.' }
    }
  }

  // Update profile details (Name, Avatar photo, Bio)
  const updateProfile = async ({ name, avatar, bio }: { name?: string; avatar?: string; bio?: string }) => {
    if (!import.meta.client) return { success: false }
    isLoading.value = true
    authError.value = null

    try {
      if (name && name.trim() && name.trim() !== user.value?.name) {
        await account.updateName({ name: name.trim() })
      }

      const currentPrefs = { ...(user.value?.prefs || {}) }
      let prefsNeedUpdate = false

      if (avatar !== undefined && avatar !== currentPrefs.avatar) {
        currentPrefs.avatar = avatar || ''
        prefsNeedUpdate = true
      }

      if (bio !== undefined && bio.trim() !== (currentPrefs.bio || '')) {
        currentPrefs.bio = bio.trim()
        prefsNeedUpdate = true
      }

      if (prefsNeedUpdate) {
        await account.updatePrefs({
          prefs: currentPrefs
        })
      }

      const updatedUser = await account.get<UserPreferences>()
      user.value = updatedUser
      return { success: true, user: updatedUser }
    } catch (err: any) {
      const message = err?.message || 'Gagal memperbarui profil.'
      authError.value = message
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }

  // Update password
  const updatePassword = async (newPassword: string, oldPassword?: string) => {
    if (!import.meta.client) return { success: false }
    isLoading.value = true
    authError.value = null

    try {
      if (oldPassword) {
        await account.updatePassword({ password: newPassword, oldPassword })
      } else {
        await account.updatePassword({ password: newPassword })
      }
      return { success: true }
    } catch (err: any) {
      const message = err?.message || 'Gagal mengubah kata sandi. Pastikan kata sandi lama benar dan baru minimal 8 karakter.'
      authError.value = message
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    isLoading,
    isInitialized,
    authError,
    checkSession,
    login,
    register,
    logout,
    getSessions,
    revokeSession,
    revokeAllOtherSessions,
    updateProfile,
    updatePassword
  }
}
