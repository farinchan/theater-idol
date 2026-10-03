<script setup lang="ts">
const { appName } = useAppName()
const { isStreamEnabled, isReplayEnabled } = useSiteSettings()
const { shows: appwriteShows, fetchShows, isLoading: isShowsLoading } = useAppwriteShow()
const { setlists, fetchSetlists, isLoading: isSetlistsLoading } = useAppwriteSetlist()

useSeoMeta({
  title: 'Beranda - Nonton Live Streaming & Replay Pertunjukan Theater Idol',
  ogTitle: 'Theater Idol - Nonton Live Streaming & Replay Pertunjukan Theater Idol',
  description: 'Nikmati siaran langsung interaktif dan katalog arsip video replay pertunjukan Theater Idol favorit Anda dengan kualitas audio visual HD terbaik.',
  ogDescription: 'Nikmati siaran langsung interaktif dan katalog arsip video replay pertunjukan Theater Idol favorit Anda dengan kualitas audio visual HD terbaik.',
  ogImage: '/icon.png',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Theater Idol - Nonton Live Streaming & Replay Pertunjukan Theater Idol',
  twitterDescription: 'Nikmati siaran langsung interaktif dan katalog arsip video replay pertunjukan Theater Idol favorit Anda dengan kualitas audio visual HD terbaik.',
  twitterImage: '/icon.png'
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': 'https://theater-idol.web.id/#website',
            'url': 'https://theater-idol.web.id/',
            'name': 'Theater Idol',
            'description': 'Platform Nonton Live Streaming & Replay Show Theater Idol.',
            'inLanguage': 'id-ID'
          },
          {
            '@type': 'Organization',
            '@id': 'https://theater-idol.web.id/#organization',
            'name': 'Theater Idol',
            'url': 'https://theater-idol.web.id/',
            'logo': 'https://theater-idol.web.id/icon.png'
          }
        ]
      })
    }
  ]
})

// State waktu reaktif untuk pembaruan realtime status live
const currentTime = ref(Date.now())
let liveTimer: any = null

await useAsyncData('home_catalog_data', async () => {
  await Promise.all([fetchShows(), fetchSetlists()])
  return true
})

onMounted(() => {
  fetchShows()
  fetchSetlists()
  liveTimer = setInterval(() => {
    currentTime.value = Date.now()
  }, 10000)
})

onBeforeUnmount(() => {
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
</script>

<template>
  <div class="flex-1 flex flex-col">
    <!-- Main Content Area -->
    <main class="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
      <!-- 1. Hero Banner: Selamat Datang -->
      <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 text-white p-6 sm:p-10 lg:p-12 border border-neutral-800 shadow-2xl">
        <div class="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary/25 blur-3xl pointer-events-none" />
        <div class="absolute right-1/4 -bottom-20 w-64 h-64 rounded-full bg-primary/15 blur-2xl pointer-events-none" />

        <div class="relative z-10 max-w-2xl space-y-5">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-white border border-primary/40 backdrop-blur-sm">
            <span class="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Portal {{ appName }}
          </div>

          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Selamat Datang di <span class="text-primary underline decoration-primary/40 underline-offset-8">{{ appName }}</span>
          </h1>

          <p class="text-neutral-300 text-sm sm:text-base leading-relaxed">
            Pusat pertunjukan teater idola nomor satu di Indonesia. Tonton siaran langsung lewat <strong>Stream</strong>, nikmati koleksi <strong>Replay</strong> pertunjukan, atau pantau <strong>Jadwal Show</strong> panggung mendatang.
          </p>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <UButton
              v-if="isStreamEnabled"
              to="/stream"
              color="primary"
              size="md"
              icon="i-lucide-radio"
              label="Buka Live Stream"
            />
            <UButton
              to="/jadwal"
              color="neutral"
              variant="outline"
              size="md"
              icon="i-lucide-calendar-days"
              label="Jadwal Panggung"
            />
            <UButton
              v-if="isReplayEnabled"
              to="/replay"
              color="neutral"
              variant="ghost"
              size="md"
              icon="i-lucide-play-circle"
              label="Arsip Replay"
            />
          </div>
        </div>
      </section>

      <!-- 2. Live Stream Spotlight Card -->
      <section
        v-if="isStreamEnabled"
        class="rounded-3xl border transition-all p-6 sm:p-8 shadow-sm"
        :class="activeLiveShow
          ? 'border-primary/40 bg-gradient-to-br from-primary/5 via-white dark:via-neutral-900 to-white dark:to-neutral-900 shadow-primary/5'
          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'"
      >
        <!-- State 1: Ada Live Show Berlangsung (10 menit sebelum s/d 2.5 jam setelah) -->
        <div v-if="activeLiveShow" class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-3 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <UBadge
                :color="activeLiveShow.isLiveNow ? 'primary' : 'warning'"
                variant="solid"
                size="xs"
                class="font-bold animate-pulse"
              >
                {{ activeLiveShow.isLiveNow ? 'SEDANG LIVE SEKARANG' : 'SEGERA DIMULAI' }}
              </UBadge>
              <span class="text-xs font-semibold text-neutral-500 flex items-center gap-1">
                <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-primary" />
                {{ activeLiveShow.time }}
              </span>
              <span class="text-xs text-neutral-400">&bull;</span>
              <span class="text-xs font-semibold text-neutral-500">
                {{ activeLiveShow.date }}
              </span>
            </div>

            <div>
              <h2 class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                {{ activeLiveShow.title }}
              </h2>
              <p v-if="activeLiveShow.originalTitle" class="text-xs text-neutral-400 italic mt-0.5">
                {{ activeLiveShow.originalTitle }}
              </p>
            </div>

            <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
              {{ activeLiveShow.description }}
            </p>

            <!-- Lineup Member -->
            <div v-if="activeLiveShow.lineup.length > 0" class="space-y-1.5 pt-1">
              <div class="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Lineup Tampil:</div>
              <div class="flex flex-wrap items-center gap-1.5">
                <span
                  v-for="m in activeLiveShow.lineup.slice(0, 16)"
                  :key="m"
                  class="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300"
                >
                  {{ m }}
                </span>
                <span v-if="activeLiveShow.lineup.length > 16" class="text-xs text-neutral-400 font-medium">
                  +{{ activeLiveShow.lineup.length - 16 }} member lainnya
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 flex-shrink-0 pt-2 lg:pt-0">
            <UButton
              to="/stream"
              color="primary"
              size="lg"
              icon="i-lucide-play"
              label="Masuk ke Live Stream"
              class="shadow-md shadow-primary/30 font-bold px-6 cursor-pointer"
            />
          </div>
        </div>

        <!-- State 2: Standby / Tidak Ada Show Berlangsung -->
        <div v-else class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <UIcon name="i-lucide-radio" class="w-6 h-6 text-primary" />
            </div>
            <div class="space-y-1 max-w-xl">
              <div class="flex items-center gap-2">
                <UBadge color="neutral" variant="subtle" size="xs" class="font-bold">
                  OFFLINE
                </UBadge>
                <span class="text-xs text-neutral-400">Siaran Teater</span>
              </div>
              <h3 class="font-bold text-lg text-neutral-900 dark:text-white">
                Tidak Ada Pertunjukan Berlangsung Saat Ini
              </h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Live stream otomatis aktif 10 menit sebelum pertunjukan dimulai dan ditayangkan hingga 2 jam 30 menit setelahnya.
              </p>
            </div>
          </div>

          <div v-if="nextUpcomingShow" class="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-800 p-4 rounded-2xl">
            <div class="text-left space-y-0.5">
              <span class="text-[10px] uppercase font-bold text-primary tracking-wider">Jadwal Show Berikutnya</span>
              <div class="font-bold text-sm text-neutral-900 dark:text-white">{{ nextUpcomingShow.title }}</div>
              <div class="text-neutral-500 text-xs">{{ nextUpcomingShow.date }} &bull; {{ nextUpcomingShow.time }}</div>
            </div>
            <UButton
              to="/jadwal"
              color="primary"
              variant="soft"
              size="sm"
              icon="i-lucide-calendar-days"
              label="Lihat Jadwal"
              class="cursor-pointer font-bold flex-shrink-0"
            />
          </div>
          <div v-else class="flex-shrink-0">
            <UButton
              to="/jadwal"
              color="primary"
              variant="outline"
              size="md"
              icon="i-lucide-calendar-days"
              label="Buka Jadwal Panggung"
              class="font-bold cursor-pointer"
            />
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
