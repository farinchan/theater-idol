<script setup lang="ts">
// Hubungkan ke database untuk jadwal show & setlist yang dinamis
const { shows: appwriteShows, fetchShows, isLoading: isShowsLoading } = useAppwriteShow()
const { setlists, fetchSetlists } = useAppwriteSetlist()

useSeoMeta({
  title: 'Riwayat Show Theater Idol Sebelumnya',
  ogTitle: 'Riwayat Show Theater Idol Sebelumnya',
  description: 'Arsip riwayat pertunjukan show Theater Idol yang telah selesai digelar beserta info line-up member penampil dan setlist.',
  ogDescription: 'Arsip riwayat pertunjukan show Theater Idol yang telah selesai digelar beserta info line-up member penampil dan setlist.',
  ogImage: '/icon.png',
  ogType: 'website'
})

// Ambil data jadwal show & setlist dari database tablesDB (SSR & Client Hydration)
await useAsyncData('riwayat_page_data', async () => {
  await Promise.all([fetchShows(), fetchSetlists()])
  return true
})

onMounted(() => {
  fetchShows()
  fetchSetlists()
})

// Filter & Pencarian
const searchQuery = ref('')
const selectedMonth = ref('Semua')


// Helper formatters
const getFullFormattedDate = (dateVal?: string): string => {
  if (!dateVal) return '-'
  try {
    const d = new Date(dateVal)
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d)
    }
  } catch {}
  return dateVal
}

const getFormattedTime = (timeVal?: string, dateVal?: string): string => {
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

// Data arsip riwayat pertunjukan yang telah selesai diselenggarakan
const archiveSchedules = [
  {
    id: 'hist-1',
    title: 'Cara Meminum Ramune - Senshuraku Final Show',
    originalTitle: 'Ramune no Nomikata',
    date: '2026-09-21T12:00:00.000Z',
    time: '19:00 WIB',
    month: 'September 2026',
    description: 'Pertunjukan penutup megah dan emosional setlist Ramune no Nomikata yang dibawakan serentak oleh seluruh formasi member panggung utama.',
    lineup: [
      'Freya Jayawardana', 'Angelina Christy', 'Shania Gracia', 'Azizi Asadel',
      'Marsha Lenathea', 'Feni Fitriyanti', 'Gita Sekar', 'Mutiara Azzahra',
      'Kathrina Irene', 'Jessi', 'Lulu Salsabila', 'Indah Cahya',
      'Adel Reva', 'Ella', 'Flora Shafiq', 'Oniel'
    ],
    poster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    type: 'Senshuraku'
  },
  {
    id: 'hist-2',
    title: 'Tunas di Balik Kaca - Shonichi Premiere',
    originalTitle: 'Kizuna wa Kimi no Tame ni',
    date: '2026-09-14T12:00:00.000Z',
    time: '19:00 WIB',
    month: 'September 2026',
    description: 'Panggung premiere pembuka membawakan formasi koreografi dan aransemen teater baru dengan antusiasme chant penonton.',
    lineup: [
      'Adel Reva', 'Ella', 'Lulu Salsabila', 'Indah Cahya',
      'Kathrina Irene', 'Jessi', 'Flora Shafiq', 'Oniel',
      'Freya Jayawardana', 'Christy', 'Gracia', 'Marsha'
    ],
    poster: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    type: 'Shonichi'
  },
  {
    id: 'hist-3',
    title: 'Aturan Anti Cinta - Special 12th Anniversary Stage',
    originalTitle: 'Renai Kinshi Jourei',
    date: '2026-08-24T12:00:00.000Z',
    time: '19:00 WIB',
    month: 'Agustus 2026',
    description: 'Pementasan perayaan ulang tahun panggung teater dengan aransemen orkestrasi panggung megah dan bintang tamu spesial.',
    lineup: [
      'Shania Gracia', 'Feni Fitriyanti', 'Gita Sekar', 'Freya Jayawardana',
      'Angelina Christy', 'Marsha Lenathea', 'Mutiara Azzahra', 'Zee'
    ],
    poster: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    type: 'Anniversary'
  },
  {
    id: 'hist-4',
    title: 'Seitansai Freya Jayawardana - Special Birthday Show',
    originalTitle: 'Renai Kinshi Jourei',
    date: '2026-08-15T12:00:00.000Z',
    time: '19:00 WIB',
    month: 'Agustus 2026',
    description: 'Pertunjukan spesial perayaan ulang tahun Freya Jayawardana dengan surat cinta dari member dan chant spesial penonton.',
    lineup: [
      'Freya Jayawardana', 'Angelina Christy', 'Shania Gracia', 'Marsha Lenathea',
      'Feni Fitriyanti', 'Gita Sekar', 'Kathrina Irene', 'Lulu Salsabila'
    ],
    poster: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    type: 'Seitansai'
  },
  {
    id: 'hist-5',
    title: 'Pajama Drive - Special Trainee Generation Stage',
    originalTitle: 'Pajama Drive',
    date: '2026-07-28T07:00:00.000Z',
    time: '14:00 WIB',
    month: 'Juli 2026',
    description: 'Panggung penuh energi regenerasi muda membawakan nomor-nomor klasik Pajama Drive, Temodemo no Namida, dan Junjou Shugi.',
    lineup: [
      'Gendis', 'Erine', 'Oline', 'Aralie', 'Ribka', 'Cathy', 'Lana', 'Nayla'
    ],
    poster: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
    type: 'Special Stage'
  }
]

// Helper untuk menghitung timestamp pertunjukan dari tanggal dan jam
const getShowTimestamp = (dateVal?: string, timeVal?: string): number => {
  if (!dateVal) return 0
  try {
    const d = new Date(dateVal)
    if (!isNaN(d.getTime())) {
      if (timeVal) {
        const match = timeVal.match(/(\d{1,2}):(\d{2})/)
        if (match) {
          const year = d.getFullYear()
          const month = d.getMonth()
          const date = d.getDate()
          const hours = parseInt(match[1], 10)
          const minutes = parseInt(match[2], 10)
          return new Date(year, month, date, hours, minutes, 0).getTime()
        }
      }
      return d.getTime()
    }
  } catch {}
  return 0
}

// Gabungkan riwayat show dari database tablesDB (show yang sudah lewat < now) dengan data arsip
const allHistorySchedules = computed(() => {
  const now = Date.now()
  const dbPastShows: any[] = []

  if (appwriteShows.value.length > 0) {
    appwriteShows.value.forEach(s => {
      const ts = getShowTimestamp(s.date, s.time)
      // Pertunjukan dari tablesDB yang tanggal & waktunya sudah berlalu (< now)
      if (ts > 0 && ts < now) {
        const related = setlists.value.find(set => set.$id === s.setlist_id || String(set.id) === String(s.setlist_id))
        const lineupList = s.lineup ? s.lineup.split(',').map(m => m.trim()).filter(Boolean) : []
        const monthYear = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(ts))

        dbPastShows.push({
          id: s.$id || s.id,
          title: related?.title_id || 'Pertunjukan Teater',
          originalTitle: related?.title_jp || '',
          date: s.date,
          time: getFormattedTime(s.time, s.date),
          month: monthYear,
          description: s.description || (related ? `Pertunjukan setlist ${related.title_id}` : 'Arsip pertunjukan teater.'),
          lineup: lineupList.length > 0 ? lineupList : ['Lineup arsip'],
          poster: related?.image_url || '',
          type: 'Show Selesai',
          timestamp: ts
        })
      }
    })
  }

  // Jika ada riwayat pertunjukan asli dari database tablesDB, utamakan data database!
  if (dbPastShows.length > 0) {
    return dbPastShows.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
  }

  // Fallback arsip bawaan jika database belum memiliki riwayat pertunjukan
  const pastArchives = archiveSchedules
    .filter(a => getShowTimestamp(a.date, a.time) < now)
    .map(a => ({
      ...a,
      timestamp: getShowTimestamp(a.date, a.time)
    }))

  return pastArchives.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
})

// Tab filter bulan yang dinamis berdasarkan data riwayat yang ada
const months = computed(() => {
  const setMonths = new Set<string>()
  allHistorySchedules.value.forEach(s => {
    if (s.month) setMonths.add(s.month)
  })
  return ['Semua', ...Array.from(setMonths)]
})

// Filter berdasarkan pencarian & bulan
const filteredHistory = computed(() => {
  return allHistorySchedules.value.filter(show => {
    // Filter Bulan
    if (selectedMonth.value !== 'Semua') {
      const matchMonth = show.month?.toLowerCase().includes(selectedMonth.value.toLowerCase()) ||
        getFullFormattedDate(show.date).toLowerCase().includes(selectedMonth.value.toLowerCase())
      if (!matchMonth) return false
    }

    // Filter Pencarian
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      const matchTitle = show.title.toLowerCase().includes(q)
      const matchOrig = show.originalTitle?.toLowerCase().includes(q)
      const matchDesc = show.description?.toLowerCase().includes(q)
      const matchLineup = show.lineup?.some((m: string) => m.toLowerCase().includes(q))
      return matchTitle || matchOrig || matchDesc || matchLineup
    }

    return true
  })
})
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
      <div class="space-y-1.5">
        <NuxtLink
          to="/jadwal"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-primary transition-colors uppercase tracking-wide cursor-pointer"
        >
          <UIcon name="i-lucide-arrow-left" class="w-3.5 h-3.5" />
          <span>Kembali ke Jadwal Mendatang</span>
        </NuxtLink>

        <h1 class="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3 text-neutral-900 dark:text-white">
          <UIcon name="i-lucide-history" class="w-8 h-8 text-primary" />
          <span>Riwayat Show Teater</span>
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm">
          Arsip riwayat pertunjukan teater yang telah selesai digelar beserta tema setlist dan lineup member penampil.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          to="/jadwal"
          color="primary"
          variant="solid"
          size="sm"
          icon="i-lucide-calendar"
          label="Jadwal Mendatang"
          class="rounded-xl font-bold cursor-pointer shadow-sm"
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

      <!-- Month Tabs -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          v-for="month in months"
          :key="month"
          type="button"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
            selectedMonth === month
              ? 'bg-primary text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200/60 dark:border-neutral-700/60'
          ]"
          @click="selectedMonth = month"
        >
          {{ month }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isShowsLoading" class="p-12 text-center space-y-3">
      <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
      <p class="text-xs text-neutral-500">Memuat riwayat pertunjukan...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredHistory.length === 0"
      class="p-12 text-center rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3"
    >
      <div class="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-calendar-x-2" class="w-6 h-6" />
      </div>
      <h3 class="font-bold text-neutral-900 dark:text-white text-base">Tidak ada riwayat pertunjukan ditemukan</h3>
      <p class="text-xs text-neutral-500 max-w-sm mx-auto">
        Coba ubah kata kunci pencarian atau pilih filter bulan yang lain.
      </p>
    </div>

    <!-- Schedule List Cards -->
    <div v-else class="space-y-4">
      <div
        v-for="show in filteredHistory"
        :key="show.id"
        class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
      >
        <!-- Setlist Poster & Show Main Info -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
          <!-- Poster Setlist Box di Kiri (Rasio 16:9) -->
          <div class="w-full sm:w-52 md:w-56 aspect-video rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 flex-shrink-0 relative group-hover:shadow-md transition-all">
            <img
              v-if="show.poster"
              :src="show.poster"
              :alt="show.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 gap-1.5 p-2 text-center">
              <UIcon name="i-lucide-disc-3" class="w-8 h-8 text-primary/60" />
              <span class="text-[11px] font-bold">Poster Setlist</span>
            </div>

            <!-- Badge Tipe Pertunjukan -->
            <div class="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] text-white font-bold">
              {{ show.type || 'Selesai' }}
            </div>
          </div>

          <!-- Show Details -->
          <div class="space-y-2 flex-1 min-w-0">
            <!-- Tanggal, Waktu & Status Selesai -->
            <div class="inline-flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              <UIcon name="i-lucide-calendar-days" class="w-4 h-4 text-primary" />
              <span>{{ getFullFormattedDate(show.date) }}</span>
              <span class="text-neutral-300 dark:text-neutral-700">&bull;</span>
              <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-primary" />
              <span>{{ show.time }}</span>
              <span class="text-neutral-300 dark:text-neutral-700">&bull;</span>
              <span class="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                Pertunjukan Selesai
              </span>
            </div>

            <!-- Title & Japanese Title -->
            <div>
              <h3 class="text-lg sm:text-xl font-black text-neutral-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
                {{ show.title }}
              </h3>
              <p v-if="show.originalTitle" class="text-xs text-neutral-500 dark:text-neutral-400 font-medium italic mt-0.5">
                {{ show.originalTitle }}
              </p>
            </div>

            <p class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
              {{ show.description }}
            </p>

            <!-- Lineup Member -->
            <div v-if="show.lineup && show.lineup.length" class="flex items-start gap-2 pt-1 text-xs">
              <span class="text-neutral-400 font-semibold text-[11px] mt-0.5">Lineup:</span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="m in show.lineup"
                  :key="m"
                  class="px-2.5 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50"
                >
                  {{ m }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action / Replay Button -->
        <div class="flex lg:flex-col items-center justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-100 dark:border-neutral-800">
          <UButton
            to="/replay"
            color="neutral"
            variant="outline"
            size="xs"
            icon="i-lucide-play-circle"
            label="Tonton Replay"
            class="rounded-xl font-bold cursor-pointer hover:border-primary/50"
          />
        </div>
      </div>
    </div>
  </div>
</template>
