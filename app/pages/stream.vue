<script setup lang="ts">
import HlsPlayer from '~/components/HlsPlayer.vue'

const config = useRuntimeConfig()
const streamUrl = computed(() => (config.public.streamUrl as string) || '')

const chatInput = ref('')
const liveChatMessages = ref([
  { id: 1, user: 'Rian_OshiFreya', time: '19:24', text: 'Freya center Faint auranya gokil banget malam ini! 🔥' },
  { id: 2, user: 'WotaJakarta', time: '19:25', text: 'Koreografi unit song-nya makin sinkron dan rapi!' },
  { id: 3, user: 'ChristyFansID', time: '19:26', text: 'Hai! Hai! Semangat semuanya member JKT48! ❤️' },
  { id: 4, user: 'TeaterLover', time: '19:27', text: 'Kualitas video 1080p-nya jernih banget, audionya juga bening.' }
])

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
})

onUnmounted(() => {
  if (liveTimer) clearInterval(liveTimer)
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
      description: active.description || (related ? `Pertunjukan setlist ${related.title_id} yang dibawakan langsung dari panggung Teater JKT48.` : 'Pertunjukan panggung teater langsung.'),
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

const sendChatMessage = () => {
  if (!chatInput.value.trim()) return
  liveChatMessages.value.push({
    id: Date.now(),
    user: 'Anda',
    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    text: chatInput.value.trim()
  })
  chatInput.value = ''
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- Stream Page Header -->
    <div class="border-b border-neutral-200 dark:border-neutral-800 pb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
          <UIcon name="i-lucide-radio" class="w-8 h-8 text-primary" />
          Theater Live Stream
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Siaran langsung pertunjukan panggung Teater JKT48 dengan multi-angle HD.
        </p>
      </div>
    </div>

    <!-- Main Live Stream Grid (Player + Chat) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Video Player & Controls Area -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Live Player Component -->
        <HlsPlayer :src="streamUrl" />

        <!-- Show Meta & Description Card (Jika show aktif dalam jendela 10 menit sebelum & 2.5 jam sesudah) -->
        <UCard v-if="activeLiveShow">
          <template #header>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span class="text-xs font-semibold text-primary uppercase tracking-wider">Informasi Pertunjukan</span>
                <h3 class="font-extrabold text-xl text-neutral-900 dark:text-white mt-0.5">
                  {{ activeLiveShow.title }}
                </h3>
                <p v-if="activeLiveShow.originalTitle" class="text-xs text-neutral-500 font-medium">
                  {{ activeLiveShow.originalTitle }}
                </p>
              </div>
              <div class="flex flex-col sm:items-end gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                <div class="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                  <UIcon name="i-lucide-calendar" class="w-4 h-4 text-primary" />
                  <span>{{ activeLiveShow.date }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-primary" />
                  <span>Mulai: {{ activeLiveShow.time }}</span>
                </div>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {{ activeLiveShow.description }}
            </p>

            <!-- Lineup Member Badges -->
            <div v-if="activeLiveShow.lineup.length > 0">
              <div class="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Lineup Tampil Hari Ini ({{ activeLiveShow.lineup.length }} Member)
              </div>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="member in activeLiveShow.lineup"
                  :key="member"
                  class="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-medium hover:bg-primary hover:text-white transition-colors cursor-default"
                >
                  {{ member }}
                </span>
              </div>
            </div>
            <div v-else class="text-xs text-neutral-400 italic">
              Lineup member belum diumumkan atau menyusul.
            </div>
          </div>
        </UCard>

        <!-- No Active Show State Card (Jika di luar jendela waktu show) -->
        <UCard v-else>
          <div class="p-6 text-center space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
              <UIcon name="i-lucide-calendar-clock" class="w-6 h-6 text-primary/70" />
            </div>
            <div>
              <h3 class="font-bold text-base text-neutral-900 dark:text-white">Tidak Ada Pertunjukan Berlangsung Saat Ini</h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-md mx-auto leading-relaxed">
                Informasi pertunjukan teater akan otomatis aktif dan ditampilkan 10 menit sebelum jam panggung dimulai hingga 2 jam 30 menit setelah pertunjukan.
              </p>
            </div>

            <!-- Next scheduled show teaser if available -->
            <div v-if="nextUpcomingShow" class="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-xl">
              <div class="text-left">
                <span class="text-[10px] uppercase font-bold text-primary tracking-wider">Jadwal Show Berikutnya</span>
                <div class="font-bold text-neutral-900 dark:text-white mt-0.5">{{ nextUpcomingShow.title }}</div>
                <div class="text-neutral-500 text-[11px]">{{ nextUpcomingShow.date }} &bull; {{ nextUpcomingShow.time }}</div>
              </div>
              <UButton
                to="/jadwal"
                color="primary"
                variant="soft"
                size="xs"
                icon="i-lucide-calendar-days"
                label="Lihat Jadwal Lengkap"
                class="cursor-pointer font-bold"
              />
            </div>
            <div v-else class="pt-2">
              <UButton
                to="/jadwal"
                color="primary"
                variant="soft"
                size="xs"
                icon="i-lucide-calendar-days"
                label="Lihat Jadwal Teater"
                class="cursor-pointer font-bold"
              />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Live Chat Column -->
      <div class="flex flex-col">
        <!-- Live Chat Card -->
        <UCard class="flex flex-col h-[520px] lg:h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-bold text-sm">
                <UIcon name="i-lucide-messages-square" class="w-4 h-4 text-primary" />
                <span>Live Chat Teater</span>
              </div>
              <UBadge color="primary" variant="subtle" size="xs">Aktif</UBadge>
            </div>
          </template>

          <!-- Chat List -->
          <div class="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            <div
              v-for="msg in liveChatMessages"
              :key="msg.id"
              class="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800"
            >
              <div class="flex items-center justify-between font-semibold mb-1">
                <span class="text-primary font-bold">{{ msg.user }}</span>
                <span class="text-[10px] text-neutral-400">{{ msg.time }}</span>
              </div>
              <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">{{ msg.text }}</p>
            </div>
          </div>

          <template #footer>
            <form class="flex items-center gap-2" @submit.prevent="sendChatMessage">
              <UInput
                v-model="chatInput"
                placeholder="Kirim chant atau pesan..."
                size="sm"
                class="flex-1"
              />
              <UButton
                type="submit"
                color="primary"
                size="sm"
                icon="i-lucide-send"
              />
            </form>
          </template>
        </UCard>
      </div>
    </div>
  </div>
</template>
