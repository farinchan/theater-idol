/**
 * Script untuk membuat atau memvalidasi tabel & kolom `settings` dan `orders` di Appwrite Database
 * Jalankan: node --env-file=.env scripts/setup-appwrite-tables.js
 */

const endpoint = process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
const projectId = process.env.APPWRITE_PROJECT_ID || ''
const databaseId = process.env.APPWRITE_DATABASE_ID || ''
const apiKey = process.env.APPWRITE_API_KEY

const SETTINGS_COLUMNS = [
  { type: 'string', key: 'app_name', size: 255, required: false, default: 'Pekerja48' },
  { type: 'boolean', key: 'is_stream_enabled', required: false, default: true },
  { type: 'boolean', key: 'is_replay_enabled', required: false, default: true },
  { type: 'boolean', key: 'is_stream_require_login', required: false, default: false },
  { type: 'boolean', key: 'is_replay_require_login', required: false, default: false },
  { type: 'boolean', key: 'is_stream_require_premium', required: false, default: false },
  { type: 'boolean', key: 'is_replay_require_premium', required: false, default: false },
  { type: 'string', key: 'stream_notice', size: 2000, required: false },
  { type: 'string', key: 'replay_notice', size: 2000, required: false },
  { type: 'string', key: 'updated_at', size: 100, required: false }
]

const ORDERS_COLUMNS = [
  { type: 'string', key: 'order_id', size: 100, required: true },
  { type: 'string', key: 'payment_id', size: 100, required: false },
  { type: 'string', key: 'user_id', size: 100, required: false },
  { type: 'string', key: 'user_email', size: 255, required: false },
  { type: 'string', key: 'user_name', size: 255, required: false },
  { type: 'string', key: 'plan_id', size: 50, required: false },
  { type: 'string', key: 'plan_name', size: 100, required: false },
  { type: 'integer', key: 'duration_days', required: false, default: 0 },
  { type: 'integer', key: 'amount', required: false, default: 0 },
  { type: 'string', key: 'method', size: 50, required: false, default: 'QRIS' },
  { type: 'string', key: 'status', size: 50, required: false, default: 'pending' },
  { type: 'string', key: 'payment_link_url', size: 1000, required: false },
  { type: 'string', key: 'created_at', size: 100, required: false },
  { type: 'string', key: 'paid_at', size: 100, required: false },
  { type: 'string', key: 'expires_at', size: 100, required: false },
  { type: 'string', key: 'settled_at', size: 100, required: false }
]

async function addColumn(tableId, col) {
  const url = `${endpoint}/tablesdb/${databaseId}/tables/${tableId}/columns/${col.type}`
  const payload = {
    key: col.key,
    required: col.required || false
  }

  if (col.size) payload.size = col.size
  if (col.default !== undefined) payload.default = col.default

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (res.ok) {
      console.log(`  [OK] Kolom '${col.key}' (${col.type}) berhasil ditambahkan ke tabel '${tableId}'.`)
      return true
    } else {
      if (data.type === 'attribute_already_exists' || data.message?.includes('already exists')) {
        console.log(`  [INFO] Kolom '${col.key}' sudah ada di tabel '${tableId}'.`)
        return true
      }
      console.warn(`  [GAGAL] Kolom '${col.key}' di tabel '${tableId}':`, data.message)
      return false
    }
  } catch (err) {
    console.error(`  [ERROR] Kolom '${col.key}':`, err.message)
    return false
  }
}

async function main() {
  console.log('=== MEMULAI SETUP APPWRITE DATABASE (TABLES & COLUMNS) ===')
  console.log('Project ID :', projectId)
  console.log('Database ID:', databaseId)

  console.log('\n--- 1. Memeriksa Kolom Tabel "settings" ---')
  for (const col of SETTINGS_COLUMNS) {
    await addColumn('settings', col)
  }

  console.log('\n--- 2. Memeriksa Kolom Tabel "orders" ---')
  for (const col of ORDERS_COLUMNS) {
    await addColumn('orders', col)
  }

  console.log('\n=== SELESAI ===')
}

main()
