import { createEventStream, getQuery } from 'h3'
import { registerViewerStream, getActiveViewerCount } from '~~/server/utils/streamViewers'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const clientId = (query.clientId as string) || ''

  const eventStream = createEventStream(event)

  // Daftarkan stream client ke in-memory tracker
  registerViewerStream(eventStream, clientId)

  // Kirim data awal penonton aktif segera setelah terhubung
  const initialPayload = JSON.stringify({
    viewers: getActiveViewerCount(),
    timestamp: Date.now()
  })

  await eventStream.push({
    event: 'viewers',
    data: initialPayload
  })

  // Keep-alive interval setiap 20 detik agar koneksi SSE tidak diputus oleh proxy Nginx
  const keepAliveTimer = setInterval(() => {
    eventStream.push({
      event: 'ping',
      data: 'keepalive'
    }).catch(() => {
      clearInterval(keepAliveTimer)
    })
  }, 20000)

  eventStream.onClosed(() => {
    clearInterval(keepAliveTimer)
  })

  return eventStream.send()
})
