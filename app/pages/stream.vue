<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import HlsPlayer from '~/components/HlsPlayer.vue'
import { useAppwriteLiveChat } from '~/composables/useAppwriteLiveChat'
import { useAppwriteAuth } from '~/composables/useAppwriteAuth'
import { useStreamViewers } from '~/composables/useStreamViewers'

const config = useRuntimeConfig()
// Virtual endpoint agar STREAM_URL upstream 100% tersembunyi dari DevTools Network
const streamUrl = computed(() => {
  if (config.public.isStreamConfigured) {
    return (config.public.streamEndpoint as string) || '/api/stream/live.m3u8'
  }
  return ''
})
const { isStreamEnabled, isStreamRequireLogin, isStreamRequirePremium, streamNotice } = useSiteSettings()

// In-Memory Realtime Stream Viewers Tracker (Tanpa Database)
const {
  viewerCount,
  isConnected: isViewerTrackerConnected,
  formatViewerCount,
  startTracking: startViewerTracking,
  stopTracking: stopViewerTracking
} = useStreamViewers()

useSeoMeta({
  title: 'Live Streaming Theater Idol - Nonton Siaran Langsung Online',
  ogTitle: 'Live Streaming Theater Idol - Nonton Siaran Langsung Online',
  description: 'Saksikan siaran langsung pertunjukan Theater Idol secara real-time dengan kualitas streaming HD jernih dan fitur live chat interaktif.',
  ogDescription: 'Saksikan siaran langsung pertunjukan Theater Idol secara real-time dengan kualitas streaming HD jernih dan fitur live chat interaktif.',
  ogImage: '/icon.png',
  ogType: 'video.other',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Live Streaming Theater Idol - Nonton Siaran Langsung Online',
  twitterDescription: 'Saksikan siaran langsung pertunjukan Theater Idol secara real-time dengan kualitas streaming HD jernih dan fitur live chat interaktif.',
  twitterImage: '/icon.png'
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BroadcastEvent',
        'name': 'Live Streaming Theater Idol',
        'description': 'Siaran langsung pertunjukan panggung Theater Idol',
        'isLiveBroadcast': true,
        'videoFormat': 'HD',
        'url': 'https://theater-idol.web.id/stream'
      })
    }
  ]
})

// Realtime Live Chat State
const {
  messages,
  isConnected,
  isSubscribed,
  isLoading: isChatLoading,
  isSending,
  currentSenderName,
  isLoggedIn,
  cooldownRemaining,
  chatError,
  initNickname,
  fetchMessages,
  subscribeToChat,
  unsubscribe: unsubscribeLiveChat,
  sendMessage: sendLiveChatMessage,
  formatChatTime,
  formatChatDateTime
} = useAppwriteLiveChat()

const { user, isAdmin, isPremium } = useAppwriteAuth()

const chatContainerRef = ref<HTMLDivElement | null>(null)
const chatInput = ref('')
const failedAvatarIds = ref(new Set<string | number>())
const onAvatarError = (id: string | number) => {
  failedAvatarIds.value.add(id)
}

// Strategi 3: Kunci live chat di luar jam show (kecuali jika admin)
const isChatLocked = computed(() => {
  if (isAdmin.value) return false
  return !activeLiveShow.value
})

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  })
}

// Auto-scroll saat ada pesan chat baru masuk via Realtime
watch(
  () => messages.value.length,
  () => {
    scrollToBottom()
  }
)

// Hubungkan ke data pertunjukan & setlist dari database Appwrite
const { shows: appwriteShows, fetchShows } = useAppwriteShow()
const { setlists, fetchSetlists } = useAppwriteSetlist()

// Muat data show secara SSR & Hydration
await useAsyncData('stream_active_show_data', async () => {
  await Promise.all([fetchShows(), fetchSetlists()])
  return true
})

// Timer reaktif untuk mendeteksi perubahan status live setiap 30 detik
const currentTime = ref(Date.now())
let liveTimer: any = null

onMounted(() => {
  fetchShows()
  fetchSetlists()
  liveTimer = setInterval(() => {
    currentTime.value = Date.now()
  }, 30000)

  // Inisialisasi Realtime Live Chat
  initNickname()
  fetchMessages().then(() => {
    scrollToBottom()
  })
  subscribeToChat()

  // Inisialisasi Realtime Viewer Counter (Murni In-Memory RAM, Tanpa Database)
  startViewerTracking()
})

onBeforeUnmount(() => {
  if (liveTimer) clearInterval(liveTimer)
  unsubscribeLiveChat()
  stopViewerTracking()
})

// Helper untuk menghitung timestamp pertunjukan dari tanggal dan jam
const getShowTimestamp = (dateVal?: string, timeVal?: string): number => {
  if (!dateVal) return 0
  try {
    const d = new Date(dateVal)
    if (!isNaN(d.getTime())) {
      let hours = 19
      let minutes = 0
      if (timeVal) {
        const match = timeVal.match(/(\d{1,2}):(\d{2})/)
        if (match) {
          hours = parseInt(match[1], 10)
          minutes = parseInt(match[2], 10)
        }
      }
      const year = d.getFullYear()
      const month = d.getMonth()
      const date = d.getDate()
      return new Date(year, month, date, hours, minutes, 0).getTime()
    }
  } catch {}
  return 0
}

// Pertunjukan aktif saat ini:
// Muncul 10 menit sebelum jam show (start - 10 menit)
// Berlangsung hingga 2 jam 30 menit setelah jam show (start + 2.5 jam)
const activeLiveShow = computed(() => {
  const now = currentTime.value
  const TEN_MINUTES = 10 * 60 * 1000
  const TWO_AND_HALF_HOURS = 2.5 * 60 * 60 * 1000

  const active = appwriteShows.value.find(s => {
    const startTs = getShowTimestamp(s.date, s.time)
    if (!startTs) return false
    const windowStart = startTs - TEN_MINUTES
    const windowEnd = startTs + TWO_AND_HALF_HOURS
    return now >= windowStart && now <= windowEnd
  })

  if (active) {
    const related = setlists.value.find(
      set => set.$id === active.setlist_id || String(set.id) === String(active.setlist_id)
    )
    const startTs = getShowTimestamp(active.date, active.time)
    const isLiveNow = now >= startTs

    // Format tanggal Indonesia
    let formattedDate = ''
    try {
      const d = new Date(active.date)
      formattedDate = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      formattedDate = active.date
    }

    // Format jam
    const cleanTime = active.time && active.time.includes(':') ? active.time.slice(0, 5) : (active.time || '19:00')
    const formattedTime = `${cleanTime} WIB`

    // Format lineup member
    let lineupList: string[] = []
    if (active.lineup) {
      lineupList = active.lineup
        .split(/[\n,]+/)
        .map(m => m.trim())
        .filter(Boolean)
    }

    return {
      id: active.$id || active.id,
      title: related?.title_id || 'Pertunjukan Teater',
      originalTitle: related?.title_jp || '',
      date: formattedDate,
      time: formattedTime,
      startTs,
      isLiveNow,
      description: active.description || (related ? `Pertunjukan setlist ${related.title_id} yang dibawakan langsung dari panggung teater.` : 'Pertunjukan panggung teater langsung.'),
      lineup: lineupList,
      poster: related?.image_url || ''
    }
  }

  return null
})

// Show berikutnya yang akan datang (untuk teaser saat offline)
const nextUpcomingShow = computed(() => {
  const now = currentTime.value
  const futureShows = appwriteShows.value
    .filter(s => {
      const ts = getShowTimestamp(s.date, s.time)
      return ts > now
    })
    .sort((a, b) => getShowTimestamp(a.date, a.time) - getShowTimestamp(b.date, b.time))

  if (futureShows.length > 0) {
    const next = futureShows[0]
    const related = setlists.value.find(
      set => set.$id === next.setlist_id || String(set.id) === String(next.setlist_id)
    )
    let formattedDate = ''
    try {
      const d = new Date(next.date)
      formattedDate = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      formattedDate = next.date
    }
    const cleanTime = next.time && next.time.includes(':') ? next.time.slice(0, 5) : (next.time || '19:00')
    return {
      title: related?.title_id || 'Pertunjukan Teater Mendatang',
      date: formattedDate,
      time: `${cleanTime} WIB`
    }
  }
  return null
})

const handleSendMessage = async () => {
  if (!isLoggedIn.value || isChatLocked.value) return
  if (cooldownRemaining.value > 0 || isSending.value) return
  if (!chatInput.value.trim()) return

  const text = chatInput.value
  chatInput.value = ''
  const res = await sendLiveChatMessage(text, activeLiveShow.value?.id, !!activeLiveShow.value)
  if (res.success) {
    scrollToBottom()
  } else {
    chatInput.value = text
  }
}
</script>

<template>
  <!-- Screen Jika Fitur Stream Dinonaktifkan oleh Admin -->
  <div v-if="!isStreamEnabled" class="p-8 sm:p-16 max-w-2xl mx-auto text-center space-y-6">
    <div class="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
      <UIcon name="i-lucide-radio" class="w-8 h-8" />
    </div>
    <div class="space-y-2">
      <UBadge color="warning" variant="subtle" size="xs" class="font-bold">
        FITUR DINONAKTIFKAN SEMENTARA
      </UBadge>
      <h2 class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
        Live Stream Sedang Ditutup
      </h2>
      <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        {{ streamNotice }}
      </p>
    </div>
    <div class="flex items-center justify-center gap-3 pt-2">
      <UButton
        to="/"
        color="primary"
        variant="solid"
        size="md"
        icon="i-lucide-home"
        label="Kembali ke Beranda"
        class="font-bold rounded-xl"
      />
      <UButton
        to="/jadwal"
        color="neutral"
        variant="outline"
        size="md"
        icon="i-lucide-calendar-days"
        label="Lihat Jadwal Show"
        class="font-bold rounded-xl"
      />
    </div>
  </div>

  <!-- Screen Jika Akses Stream Memerlukan Login -->
  <div v-else-if="(isStreamRequirePremium || isStreamRequireLogin) && !user" class="p-8 sm:p-16 max-w-md mx-auto text-center space-y-6">
    <div class="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-sm">
      <UIcon name="i-lucide-lock" class="w-8 h-8" />
    </div>
    <div class="space-y-2">
      <UBadge color="primary" variant="subtle" size="xs" class="font-bold">
        LOGIN DIPERLUKAN
      </UBadge>
      <h2 class="text-2xl font-black text-neutral-900 dark:text-white">
        Akses Live Stream Terbatas
      </h2>
      <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        Live Streaming saat ini hanya dapat disaksikan oleh pengguna yang telah masuk ke akun. Silakan masuk terlebih dahulu untuk menonton.
      </p>
    </div>
    <div class="flex items-center justify-center gap-3 pt-2">
      <UButton
        to="/login"
        color="primary"
        variant="solid"
        size="md"
        icon="i-lucide-log-in"
        label="Masuk ke Akun"
        class="font-bold rounded-xl"
      />
      <UButton
        to="/"
        color="neutral"
        variant="ghost"
        size="md"
        label="Kembali ke Beranda"
        class="font-bold rounded-xl"
      />
    </div>
  </div>

  <!-- Screen Jika Akses Stream Khusus Member Premium -->
  <div v-else-if="isStreamRequirePremium && !isPremium && !isAdmin" class="p-8 sm:p-16 max-w-md mx-auto text-center space-y-6">
    <div class="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
      <UIcon name="i-lucide-crown" class="w-8 h-8" />
    </div>
    <div class="space-y-2">
      <UBadge color="warning" variant="subtle" size="xs" class="font-bold">
        KHUSUS MEMBER PREMIUM
      </UBadge>
      <h2 class="text-2xl font-black text-neutral-900 dark:text-white">
        Fitur Eksklusif Premium
      </h2>
      <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        Siaran Live Stream panggung teater ini dikhususkan bagi Member Premium. Aktifkan paket langganan Anda untuk mendapatkan akses penuh menonton.
      </p>
    </div>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
      <UButton
        to="/pembayaran"
        color="warning"
        variant="solid"
        size="md"
        icon="i-lucide-crown"
        label="Aktifkan Member Premium"
        class="font-bold rounded-xl shadow-md w-full sm:w-auto justify-center"
      />
      <UButton
        to="/"
        color="neutral"
        variant="ghost"
        size="md"
        label="Kembali ke Beranda"
        class="font-bold rounded-xl w-full sm:w-auto justify-center"
      />
    </div>
  </div>

  <!-- Konten Utama Live Stream -->
  <div v-else class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- Stream Page Header -->
    <div class="border-b border-neutral-200 dark:border-neutral-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
          <UIcon name="i-lucide-radio" class="w-8 h-8 text-primary" />
          Theater Live Stream
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Siaran langsung pertunjukan panggung teater dengan multi-angle HD.
        </p>
      </div>

      <!-- Realtime Viewers & Live Indicators -->
      <div class="flex items-center gap-2.5 self-start sm:self-auto">
        <!-- Live Status Pill -->
        <div
          v-if="activeLiveShow"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold shadow-xs"
        >
          <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>LIVE SEKARANG</span>
        </div>

        <!-- Realtime Viewer Counter Badge -->
        <div
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700/70 text-xs font-bold text-neutral-800 dark:text-neutral-100 shadow-xs"
          :title="`${viewerCount} penonton sedang aktif menyaksikan siaran ini secara realtime`"
        >
          <div class="relative flex items-center justify-center">
            <UIcon name="i-lucide-eye" class="w-4 h-4 text-primary" />
            <span
              v-if="isViewerTrackerConnected"
              class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"
            />
          </div>
          <span class="tabular-nums font-black">{{ formatViewerCount(viewerCount) }}</span>
          <span class="text-neutral-500 dark:text-neutral-400 font-medium text-[11px]">Penonton</span>
        </div>
      </div>
    </div>

    <!-- Main Live Stream Grid (Player + Chat) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Video Player Component -->
      <div class="lg:col-span-2">
        <HlsPlayer :src="streamUrl" />
      </div>

      <!-- Live Chat Column -->
      <div class="flex flex-col h-[420px] sm:h-[450px] lg:h-[450px]">
        <!-- Live Chat Card -->
        <UCard
          class="flex flex-col h-full"
          :ui="{
            root: 'flex flex-col h-full',
            header: 'p-3.5 sm:p-4 flex-shrink-0 border-b border-neutral-100 dark:border-neutral-800',
            body: 'flex-1 flex flex-col min-h-0 p-3 sm:p-4 overflow-hidden',
            footer: 'mt-auto p-3 sm:p-4 border-t border-neutral-100 dark:border-neutral-800 flex-shrink-0'
          }"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-messages-square" class="w-4 h-4 text-primary" />
                <span class="font-bold text-sm">Live Chat</span>

                <!-- Realtime Viewers Pill in Chat Header -->
                <UBadge
                  color="neutral"
                  variant="subtle"
                  size="xs"
                  class="font-bold tabular-nums flex items-center gap-1 text-[10px]"
                  :title="`${viewerCount} penonton online`"
                >
                  <UIcon name="i-lucide-eye" class="w-3 h-3 text-primary" />
                  <span>{{ formatViewerCount(viewerCount) }}</span>
                </UBadge>
              </div>

              <!-- Realtime Connection Status & User Display (Read-Only) -->
              <div class="flex items-center gap-2">
                <UBadge
                  :color="isConnected ? 'success' : 'neutral'"
                  variant="subtle"
                  size="xs"
                  class="flex items-center gap-1.5 font-bold"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'"
                  />
                  <span>{{ isConnected ? 'Realtime' : 'Menghubungkan' }}</span>
                </UBadge>

                <!-- Sender Name / Login Status -->
                <div
                  v-if="isLoggedIn"
                  class="flex items-center gap-1.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md"
                  :title="`Pengirim: ${currentSenderName}`"
                >
                  <img
                    v-if="user?.prefs?.avatar"
                    :src="user.prefs.avatar"
                    :alt="currentSenderName"
                    class="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                  />
                  <UIcon v-else name="i-lucide-user" class="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span class="max-w-[90px] truncate">{{ currentSenderName }}</span>
                </div>
                <UButton
                  v-else
                  to="/login"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  icon="i-lucide-log-in"
                  label="Masuk"
                  class="text-[11px] font-bold cursor-pointer"
                />
              </div>
            </div>
          </template>

          <!-- Chat List Container -->
          <div
            ref="chatContainerRef"
            class="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs scroll-smooth"
          >
            <!-- Loading indicator -->
            <div v-if="isChatLoading && messages.length === 0" class="py-8 text-center text-neutral-400 space-y-2">
              <UIcon name="i-lucide-loader-2" class="w-5 h-5 mx-auto animate-spin text-primary" />
              <p class="text-[11px]">Menghubungkan ke live chat...</p>
            </div>

            <!-- Messages list -->
            <div
              v-for="msg in messages"
              :key="msg.$id || msg.id"
              :class="[
                'p-2.5 rounded-xl border transition-all text-xs',
                msg.user_name === currentSenderName
                  ? 'bg-primary/5 dark:bg-primary/10 border-primary/20 ml-2'
                  : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-100 dark:border-neutral-800 mr-2'
              ]"
            >
              <div class="flex items-center justify-between font-semibold mb-1 gap-2">
                <div class="flex items-center gap-1.5 min-w-0">
                  <!-- User Avatar Image atau Inisial Depan -->
                  <div
                    class="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0 overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
                    :class="msg.is_admin ? 'bg-amber-500 text-white' : msg.user_name === currentSenderName ? 'bg-primary text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'"
                  >
                    <img
                      v-if="msg.user_avatar && !failedAvatarIds.has(msg.$id || msg.id)"
                      :src="msg.user_avatar"
                      :alt="msg.user_name"
                      class="w-full h-full object-cover"
                      loading="lazy"
                      @error="onAvatarError(msg.$id || msg.id)"
                    />
                    <span v-else>
                      {{ (msg.user_name || 'W').charAt(0).toUpperCase() }}
                    </span>
                  </div>

                  <span
                    :class="[
                      'truncate font-bold text-[11px]',
                      msg.is_admin ? 'text-amber-500' : msg.user_name === currentSenderName ? 'text-primary' : 'text-neutral-800 dark:text-neutral-200'
                    ]"
                  >
                    {{ msg.user_name }}
                  </span>

                  <!-- Staff/Admin badge -->
                  <span
                    v-if="msg.is_admin"
                    class="text-[9px] font-bold bg-amber-500/20 text-amber-500 px-1.5 py-0.2 rounded font-mono uppercase"
                  >
                    STAFF
                  </span>

                  <!-- Anda badge -->
                  <span
                    v-else-if="msg.user_name === currentSenderName"
                    class="text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.2 rounded"
                  >
                    Anda
                  </span>
                </div>

                <div class="flex items-center gap-1 text-[10px] text-neutral-400 flex-shrink-0">
                  <span :title="formatChatDateTime(msg.time, msg.$createdAt)">{{ formatChatTime(msg.time, msg.$createdAt) }}</span>
                  <UIcon
                    v-if="msg.isOptimistic"
                    name="i-lucide-clock"
                    class="w-3 h-3 text-neutral-400 animate-spin"
                    title="Mengirim..."
                  />
                </div>
              </div>

              <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed break-words pl-5.5">
                {{ msg.message }}
              </p>
            </div>
          </div>

          <template #footer>
            <!-- Jika belum login: Prompt masuk akun -->
            <div
              v-if="!isLoggedIn"
              class="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60"
            >
              <div class="flex items-center gap-2 min-w-0">
                <UIcon name="i-lucide-lock" class="w-4 h-4 text-primary flex-shrink-0" />
                <span class="text-xs text-neutral-600 dark:text-neutral-300 font-medium truncate">
                  Masuk untuk kirim chat
                </span>
              </div>
              <UButton
                to="/login"
                color="primary"
                size="xs"
                icon="i-lucide-log-in"
                label="Masuk"
                class="cursor-pointer font-bold flex-shrink-0"
              />
            </div>

            <!-- Strategi 3: Jika di luar jam pertunjukan: Chat terkunci (kecuali admin) -->
            <div
              v-else-if="isChatLocked"
              class="flex items-center gap-2 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 text-xs text-neutral-600 dark:text-neutral-400"
            >
              <UIcon name="i-lucide-clock" class="w-4 h-4 text-primary flex-shrink-0" />
              <span class="truncate">Live chat dibuka saat pertunjukan teater berlangsung</span>
            </div>

            <!-- Strategi 1 & 4: Form kirim pesan chat dengan slow mode & batas karakter -->
            <div v-else class="space-y-1.5 w-full">
              <div v-if="chatError" class="text-[11px] text-red-500 font-medium px-1 flex items-center gap-1">
                <UIcon name="i-lucide-alert-circle" class="w-3.5 h-3.5 flex-shrink-0" />
                <span>{{ chatError }}</span>
              </div>

              <form class="flex items-center gap-2" @submit.prevent="handleSendMessage">
                <div class="relative flex-1">
                  <UInput
                    v-model="chatInput"
                    :placeholder="cooldownRemaining > 0 ? `Slow mode: tunggu ${cooldownRemaining}s...` : 'Tulis pesan live chat (maks 150)...'"
                    size="sm"
                    class="w-full"
                    :maxlength="150"
                    :disabled="isSending || cooldownRemaining > 0"
                    @keyup.enter="handleSendMessage"
                  />
                  <span
                    v-if="chatInput.length > 100"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-neutral-400 pointer-events-none"
                  >
                    {{ chatInput.length }}/150
                  </span>
                </div>
                <UButton
                  type="submit"
                  :color="cooldownRemaining > 0 ? 'neutral' : 'primary'"
                  :variant="cooldownRemaining > 0 ? 'soft' : 'solid'"
                  size="sm"
                  :icon="cooldownRemaining > 0 ? 'i-lucide-timer' : 'i-lucide-send'"
                  :label="cooldownRemaining > 0 ? `${cooldownRemaining}s` : ''"
                  :disabled="cooldownRemaining > 0 || isSending || !chatInput.trim()"
                  :loading="isSending"
                  class="cursor-pointer font-bold flex-shrink-0"
                  :title="cooldownRemaining > 0 ? `Tunggu ${cooldownRemaining} detik` : 'Kirim pesan'"
                />
              </form>
            </div>
          </template>
        </UCard>
      </div>
    </div>

    <!-- Full Row: Informasi Pertunjukan (Tanpa Card) -->
    <div class="pt-6 border-t border-neutral-200/80 dark:border-neutral-800/80">
      <!-- State 1: Show Aktif -->
      <div v-if="activeLiveShow" class="space-y-6">
        <!-- Header Info Row -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-primary uppercase tracking-wider">
                Informasi Pertunjukan
              </span>
              <span class="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <span class="text-xs text-neutral-500 font-medium">Teater</span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {{ activeLiveShow.title }}
            </h2>
            <p v-if="activeLiveShow.originalTitle" class="text-xs text-neutral-500 font-medium">
              {{ activeLiveShow.originalTitle }}
            </p>
          </div>

          <!-- Schedule Pills -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <UIcon name="i-lucide-calendar" class="w-4 h-4 text-primary" />
              <span>{{ activeLiveShow.date }}</span>
            </div>
            <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <UIcon name="i-lucide-clock" class="w-4 h-4 text-primary" />
              <span>Mulai: {{ activeLiveShow.time }}</span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <p class="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-4xl">
          {{ activeLiveShow.description }}
        </p>

        <!-- Lineup Member Section -->
        <div class="space-y-3 pt-2">
          <div class="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            <UIcon name="i-lucide-users" class="w-4 h-4 text-primary" />
            <span>Lineup Member Tampil Hari Ini</span>
            <span v-if="activeLiveShow.lineup.length > 0" class="text-[11px] font-normal text-neutral-500">
              ({{ activeLiveShow.lineup.length }} Member)
            </span>
          </div>

          <div v-if="activeLiveShow.lineup.length > 0" class="flex flex-wrap gap-2">
            <span
              v-for="member in activeLiveShow.lineup"
              :key="member"
              class="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/90 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-primary hover:text-white transition-colors cursor-default"
            >
              {{ member }}
            </span>
          </div>
          <div v-else class="text-xs text-neutral-400 italic">
            Lineup member belum diumumkan atau menyusul.
          </div>
        </div>
      </div>

      <!-- State 2: Tidak Ada Show Aktif (Full Row, Tanpa Card) -->
      <div v-else class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 py-2">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <UIcon name="i-lucide-calendar-clock" class="w-6 h-6 text-primary" />
            </div>
            <div class="space-y-1 max-w-xl">
              <h3 class="font-bold text-lg text-neutral-900 dark:text-white">
                Tidak Ada Pertunjukan Berlangsung Saat Ini
              </h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Informasi pertunjukan teater akan otomatis aktif dan ditampilkan 10 menit sebelum jam panggung dimulai hingga 2 jam 30 menit setelah pertunjukan.
              </p>
            </div>
          </div>

          <!-- Next Show Teaser Box or Jadwal Button -->
          <div v-if="nextUpcomingShow" class="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/60 dark:border-neutral-800 p-3.5 rounded-2xl">
            <div class="text-left">
              <span class="text-[10px] uppercase font-bold text-primary tracking-wider">Jadwal Show Berikutnya</span>
              <div class="font-bold text-sm text-neutral-900 dark:text-white mt-0.5">{{ nextUpcomingShow.title }}</div>
              <div class="text-neutral-500 text-xs">{{ nextUpcomingShow.date }} &bull; {{ nextUpcomingShow.time }}</div>
            </div>
            <UButton
              to="/jadwal"
              color="primary"
              variant="soft"
              size="xs"
              icon="i-lucide-calendar-days"
              label="Lihat Jadwal Lengkap"
              class="cursor-pointer font-bold flex-shrink-0"
            />
          </div>
          <div v-else>
            <UButton
              to="/jadwal"
              color="primary"
              variant="soft"
              size="sm"
              icon="i-lucide-calendar-days"
              label="Lihat Jadwal Teater"
              class="cursor-pointer font-bold"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
