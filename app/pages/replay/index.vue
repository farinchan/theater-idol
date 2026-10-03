<script setup lang="ts">
const { appName } = useAppName()
const { isReplayEnabled, isReplayRequireLogin, isReplayRequirePremium, replayNotice } = useSiteSettings()
const { user, isPremium, isAdmin } = useAppwriteAuth()
const { shows: appwriteShows, fetchShows, isLoading: isShowsLoading } = useAppwriteShow()
const { setlists, fetchSetlists, isLoading: isSetlistsLoading } = useAppwriteSetlist()

useSeoMeta({
  title: 'Katalog Video Replay Pertunjukan Theater Idol',
  ogTitle: 'Katalog Video Replay Pertunjukan Theater Idol Terlengkap',
  description: 'Tonton kembali rekaman pertunjukan Theater Idol favorit Anda kapan saja. Arsip video show lengkap dari berbagai setlist dengan kualitas audio visual HD jernih.',
  ogDescription: 'Tonton kembali rekaman pertunjukan Theater Idol favorit Anda kapan saja. Arsip video show lengkap dari berbagai setlist dengan kualitas audio visual HD jernih.',
  ogImage: '/icon.png',
  ogType: 'video.other',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Katalog Video Replay Pertunjukan Theater Idol Terlengkap',
  twitterDescription: 'Tonton kembali rekaman pertunjukan Theater Idol favorit Anda kapan saja. Arsip video show lengkap dari berbagai setlist dengan kualitas audio visual HD jernih.',
  twitterImage: '/icon.png'
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': 'Katalog Video Replay Theater Idol',
        'description': 'Koleksi arsip rekaman video pertunjukan Theater Idol',
        'url': 'https://theater-idol.web.id/replay'
      })
    }
  ]
})

// Muat data show & setlist (SSR & Client Hydration)
await useAsyncData('replay_catalog_data', async () => {
  await Promise.all([fetchShows(), fetchSetlists()])
  return true
})

onMounted(() => {
  fetchShows()
  fetchSetlists()
})

// State Filter & Search
const searchQuery = ref('')
const selectedCategory = ref('Semua')

// Helper hitung timestamp dari date & time pertunjukan
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
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes, 0).getTime()
    }
  } catch {}
  return 0
}

// Format Tanggal Indonesia
const formatIndonesianDate = (dateVal?: string): string => {
  if (!dateVal) return '-'
  try {
    const d = new Date(dateVal)
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d)
    }
  } catch {}
  return dateVal
}

// Format Waktu WIB
const formatIndonesianTime = (timeVal?: string, dateVal?: string): string => {
  if (timeVal && timeVal.includes(':')) {
    return `${timeVal.slice(0, 5)} WIB`
  }
  if (dateVal) {
    try {
      const d = new Date(dateVal)
      if (!isNaN(d.getTime())) {
        const h = String(d.getHours()).padStart(2, '0')
        const m = String(d.getMinutes()).padStart(2, '0')
        return `${h}:${m} WIB`
      }
    } catch {}
  }
  return timeVal || '19:00 WIB'
}

// Helper Deteksi YouTube ID
const getYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null
  const trimmed = url.trim()
  const shortMatch = trimmed.match(/^https?:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/i)
  if (shortMatch) return shortMatch[1]
  const fullMatch = trimmed.match(
    /^https?:\/\/(?:www\.|m\.)?youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/)([a-zA-Z0-9_-]{11})/i
  )
  if (fullMatch) return fullMatch[1]
  return null
}

// Ambil semua show yang:
// 1. Sudah lewat (timestamp <= now)
// 2. replay_url terisi dan valid
const replayShows = computed(() => {
  const now = Date.now()

  return appwriteShows.value
    .filter(show => {
      const hasReplayUrl = Boolean(show.replay_url && show.replay_url.trim())
      const ts = getShowTimestamp(show.date, show.time)
      const isPast = ts > 0 && ts <= now
      return isPast && hasReplayUrl
    })
    .map(show => {
      const related = setlists.value.find(
        s => s.$id === show.setlist_id || String(s.id) === String(show.setlist_id)
      )
      const ts = getShowTimestamp(show.date, show.time)
      const lineupList = show.lineup
        ? show.lineup.split(/[\n,]+/).map(m => m.trim()).filter(Boolean)
        : []

      const ytId = getYouTubeVideoId(show.replay_url)
      const ytThumbnail = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : ''
      const mediaType = ytId ? 'YouTube' : (show.replay_url?.toLowerCase().includes('.mp4') ? 'MP4' : 'Video')

      return {
        id: show.$id || String(show.id),
        title: related?.title_id || 'Pertunjukan Teater',
        originalTitle: related?.title_jp || '',
        category: related?.title_id || 'Teater',
        date: formatIndonesianDate(show.date),
        time: formatIndonesianTime(show.time, show.date),
        timestamp: ts,
        description: show.description || (related ? `Rekaman pertunjukan setlist ${related.title_id} yang dibawakan langsung dari panggung teater.` : 'Rekaman arsip pertunjukan panggung teater.'),
        lineup: lineupList,
        poster: related?.image_url || ytThumbnail,
        replay_url: show.replay_url,
        mediaType,
        isYouTube: Boolean(ytId)
      }
    })
    .sort((a, b) => b.timestamp - a.timestamp)
})

// Daftar Kategori Dinamis berdasarkan setlist yang memiliki replay
const categories = computed(() => {
  const cats = new Set<string>()
  cats.add('Semua')
  replayShows.value.forEach(r => {
    if (r.category) cats.add(r.category)
  })
  return Array.from(cats)
})

// Filter pencarian dan kategori
const filteredReplays = computed(() => {
  return replayShows.value.filter(item => {
    const matchesCategory = selectedCategory.value === 'Semua' || item.category === selectedCategory.value
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return matchesCategory

    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      item.originalTitle.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.date.toLowerCase().includes(q) ||
      item.lineup.some(m => m.toLowerCase().includes(q))

    return matchesCategory && matchesSearch
  })
})

// Featured Replay: Replay pertunjukan paling terbaru
const featuredReplay = computed(() => {
  return replayShows.value.length > 0 ? replayShows.value[0] : null
})
</script>

<template>
  <!-- Screen Jika Fitur Replay Dinonaktifkan oleh Admin -->
  <div v-if="!isReplayEnabled" class="p-8 sm:p-16 max-w-2xl mx-auto text-center space-y-6">
    <div class="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
      <UIcon name="i-lucide-play-circle" class="w-8 h-8" />
    </div>
    <div class="space-y-2">
      <UBadge color="warning" variant="subtle" size="xs" class="font-bold">
        FITUR DINONAKTIFKAN SEMENTARA
      </UBadge>
      <h2 class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
        Arsip Replay Sedang Ditutup
      </h2>
      <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        {{ replayNotice }}
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

  <!-- Screen Jika Akses Replay Memerlukan Login -->
  <div v-else-if="(isReplayRequirePremium || isReplayRequireLogin) && !user" class="p-8 sm:p-16 max-w-md mx-auto text-center space-y-6">
    <div class="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-sm">
      <UIcon name="i-lucide-lock" class="w-8 h-8" />
    </div>
    <div class="space-y-2">
      <UBadge color="primary" variant="subtle" size="xs" class="font-bold">
        LOGIN DIPERLUKAN
      </UBadge>
      <h2 class="text-2xl font-black text-neutral-900 dark:text-white">
        Akses Arsip Replay Terbatas
      </h2>
      <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        Katalog dan video rekaman pertunjukan teater hanya dapat diakses oleh pengguna yang telah masuk ke akun. Silakan masuk terlebih dahulu untuk menonton.
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

  <!-- Screen Jika Akses Replay Khusus Member Premium -->
  <div v-else-if="isReplayRequirePremium && !isPremium && !isAdmin" class="p-8 sm:p-16 max-w-md mx-auto text-center space-y-6">
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
        Katalog video rekaman pertunjukan teater ini dikhususkan bagi Member Premium. Aktifkan paket langganan Anda untuk mendapatkan akses menonton seluruh video replay.
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

  <!-- Konten Katalog Replay -->
  <div v-else class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
          <UIcon name="i-lucide-play-circle" class="w-8 h-8 text-primary" />
          Replay & Video Show Teater
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Koleksi rekaman pertunjukan teater resmi untuk ditonton kembali kapan saja.
        </p>
      </div>

      <div class="w-full sm:w-72">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Cari arsip replay..."
          size="sm"
          class="w-full"
        />
      </div>
    </div>

    <!-- Category Pills Filter (Jika ada lebih dari 1 kategori) -->
    <div v-if="categories.length > 1" class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        v-for="cat in categories"
        :key="cat"
        :class="[
          'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
          selectedCategory === cat
            ? 'bg-primary text-white shadow-sm shadow-primary/30 font-bold'
            : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-primary/50 hover:text-primary'
        ]"
        @click="selectedCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isShowsLoading && replayShows.length === 0" class="py-16 text-center space-y-3">
      <div class="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin mx-auto" />
      <p class="text-sm font-medium text-neutral-500">Memuat koleksi replay teater...</p>
    </div>

    <!-- Empty State: Belum ada show yang selesai dengan replay_url -->
    <div
      v-else-if="replayShows.length === 0"
      class="p-10 sm:p-14 text-center rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-4 max-w-2xl mx-auto"
    >
      <div class="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-video-off" class="w-7 h-7" />
      </div>
      <div class="space-y-1.5">
        <h3 class="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
          Belum Ada Video Replay Tersedia
        </h3>
        <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Pertunjukan teater yang telah selesai dan memiliki rekaman stream akan otomatis muncul pada halaman ini.
        </p>
      </div>
      <div class="pt-2">
        <UButton
          to="/jadwal"
          color="primary"
          variant="solid"
          size="md"
          icon="i-lucide-calendar-days"
          label="Lihat Jadwal Pertunjukan Mendatang"
          class="rounded-xl font-bold cursor-pointer shadow-sm shadow-primary/20"
        />
      </div>
    </div>

    <!-- Konten Replay Tersedia -->
    <div v-else class="space-y-8">
      <!-- Featured Replay Hero Banner -->
      <div
        v-if="featuredReplay && selectedCategory === 'Semua' && !searchQuery.trim()"
        class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 via-neutral-900 to-neutral-950 border border-neutral-800 p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div class="max-w-xl space-y-4">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-white border border-primary/40">
            <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5 text-primary" />
            Replay Terbaru Teater
          </div>
          <div>
            <h2 class="text-2xl sm:text-3xl font-black leading-tight">
              {{ featuredReplay.title }}
            </h2>
            <p v-if="featuredReplay.originalTitle" class="text-xs text-neutral-400 mt-0.5">
              {{ featuredReplay.originalTitle }}
            </p>
          </div>
          <p class="text-neutral-300 text-xs sm:text-sm leading-relaxed line-clamp-3">
            {{ featuredReplay.description }}
          </p>
          <div class="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
            <span class="flex items-center gap-1.5">
              <UIcon name="i-lucide-calendar" class="w-4 h-4 text-primary" />
              {{ featuredReplay.date }}
            </span>
            <span>&bull;</span>
            <span class="flex items-center gap-1.5">
              <UIcon name="i-lucide-clock" class="w-4 h-4 text-primary" />
              {{ featuredReplay.time }}
            </span>
          </div>
        </div>

        <div class="flex-shrink-0 w-full sm:w-auto">
          <UButton
            :to="`/replay/${featuredReplay.id}`"
            color="primary"
            size="lg"
            icon="i-lucide-play"
            label="Putar Show Sekarang"
            class="shadow-lg shadow-primary/40 font-bold w-full sm:w-auto cursor-pointer"
          />
        </div>
      </div>

      <!-- No Filtered Results State -->
      <div v-if="filteredReplays.length === 0" class="py-12 text-center space-y-2">
        <UIcon name="i-lucide-search-x" class="w-10 h-10 text-neutral-400 mx-auto" />
        <h4 class="font-bold text-sm text-neutral-800 dark:text-neutral-200">Tidak ada replay yang sesuai</h4>
        <p class="text-xs text-neutral-500">Coba ubah kata kunci pencarian atau kategori filter.</p>
      </div>

      <!-- Replays Catalog Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard
          v-for="item in filteredReplays"
          :key="item.id"
          class="hover:border-primary/50 transition-all duration-200 overflow-hidden flex flex-col justify-between group"
        >
          <template #header>
            <!-- Thumbnail Box -->
            <NuxtLink
              :to="`/replay/${item.id}`"
              class="relative -mx-6 -mt-6 h-48 bg-neutral-900 overflow-hidden flex items-center justify-center block cursor-pointer group/thumb"
            >
              <!-- Poster Image -->
              <img
                v-if="item.poster"
                :src="item.poster"
                :alt="item.title"
                class="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300 opacity-90"
              />
              <div
                v-else
                class="w-full h-full bg-gradient-to-br from-red-950 via-neutral-900 to-neutral-950 flex items-center justify-center"
              >
                <UIcon name="i-lucide-music-4" class="w-12 h-12 text-neutral-600" />
              </div>

              <!-- Overlay Gradient -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <!-- Play Button Center Hover -->
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover/thumb:scale-110 group-hover/thumb:bg-primary transition-all shadow-xl">
                  <UIcon name="i-lucide-play" class="w-7 h-7 ml-0.5 text-white" />
                </div>
              </div>

              <!-- Bottom Badges -->
              <div class="absolute bottom-2.5 left-3 flex items-center text-[11px] font-mono">
                <span class="bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded text-neutral-200 flex items-center gap-1 font-semibold">
                  <UIcon name="i-lucide-clock" class="w-3 h-3 text-primary" />
                  {{ item.time }}
                </span>
              </div>
            </NuxtLink>
          </template>

          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span class="flex items-center gap-1 font-medium">
                <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5 text-primary" />
                {{ item.date }}
              </span>
              <span class="text-[10px] uppercase font-bold text-neutral-400">
                Teater
              </span>
            </div>

            <div>
              <NuxtLink :to="`/replay/${item.id}`">
                <h3 class="font-bold text-base text-neutral-900 dark:text-white leading-snug group-hover:text-primary transition-colors cursor-pointer line-clamp-1">
                  {{ item.title }}
                </h3>
              </NuxtLink>
              <p v-if="item.originalTitle" class="text-[11px] text-neutral-400 italic line-clamp-1 mt-0.5">
                {{ item.originalTitle }}
              </p>
            </div>

            <p class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
              {{ item.description }}
            </p>

            <!-- Lineup Member Chips -->
            <div v-if="item.lineup.length > 0" class="flex flex-wrap gap-1 pt-1">
              <span
                v-for="mem in item.lineup.slice(0, 4)"
                :key="mem"
                class="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium text-neutral-600 dark:text-neutral-300"
              >
                {{ mem }}
              </span>
              <span v-if="item.lineup.length > 4" class="px-1.5 py-0.5 text-[10px] text-neutral-400">
                +{{ item.lineup.length - 4 }} lagi
              </span>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
