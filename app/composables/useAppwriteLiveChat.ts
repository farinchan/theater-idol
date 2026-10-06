import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { client, account, tablesDB, databases, ID, Query } from '~/appwrite'
import { useAppwriteAuth } from '~/composables/useAppwriteAuth'

export interface ChatMessage {
  $id?: string
  id: string | number
  user_id?: string
  user_name: string
  user_avatar?: string
  is_admin?: boolean
  message: string
  show_id?: string
  time: string
  $createdAt?: string
  isOptimistic?: boolean
}

// Helper memformat timestamp UTC ke waktu lokal masing-masing pengguna (format jam:menit)
export const formatChatTime = (timeVal?: string, createdAtVal?: string): string => {
  // 1. Cek jika timeVal adalah format ISO date time (contoh: 2026-10-06T09:44:00.000Z)
  if (timeVal && timeVal.includes('T') && !isNaN(Date.parse(timeVal))) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date(timeVal))
    } catch {}
  }

  // 2. Jika createdAtVal tersedia dan valid ISO
  if (createdAtVal && !isNaN(Date.parse(createdAtVal))) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date(createdAtVal))
    } catch {}
  }

  // 3. Fallback jika timeVal berupa string waktu sederhana lama ("19:24")
  if (timeVal) {
    return timeVal.trim().slice(0, 5)
  }

  return ''
}

// Helper memformat tanggal dan waktu lengkap lokal untuk tooltip saat hover
export const formatChatDateTime = (timeVal?: string, createdAtVal?: string): string => {
  const target = (timeVal && timeVal.includes('T')) ? timeVal : (createdAtVal || timeVal)
  if (!target) return ''
  try {
    const d = new Date(target)
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(d)
    }
  } catch {}
  return target
}

// Starter seed messages if table is new or offline fallback (dalam format UTC ISO)
const defaultSeedMessages: ChatMessage[] = [
  {
    id: 1,
    user_name: 'Rian_OshiFreya',
    user_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rian&backgroundColor=f43f5e',
    time: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    message: 'Freya center Faint auranya gokil banget malam ini! 🔥',
    is_admin: false
  },
  {
    id: 2,
    user_name: 'WotaJakarta',
    user_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=WotaJakarta&backgroundColor=0284c7',
    time: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    message: 'Koreografi unit song-nya makin sinkron dan rapi!',
    is_admin: false
  },
  {
    id: 3,
    user_name: 'ChristyFansID',
    user_avatar: '',
    time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    message: 'Hai! Hai! Semangat semuanya! ❤️',
    is_admin: false
  },
  {
    id: 4,
    user_name: 'StaffTeater',
    user_avatar: '',
    time: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    message: 'Selamat menikmati pertunjukan teater! Mohon jaga ketertiban di live chat ya.',
    is_admin: true
  }
]

export const useAppwriteLiveChat = () => {
  const config = useRuntimeConfig()
  const dbId = computed(() => (config.public.appwriteDatabaseId as string) || '')
  const tableId = computed(() => (config.public.appwriteTableChatId as string) || 'live_chat')

  const { user, isAdmin } = useAppwriteAuth()
  const isLoggedIn = computed(() => !!user.value)

  // Reactive state
  const messages = useState<ChatMessage[]>('appwrite_live_chat_messages', () => [])
  const isConnected = ref(false)
  const isSubscribed = ref(false)
  const isLoading = ref(false)
  const isSending = ref(false)
  const chatError = ref<string | null>(null)
  const customNickname = ref('')

  // Slow Mode Cooldown & Anti-Spam (Strategi 1 & 4)
  const COOLDOWN_SECONDS = 5
  const cooldownRemaining = ref(0)
  const lastSentTimestamp = ref(0)
  const lastSentMessageText = ref('')
  let cooldownTimer: any = null

  // SWR Cache timestamp (Strategi 2)
  const lastFetchTime = useState<number>('appwrite_chat_last_fetch', () => 0)
  const CACHE_FRESHNESS_MS = 60 * 1000 // 60 detik

  const startCooldown = (duration = COOLDOWN_SECONDS) => {
    cooldownRemaining.value = duration
    if (cooldownTimer) clearInterval(cooldownTimer)
    cooldownTimer = setInterval(() => {
      if (cooldownRemaining.value > 1) {
        cooldownRemaining.value--
      } else {
        cooldownRemaining.value = 0
        if (cooldownTimer) {
          clearInterval(cooldownTimer)
          cooldownTimer = null
        }
      }
    }, 1000)
  }

  let unsubscribeFn: (() => void) | null = null

  // Local storage cache helper
  const getCachedMessages = (): ChatMessage[] => {
    if (!import.meta.client) return []
    try {
      const raw = localStorage.getItem('theater_cached_chat')
      if (raw) return JSON.parse(raw)
    } catch {}
    return []
  }

  const saveCachedMessages = (items: ChatMessage[]) => {
    if (!import.meta.client) return
    try {
      localStorage.setItem('theater_cached_chat', JSON.stringify(items.slice(-50)))
    } catch {}
  }

  // Active sender display name
  const currentSenderName = computed(() => {
    if (user.value?.name) return user.value.name
    if (customNickname.value.trim()) return customNickname.value.trim()
    return 'Wota_Fans'
  })

  // Initialize nickname from localStorage
  const initNickname = () => {
    if (!import.meta.client) return
    const saved = localStorage.getItem('theater_chat_nickname')
    if (saved) {
      customNickname.value = saved
    } else if (!user.value) {
      // Default random fan handle
      const randomDigits = Math.floor(100 + Math.random() * 900)
      const generated = `Wota_${randomDigits}`
      customNickname.value = generated
      localStorage.setItem('theater_chat_nickname', generated)
    }
  }

  const setNickname = (newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) return
    customNickname.value = trimmed
    if (import.meta.client) {
      localStorage.setItem('theater_chat_nickname', trimmed)
    }
  }

  // Fetch initial chat messages (Strategi 2: Limit 25 rows & SWR Cache)
  const fetchMessages = async (force = false) => {
    if (import.meta.client && !customNickname.value) {
      initNickname()
    }

    // SWR Cache: Jangan query database jika pesan sudah ada dan diambil dalam 60s terakhir
    const now = Date.now()
    if (!force && messages.value.length > 0 && now - lastFetchTime.value < CACHE_FRESHNESS_MS) {
      return
    }

    isLoading.value = true
    chatError.value = null

    try {
      let rawItems: any[] = []
      const queries = [
        Query.orderDesc('$createdAt'),
        Query.limit(25)
      ]

      try {
        const res = await tablesDB.listRows(dbId.value, tableId.value, queries)
        rawItems = res.rows || []
      } catch (tableErr: any) {
        try {
          const docRes = await databases.listDocuments(dbId.value, tableId.value, queries)
          rawItems = docRes.documents || []
        } catch {
          // If collection doesn't exist yet on Appwrite Cloud
          throw tableErr
        }
      }

      if (rawItems.length > 0) {
        const mapped: ChatMessage[] = rawItems.map((row: any) => ({
          $id: row.$id,
          id: row.$id,
          user_id: row.user_id || '',
          user_name: row.user_name || 'Penonton',
          user_avatar: row.user_avatar || '',
          is_admin: !!row.is_admin,
          message: row.message || '',
          show_id: row.show_id || '',
          time: row.time || row.$createdAt || new Date().toISOString(),
          $createdAt: row.$createdAt
        }))

        // Balik urutan agar pesan terlama di atas dan pesan terbaru di bawah
        mapped.reverse()

        messages.value = mapped
        lastFetchTime.value = Date.now()
        saveCachedMessages(mapped)
      } else if (messages.value.length === 0) {
        // Use seed messages if remote is empty
        messages.value = [...defaultSeedMessages]
      }
    } catch (err: any) {
      // Remote collection might not exist yet; gracefully fallback
      console.warn('Appwrite Live Chat fetch fallback:', err?.message)
      const cached = getCachedMessages()
      if (cached.length > 0) {
        messages.value = cached
      } else if (messages.value.length === 0) {
        messages.value = [...defaultSeedMessages]
      }
    } finally {
      isLoading.value = false
    }
  }

  // Subscribe to Appwrite Realtime channel
  const subscribeToChat = () => {
    if (!import.meta.client) return

    // Clean up previous subscription if any
    unsubscribe()

    const channels = [
      `databases.${dbId.value}.collections.${tableId.value}.documents`,
      `tablesdb.${dbId.value}.tables.${tableId.value}.rows`
    ]

    try {
      unsubscribeFn = client.subscribe(channels, (response: any) => {
        isConnected.value = true
        const event = response.events?.[0] || ''
        const payload = response.payload

        if (!payload) return

        // 1. New Message Created Event
        if (event.includes('.create')) {
          const newMsg: ChatMessage = {
            $id: payload.$id,
            id: payload.$id,
            user_id: payload.user_id || '',
            user_name: payload.user_name || 'Penonton',
            user_avatar: payload.user_avatar || '',
            is_admin: !!payload.is_admin,
            message: payload.message || '',
            show_id: payload.show_id || '',
            time: payload.time || payload.$createdAt || new Date().toISOString(),
            $createdAt: payload.$createdAt
          }

          // Check if message is already in list (e.g. from optimistic send)
          const existingIndex = messages.value.findIndex(
            (m) =>
              m.$id === payload.$id ||
              (m.isOptimistic && m.message === newMsg.message && m.user_name === newMsg.user_name)
          )

          if (existingIndex !== -1) {
            // Replace optimistic message with confirmed server message
            messages.value[existingIndex] = newMsg
          } else {
            messages.value.push(newMsg)
          }

          saveCachedMessages(messages.value)
        }

        // 2. Message Deleted Event (Moderation)
        if (event.includes('.delete')) {
          messages.value = messages.value.filter((m) => m.$id !== payload.$id && m.id !== payload.$id)
          saveCachedMessages(messages.value)
        }
      })

      isSubscribed.value = true
      isConnected.value = true
    } catch (subErr: any) {
      console.warn('Realtime subscription error:', subErr)
      isConnected.value = false
    }
  }

  const unsubscribe = () => {
    if (unsubscribeFn) {
      try {
        unsubscribeFn()
      } catch (e) {
        console.warn('Error unsubscribing realtime:', e)
      }
      unsubscribeFn = null
    }
    isSubscribed.value = false
    isConnected.value = false
  }

  // Send a new chant/chat message (Strategi 1, 3, 4 Guardrails)
  const sendMessage = async (text: string, showId?: string, isShowActive = true) => {
    if (!user.value) {
      return { success: false, error: 'Silakan masuk akun terlebih dahulu untuk mengirim chat.' }
    }

    // Strategi 3: Kunci live chat di luar jam show (admin bypass)
    if (!isShowActive && !isAdmin.value) {
      return { success: false, error: 'Live chat ditutup di luar jam siaran pertunjukan.' }
    }

    const trimmed = text.trim()
    if (!trimmed) return { success: false, error: 'Pesan tidak boleh kosong' }

    // Strategi 4: Batasi panjang karakter (maks 150 karakter)
    if (trimmed.length > 150) {
      return { success: false, error: 'Pesan terlalu panjang (maksimal 150 karakter).' }
    }

    // Strategi 1: Slow Mode Cooldown (5 detik untuk penonton biasa)
    if (!isAdmin.value && cooldownRemaining.value > 0) {
      return { success: false, error: `Harap tunggu ${cooldownRemaining.value} detik sebelum mengirim lagi.` }
    }

    // Strategi 4: Anti-Duplikasi Pesan Kembar dalam 30 detik
    const now = Date.now()
    if (
      !isAdmin.value &&
      trimmed.toLowerCase() === lastSentMessageText.value.toLowerCase() &&
      now - lastSentTimestamp.value < 30000
    ) {
      return { success: false, error: 'Pesan sama baru saja dikirim. Hindari pengiriman berulang.' }
    }

    // Record last sent for rate-limit
    lastSentTimestamp.value = now
    lastSentMessageText.value = trimmed
    if (!isAdmin.value) {
      startCooldown(COOLDOWN_SECONDS)
    }

    isSending.value = true
    chatError.value = null

    const senderName = currentSenderName.value
    const senderId = user.value?.$id || ''
    const senderIsAdmin = isAdmin.value
    const senderAvatar = user.value?.prefs?.avatar || ''
    const currentUtcIso = new Date().toISOString()

    // 1. Optimistic Update (Instant feedback in UI)
    const optimisticId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      user_id: senderId,
      user_name: senderName,
      user_avatar: senderAvatar,
      is_admin: senderIsAdmin,
      message: trimmed,
      show_id: showId || '',
      time: currentUtcIso,
      isOptimistic: true,
      $createdAt: currentUtcIso
    }

    messages.value.push(optimisticMsg)
    saveCachedMessages(messages.value)

    // 2. Persist securely via server endpoint (/api/chat/send)
    try {
      const headers: Record<string, string> = {}
      try {
        const jwtRes = await account.createJWT()
        if (jwtRes?.jwt) {
          headers['X-Appwrite-JWT'] = jwtRes.jwt
        }
      } catch {}

      const res = await $fetch<{ success: boolean; message: any }>('/api/chat/send', {
        method: 'POST',
        headers,
        body: {
          message: trimmed,
          show_id: showId || '',
          avatar: senderAvatar
        }
      })

      if (res?.success && res.message) {
        optimisticMsg.$id = res.message.$id
        optimisticMsg.id = res.message.$id
        optimisticMsg.is_admin = !!res.message.is_admin
        optimisticMsg.isOptimistic = false
      }

      saveCachedMessages(messages.value)
      return { success: true, message: optimisticMsg }
    } catch (err: any) {
      console.warn('Chat send error via server API:', err?.message)
      const errorMsg = err?.data?.statusMessage || err?.message || 'Gagal mengirim pesan'
      chatError.value = errorMsg
      // Hapus pesan optimistik jika ditolak oleh server (misal karena rate-limit)
      messages.value = messages.value.filter(m => m.id !== optimisticId)
      saveCachedMessages(messages.value)
      return { success: false, error: errorMsg }
    } finally {
      isSending.value = false
    }
  }

  return {
    messages,
    isConnected,
    isSubscribed,
    isLoading,
    isSending,
    chatError,
    customNickname,
    currentSenderName,
    isLoggedIn,
    user,
    cooldownRemaining,
    cooldownDuration: COOLDOWN_SECONDS,
    initNickname,
    setNickname,
    fetchMessages,
    subscribeToChat,
    unsubscribe,
    sendMessage,
    formatChatTime,
    formatChatDateTime,
    tableId,
    dbId
  }
}
