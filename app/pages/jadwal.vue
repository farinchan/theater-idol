<script setup lang="ts">
const selectedFilter = ref('Semua Show')
const selectedShowForLineup = ref<any>(null)
const isLineupModalOpen = ref(false)

const filters = ['Semua Show', 'Regular Show', 'Spesial Seitansai', 'Trainee Stage']

// Hubungkan ke Appwrite TablesDB untuk jadwal show & setlist yang dinamis
const { shows: appwriteShows, fetchShows, isLoading: isShowsLoading } = useAppwriteShow()
const { setlists, fetchSetlists } = useAppwriteSetlist()

onMounted(() => {
  fetchShows()
  fetchSetlists()
})

// Helper formatters untuk penanganan ISO Datetime dan lokal Indonesia
const getDayName = (dateVal?: string): string => {
  if (!dateVal) return '-'
  try {
    const d = new Date(dateVal)
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(d)
    }
  } catch {}
  if (dateVal.includes(',')) return dateVal.split(',')[0]
  return dateVal
}

const getDayAndMonth = (dateVal?: string): string => {
  if (!dateVal) return '-'
  try {
    const d = new Date(dateVal)
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d)
    }
  } catch {}
  if (dateVal.includes(',')) {
    return dateVal.split(',')[1]?.trim() || dateVal
  }
  return dateVal
}

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
    type: 'Regular Evening Show',
    status: 'Jadwal Terkonfirmasi',
    statusColor: 'primary' as const,
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
    type: 'Matinee Afternoon Show',
    status: 'Show Siang',
    statusColor: 'warning' as const,
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
    type: 'Evening Show',
    status: 'Show Malam',
    statusColor: 'primary' as const,
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

// Gabungkan data dari TablesDB dengan relasi setlist
const allSchedules = computed(() => {
  if (appwriteShows.value.length > 0) {
    return appwriteShows.value.map(s => {
      const related = setlists.value.find(set => set.$id === s.setlist_id || String(set.id) === String(s.setlist_id))
      const lineupList = s.lineup ? s.lineup.split(',').map(m => m.trim()).filter(Boolean) : []
      return {
        id: s.$id || s.id,
        title: related?.title_id || 'Pertunjukan Teater',
        originalTitle: related?.title_jp || '',
        category: 'Regular Show',
        date: s.date,
        time: getFormattedTime(s.time, s.date),
        type: 'Regular Evening Show',
        status: 'Jadwal Terkonfirmasi',
        statusColor: 'primary' as const,
        description: s.description || (related ? `Pertunjukan setlist ${related.title_id}` : 'Pertunjukan teater mendatang.'),
        lineup: lineupList.length > 0 ? lineupList : ['Lineup menyusul'],
        poster: related?.image_url || ''
      }
    })
  }
  return defaultSchedules
})

const filteredSchedules = computed(() => {
  if (selectedFilter.value === 'Semua Show') return allSchedules.value
  return allSchedules.value.filter(s => s.category === selectedFilter.value)
})

const openLineupModal = (show: any) => {
  selectedShowForLineup.value = show
  isLineupModalOpen.value = true
}
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
        <span class="text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
          Oktober 2026
        </span>
        <UButton
          to="https://jkt48.com/theater/schedule?lang=id"
          target="_blank"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-external-link"
          label="Portal JKT48.com"
        />
      </div>
    </div>

    <!-- Filter Pills -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        v-for="f in filters"
        :key="f"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
          selectedFilter === f
            ? 'bg-primary text-white shadow-sm shadow-primary/30 font-bold'
            : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-primary/50 hover:text-primary'
        ]"
        @click="selectedFilter = f"
      >
        {{ f }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isShowsLoading" class="p-12 text-center space-y-3">
      <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
      <p class="text-xs text-neutral-500">Memuat jadwal pertunjukan...</p>
    </div>

    <!-- Schedule List Cards -->
    <div v-else class="space-y-4">
      <div
        v-for="show in filteredSchedules"
        :key="show.id"
        class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
      >
        <!-- Date Badge & Show Main Info -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1">
          <!-- Date Box -->
          <div class="w-full sm:w-36 p-3 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 flex flex-row sm:flex-col items-center justify-between sm:justify-center text-center flex-shrink-0">
            <span class="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{{ getDayName(show.date) }}</span>
            <span class="text-lg sm:text-2xl font-black text-primary my-0.5">{{ getDayAndMonth(show.date) }}</span>
            <span class="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">{{ show.time }}</span>
          </div>

          <!-- Show Details -->
          <div class="space-y-2 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <UBadge :color="show.statusColor" variant="subtle" size="xs" class="font-bold">
                {{ show.status }}
              </UBadge>
              <span class="text-xs text-neutral-500 font-semibold">&bull; {{ show.type }}</span>
            </div>

            <!-- Poster & Title -->
            <div class="flex items-start gap-3.5">
              <div
                v-if="show.poster"
                class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 border border-neutral-200 dark:border-neutral-700"
              >
                <img :src="show.poster" :alt="show.title" class="w-full h-full object-cover" />
              </div>
              <div>
                <h3 class="text-lg sm:text-xl font-black text-neutral-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
                  {{ show.title }}
                </h3>
                <p v-if="show.originalTitle" class="text-xs text-primary font-medium italic mt-0.5">
                  {{ show.originalTitle }}
                </p>
              </div>
            </div>

            <p class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
              {{ show.description }}
            </p>

            <!-- Lineup preview snippet -->
            <div class="flex items-center gap-2 pt-1 text-xs">
              <span class="text-neutral-400 font-semibold text-[11px]">Member:</span>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="m in show.lineup.slice(0, 3)"
                  :key="m"
                  class="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium"
                >
                  {{ m }}
                </span>
                <button
                  v-if="show.lineup.length > 3"
                  class="text-primary hover:underline font-semibold text-[11px] ml-1 cursor-pointer"
                  @click="openLineupModal(show)"
                >
                  +{{ show.lineup.length - 3 }} member lainnya
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Button (Lineup Detail) -->
        <div class="flex sm:flex-col items-center gap-2 flex-shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-neutral-100 dark:border-neutral-800">
          <UButton
            color="primary"
            block
            icon="i-lucide-users"
            label="Lihat Lineup Member"
            class="shadow-sm shadow-primary/30 w-full sm:w-48 font-semibold cursor-pointer"
            @click="openLineupModal(show)"
          />
        </div>
      </div>
    </div>

    <!-- Lineup Detail Modal -->
    <UModal v-model:open="isLineupModalOpen">
      <template #content>
        <div v-if="selectedShowForLineup" class="p-6 space-y-5">
          <div class="flex items-start justify-between">
            <div>
              <span class="text-xs text-primary font-bold uppercase tracking-wider">Lineup Member Penampil</span>
              <h3 class="font-black text-xl text-neutral-900 dark:text-white mt-0.5">
                {{ selectedShowForLineup.title }}
              </h3>
              <p class="text-xs text-neutral-500 mt-1">
                {{ getFullFormattedDate(selectedShowForLineup.date) }} &bull; {{ selectedShowForLineup.time }}
              </p>
            </div>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" class="cursor-pointer" @click="isLineupModalOpen = false" />
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
            <div
              v-for="(member, idx) in selectedShowForLineup.lineup"
              :key="member"
              class="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-100 dark:border-neutral-800 text-center"
            >
              <div class="w-8 h-8 mx-auto rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center mb-1.5">
                {{ idx + 1 }}
              </div>
              <div class="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">{{ member }}</div>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <UButton color="primary" label="Tutup" class="cursor-pointer font-bold" @click="isLineupModalOpen = false" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Venue Guide Box -->
    <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
      <div class="space-y-2">
        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <UIcon name="i-lucide-clock" class="w-5 h-5" />
        </div>
        <h4 class="font-bold text-base text-neutral-900 dark:text-white">Jadwal & Waktu Pertunjukan</h4>
        <p class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Pertunjukan biasanya diadakan pada hari kerja (19:00 WIB) serta akhir pekan dalam format Matinee (14:00 WIB) dan Evening (19:00 WIB).
        </p>
      </div>

      <div class="space-y-2">
        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <UIcon name="i-lucide-map-pin" class="w-5 h-5" />
        </div>
        <h4 class="font-bold text-base text-neutral-900 dark:text-white">Lokasi Teater</h4>
        <p class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          fX Sudirman Lt. 4, Jl. Jenderal Sudirman, Pintu Satu Senayan, Gelora, Kecamatan Tanah Abang, Kota Jakarta Pusat.
        </p>
      </div>

      <div class="space-y-2">
        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <UIcon name="i-lucide-ticket" class="w-5 h-5" />
        </div>
        <h4 class="font-bold text-base text-neutral-900 dark:text-white">Pemesanan Tiket</h4>
        <p class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Tiket masuk teater dapat dibeli melalui sistem undian / ticketing resmi di portal official JKT48 sebelum tanggal pementasan.
        </p>
      </div>
    </div>
  </div>
</template>
