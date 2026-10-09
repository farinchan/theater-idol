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

  // Waktu dibuat dalam format UTC ISO string standar (tepat 20 karakter: YYYY-MM-DDTHH:mm:ssZ agar memenuhi limit schema Appwrite max 20 chars)
  const currentUtcIso = new Date().toISOString().slice(0, 19) + 'Z'
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

  // Ekstrak token autentikasi request pengguna
  const reqHeaders = getHeaders(event)
  let jwt = (reqHeaders['x-appwrite-jwt'] as string) || ''
  const authHeader = (reqHeaders['authorization'] as string) || ''
  if (!jwt && authHeader.startsWith('Bearer ')) {
    jwt = authHeader.slice(7).trim()
  }

  const sessionToken =
    (reqHeaders['x-appwrite-session'] as string) ||
    getCookie(event, `a_session_${projectId}`) ||
    getCookie(event, `a_session_${projectId.toLowerCase()}`) ||
    getCookie(event, `a_session_${projectId}_legacy`)

  // Fungsi pembantu penulisan ke TablesDB atau Databases (dengan/tanpa permissions)
  const writeWithClient = async (c: Client) => {
    const tDb = new TablesDB(c)
    const db = new Databases(c)

    const tryWrite = async (currentPayload: any) => {
      try {
        return await tDb.createRow(dbId, tableId, newDocId, currentPayload, permissions)
      } catch {
        try {
          return await tDb.createRow(dbId, tableId, newDocId, currentPayload)
        } catch {
          try {
            return await db.createDocument(dbId, tableId, newDocId, currentPayload, permissions)
          } catch {
            return await db.createDocument(dbId, tableId, newDocId, currentPayload)
          }
        }
      }
    }

    try {
      return await tryWrite(payload)
    } catch (err: any) {
      // Fallback jika skema Appwrite memiliki limit panjang time lebih kecil dari 20 karakter
      if (err?.message?.includes('"time"') && err?.message?.includes('no longer than')) {
        const match = err.message.match(/no longer than (\d+) chars/i)
        const maxLen = match ? parseInt(match[1], 10) : 19
        const truncatedPayload = {
          ...payload,
          time: payload.time.slice(0, maxLen)
        }
        return await tryWrite(truncatedPayload)
      }
      throw err
    }
  }

  let result: any = null
  let lastError: any = null

  // 1. Prioritaskan penulisan menggunakan JWT/Sesi pengguna terautentikasi
  // (Metode ini tidak memerlukan scope API key "documents.write" karena bertindak atas nama pengguna)
  if (jwt || sessionToken) {
    try {
      const userClient = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)

      if (jwt) {
        userClient.setJWT(jwt)
      } else if (sessionToken) {
        userClient.setSession(sessionToken)
      }

      result = await writeWithClient(userClient)
    } catch (userErr: any) {
      lastError = userErr
      console.warn('[ChatSendAPI] Penulisan via sesi/JWT pengguna gagal, mencoba via API Key...', userErr?.message)
    }
  }

  // 2. Jika via sesi/JWT belum berhasil, coba via API Key server (jika tersedia)
  if (!result && config.appwriteApiKey) {
    try {
      const apiKeyClient = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)

      ;(apiKeyClient as any).headers['X-Appwrite-Key'] = config.appwriteApiKey

      result = await writeWithClient(apiKeyClient)
    } catch (apiKeyErr: any) {
      lastError = apiKeyErr
      console.error('[ChatSendAPI] Penulisan via API Key gagal:', apiKeyErr?.message)
    }
  }

  if (result) {
    return {
      success: true,
      message: result
    }
  }

  // Tangani error spesifik jika API Key kekurangan scope
  const errorMsg = lastError?.message || 'Gagal mengirim pesan obrolan ke Appwrite'
  if (errorMsg.includes('missing scopes') || errorMsg.includes('documents.write')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'API Key Appwrite belum memiliki scope "documents.write". Aktifkan scope "documents.write" (dan "databases.write") di Appwrite Console > Project Settings > API Keys, atau periksa hak akses Create pada tabel "live_chat".'
    })
  }

  throw createError({
    statusCode: 500,
    statusMessage: errorMsg
  })
})
