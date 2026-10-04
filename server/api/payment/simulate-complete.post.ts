import { getOrderByOrderId, updateOrderStatus } from '~~/server/utils/ordersStorage'
import { updateUserPremiumInAppwrite } from '~~/server/utils/appwriteServer'
import { requireAdminUser } from '~~/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  // 1. Blokir sepenuhnya pada lingkungan produksi
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Endpoint tidak tersedia di lingkungan produksi'
    })
  }

  // 2. Wajibkan autentikasi administrator bahkan di lingkungan development
  await requireAdminUser(event)

  const body = await readBody(event)
  const orderId = body?.order_id

  if (!orderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'order_id wajib diisi'
    })
  }

  const order = await getOrderByOrderId(orderId)
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pesanan tidak ditemukan'
    })
  }

  if (order.status === 'completed') {
    return {
      success: true,
      message: 'Pesanan sudah berstatus selesai',
      order
    }
  }

  const paidAt = new Date().toISOString()
  const updated = await updateOrderStatus(orderId, 'completed', {
    paidAt,
    settledAt: paidAt
  })

  let newExpiry: string | undefined
  if (order.userId) {
    const appwriteRes = await updateUserPremiumInAppwrite(order.userId, order.durationDays)
    if (appwriteRes.success) {
      newExpiry = appwriteRes.newExpiry
    }
  }

  return {
    success: true,
    message: 'Pembayaran sandbox berhasil diselesaikan',
    order: updated,
    newExpiry
  }
})
