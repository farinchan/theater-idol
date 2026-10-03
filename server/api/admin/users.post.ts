import { createAppwriteUser } from '~~/server/utils/appwriteServer'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body tidak boleh kosong'
    })
  }

  const name = String(body.name || '').trim()
  const email = String(body.email || '').trim()
  const password = String(body.password || '').trim()

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nama lengkap wajib diisi'
    })
  }

  if (!email || !email.includes('@')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Format email tidak valid'
    })
  }

  if (!password || password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Kata sandi minimal 8 karakter'
    })
  }

  // Siapkan Labels
  const labels: string[] = []
  if (body.role === 'admin' || (Array.isArray(body.labels) && body.labels.includes('admin'))) {
    labels.push('admin')
  }

  // Siapkan Prefs (Premium & Avatar)
  const prefs: Record<string, any> = {}
  if (body.avatar) {
    prefs.avatar = String(body.avatar).trim()
  } else {
    // Generate avatar default DiceBear
    prefs.avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}&backgroundColor=f43f5e`
  }

  // Tangani Premium
  if (body.premiumExpiry === 'lifetime' || body.premiumExpiry === 'permanen') {
    prefs.premium = 'lifetime'
  } else if (body.premiumExpiry) {
    prefs.premium = new Date(body.premiumExpiry).toISOString()
  } else if (body.premiumDurationDays && Number(body.premiumDurationDays) > 0) {
    const days = Number(body.premiumDurationDays)
    prefs.premium = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
  }

  const status = body.status !== undefined ? Boolean(body.status) : true

  try {
    const newUser = await createAppwriteUser({
      name,
      email,
      password,
      labels,
      prefs,
      status
    })

    return {
      success: true,
      user: newUser
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Gagal membuat pengguna baru'
    })
  }
})
