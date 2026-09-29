<script setup lang="ts">
// Hubungkan ke database untuk jadwal show & setlist yang dinamis
const { shows: appwriteShows, fetchShows, isLoading: isShowsLoading } = useAppwriteShow()
const { setlists, fetchSetlists } = useAppwriteSetlist()

// Ambil data jadwal show & setlist dari database tablesDB (SSR & Client Hydration)
await useAsyncData('jadwal_page_data', async () => {
  await Promise.all([fetchShows(), fetchSetlists()])
  return true
})

onMounted(() => {
  fetchShows()
  fetchSetlists()
})

// Helper formatters untuk penanganan ISO Datetime dan lokal Indonesia

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

const defaultSchedules = [
  {
    id: 1,
    title: 'Cara Meminum Ramune',
    originalTitle: 'Ramune no Nomikata',
    category: 'Regular Show',
    date: '2026-10-03T12:00:00.000Z',
    time: '19:00 WIB',
    description: 'Pertunjukan penuh energi dan kesegaran masa muda khas setlist Ramune no Nomikata dengan 16 lagu ceria dan emosional.',
    lineup: [
      'Freya Jayawardana', 'Angelina Christy', 'Shania Gracia', 'Azizi Asadel',
      'Marsha Lenathea', 'Feni Fitriyanti', 'Gita Sekar', 'Mutiara Azzahra',
      'Kathrina Irene', 'Jessi', 'Lulu Salsabila', 'Indah Cahya',
      'Adel Reva', 'Ella', 'Flora Shafiq', 'Oniel'
    ],
    poster: ''
  },
  {
    id: 2,
    title: 'Aturan Anti Cinta',
    originalTitle: 'Renai Kinshi Jourei',
    category: 'Regular Show',
    date: '2026-10-04T07:00:00.000Z',
    time: '14:00 WIB',
    description: 'Setlist legendaris yang membawakan lagu-lagu nostalgia seperti Nagai Hikari, Heart Gata Virus, dan Renai Kinshi Jourei.',
    lineup: [
      'Gita Sekar', 'Mutiara Azzahra', 'Marsha Lenathea', 'Feni Fitriyanti',
      'Kathrina Irene', 'Jessi', 'Lulu Salsabila', 'Indah Cahya',
      'Freya Jayawardana', 'Christy', 'Gracia', 'Flora',
      'Oniel', 'Ella', 'Adel', 'Amanda'
    ],
    poster: ''
  },
  {
    id: 3,
    title: 'Aturan Anti Cinta',
    originalTitle: 'Renai Kinshi Jourei',
    category: 'Regular Show',
    date: '2026-10-04T12:00:00.000Z',
    time: '19:00 WIB',
    description: 'Pertunjukan malam penuh semangat dengan antusiasme chant penonton di Teater JKT48.',
    lineup: [
      'Freya Jayawardana', 'Christy', 'Gracia', 'Zee',
      'Marsha', 'Feni', 'Gita', 'Muthe',
      'Kathrina', 'Lulu', 'Indah', 'Ella',
      'Adel', 'Flora', 'Oniel', 'Jessi'
    ],
    poster: ''
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

// Gabungkan data jadwal show dari database tablesDB dan filter hanya yang akan datang (mendatang)
const allSchedules = computed(() => {
  const now = Date.now()

  if (appwriteShows.value.length > 0) {
    // Filter show dari tablesDB yang tanggalnya mendatang (>= now)
    const upcomingShows = appwriteShows.value
      .filter(s => {
        const ts = getShowTimestamp(s.date, s.time)
        return ts >= now
      })
      .sort((a, b) => getShowTimestamp(a.date, a.time) - getShowTimestamp(b.date, b.time))

    if (upcomingShows.length > 0) {
      return upcomingShows.map(s => {
        const related = setlists.value.find(set => set.$id === s.setlist_id || String(set.id) === String(s.setlist_id))
        const lineupList = s.lineup ? s.lineup.split(',').map(m => m.trim()).filter(Boolean) : []
        return {
          id: s.$id || s.id,
          title: related?.title_id || 'Pertunjukan Teater',
          originalTitle: related?.title_jp || '',
          category: 'Regular Show',
          date: s.date,
          time: getFormattedTime(s.time, s.date),
          description: s.description || (related ? `Pertunjukan setlist ${related.title_id}` : 'Pertunjukan teater mendatang.'),
          lineup: lineupList.length > 0 ? lineupList : ['Lineup menyusul'],
          poster: related?.image_url || ''
        }
      })
    }
  }

  // Fallback jadwal default yang berstatus mendatang jika database belum memiliki data mendatang
  return defaultSchedules
    .filter(s => getShowTimestamp(s.date, s.time) >= now)
    .sort((a, b) => getShowTimestamp(a.date, a.time) - getShowTimestamp(b.date, b.time))
})
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold text-primary tracking-wide uppercase">
          <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5" />
          Jadwal Panggung Teater
        </div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight mt-1 flex items-center gap-3">
          <UIcon name="i-lucide-calendar-days" class="w-8 h-8 text-primary" />
          Jadwal Show Teater
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Daftar jadwal pertunjukan teater mendatang, tema setlist, dan lineup member penampil.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          to="/jadwal/riwayat"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-history"
          label="Riwayat"
          class="rounded-xl font-bold cursor-pointer hover:border-primary/50"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isShowsLoading" class="p-12 text-center space-y-3">
      <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
      <p class="text-xs text-neutral-500">Memuat jadwal pertunjukan...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="allSchedules.length === 0"
      class="p-12 text-center rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3"
    >
      <div class="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-calendar-x-2" class="w-6 h-6" />
      </div>
      <h3 class="font-bold text-neutral-900 dark:text-white text-base">Belum Ada Jadwal Pertunjukan Mendatang</h3>
      <p class="text-xs text-neutral-500 max-w-sm mx-auto">
        Jadwal show teater berikutnya sedang dipersiapkan. Anda dapat melihat arsip show sebelumnya pada menu Riwayat.
      </p>
      <div class="pt-2">
        <UButton
          to="/jadwal/riwayat"
          color="primary"
          variant="soft"
          size="sm"
          icon="i-lucide-history"
          label="Lihat Riwayat Show"
          class="rounded-xl font-bold cursor-pointer"
        />
      </div>
    </div>

    <!-- Schedule List Cards -->
    <div v-else class="space-y-4">
      <div
        v-for="show in allSchedules"
        :key="show.id"
        class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
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
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 gap-1.5 p-2 text-center">
              <UIcon name="i-lucide-disc-3" class="w-8 h-8 text-primary/60" />
              <span class="text-[11px] font-bold">Poster Setlist</span>
            </div>
          </div>

          <!-- Show Details -->
          <div class="space-y-2 flex-1 min-w-0">
            <!-- Tanggal & Waktu Pertunjukan -->
            <div class="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              <UIcon name="i-lucide-calendar-days" class="w-4 h-4 text-primary" />
              <span>{{ getFullFormattedDate(show.date) }}</span>
              <span class="text-neutral-300 dark:text-neutral-700">&bull;</span>
              <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-primary" />
              <span>{{ show.time }}</span>
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
      </div>
    </div>
  </div>
</template>
