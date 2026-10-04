import { updateAppwriteUser, getAppwriteUser } from '~~/server/utils/appwriteServer'
import { requireAdminUser } from '~~/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  // Wajibkan hak akses admin
  await requireAdminUser(event)

  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID wajib disertakan'
    })
  }

  const body = await readBody(event)
  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body tidak boleh kosong'
    })
  }

  const payload: Parameters<typeof updateAppwriteUser>[1] = {}

  // Update Nama
  if (body.name !== undefined && body.name.trim()) {
    payload.name = String(body.name).trim()
  }

  // Update Email
  if (body.email !== undefined && body.email.trim()) {
    payload.email = String(body.email).trim()
  }

  // Update Password
  if (body.password !== undefined && body.password.trim()) {
    if (body.password.trim().length < 8) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Kata sandi minimal 8 karakter'
      })
    }
    payload.password = String(body.password).trim()
  }

  // Update Status
  if (body.status !== undefined) {
    payload.status = Boolean(body.status)
  }

  // Update Role / Labels
  if (body.role !== undefined) {
    if (body.role === 'admin') {
      payload.labels = ['admin']
    } else {
      payload.labels = []
    }
  } else if (Array.isArray(body.labels)) {
    payload.labels = body.labels
  }

  // Update Prefs (Premium & Avatar)
  const prefsUpdate: Record<string, any> = {}

  if (body.avatar !== undefined) {
    prefsUpdate.avatar = String(body.avatar).trim()
  }

  // Penanganan Perubahan Membership Premium
  if (body.premiumAction) {
    const currentUser = await getAppwriteUser(userId)
    const currentPrefs = currentUser.prefs || {}

    if (body.premiumAction === 'remove') {
      prefsUpdate.premium = null
      const currentLabels = currentUser.labels || []
      const filteredLabels = currentLabels.filter(
        (l: string) => !['premium', 'vip'].includes(l.toLowerCase())
      )
      if (filteredLabels.length !== currentLabels.length && payload.labels === undefined) {
        payload.labels = filteredLabels
      }
    } else if (body.premiumAction === 'lifetime') {
      prefsUpdate.premium = 'lifetime'
    } else if (body.premiumAction === 'setExpiry' && body.expiryDate) {
      prefsUpdate.premium = new Date(body.expiryDate).toISOString()
    } else if (body.premiumAction === 'addDays' && body.days) {
      const days = Number(body.days)
      let baseTime = Date.now()
      if (currentPrefs.premium && currentPrefs.premium !== 'lifetime') {
        const existingExp = new Date(currentPrefs.premium).getTime()
        if (!isNaN(existingExp) && existingExp > Date.now()) {
          baseTime = existingExp
        }
      }
      prefsUpdate.premium = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString()
    }
  } else if (body.prefs) {
    Object.assign(prefsUpdate, body.prefs)
  }

  if (Object.keys(prefsUpdate).length > 0) {
    payload.prefs = prefsUpdate
  }

  try {
    const updatedUser = await updateAppwriteUser(userId, payload)
    return {
      success: true,
      user: updatedUser
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Gagal memperbarui data pengguna'
    })
  }
})
