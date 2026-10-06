import { Client, TablesDB, Databases, ID } from 'appwrite'
import { requireAuthUser } from '~~/server/utils/authGuard'

// In-memory rate limiting map: userId -> lastTimestamp (ms)
const rateLimitMap = new Map<string, number>()

export default defineEventHandler(async (event) => {
  // 1. Wajibkan user login terverifikasi
  const authUser = await requireAuthUser(event)

  const body = await readBody(event)
  if (!body || !body.message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pesan obrolan wajib diisi'
    })
  }

  const rawMessage = String(body.message).trim()
  if (!rawMessage) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pesan tidak boleh kosong'
    })
  }

  if (rawMessage.length > 150) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pesan terlalu panjang (maksimal 150 karakter)'
    })
  }

  // 2. Evaluasi status Admin secara KETAT di server (mencegah impersonasi staf)
  const isAdmin = Array.isArray(authUser.labels) && authUser.labels.includes('admin')

  // 3. Server-side Rate Limiting (Cooldown 5 detik untuk non-admin)
  const now = Date.now()
  if (!isAdmin) {
    const lastSent = rateLimitMap.get(authUser.$id) || 0
    if (now - lastSent < 4500) {
      const waitSec = Math.ceil((4500 - (now - lastSent)) / 1000)
      throw createError({
        statusCode: 429,
        statusMessage: `Mohon tunggu ${waitSec} detik sebelum mengirim pesan lagi.`
      })
    }
    rateLimitMap.set(authUser.$id, now)

    // Bersihkan entri lama jika map membesar agar memory tetap hemat
    if (rateLimitMap.size > 1000) {
      for (const [key, ts] of rateLimitMap.entries()) {
        if (now - ts > 60000) rateLimitMap.delete(key)
      }
    }
  }

  const config = useRuntimeConfig()
  const endpoint = config.public.appwriteEndpoint || 'https://sgp.cloud.appwrite.io/v1'
  const projectId = config.public.appwriteProjectId || ''
  const dbId = (config.public.appwriteDatabaseId as string) || ''
  const tableId = (config.public.appwriteTableChatId as string) || 'live_chat'

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)

  if (config.appwriteApiKey) {
    (client as any).headers['X-Appwrite-Key'] = config.appwriteApiKey
  }

  const tablesDB = new TablesDB(client)
  const databases = new Databases(client)

  // Waktu dibuat dalam format UTC ISO string standar
  const currentUtcIso = new Date().toISOString()
  const newDocId = ID.unique()

  // Ambil avatar akun terverifikasi (atau fallback dari payload body jika ada)
  const clientAvatar = body.avatar && typeof body.avatar === 'string' ? body.avatar.trim() : ''
  const effectiveAvatar = authUser.prefs?.avatar || clientAvatar || ''

  // Payload murni dari identitas akun server terverifikasi
  const payload = {
    user_id: authUser.$id,
    user_name: authUser.name || authUser.email.split('@')[0] || 'Penonton',
    user_avatar: effectiveAvatar,
    is_admin: isAdmin, // HANYA bernilai true jika akun verified admin dari Appwrite
    message: rawMessage,
    show_id: body.show_id ? String(body.show_id) : '',
    time: currentUtcIso
  }

  const permissions = ['read("any")']

  try {
    let result: any
    try {
      result = await tablesDB.createRow(dbId, tableId, newDocId, payload, permissions)
    } catch (tablesErr: any) {
      result = await databases.createDocument(dbId, tableId, newDocId, payload, permissions)
    }

    return {
      success: true,
      message: result
    }
  } catch (err: any) {
    console.error('[ChatSendAPI] Gagal menyimpan pesan ke Appwrite:', err)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Gagal mengirim pesan obrolan'
    })
  }
})
