import { getOrderByOrderId, updateOrderStatus, type OrderRecord } from '~~/server/utils/ordersStorage'
import { updateUserPremiumInAppwrite } from '~~/server/utils/appwriteServer'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const orderId = body?.order_id as string
  const newStatus = body?.status as OrderRecord['status']

  if (!orderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'order_id wajib diisi'
    })
  }

  const validStatuses: OrderRecord['status'][] = ['completed', 'pending', 'failed', 'expired']
  if (!newStatus || !validStatuses.includes(newStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Status tidak valid. Pilihan: ${validStatuses.join(', ')}`
    })
  }

  const order = await getOrderByOrderId(orderId)
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pesanan tidak ditemukan'
    })
  }

  const now = new Date().toISOString()
  const extra: Partial<OrderRecord> = {}

  if (newStatus === 'completed') {
    extra.paidAt = order.paidAt || now
    extra.settledAt = order.settledAt || now
  }

  const updated = await updateOrderStatus(orderId, newStatus, extra)

  let newExpiry: string | undefined
  // Jika diubah menjadi completed dan ada userId, otomatis perpanjang premium di Appwrite Auth
  if (newStatus === 'completed' && order.userId) {
    const appwriteRes = await updateUserPremiumInAppwrite(order.userId, order.durationDays)
    if (appwriteRes.success) {
      newExpiry = appwriteRes.newExpiry
    }
  }

  return {
    success: true,
    message: `Status pesanan berhasil diubah menjadi ${newStatus}`,
    order: updated,
    newExpiry
  }
})
