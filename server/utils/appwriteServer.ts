export async function updateUserPremiumInAppwrite(
  userId: string,
  durationDays: number
): Promise<{ success: boolean; newExpiry?: string; error?: string }> {
  const config = useRuntimeConfig()
  const endpoint = config.public.appwriteEndpoint || 'https://sgp.cloud.appwrite.io/v1'
  const projectId = config.public.appwriteProjectId || ''
  const apiKey = config.appwriteApiKey

  if (!apiKey) {
    console.warn('[AppwriteServer] APPWRITE_API_KEY tidak dikonfigurasi.')
    return { success: false, error: 'APPWRITE_API_KEY is missing' }
  }

  try {
    // 1. Dapatkan preferensi pengguna saat ini
    const userRes = await fetch(`${endpoint}/users/${userId}`, {
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey
      }
    })

    if (!userRes.ok) {
      const errText = await userRes.text()
      return { success: false, error: `Gagal membaca data pengguna: ${errText}` }
    }

    const userData = await userRes.json()
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
