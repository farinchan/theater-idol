import { Client, Account, type Models } from 'appwrite'
import type { H3Event } from 'h3'
import { getAppwriteServerConfig } from './appwriteServer'

export interface AuthenticatedUser {
  $id: string
  name: string
  email: string
  labels: string[]
  prefs?: Record<string, any>
  isSystem?: boolean
}

/**
 * Memvalidasi dan mengekstrak data user dari request menggunakan JWT atau sesi Appwrite
 */
export async function getAuthenticatedUser(event: H3Event): Promise<AuthenticatedUser | null> {
  const config = useRuntimeConfig()
  const headers = getHeaders(event)

  // 1. Verifikasi System / Admin API Key internal (misal dari backend job)
  const adminKey = headers['x-admin-key']
  if (adminKey && config.appwriteApiKey && adminKey === config.appwriteApiKey) {
    return {
      $id: 'system_admin',
      name: 'System Admin',
      email: 'admin@theater-idol.web.id',
      labels: ['admin'],
      isSystem: true
    }
  }

  const { endpoint, projectId } = getAppwriteServerConfig()

  // 2. Verifikasi via Appwrite JWT (Official recommended method)
  let jwt = (headers['x-appwrite-jwt'] as string) || ''
  const authHeader = (headers['authorization'] as string) || ''
  if (!jwt && authHeader.startsWith('Bearer ')) {
    jwt = authHeader.slice(7).trim()
  }

  if (jwt) {
    try {
      const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setJWT(jwt)

      const userAccount = new Account(client)
      const user = await userAccount.get()
      return {
        $id: user.$id,
        name: user.name || '',
        email: user.email || '',
        labels: Array.isArray(user.labels) ? user.labels : [],
        prefs: user.prefs || {}
      }
    } catch (err: any) {
      console.warn('[authGuard] Verifikasi JWT Appwrite gagal:', err?.message)
    }
  }

  // 3. Verifikasi via Appwrite Session (Cookie atau X-Appwrite-Session)
  const sessionToken =
    (headers['x-appwrite-session'] as string) ||
    getCookie(event, `a_session_${projectId}`) ||
    getCookie(event, `a_session_${projectId.toLowerCase()}`) ||
    getCookie(event, `a_session_${projectId}_legacy`)

  if (sessionToken) {
    try {
      const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setSession(sessionToken)

      const userAccount = new Account(client)
      const user = await userAccount.get()
      return {
        $id: user.$id,
        name: user.name || '',
        email: user.email || '',
        labels: Array.isArray(user.labels) ? user.labels : [],
        prefs: user.prefs || {}
      }
    } catch (err: any) {
      console.warn('[authGuard] Verifikasi Session Appwrite gagal:', err?.message)
    }
  }

  return null
}

/**
 * Wajibkan pengguna login (Authenticated)
 */
export async function requireAuthUser(event: H3Event): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Autentikasi diperlukan. Silakan masuk ke akun Anda.'
    })
  }
  return user
}

/**
 * Wajibkan pengguna memiliki hak akses Administrator (label: admin)
 */
export async function requireAdminUser(event: H3Event): Promise<AuthenticatedUser> {
  const user = await requireAuthUser(event)
  const labels = Array.isArray(user.labels) ? user.labels : []
  const isAdmin = labels.some((l: string) => typeof l === 'string' && l.toLowerCase() === 'admin')

  if (!isAdmin && !user.isSystem) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Akses ditolak: Anda tidak memiliki wewenang administrator.'
    })
  }

  return user
}
