/**
 * In-Memory Realtime Stream Viewers Tracker
 * Sesuai instruksi: Data TIDAK disimpan ke database sama sekali,
 * melainkan dikelola murni di memori RAM server (Nitro memory) secara realtime.
 */

interface ViewerClient {
  id: string
  lastSeen: number
}

// In-memory registry: clientId -> ViewerClient
const activeViewers = new Map<string, ViewerClient>()

// In-memory active SSE streams
const activeStreams = new Set<any>()

// Batas toleransi heartbeat sebelum client dianggap disconnect (35 detik)
const VIEWER_TIMEOUT_MS = 35 * 1000

// Hapus viewer yang tidak aktif lebih dari VIEWER_TIMEOUT_MS
export function cleanupStaleViewers(): boolean {
  const now = Date.now()
  let changed = false

  for (const [id, viewer] of activeViewers.entries()) {
    if (now - viewer.lastSeen > VIEWER_TIMEOUT_MS) {
      activeViewers.delete(id)
      changed = true
    }
  }

  return changed
}

// Dapatkan jumlah penonton aktif saat ini
export function getActiveViewerCount(): number {
  cleanupStaleViewers()
  return activeViewers.size
}

// Kirim broadcast update jumlah viewer ke seluruh client SSE yang terhubung
export function broadcastViewerCount() {
  cleanupStaleViewers()
  const count = activeViewers.size
  const payload = JSON.stringify({ viewers: count, timestamp: Date.now() })

  for (const stream of activeStreams) {
    try {
      stream.push({
        event: 'viewers',
        data: payload
      }).catch(() => {
        activeStreams.delete(stream)
      })
    } catch {
      activeStreams.delete(stream)
    }
  }
}

// Catat atau perbarui heartbeat penonton
export function recordViewerHeartbeat(clientId: string): number {
  if (!clientId || typeof clientId !== 'string') return getActiveViewerCount()

  const trimmedId = clientId.trim()
  if (!trimmedId) return getActiveViewerCount()

  const isNew = !activeViewers.has(trimmedId)
  activeViewers.set(trimmedId, {
    id: trimmedId,
    lastSeen: Date.now()
  })

  cleanupStaleViewers()

  if (isNew) {
    broadcastViewerCount()
  }

  return activeViewers.size
}

// Hapus penonton ketika meninggalkan halaman stream
export function removeViewer(clientId: string): number {
  if (!clientId || typeof clientId !== 'string') return getActiveViewerCount()

  const trimmedId = clientId.trim()
  if (activeViewers.has(trimmedId)) {
    activeViewers.delete(trimmedId)
    broadcastViewerCount()
  }

  return activeViewers.size
}

// Daftarkan koneksi Server-Sent Events (SSE)
export function registerViewerStream(stream: any, clientId: string) {
  activeStreams.add(stream)
  if (clientId) {
    recordViewerHeartbeat(clientId)
  }

  stream.onClosed(() => {
    activeStreams.delete(stream)
    if (clientId) {
      removeViewer(clientId)
    }
  })
}
