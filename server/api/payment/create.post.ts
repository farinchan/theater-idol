import { saveOrder, type OrderRecord } from '~~/server/utils/ordersStorage'

export const PREMIUM_PLANS: Record<string, { id: string; name: string; durationDays: number; price: number; label: string }> = {
  plan_7d: {
    id: 'plan_7d',
    name: 'Member Premium 7 Hari',
    durationDays: 7,
    price: 12000,
    label: 'Paket 7 Hari'
  },
  plan_14d: {
    id: 'plan_14d',
    name: 'Member Premium 14 Hari',
    durationDays: 14,
    price: 20000,
    label: 'Paket 14 Hari'
  },
  plan_30d: {
    id: 'plan_30d',
    name: 'Member Premium 30 Hari',
    durationDays: 30,
    price: 30000,
    label: 'Paket 30 Hari (1 Bulan)'
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  const planId = body?.plan_id
  const plan = PREMIUM_PLANS[planId]

  if (!plan) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Paket tidak valid. Pilihan: plan_7d, plan_14d, plan_30d.'
    })
  }

  const userId = body?.user_id || ''
  const userEmail = body?.user_email || ''
  const userName = body?.user_name || ''

  // Generate unique order ID
  const timestamp = Date.now()
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const orderId = `PREM-${timestamp}-${randomSuffix}`

  // Get current origin for success/cancel return URLs
  const reqUrl = getRequestURL(event)
  const origin = reqUrl.origin || 'http://localhost:3000'

  const apiKey = config.sumopodApiKey
  const endpoint = config.sumopodPayEndpoint || 'https://api-pay-sandbox.sumopod.com/api/v1/payments'

  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1')

  try {
    const sumopodPayload: Record<string, any> = {
      order_id: orderId,
      amount: plan.price,
      currency: 'IDR',
      expires_in_hours: 1, // QRIS aktif 1 jam
      payment_method_type_code: 'QRIS'
    }

    // SumoPod validator mensyaratkan format URL publik yang valid (menolak localhost)
    if (!isLocal && (origin.startsWith('https://') || origin.startsWith('http://'))) {
      sumopodPayload.success_return_url = `${origin}/pembayaran?order_id=${orderId}&status=success`
      sumopodPayload.cancel_return_url = `${origin}/pembayaran?status=cancel`
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify(sumopodPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[SumoPod] Gagal membuat payment:', errorText)
      throw createError({
        statusCode: response.status,
        statusMessage: `Gagal membuat pembayaran ke payment gateway: ${errorText}`
      })
    }

    const paymentData = await response.json()

    // Simpan order ke orders.json
    const orderRecord: OrderRecord = {
      id: orderId,
      paymentId: paymentData.payment_id,
      userId,
      userEmail,
      userName,
      planId: plan.id,
      planName: plan.name,
      durationDays: plan.durationDays,
      amount: plan.price,
      method: 'QRIS',
      paymentLinkUrl: paymentData.payment_link_url,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: paymentData.expires_at
    }

    await saveOrder(orderRecord)

    return {
      success: true,
      order: orderRecord,
      payment: paymentData
    }
  } catch (err: any) {
    console.error('[PaymentCreate] Error:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Internal Server Error'
    })
  }
})
