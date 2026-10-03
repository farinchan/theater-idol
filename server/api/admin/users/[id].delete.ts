import { deleteAppwriteUser } from '~~/server/utils/appwriteServer'

export default defineEventHandler(async (event) => {
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
