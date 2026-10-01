import { readOrders, getOrderByOrderId, getOrdersByUserId } from '~~/server/utils/ordersStorage'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const orderId = query.order_id as string
  const userId = query.user_id as string

  if (orderId) {
    const order = await getOrderByOrderId(orderId)
    return {
      success: true,
      order: order || null
    }
  }

  if (userId) {
    const orders = await getOrdersByUserId(userId)
    return {
      success: true,
      orders
    }
  }

  // Jika tanpa filter, kembalikan 50 pesanan terbaru
  const allOrders = await readOrders()
  return {
    success: true,
    orders: allOrders.slice(0, 50)
  }
})
