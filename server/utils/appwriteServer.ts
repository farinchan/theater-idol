export function getAppwriteServerConfig() {
  const config = useRuntimeConfig()
  const endpoint = (config.public.appwriteEndpoint as string) || 'https://sgp.cloud.appwrite.io/v1'
  const projectId = (config.public.appwriteProjectId as string) || ''
  const apiKey = (config.appwriteApiKey as string) || ''

  if (!apiKey) {
    console.warn('[AppwriteServer] APPWRITE_API_KEY tidak dikonfigurasi.')
  }

  return { endpoint, projectId, apiKey }
}

export interface AppwriteAdminUser {
  $id: string
  $createdAt: string
  $updatedAt: string
  name: string
  email: string
  phone: string
  status: boolean
  labels: string[]
  emailVerification: boolean
  phoneVerification: boolean
  mfa: boolean
  prefs: Record<string, any>
  accessedAt: string
  registration: string
}

/**
 * Mengambil daftar pengguna dari Appwrite Users API
 */
export async function listAppwriteUsers(params: {
  search?: string
  limit?: number
  offset?: number
} = {}): Promise<{ total: number; users: AppwriteAdminUser[] }> {
  const { endpoint, projectId, apiKey } = getAppwriteServerConfig()

  if (!apiKey) {
    throw new Error('APPWRITE_API_KEY is missing')
  }

  const queryParams = new URLSearchParams()
  if (params.search && params.search.trim()) {
    queryParams.set('search', params.search.trim())
  }
  const limit = Math.min(Math.max(Number(params.limit) || 100, 1), 500)
  queryParams.set('limit', String(limit))
  if (params.offset && params.offset > 0) {
    queryParams.set('offset', String(params.offset))
  }

  const url = `${endpoint}/users?${queryParams.toString()}`
  const res = await fetch(url, {
    headers: {
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey
    }
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gagal mengambil data pengguna: ${errText}`)
  }

  const data = await res.json()
  return {
    total: data.total || 0,
    users: data.users || []
  }
}

/**
 * Mengambil detail pengguna tunggal berdasarkan ID
 */
export async function getAppwriteUser(userId: string): Promise<AppwriteAdminUser> {
  const { endpoint, projectId, apiKey } = getAppwriteServerConfig()

  if (!apiKey) {
    throw new Error('APPWRITE_API_KEY is missing')
  }

  const res = await fetch(`${endpoint}/users/${userId}`, {
    headers: {
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey
    }
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gagal membaca data pengguna: ${errText}`)
  }

  return await res.json()
}

/**
 * Membuat akun pengguna baru di Appwrite
 */
export async function createAppwriteUser(payload: {
  email: string
  password?: string
  name: string
  labels?: string[]
  prefs?: Record<string, any>
  status?: boolean
}): Promise<AppwriteAdminUser> {
  const { endpoint, projectId, apiKey } = getAppwriteServerConfig()

  if (!apiKey) {
    throw new Error('APPWRITE_API_KEY is missing')
  }

  // 1. Buat Akun Pengguna Dasar
  const createRes = await fetch(`${endpoint}/users`, {
    method: 'POST',
    headers: {
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: 'unique()',
      email: payload.email.trim(),
      password: payload.password?.trim() || undefined,
      name: payload.name.trim()
    })
  })

  if (!createRes.ok) {
    const errText = await createRes.text()
    let msg = errText
    try {
      const parsed = JSON.parse(errText)
      if (parsed.message) msg = parsed.message
    } catch {}
    throw new Error(`Gagal membuat akun: ${msg}`)
  }

  let user = await createRes.json()
  const userId = user.$id

  // 2. Set Labels jika diberikan
  if (Array.isArray(payload.labels) && payload.labels.length > 0) {
    try {
      const labelsRes = await fetch(`${endpoint}/users/${userId}/labels`, {
        method: 'PUT',
        headers: {
          'X-Appwrite-Project': projectId,
          'X-Appwrite-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ labels: payload.labels })
      })
      if (labelsRes.ok) {
        user = await labelsRes.json()
      }
    } catch (err: any) {
      console.warn('[AppwriteServer] Gagal mengatur label pengguna baru:', err?.message)
    }
  }

  // 3. Set Prefs jika diberikan (misal status premium)
  if (payload.prefs && Object.keys(payload.prefs).length > 0) {
    try {
      const prefsRes = await fetch(`${endpoint}/users/${userId}/prefs`, {
        method: 'PATCH',
        headers: {
          'X-Appwrite-Project': projectId,
          'X-Appwrite-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prefs: payload.prefs })
      })
      if (prefsRes.ok) {
        user.prefs = await prefsRes.json()
      }
    } catch (err: any) {
      console.warn('[AppwriteServer] Gagal mengatur preferensi pengguna baru:', err?.message)
    }
  }

  // 4. Set Status aktif/blokir jika secara eksplisit disetel false
  if (payload.status === false) {
    try {
      const statusRes = await fetch(`${endpoint}/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'X-Appwrite-Project': projectId,
          'X-Appwrite-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: false })
      })
      if (statusRes.ok) {
        user = await statusRes.json()
      }
    } catch (err: any) {
      console.warn('[AppwriteServer] Gagal mengatur status blokir pengguna baru:', err?.message)
    }
  }

  return await getAppwriteUser(userId)
}

/**
 * Memperbarui akun pengguna di Appwrite
 */
export async function updateAppwriteUser(
  userId: string,
  payload: {
    name?: string
    email?: string
    password?: string
    status?: boolean
    labels?: string[]
    prefs?: Record<string, any>
  }
): Promise<AppwriteAdminUser> {
  const { endpoint, projectId, apiKey } = getAppwriteServerConfig()

  if (!apiKey) {
    throw new Error('APPWRITE_API_KEY is missing')
  }

  let currentUser = await getAppwriteUser(userId)

  // 1. Update Nama
  if (payload.name !== undefined && payload.name.trim() !== currentUser.name) {
    const res = await fetch(`${endpoint}/users/${userId}/name`, {
      method: 'PATCH',
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: payload.name.trim() })
    })
    if (res.ok) currentUser = await res.json()
  }

  // 2. Update Email
  if (payload.email !== undefined && payload.email.trim() && payload.email.trim() !== currentUser.email) {
    const res = await fetch(`${endpoint}/users/${userId}/email`, {
      method: 'PATCH',
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: payload.email.trim() })
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Gagal memperbarui email: ${errText}`)
    }
    currentUser = await res.json()
  }

  // 3. Update Password jika diisi
  if (payload.password && payload.password.trim()) {
    const res = await fetch(`${endpoint}/users/${userId}/password`, {
      method: 'PATCH',
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: payload.password.trim() })
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Gagal memperbarui kata sandi: ${errText}`)
    }
    currentUser = await res.json()
  }

  // 4. Update Status (Aktif / Blokir)
  if (payload.status !== undefined && payload.status !== currentUser.status) {
    const res = await fetch(`${endpoint}/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: Boolean(payload.status) })
    })
    if (res.ok) currentUser = await res.json()
  }

  // 5. Update Labels (Role Admin, dsb.)
  if (payload.labels !== undefined) {
    const res = await fetch(`${endpoint}/users/${userId}/labels`, {
      method: 'PUT',
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ labels: payload.labels })
    })
    if (res.ok) currentUser = await res.json()
  }

  // 6. Update Preferensi (Membership Premium, Avatar, dsb.)
  if (payload.prefs !== undefined) {
    const mergedPrefs = {
      ...(currentUser.prefs || {}),
      ...payload.prefs
    }
    const res = await fetch(`${endpoint}/users/${userId}/prefs`, {
      method: 'PATCH',
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prefs: mergedPrefs })
    })
    if (!res.ok) {
      const errText = await res.text()
      let msg = errText
      try {
        const parsed = JSON.parse(errText)
        if (parsed.message) msg = parsed.message
      } catch {}
      throw new Error(`Gagal memperbarui preferensi: ${msg}`)
    }
    currentUser.prefs = await res.json()
  }

  // Selalu kembalikan objek pengguna Appwrite lengkap dan terbaru
  return await getAppwriteUser(userId)
}

/**
 * Menghapus akun pengguna dari Appwrite
 */
export async function deleteAppwriteUser(userId: string): Promise<boolean> {
  const { endpoint, projectId, apiKey } = getAppwriteServerConfig()

  if (!apiKey) {
    throw new Error('APPWRITE_API_KEY is missing')
  }

  const res = await fetch(`${endpoint}/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey
    }
  })

  if (!res.ok && res.status !== 404) {
    const errText = await res.text()
    throw new Error(`Gagal menghapus pengguna: ${errText}`)
  }

  return true
}

/**
 * Memperpanjang/menambah masa aktif premium pengguna (digunakan saat order selesai)
 */
export async function updateUserPremiumInAppwrite(
  userId: string,
  durationDays: number
): Promise<{ success: boolean; newExpiry?: string; error?: string }> {
  const { endpoint, projectId, apiKey } = getAppwriteServerConfig()

  if (!apiKey) {
    console.warn('[AppwriteServer] APPWRITE_API_KEY tidak dikonfigurasi.')
    return { success: false, error: 'APPWRITE_API_KEY is missing' }
  }

  try {
    // 1. Dapatkan preferensi pengguna saat ini
    const userData = await getAppwriteUser(userId)
    const currentPrefs = userData.prefs || {}

    // 2. Hitung tanggal kedaluwarsa baru
    let baseTime = Date.now()
    if (currentPrefs.premium) {
      const existingExp = new Date(currentPrefs.premium).getTime()
      if (!isNaN(existingExp) && existingExp > Date.now()) {
        baseTime = existingExp
      }
    }

    const newExpiry = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000).toISOString()
    const updatedPrefs = {
      ...currentPrefs,
      premium: newExpiry
    }

    // 3. Simpan pembaruan preferensi
    const updateRes = await fetch(`${endpoint}/users/${userId}/prefs`, {
      method: 'PATCH',
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prefs: updatedPrefs })
    })

    if (!updateRes.ok) {
      const errText = await updateRes.text()
      return { success: false, error: `Gagal memperbarui preferensi: ${errText}` }
    }

    return { success: true, newExpiry }
  } catch (err: any) {
    console.error('[AppwriteServer] Error updating user premium:', err)
    return { success: false, error: err?.message || 'Server error' }
  }
}
