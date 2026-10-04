import { deleteAppwriteUser } from '~~/server/utils/appwriteServer'
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

  try {
    await deleteAppwriteUser(userId)
    return {
      success: true
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Gagal menghapus pengguna'
    })
  }
})
