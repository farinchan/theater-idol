import crypto from 'node:crypto'
import { getOrderByOrderId, updateOrderStatus } from '~~/server/utils/ordersStorage'
import { updateUserPremiumInAppwrite } from '~~/server/utils/appwriteServer'

function verifySignature(
  secret: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  rawBody: string
): boolean {
  try {
    const cleanSecret = secret.replace('whsec_', '')
    const secretBytes = Buffer.from(cleanSecret, 'base64')
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`

    const expectedSignature = crypto
      .createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64')

    const signatures = svixSignature.split(' ').map(s => s.split(',')[1])
    return signatures.includes(expectedSignature)
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const rawBody = await readRawBody(event, 'utf-8') || ''
  const headers = getHeaders(event)

  const receivedToken = headers['x-webhook-token']
  const expectedToken = config.sumopodWebhookToken

  const svixId = headers['svix-id'] as string
  const svixTimestamp = headers['svix-timestamp'] as string
  const svixSignature = headers['svix-signature'] as string
  const webhookSecret = config.sumopodWebhookSecret

  let isAuthorized = false

  // 1. Verifikasi dengan token X-Webhook-Token
  if (expectedToken && receivedToken && receivedToken === expectedToken) {
    isAuthorized = true
  }

  // 2. Verifikasi dengan signature HMAC jika token tidak cocok/tidak ada
  if (!isAuthorized && webhookSecret && svixId && svixTimestamp && svixSignature) {
    isAuthorized = verifySignature(webhookSecret, svixId, svixTimestamp, svixSignature, rawBody)
  }

  // Jika di lingkungan dev/sandbox dan token tidak dikirim, beri toleransi jika test
  if (!isAuthorized && !expectedToken && !webhookSecret) {
    isAuthorized = true
  }

  if (!isAuthorized) {
    console.warn('[Webhook] Autentikasi webhook gagal: invalid token / signature.')
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid webhook token or signature'
    })
  }

  let payload: any = {}
  try {
    payload = JSON.parse(rawBody)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid JSON payload'
    })
  }

  const eventType = payload?.event_type
  const eventData = payload?.data || {}
  const orderId = eventData?.order_id
  const paymentId = eventData?.payment_id

  console.log(`[Webhook] Menerima event: ${eventType} untuk order_id: ${orderId}`)

  if (eventType === 'payment.completed') {
    if (!orderId) {
      return { success: true, message: 'No order_id in completed payload' }
    }

    const order = await getOrderByOrderId(orderId)
    if (!order) {
      console.warn(`[Webhook] Order tidak ditemukan di sistem: ${orderId}`)
      return { success: true, message: 'Order not found, skipped' }
    }

    // Perbarui status order
    await updateOrderStatus(orderId, 'completed', {
      paidAt: eventData.paid_at || new Date().toISOString(),
      settledAt: eventData.settled_at || eventData.completed_at || new Date().toISOString(),
      paymentId: paymentId || order.paymentId
    })

    // Jika ada userId, otomatis perbarui status Member Premium di Appwrite Auth
    if (order.userId) {
      const updateRes = await updateUserPremiumInAppwrite(order.userId, order.durationDays)
      if (updateRes.success) {
        console.log(`[Webhook] Berhasil memperpanjang premium user ${order.userId} hingga ${updateRes.newExpiry}`)
      } else {
        console.error(`[Webhook] Gagal memperpanjang premium di Appwrite:`, updateRes.error)
      }
    }

    return {
      success: true,
      message: `Payment completed for ${orderId}`
    }
  }

  if (eventType === 'payment.failed') {
    if (orderId) {
      await updateOrderStatus(orderId, 'failed')
    }
    return { success: true, message: 'Payment marked as failed' }
  }

  if (eventType === 'payment.expired') {
    if (orderId) {
      await updateOrderStatus(orderId, 'expired')
    }
    return { success: true, message: 'Payment marked as expired' }
  }

  if (eventType === 'payment.test') {
    console.log('[Webhook] Menerima event test dari SumoPod settings.')
    return { success: true, message: 'Test event received successfully' }
  }

  return { success: true, message: `Event ${eventType} received` }
})
