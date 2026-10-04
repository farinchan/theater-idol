import { readBody } from 'h3'
import { recordViewerHeartbeat, removeViewer, getActiveViewerCount } from '~~/server/utils/streamViewers'

export default defineEventHandler(async (event) => {
  let body: any = {}
  try {
    body = await readBody(event)
    // Tangani jika body dikirim via navigator.sendBeacon sebagai text string
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {}
    }
  } catch {
    body = {}
  }

  const clientId = body?.clientId || ''
  const action = body?.action || 'heartbeat'

  if (action === 'leave') {
    removeViewer(clientId)
  } else {
    recordViewerHeartbeat(clientId)
  }

  return {
    success: true,
    viewers: getActiveViewerCount()
  }
})
