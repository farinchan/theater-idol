<script setup lang="ts">
const selectedFilter = ref('Semua Show')
const selectedShowForLineup = ref<any>(null)
const isLineupModalOpen = ref(false)

const filters = ['Semua Show', 'Regular Show', 'Spesial Seitansai', 'Trainee Stage']

const scheduleList = [
  {
    id: 1,
    title: 'Cara Meminum Ramune',
    originalTitle: 'Ramune no Nomikata',
    category: 'Regular Show',
    date: 'Jumat, 3 Oktober 2026',
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
    ]
  },
  {
    id: 2,
    title: 'Aturan Anti Cinta',
    originalTitle: 'Renai Kinshi Jourei',
    category: 'Regular Show',
    date: 'Sabtu, 4 Oktober 2026',
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
    ]
  },
  {
    id: 3,
    title: 'Aturan Anti Cinta',
    originalTitle: 'Renai Kinshi Jourei',
    category: 'Regular Show',
    date: 'Sabtu, 4 Oktober 2026',
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
    ]
  },
  {
    id: 4,
    title: 'Tunas di Balik Kaca (Spesial Seitansai Freya)',
    originalTitle: 'Megalopolis no Michi',
    category: 'Spesial Seitansai',
    date: 'Minggu, 5 Oktober 2026',
    time: '16:00 WIB',
    type: 'Special Birthday Show',
    status: 'Spesial Ulang Tahun',
    statusColor: 'error' as const,
    description: 'Pertunjukan spesial perayaan hari ulang tahun Freya Jayawardana dengan segmen perayaan khusus, surat dari member, dan dekorasi panggung unik.',
    lineup: [
      'Freya Jayawardana (Birthday Girl)', 'Angelina Christy', 'Shania Gracia', 'Azizi Asadel',
      'Marsha Lenathea', 'Feni Fitriyanti', 'Gita Sekar', 'Mutiara Azzahra',
      'Kathrina Irene', 'Jessi', 'Lulu Salsabila', 'Indah Cahya',
      'Adel Reva', 'Ella', 'Flora Shafiq', 'Oniel'
    ]
  },
  {
    id: 5,
    title: 'Pajama Drive',
    originalTitle: 'Pajama Drive',
    category: 'Trainee Stage',
    date: 'Rabu, 8 Oktober 2026',
    time: '19:00 WIB',
    type: 'Trainee Show',
    status: 'Panggung Trainee',
    statusColor: 'primary' as const,
    description: 'Panggung pembuktian member Trainee JKT48 generasi terbaru membawakan setlist legendaris Pajama Drive dengan semangat membara.',
    lineup: [
      'Gendis', 'Erine', 'Oline', 'Aralie', 'Ribka',
      'Cathy', 'Lana', 'Moreen', 'Nayla', 'Nachia',
      'Levi', 'Regie', 'Trisha', 'Fritzy', 'Kimmy', 'Delynn'
    ]
  }
]

const filteredSchedules = computed(() => {
  if (selectedFilter.value === 'Semua Show') return scheduleList
  return scheduleList.filter(s => s.category === selectedFilter.value)
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
          Jadwal Panggung Teater JKT48
        </div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight mt-1 flex items-center gap-3">
          <UIcon name="i-lucide-calendar-days" class="w-8 h-8 text-primary" />
          Jadwal Show Teater
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Daftar jadwal pertunjukan teater mendatang, tema setlist, dan lineup 16 member penampil.
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
          'px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
          selectedFilter === f
            ? 'bg-primary text-white shadow-sm shadow-primary/30 font-bold'
            : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-primary/50 hover:text-primary'
        ]"
        @click="selectedFilter = f"
      >
        {{ f }}
      </button>
    </div>

    <!-- Schedule List Cards -->
    <div class="space-y-4">
      <div
        v-for="show in filteredSchedules"
        :key="show.id"
        class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
      >
        <!-- Date Badge & Show Main Info -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1">
          <!-- Date Box -->
          <div class="w-full sm:w-36 p-3 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 flex flex-row sm:flex-col items-center justify-between sm:justify-center text-center flex-shrink-0">
            <span class="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{{ show.date.split(',')[0] }}</span>
            <span class="text-lg sm:text-xl font-black text-primary">{{ show.date.split(',')[1]?.trim().split(' ')[0] }} Okt</span>
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

            <h3 class="text-xl font-black text-neutral-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
              {{ show.title }}
            </h3>
            <p class="text-xs text-primary font-medium italic -mt-1">{{ show.originalTitle }}</p>

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
                  class="text-primary hover:underline font-semibold text-[11px] ml-1"
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
            label="Lihat Lineup 16 Member"
            class="shadow-sm shadow-primary/30 w-full sm:w-48 font-semibold"
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
              <span class="text-xs text-primary font-bold uppercase tracking-wider">Lineup 16 Member</span>
              <h3 class="font-black text-xl text-neutral-900 dark:text-white mt-0.5">
                {{ selectedShowForLineup.title }}
              </h3>
              <p class="text-xs text-neutral-500 mt-1">
                {{ selectedShowForLineup.date }} &bull; {{ selectedShowForLineup.time }}
              </p>
            </div>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isLineupModalOpen = false" />
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
            <UButton color="primary" label="Tutup" @click="isLineupModalOpen = false" />
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
        <h4 class="font-bold text-base text-neutral-900 dark:text-white">Akses Panggung Teater</h4>
        <p class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Pintu ruang teater dibuka 30 menit sebelum pertunjukan dimulai untuk persiapan penonton memasuki area auditorium.
        </p>
      </div>

      <div class="space-y-2">
        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <UIcon name="i-lucide-shield-check" class="w-5 h-5" />
        </div>
        <h4 class="font-bold text-base text-neutral-900 dark:text-white">Tata Tertib Auditorium</h4>
        <p class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Dilarang mengambil foto/video selama pertunjukan berlangsung. Penggunaan lightstick dan chant diperbolehkan sesuai etika menonton.
        </p>
      </div>
    </div>
  </div>
</template>
