import { getOrderByOrderId, updateOrderStatus } from '~~/server/utils/ordersStorage'
import { updateUserPremiumInAppwrite } from '~~/server/utils/appwriteServer'

export default defineEventHandler(async (event) => {
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
