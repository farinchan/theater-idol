import type { Models } from 'appwrite'
import { account, avatars, ID, OAuthProvider } from '~/appwrite'

export interface UserPreferences {
  avatar?: string
  bio?: string
  premium?: string // Waktu kedaluwarsa premium dalam format ISO string (contoh: 2026-10-31T23:59:59.000Z)
  [key: string]: any
}

export type AppwriteUser = Models.User<UserPreferences>

export interface ParsedPremium {
  isActive: boolean
  expDate: Date | null
  isLifetime: boolean
  formatted: string
}

/**
 * Mem-parsing fleksibel nilai preferensi premium:
 * Mendukung ISO string, format YYYY-MM-DD, format DD-MM-YYYY / DD/MM/YYYY,
 * timestamp Unix (detik & milidetik), dan boolean / flag "true" / "lifetime".
 */
export const parsePremiumExpiry = (val: any): ParsedPremium => {
  if (val === null || val === undefined || val === '') {
    return { isActive: false, expDate: null, isLifetime: false, formatted: '' }
  }

  // 1. Boolean atau string flag permanen / aktif
  const lowerStr = String(val).toLowerCase().trim()
  if (
    val === true ||
    val === 1 ||
    lowerStr === 'true' ||
    lowerStr === '1' ||
    lowerStr === 'active' ||
    lowerStr === 'aktif' ||
    lowerStr === 'lifetime' ||
    lowerStr === 'permanen' ||
    lowerStr === 'selamanya' ||
    lowerStr === 'premium'
  ) {
    return { isActive: true, expDate: null, isLifetime: true, formatted: 'Permanen / Lifetime' }
  }

  if (
    val === false ||
    val === 0 ||
    lowerStr === 'false' ||
    lowerStr === '0'
  ) {
    return { isActive: false, expDate: null, isLifetime: false, formatted: '' }
  }

  const str = String(val).trim()

  // 2. Numeric timestamp (detik atau milidetik)
  if (/^\d+$/.test(str)) {
    const num = Number(str)
    const ts = str.length <= 10 ? num * 1000 : num
    const d = new Date(ts)
    if (!isNaN(d.getTime())) {
      const active = d.getTime() > Date.now()
      return { isActive: active, expDate: d, isLifetime: false, formatted: d.toISOString() }
    }
  }

  // 3. Format DD-MM-YYYY atau DD/MM/YYYY atau DD.MM.YYYY (standar penulisan tanggal di Indonesia)
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/)
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10)
    const month = parseInt(dmyMatch[2], 10) - 1
    const year = parseInt(dmyMatch[3], 10)
    const hour = dmyMatch[4] !== undefined ? parseInt(dmyMatch[4], 10) : 23
    const minute = dmyMatch[5] !== undefined ? parseInt(dmyMatch[5], 10) : 59
    const second = dmyMatch[6] !== undefined ? parseInt(dmyMatch[6], 10) : 59
    const d = new Date(year, month, day, hour, minute, second, 999)
    if (!isNaN(d.getTime())) {
      const active = d.getTime() > Date.now()
      return { isActive: active, expDate: d, isLifetime: false, formatted: d.toISOString() }
    }
  }

  // 4. Format YYYY-MM-DD atau YYYY/MM/DD (tanpa jam: berlaku hingga akhir hari 23:59:59 lokal)
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10)
    const month = parseInt(ymdMatch[2], 10) - 1
    const day = parseInt(ymdMatch[3], 10)
    const d = new Date(year, month, day, 23, 59, 59, 999)
    if (!isNaN(d.getTime())) {
      const active = d.getTime() > Date.now()
      return { isActive: active, expDate: d, isLifetime: false, formatted: d.toISOString() }
    }
  }

  // 5. Standard ISO / Date string
  const d = new Date(str)
  if (!isNaN(d.getTime())) {
    let expTime = d.getTime()
    if (!str.includes(':') && !str.includes('T')) {
      d.setHours(23, 59, 59, 999)
      expTime = d.getTime()
    }
    const active = expTime > Date.now()
    return { isActive: active, expDate: d, isLifetime: false, formatted: d.toISOString() }
  }

  return { isActive: false, expDate: null, isLifetime: false, formatted: '' }
}

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

  // Login / Register using Google OAuth via Appwrite
  const loginWithGoogle = async (redirectPath: string = '/profile') => {
    if (!import.meta.client) return { success: false, error: 'Hanya dapat dijalankan di browser.' }

    isLoading.value = true
    authError.value = null

    try {
      if (redirectPath) {
        try {
          sessionStorage.setItem('oauth_redirect', redirectPath)
        } catch {}
      }

      const origin = window.location.origin
      const successUrl = `${origin}/login?oauth=success`
      const failureUrl = `${origin}/login?oauth=failed`

      // Memulai sesi OAuth Google via Appwrite Client SDK dengan scope profil & email
      account.createOAuth2Session(
        OAuthProvider.Google,
        successUrl,
        failureUrl,
        ['profile', 'email']
      )
      return { success: true }
    } catch (err: any) {
      const message = err?.message || 'Gagal memulai otorisasi login dengan Google.'
      authError.value = message
      isLoading.value = false
      return { success: false, error: message }
    }
  }

  // Sinkronisasi foto profil Google ke preferensi akun user (prefs.avatar)
  const syncGoogleProfilePicture = async (force: boolean = false): Promise<string | null> => {
    if (!import.meta.client) return null

    try {
      const currentUser = await account.get<UserPreferences>()
      // Jika user sudah memiliki avatar kustom dan tidak dipaksa (force), pertahankan foto yang ada
      if (!force && currentUser.prefs?.avatar && currentUser.prefs.avatar.trim() !== '') {
        return currentUser.prefs.avatar
      }

      let googlePictureUrl = ''

      // 1. Coba ambil providerAccessToken dari Appwrite account identities
      try {
        const { identities } = await account.listIdentities()
        const googleIdentity = identities.find(
          (id: any) => id.provider?.toLowerCase() === 'google' && id.providerAccessToken
        )

        if (googleIdentity?.providerAccessToken) {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${googleIdentity.providerAccessToken}`
            }
          })
          if (res.ok) {
            const data = await res.json()
            if (data?.picture) {
              googlePictureUrl = data.picture
            }
          }
        }
      } catch (identitiesErr) {
        console.warn('[Google OAuth] listIdentities note:', identitiesErr)
      }

      // 2. Fallback jika access token tidak tersedia: gunakan Appwrite Avatars Photo API
      if (!googlePictureUrl) {
        try {
          const photoUrl = avatars.getPhoto({ width: 256, height: 256 })
          if (photoUrl) {
            googlePictureUrl = photoUrl
          }
        } catch {}
      }

      // 3. Simpan ke preferensi user jika URL foto Google berhasil didapatkan
      if (googlePictureUrl) {
        const currentPrefs = { ...(currentUser.prefs || {}) }
        currentPrefs.avatar = googlePictureUrl
        await account.updatePrefs({ prefs: currentPrefs })
        const updatedUser = await account.get<UserPreferences>()
        user.value = updatedUser
        return googlePictureUrl
      }
    } catch (err) {
      console.warn('[Google OAuth] syncGoogleProfilePicture note:', err)
    }

    return null
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

  // Check if current user has 'admin' label
  const isAdmin = computed(() => {
    if (!user.value) return false
    const labels = user.value.labels || []
    return Array.isArray(labels) && labels.some((l: string) => l.toLowerCase() === 'admin')
  })

  // Helper to extract raw premium preference value
  const rawPremiumPref = computed(() => {
    if (!user.value) return null
    const prefs = user.value.prefs || {}
    return (
      prefs.premium ??
      prefs.Premium ??
      prefs.PREMIUM ??
      prefs.premium_until ??
      prefs.premiumUntil ??
      prefs.membership ??
      null
    )
  })

  // Check if current user has active premium subscription from prefs.premium or labels
  const isPremium = computed(() => {
    if (!user.value) return false

    // 1. Check user labels (e.g. 'premium', 'vip', 'member_premium')
    const labels = user.value.labels || []
    if (Array.isArray(labels) && labels.some((l: string) => ['premium', 'vip', 'member_premium'].includes(l.toLowerCase()))) {
      return true
    }

    // 2. Check user preferences
    const raw = rawPremiumPref.value
    if (raw === null || raw === undefined) return false

    const parsed = parsePremiumExpiry(raw)
    return parsed.isActive
  })

  // Return the premium expiration ISO string or formatted text or null
  const premiumUntil = computed(() => {
    if (!user.value) return null

    const raw = rawPremiumPref.value
    if (raw === null || raw === undefined) {
      const labels = user.value.labels || []
      if (Array.isArray(labels) && labels.some((l: string) => ['premium', 'vip'].includes(l.toLowerCase()))) {
        return 'Permanen'
      }
      return null
    }

    const parsed = parsePremiumExpiry(raw)
    if (parsed.isLifetime) return 'Permanen'
    return parsed.expDate ? parsed.expDate.toISOString() : (parsed.formatted || String(raw))
  })

  // Helper to update premium preference in Appwrite Auth
  const updatePremiumPreference = async (untilDateIso: string | null) => {
    if (!import.meta.client) return { success: false, error: 'Client-only operation' }
    if (!user.value) return { success: false, error: 'User belum login' }

    isLoading.value = true
    authError.value = null

    try {
      const currentPrefs = { ...(user.value.prefs || {}) }
      if (untilDateIso) {
        currentPrefs.premium = untilDateIso
      } else {
        delete currentPrefs.premium
      }

      await account.updatePrefs({
        prefs: currentPrefs
      })

      const updatedUser = await account.get<UserPreferences>()
      user.value = updatedUser
      return { success: true, user: updatedUser }
    } catch (err: any) {
      const message = err?.message || 'Gagal memperbarui status premium di Appwrite Auth.'
      authError.value = message
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    isAdmin,
    isPremium,
    premiumUntil,
    isLoading,
    isInitialized,
    authError,
    checkSession,
    login,
    register,
    loginWithGoogle,
    syncGoogleProfilePicture,
    logout,
    getSessions,
    revokeSession,
    revokeAllOtherSessions,
    updateProfile,
    updatePassword,
    updatePremiumPreference
  }
}
