import { Client, TablesDB, Query } from 'appwrite'

export interface OrderRecord {
  id: string // e.g. order_id: 'PREM-1790820000000-xxxx'
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

/**
 * Inisialisasi client TablesDB Appwrite untuk server dengan API Key
 */
export function getAppwriteOrdersDB() {
  const config = useRuntimeConfig()
  const endpoint = config.public.appwriteEndpoint || 'https://sgp.cloud.appwrite.io/v1'
  const projectId = config.public.appwriteProjectId || ''
  const dbId = (config.public.appwriteDatabaseId as string) || ''

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)

  if (config.appwriteApiKey) {
    (client as any).headers['X-Appwrite-Key'] = config.appwriteApiKey
  }

  const tablesDB = new TablesDB(client)
  return { tablesDB, dbId }
}

function rowToOrderRecord(row: any): OrderRecord {
  return {
    id: row.order_id || row.$id,
    paymentId: row.payment_id || undefined,
    userId: row.user_id || undefined,
    userEmail: row.user_email || undefined,
    userName: row.user_name || undefined,
    planId: row.plan_id || '',
    planName: row.plan_name || '',
    durationDays: Number(row.duration_days) || 0,
    amount: Number(row.amount) || 0,
    method: row.method || 'QRIS',
    paymentLinkUrl: row.payment_link_url || undefined,
    status: (row.status as OrderRecord['status']) || 'pending',
    createdAt: row.created_at || row.$createdAt,
    paidAt: row.paid_at || undefined,
    expiresAt: row.expires_at || undefined,
    settledAt: row.settled_at || undefined
  }
}

/**
 * Membaca seluruh data pesanan langsung dari Appwrite Database (tabel `orders`)
 */
export async function readOrders(limit = 100): Promise<OrderRecord[]> {
  try {
    const { tablesDB, dbId } = getAppwriteOrdersDB()
    const rowsRes = await tablesDB.listRows(dbId, 'orders', [
      Query.orderDesc('$createdAt'),
      Query.limit(limit)
    ])
    if (Array.isArray(rowsRes.rows)) {
      return rowsRes.rows.map(rowToOrderRecord)
    }
  } catch (err: any) {
    console.error('[OrdersStorage] Gagal membaca pesanan dari Appwrite Database:', err?.message)
  }

  return []
}

/**
 * Menyimpan pesanan baru ke Appwrite Database (tabel `orders`)
 */
export async function saveOrder(order: OrderRecord): Promise<OrderRecord> {
  const payload: Record<string, any> = {
    order_id: order.id,
    payment_id: order.paymentId || '',
    user_id: order.userId || '',
    user_email: order.userEmail || '',
    user_name: order.userName || '',
    plan_id: order.planId,
    plan_name: order.planName,
    duration_days: order.durationDays,
    amount: order.amount,
    method: order.method || 'QRIS',
    status: order.status || 'pending',
    payment_link_url: order.paymentLinkUrl || '',
    created_at: order.createdAt,
    paid_at: order.paidAt || '',
    expires_at: order.expiresAt || '',
    settled_at: order.settledAt || ''
  }

  try {
    const { tablesDB, dbId } = getAppwriteOrdersDB()
    try {
      await tablesDB.createRow(dbId, 'orders', order.id, payload)
    } catch {
      // Jika row ID sudah ada, lakukan update
      await tablesDB.updateRow(dbId, 'orders', order.id, payload)
    }
  } catch (err: any) {
    console.error('[OrdersStorage] Gagal menyimpan pesanan ke Appwrite Database:', err?.message)
  }

  return order
}

/**
 * Memperbarui status pesanan di Appwrite Database
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderRecord['status'],
  extra: Partial<OrderRecord> = {}
): Promise<OrderRecord | null> {
  const updatePayload: Record<string, any> = {
    status,
    ...(extra.paidAt ? { paid_at: extra.paidAt } : {}),
    ...(extra.settledAt ? { settled_at: extra.settledAt } : {}),
    ...(extra.paymentId ? { payment_id: extra.paymentId } : {})
  }

  try {
    const { tablesDB, dbId } = getAppwriteOrdersDB()
    try {
      const updatedRow = await tablesDB.updateRow(dbId, 'orders', orderId, updatePayload)
      return rowToOrderRecord(updatedRow)
    } catch {
      // Jika bukan row ID, cari via query order_id
      const searchRes = await tablesDB.listRows(dbId, 'orders', [
        Query.equal('order_id', orderId)
      ])
      if (searchRes.total > 0 && searchRes.rows[0]) {
        const rowId = searchRes.rows[0].$id
        const updatedRow = await tablesDB.updateRow(dbId, 'orders', rowId, updatePayload)
        return rowToOrderRecord(updatedRow)
      }
    }
  } catch (err: any) {
    console.error('[OrdersStorage] Gagal memperbarui status order di Appwrite Database:', err?.message)
  }

  return null
}

/**
 * Mengambil detail pesanan berdasarkan orderId dari Appwrite Database
 */
export async function getOrderByOrderId(orderId: string): Promise<OrderRecord | null> {
  try {
    const { tablesDB, dbId } = getAppwriteOrdersDB()
    try {
      const row = await tablesDB.getRow(dbId, 'orders', orderId)
      if (row) return rowToOrderRecord(row)
    } catch {}

    const searchRes = await tablesDB.listRows(dbId, 'orders', [
      Query.equal('order_id', orderId)
    ])
    if (searchRes.total > 0 && searchRes.rows[0]) {
      return rowToOrderRecord(searchRes.rows[0])
    }
  } catch (err: any) {
    console.error('[OrdersStorage] Gagal mengambil pesanan:', err?.message)
  }

  return null
}

/**
 * Mengambil daftar riwayat pesanan milik pengguna tertentu dari Appwrite Database
 */
export async function getOrdersByUserId(userId: string): Promise<OrderRecord[]> {
  try {
    const { tablesDB, dbId } = getAppwriteOrdersDB()
    const searchRes = await tablesDB.listRows(dbId, 'orders', [
      Query.equal('user_id', userId),
      Query.orderDesc('$createdAt'),
      Query.limit(50)
    ])
    if (Array.isArray(searchRes.rows)) {
      return searchRes.rows.map(rowToOrderRecord)
    }
  } catch (err: any) {
    console.error('[OrdersStorage] Gagal mengambil pesanan user dari Appwrite Database:', err?.message)
  }

  return []
}
