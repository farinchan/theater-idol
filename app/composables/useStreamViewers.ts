import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useStreamViewers() {
  const viewerCount = ref<number>(1)
  const isConnected = ref<boolean>(false)

  let eventSource: EventSource | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let clientId = ''

  // Format angka penonton (contoh: 1250 -> 1.250 atau 15 -> 15)
  const formatViewerCount = (num: number): string => {
    if (!num || num < 1) return '1'
    return new Intl.NumberFormat('id-ID').format(num)
  }

  // Dapatkan ID client unik per tab browser
  const getClientId = (): string => {
    if (!import.meta.client) return ''
    try {
      let id = sessionStorage.getItem('stream_viewer_cid')
      if (!id) {
        id = 'v_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
        sessionStorage.setItem('stream_viewer_cid', id)
      }
      return id
    } catch {
      return 'v_' + Math.random().toString(36).slice(2, 10)
    }
  }

  // Kirim sinyal heartbeat berkala
  const sendHeartbeat = async (action: 'heartbeat' | 'leave' = 'heartbeat') => {
    if (!import.meta.client || !clientId) return

    try {
      const res = await $fetch<{ viewers: number }>('/api/stream/viewers/heartbeat', {
        method: 'POST',
        body: {
          clientId,
          action
        }
      })
      if (res?.viewers !== undefined && action === 'heartbeat') {
        viewerCount.value = Math.max(1, res.viewers)
      }
    } catch {}
  }

  // Kirim sinyal keluar via beacon (saat tab ditutup/reload tanpa jeda)
  const sendLeaveBeacon = () => {
    if (!import.meta.client || !clientId) return
    try {
      const payload = JSON.stringify({ clientId, action: 'leave' })
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon('/api/stream/viewers/heartbeat', blob)
      } else {
        fetch('/api/stream/viewers/heartbeat', {
          method: 'POST',
          body: payload,
          keepalive: true,
          headers: { 'Content-Type': 'application/json' }
        }).catch(() => {})
      }
    } catch {}
  }

  // Mulai koneksi realtime
  const startTracking = () => {
    if (!import.meta.client) return

    clientId = getClientId()

    // 1. Ambil data awal jumlah penonton
    $fetch<{ viewers: number }>('/api/stream/viewers')
      .then(res => {
        if (res?.viewers) {
          viewerCount.value = Math.max(1, res.viewers)
        }
      })
      .catch(() => {})

    // 2. Hubungkan ke Server-Sent Events (SSE) untuk realtime update seketika
    try {
      if (typeof EventSource !== 'undefined') {
        const sseUrl = `/api/stream/viewers/stream?clientId=${encodeURIComponent(clientId)}`
        eventSource = new EventSource(sseUrl)

        eventSource.addEventListener('viewers', (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data)
            if (data?.viewers !== undefined) {
              viewerCount.value = Math.max(1, Number(data.viewers))
              isConnected.value = true
            }
          } catch {}
        })

        eventSource.onopen = () => {
          isConnected.value = true
        }

        eventSource.onerror = () => {
          isConnected.value = false
        }
      }
    } catch (e) {
      console.warn('[StreamViewers] SSE connection error:', e)
    }

    // 3. Heartbeat berkala setiap 15 detik sebagai keep-alive dan cadangan polling
    sendHeartbeat('heartbeat')
    heartbeatTimer = setInterval(() => {
      sendHeartbeat('heartbeat')
    }, 15000)

    // 4. Pasang listener event saat tab browser ditutup atau dipindah
    window.addEventListener('pagehide', sendLeaveBeacon)
    window.addEventListener('beforeunload', sendLeaveBeacon)
  }

  // Hentikan koneksi saat meninggalkan halaman
  const stopTracking = () => {
    if (!import.meta.client) return

    window.removeEventListener('pagehide', sendLeaveBeacon)
    window.removeEventListener('beforeunload', sendLeaveBeacon)

    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }

    if (eventSource) {
      eventSource.close()
      eventSource = null
    }

    isConnected.value = false

    // Kirim sinyal bahwa client telah meninggalkan stream
    sendLeaveBeacon()
  }

  return {
    viewerCount,
    isConnected,
    formatViewerCount,
    startTracking,
    stopTracking
  }
}
