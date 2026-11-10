<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { showService } from '~/services/show-service'
import type { ShowListItem } from '~/types/show'

const { state } = useAuth()
const user = computed(() => state.user)
const isAdmin = computed(() => state.isAdmin)
const isPremium = computed(() => state.isPremium)

const isReplayEnabled = ref(true)
const isReplayRequireLogin = ref(false)
const isReplayRequirePremium = ref(false)
const replayNotice = ref('Fitur Replay sedang ditutup.')

const isShowsLoading = ref(true)
const shows = ref<ShowListItem[]>([])

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

const loadData = async () => {
  isShowsLoading.value = true
  try {
    const res = await showService.getAll(1, 100)
    if (res?.data) {
      shows.value = res.data
      isReplayEnabled.value = true
    }
  } catch (err: any) {
    if (err?.response?.status === 403) {
      isReplayEnabled.value = false
      replayNotice.value = err?.response?.data?.message || 'Fitur pertunjukan sedang dinonaktifkan sementara.'
    }
  } finally {
    isShowsLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

// Ambil semua show yang sudah lewat
const replayShows = computed(() => {
  const now = Date.now()

  return shows.value
    .filter(show => {
      const ts = getShowTimestamp(show.date, show.time)
      return ts === 0 || ts <= now
    })
    .map(show => {
      const ts = getShowTimestamp(show.date, show.time)
      const lineupList = show.lineup
        ? show.lineup.split(/[\n,]+/).map(m => m.trim()).filter(Boolean)
        : []

      return {
        id: String(show.id),
        title: show.setlist?.title_id || 'Pertunjukan Teater',
        originalTitle: show.setlist?.title_jp || '',
        category: show.setlist?.title_id || 'Teater',
        date: formatIndonesianDate(show.date),
        time: formatIndonesianTime(show.time, show.date),
        timestamp: ts,
        description: show.description || (show.setlist ? `Rekaman pertunjukan setlist ${show.setlist.title_id} yang dibawakan langsung dari panggung teater.` : 'Rekaman arsip pertunjukan panggung teater.'),
        lineup: lineupList,
        poster: resolveMediaUrl(show.setlist?.image),
        mediaType: 'Video'
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
    if (!matchesCategory) return false

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      const matchesTitle = item.title.toLowerCase().includes(q)
      const matchesOrig = item.originalTitle?.toLowerCase().includes(q)
      const matchesDesc = item.description?.toLowerCase().includes(q)
      const matchesLineup = item.lineup.some(m => m.toLowerCase().includes(q))
      return matchesTitle || matchesOrig || matchesDesc || matchesLineup
    }

    return true
  })
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
        Akses Video Replay Terbatas
      </h2>
      <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        Video rekaman pertunjukan teater hanya dapat disaksikan oleh pengguna yang telah masuk ke akun. Silakan masuk terlebih dahulu untuk menonton.
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
        Video rekaman pertunjukan teater ini dikhususkan bagi Member Premium. Aktifkan paket langganan Anda untuk mendapatkan akses menonton seluruh video replay.
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

  <!-- Normal Content -->
  <div v-else class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3 text-neutral-900 dark:text-white">
          <UIcon name="i-lucide-play-circle" class="w-8 h-8 text-primary" />
          Katalog Video Replay
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Koleksi arsip rekaman video pertunjukan teater idol lengkap dengan kualitas audio visual HD jernih.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          to="/jadwal"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-calendar"
          label="Lihat Jadwal Show"
          class="rounded-xl font-bold cursor-pointer hover:border-primary/50"
        />
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="relative w-full sm:w-80">
        <UIcon name="i-lucide-search" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari setlist, lagu, atau member..."
          class="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 focus:outline-none focus:border-primary text-neutral-900 dark:text-white placeholder-neutral-400 transition-colors"
        />
      </div>

      <!-- Categories Pills -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
            selectedCategory === cat
              ? 'bg-primary text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200/60 dark:border-neutral-700/60'
          ]"
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isShowsLoading" class="p-12 text-center space-y-3">
      <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
      <p class="text-xs text-neutral-500">Memuat katalog video replay...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredReplays.length === 0"
      class="p-12 text-center rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3"
    >
      <div class="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-video-off" class="w-6 h-6" />
      </div>
      <h3 class="font-bold text-neutral-900 dark:text-white text-base">Tidak Ada Video Replay Ditemukan</h3>
      <p class="text-xs text-neutral-500 max-w-sm mx-auto">
        Belum ada rekaman show yang tersedia untuk pencarian atau kategori ini.
      </p>
    </div>

    <!-- Video Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="item in filteredReplays"
        :key="item.id"
        :to="`/replay/${item.id}`"
        class="group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 shadow-xs hover:shadow-md transition-all cursor-pointer"
      >
        <!-- Poster / Thumbnail (Rasio 16:9) -->
        <div class="aspect-video w-full relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <img
            v-if="item.poster"
            :src="item.poster"
            :alt="item.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div v-else class="w-full h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 gap-1.5 p-4 text-center">
            <UIcon name="i-lucide-play-circle" class="w-10 h-10 text-primary/60" />
            <span class="text-xs font-bold">{{ item.title }}</span>
          </div>

          <!-- Play button overlay -->
          <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              <UIcon name="i-lucide-play" class="w-6 h-6 ml-0.5" />
            </div>
          </div>
        </div>

        <!-- Meta Content -->
        <div class="p-4 space-y-2 flex-1 flex flex-col justify-between">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500">
              <UIcon name="i-lucide-calendar-days" class="w-3.5 h-3.5 text-primary" />
              <span>{{ item.date }}</span>
              <span>&bull;</span>
              <span>{{ item.time }}</span>
            </div>

            <h3 class="font-bold text-neutral-900 dark:text-white text-base group-hover:text-primary transition-colors line-clamp-1">
              {{ item.title }}
            </h3>
            <p v-if="item.originalTitle" class="text-xs text-neutral-400 italic line-clamp-1">
              {{ item.originalTitle }}
            </p>
            <p class="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1">
              {{ item.description }}
            </p>
          </div>

          <div v-if="item.lineup && item.lineup.length" class="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 flex items-center gap-1">
            <span class="font-semibold text-neutral-400">Lineup:</span>
            <span class="truncate">{{ item.lineup.slice(0, 4).join(', ') }}{{ item.lineup.length > 4 ? ` +${item.lineup.length - 4}` : '' }}</span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
