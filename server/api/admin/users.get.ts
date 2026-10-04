import { listAppwriteUsers } from '~~/server/utils/appwriteServer'
import { requireAdminUser } from '~~/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  // Wajibkan hak akses admin
  await requireAdminUser(event)

  const query = getQuery(event)
  const search = typeof query.search === 'string' ? query.search : undefined
  const limit = query.limit ? Number(query.limit) : 100
  const offset = query.offset ? Number(query.offset) : 0

  try {
    const result = await listAppwriteUsers({ search, limit, offset })
    return {
      success: true,
      total: result.total,
      users: result.users
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Gagal memuat daftar pengguna dari Appwrite'
    })
  }
})
