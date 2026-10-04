import { readOrders, getOrderByOrderId, getOrdersByUserId } from '~~/server/utils/ordersStorage'
import { getAuthenticatedUser, requireAdminUser } from '~~/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const orderId = query.order_id as string
  const userId = query.user_id as string
  const userEmail = query.user_email as string

  // 1. Pengecekan status satu pesanan spesifik via order_id unik (digunakan untuk polling QRIS)
  if (orderId) {
    const order = await getOrderByOrderId(orderId)
    if (!order) {
      return {
        success: true,
        order: null
      }
    }

    return {
      success: true,
      order
    }
  }

  // 2. Kueri riwayat pesanan berdasarkan user_id atau user_email
  if (userId || userEmail) {
    const authUser = await getAuthenticatedUser(event)
    if (!authUser) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Autentikasi diperlukan untuk melihat riwayat pesanan.'
      })
    }

    const isAdmin = authUser.labels?.includes('admin') || authUser.isSystem
    // Jika bukan admin, pastikan user hanya bisa melihat pesanannya sendiri
    if (!isAdmin) {
      const isOwner =
        (userId && userId === authUser.$id) ||
        (userEmail && userEmail.toLowerCase() === authUser.email.toLowerCase())

      if (!isOwner) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Akses ditolak: Anda hanya dapat melihat riwayat pesanan milik Anda sendiri.'
        })
      }
    }

    const orders = await getOrdersByUserId(userId, userEmail)
    return {
      success: true,
      orders
    }
  }

  // 3. Kueri seluruh daftar transaksi pesanan (hanya boleh diakses oleh Administrator)
  await requireAdminUser(event)

  const limit = Math.min(Math.max(Number(query.limit) || 100, 1), 500)
  const allOrders = await readOrders(limit)

  return {
    success: true,
    orders: allOrders
  }
})
