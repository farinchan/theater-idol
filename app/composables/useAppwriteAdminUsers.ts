import { parsePremiumExpiry, type ParsedPremium } from '~/composables/useAppwriteAuth'

export interface AdminUserItem {
  $id: string
  $createdAt: string
  $updatedAt: string
  name: string
  email: string
  phone?: string
  status: boolean // true = active, false = blocked
  labels: string[]
  emailVerification: boolean
  phoneVerification: boolean
  mfa: boolean
  prefs: Record<string, any>
  accessedAt?: string
  registration?: string
  // Computed fields on client
  isAdmin: boolean
  premium: ParsedPremium
  avatarUrl: string
}

export const useAppwriteAdminUsers = () => {
  const users = useState<AdminUserItem[]>('appwrite_admin_users', () => [])
  const total = useState<number>('appwrite_admin_users_total', () => 0)
  const isLoading = useState<boolean>('appwrite_admin_users_loading', () => false)
  const isActionLoading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const notice = ref<string | null>(null)

  // Transform raw Appwrite user to enhanced AdminUserItem
  const transformUser = (raw: any): AdminUserItem => {
    if (!raw || typeof raw !== 'object') {
      return {
        $id: '',
        $createdAt: '',
        $updatedAt: '',
        name: 'Pengguna',
        email: '',
        phone: '',
        status: true,
        labels: [],
        emailVerification: false,
        phoneVerification: false,
        mfa: false,
        prefs: {},
        accessedAt: '',
        registration: '',
        isAdmin: false,
        premium: { isActive: false, expDate: null, isLifetime: false, formatted: '' },
        avatarUrl: ''
      }
    }

    const id = String(raw.$id || raw.id || '')
    const labels = Array.isArray(raw.labels) ? raw.labels : []
    const isAdmin = labels.some((l: string) => typeof l === 'string' && l.toLowerCase() === 'admin')
    const prefs = (raw.prefs && typeof raw.prefs === 'object') ? raw.prefs : {}
    const rawPremium = prefs.premium ?? prefs.membership ?? null
    const parsedPremium = parsePremiumExpiry(rawPremium)

    // Fallback if labels has 'premium' or 'vip'
    if (!parsedPremium.isActive && labels.some((l: string) => typeof l === 'string' && ['premium', 'vip'].includes(l.toLowerCase()))) {
      parsedPremium.isActive = true
      parsedPremium.isLifetime = true
      parsedPremium.formatted = 'Permanen / Lifetime'
    }

    const name = raw.name || raw.email?.split('@')[0] || 'Pengguna'
    const avatarUrl = prefs.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}&backgroundColor=f43f5e`

    return {
      $id: id,
      $createdAt: raw.$createdAt || raw.registration || '',
      $updatedAt: raw.$updatedAt || '',
      name,
      email: raw.email || '',
      phone: raw.phone || '',
      status: raw.status !== false,
      labels,
      emailVerification: Boolean(raw.emailVerification),
      phoneVerification: Boolean(raw.phoneVerification),
      mfa: Boolean(raw.mfa),
      prefs,
      accessedAt: raw.accessedAt || '',
      registration: raw.registration || '',
      isAdmin,
      premium: parsedPremium,
      avatarUrl
    }
  }

  // Fetch users from server endpoint
  const fetchUsers = async (params: { search?: string; limit?: number; offset?: number } = {}) => {
    if (!import.meta.client) return
    isLoading.value = true
    error.value = null

    try {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      if (params.limit) q.set('limit', String(params.limit))
      if (params.offset) q.set('offset', String(params.offset))

      const res = await $fetch<{ success: boolean; total: number; users: any[] }>(
        `/api/admin/users?${q.toString()}`
      )

      if (res?.success && Array.isArray(res.users)) {
        users.value = res.users.map(transformUser)
        total.value = res.total || users.value.length
      }
    } catch (err: any) {
      console.error('[useAppwriteAdminUsers] Gagal memuat daftar pengguna:', err)
      error.value = err?.data?.message || err?.message || 'Gagal memuat pengguna'
    } finally {
      isLoading.value = false
    }
  }

  // Create a new user
  const createUser = async (payload: {
    name: string
    email: string
    password?: string
    role?: 'admin' | 'user'
    status?: boolean
    premiumDurationDays?: number
    premiumExpiry?: string
    avatar?: string
  }) => {
    if (!import.meta.client) return { success: false }
    isActionLoading.value = true
    error.value = null
    notice.value = null

    try {
      const res = await $fetch<{ success: boolean; user: any }>('/api/admin/users', {
        method: 'POST',
        body: payload
      })

      if (res?.success && res.user) {
        const enhanced = transformUser(res.user)
        users.value.unshift(enhanced)
        total.value++
        notice.value = `Pengguna "${enhanced.name}" berhasil dibuat.`
        return { success: true, user: enhanced }
      }
      return { success: false, error: 'Gagal membuat pengguna' }
    } catch (err: any) {
      const msg = err?.data?.statusMessage || err?.data?.message || err?.message || 'Gagal membuat pengguna'
      error.value = msg
      return { success: false, error: msg }
    } finally {
      isActionLoading.value = false
    }
  }

  // Update existing user
  const updateUser = async (
    userId: string,
    payload: {
      name?: string
      email?: string
      password?: string
      status?: boolean
      role?: 'admin' | 'user'
      labels?: string[]
      avatar?: string
      premiumAction?: 'addDays' | 'setExpiry' | 'lifetime' | 'remove'
      days?: number
      expiryDate?: string
      prefs?: Record<string, any>
    }
  ) => {
    if (!import.meta.client) return { success: false }
    isActionLoading.value = true
    error.value = null
    notice.value = null

    try {
      const res = await $fetch<{ success: boolean; user: any }>(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: payload
      })

      if (res?.success && res.user) {
        const enhanced = transformUser(res.user)
        const idx = users.value.findIndex(u => u.$id === userId)
        if (idx !== -1) {
          users.value[idx] = enhanced
        }

        // Sinkronisasi dengan user auth jika akun yang diubah adalah akun admin yang sedang login
        try {
          const { user: authUser } = useAppwriteAuth()
          if (authUser.value && authUser.value.$id === userId) {
            authUser.value.prefs = { ...(authUser.value.prefs || {}), ...(res.user.prefs || {}) }
          }
        } catch {}

        notice.value = `Data pengguna "${enhanced.name}" berhasil diperbarui.`
        return { success: true, user: enhanced }
      }
      return { success: false, error: 'Gagal memperbarui pengguna' }
    } catch (err: any) {
      const msg = err?.data?.statusMessage || err?.data?.message || err?.message || 'Gagal memperbarui pengguna'
      error.value = msg
      return { success: false, error: msg }
    } finally {
      isActionLoading.value = false
    }
  }

  // Delete user
  const deleteUser = async (userId: string) => {
    if (!import.meta.client) return { success: false }
    isActionLoading.value = true
    error.value = null
    notice.value = null

    try {
      const res = await $fetch<{ success: boolean }>(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (res?.success) {
        const idx = users.value.findIndex(u => u.$id === userId)
        const deletedName = idx !== -1 ? users.value[idx].name : 'Pengguna'
        if (idx !== -1) {
          users.value.splice(idx, 1)
        }
        total.value = Math.max(0, total.value - 1)
        notice.value = `Akun "${deletedName}" berhasil dihapus secara permanen.`
        return { success: true }
      }
      return { success: false, error: 'Gagal menghapus pengguna' }
    } catch (err: any) {
      const msg = err?.data?.statusMessage || err?.data?.message || err?.message || 'Gagal menghapus pengguna'
      error.value = msg
      return { success: false, error: msg }
    } finally {
      isActionLoading.value = false
    }
  }

  // Statistics summary
  const stats = computed(() => {
    const list = users.value
    const totalCount = total.value || list.length
    const activeCount = list.filter(u => u.status).length
    const blockedCount = list.filter(u => !u.status).length
    const premiumCount = list.filter(u => u.premium.isActive).length
    const adminCount = list.filter(u => u.isAdmin).length

    return {
      total: totalCount,
      active: activeCount,
      blocked: blockedCount,
      premium: premiumCount,
      admin: adminCount
    }
  })

  return {
    users,
    total,
    isLoading,
    isActionLoading,
    error,
    notice,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    stats
  }
}
