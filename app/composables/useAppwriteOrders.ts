import { account } from '~/appwrite'

// Helper untuk menyertakan JWT autentikasi Appwrite ke endpoint server
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {}
  if (!import.meta.client) return headers
  try {
    const res = await account.createJWT()
    if (res?.jwt) {
      headers['X-Appwrite-JWT'] = res.jwt
    }
  } catch {}
  return headers
}

export interface OrderItem {
  id: string
  paymentId?: string
  userId?: string
  userEmail?: string
  userName?: string
  planId: string
  planName: string
  durationDays: number
  amount: number
  method: string
  paymentLinkUrl?: string
  status: 'pending' | 'completed' | 'failed' | 'expired'
  createdAt: string
  paidAt?: string
  expiresAt?: string
  settledAt?: string
}

export const useAppwriteOrders = () => {
  const orders = useState<OrderItem[]>('admin_orders_list', () => [])
  const isLoading = ref(false)
  const isActionLoading = ref(false)
  const error = ref<string | null>(null)
  const notice = ref<string | null>(null)

  const fetchOrders = async (limit = 200) => {
    isLoading.value = true
    error.value = null
    try {
      const headers = await getAuthHeaders()
      const res = await $fetch<{ success: boolean; orders: OrderItem[] }>(
        `/api/payment/orders?limit=${limit}`,
        { headers }
      )
      if (res?.success && Array.isArray(res.orders)) {
        orders.value = res.orders
      }
    } catch (err: any) {
      error.value = err?.data?.statusMessage || err?.message || 'Gagal memuat riwayat pembayaran.'
    } finally {
      isLoading.value = false
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: OrderItem['status']) => {
    isActionLoading.value = true
    error.value = null
    notice.value = null
    try {
      const headers = await getAuthHeaders()
      const res = await $fetch<{ success: boolean; message: string; order: OrderItem; newExpiry?: string }>(
        '/api/payment/update-status',
        {
          method: 'POST',
          headers,
          body: {
            order_id: orderId,
            status: newStatus
          }
        }
      )

      if (res?.success && res.order) {
        // Update local list
        const idx = orders.value.findIndex(o => o.id === orderId)
        if (idx !== -1) {
          orders.value[idx] = { ...orders.value[idx], ...res.order }
        }
        notice.value = res.message || 'Status pesanan berhasil diperbarui.'
        return { success: true, newExpiry: res.newExpiry }
      }
      return { success: false, error: 'Gagal memperbarui status.' }
    } catch (err: any) {
      const errMsg = err?.data?.statusMessage || err?.message || 'Gagal mengubah status pesanan.'
      error.value = errMsg
      return { success: false, error: errMsg }
    } finally {
      isActionLoading.value = false
    }
  }

  // Computed statistics
  const stats = computed(() => {
    const list = orders.value
    let totalRevenue = 0
    let completedCount = 0
    let pendingCount = 0
    let failedCount = 0
    let expiredCount = 0

    list.forEach(order => {
      if (order.status === 'completed') {
        totalRevenue += Number(order.amount) || 0
        completedCount++
      } else if (order.status === 'pending') {
        pendingCount++
      } else if (order.status === 'failed') {
        failedCount++
      } else if (order.status === 'expired') {
        expiredCount++
      }
    })

    return {
      totalOrders: list.length,
      totalRevenue,
      completedCount,
      pendingCount,
      failedCount,
      expiredCount
    }
  })

  return {
    orders,
    isLoading,
    isActionLoading,
    error,
    notice,
    fetchOrders,
    updateOrderStatus,
    stats
  }
}
