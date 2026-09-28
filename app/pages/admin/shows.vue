<script setup lang="ts">
const router = useRouter()
const { user, isAdmin, isLoading, isInitialized } = useAppwriteAuth()

interface ShowItem {
  id: number | string
  title: string
  originalTitle: string
  category: string
  date: string
  time: string
  type: string
  status: string
  statusColor: 'primary' | 'warning' | 'success' | 'neutral'
  description: string
  lineup: string[]
}

const defaultShows: ShowItem[] = [
  {
    id: 1,
    title: 'Cara Meminum Ramune',
    originalTitle: 'Ramune no Nomikata',
    category: 'Regular Show',
    date: 'Jumat, 3 Oktober 2026',
    time: '19:00 WIB',
    type: 'Regular Evening Show',
    status: 'Jadwal Terkonfirmasi',
    statusColor: 'primary',
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
    statusColor: 'warning',
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
    statusColor: 'primary',
    description: 'Pertunjukan malam penuh semangat dengan antusiasme chant penonton di teater.',
    lineup: [
      'Freya Jayawardana', 'Christy', 'Gracia', 'Zee',
      'Marsha', 'Feni', 'Gita', 'Muthe',
      'Kathrina', 'Lulu', 'Indah', 'Ella',
      'Adel', 'Flora', 'Oniel', 'Jessi'
    ]
  },
  {
    id: 4,
    title: 'Tunas Dibalik Seragam',
    originalTitle: 'Seifuku no Me',
    category: 'Spesial Seitansai',
    date: 'Minggu, 5 Oktober 2026',
    time: '14:00 WIB',
    type: 'Matinee Show',
    status: 'Seitansai Freya',
    statusColor: 'success',
    description: 'Panggung spesial perayaan ulang tahun Freya Jayawardana dengan surat menyentuh dan segmen perayaan spesial.',
    lineup: [
      'Freya Jayawardana', 'Christy', 'Gracia', 'Muthe',
      'Kathrina', 'Lulu', 'Indah', 'Ella',
      'Adel', 'Flora', 'Oniel', 'Jessi',
      'Amanda', 'Lia', 'Callie', 'Raisha'
    ]
  },
  {
    id: 5,
    title: 'Pajama Drive',
    originalTitle: 'Pajama Drive',
    category: 'Trainee Stage',
    date: 'Minggu, 5 Oktober 2026',
    time: '19:00 WIB',
    type: 'Trainee Evening Show',
    status: 'Show Malam',
    statusColor: 'neutral',
    description: 'Panggung penuh pesona generasi baru membawakan setlist legendaris Pajama Drive dengan semangat tinggi.',
    lineup: [
      'Nayla', 'Anindya', 'Cynthia', 'Daisy',
      'Elin', 'Gendis', 'Chelsea', 'Danella',
      'Grace', 'Greesel', 'Alya', 'Cathy',
      'Delynn', 'Lana', 'Nala', 'Ribka'
    ]
  }
]

const shows = ref<ShowItem[]>([])
const searchQuery = ref('')
const selectedCategory = ref('Semua')
const alertMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Modal Add/Edit
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | string | null>(null)

// Modal Delete
const isDeleteModalOpen = ref(false)
const showToDelete = ref<ShowItem | null>(null)

// Modal View Lineup
const isLineupModalOpen = ref(false)
const selectedShowForLineup = ref<ShowItem | null>(null)

const form = reactive({
  title: '',
  originalTitle: '',
  category: 'Regular Show',
  date: '',
  time: '19:00 WIB',
  type: 'Regular Evening Show',
  status: 'Jadwal Terkonfirmasi',
  description: '',
  lineupText: ''
})

const categories = ['Semua', 'Regular Show', 'Spesial Seitansai', 'Trainee Stage', 'Special Event']
const categoryOptions = ['Regular Show', 'Spesial Seitansai', 'Trainee Stage', 'Special Event']

// Load shows from localStorage or default
const loadShows = () => {
  if (import.meta.client) {
    const saved = localStorage.getItem('admin_managed_shows')
    if (saved) {
      try {
        shows.value = JSON.parse(saved)
        return
      } catch {
        // fallback
      }
    }
  }
  shows.value = [...defaultShows]
}

const saveShows = () => {
  if (import.meta.client) {
    localStorage.setItem('admin_managed_shows', JSON.stringify(shows.value))
  }
}

onMounted(() => {
  loadShows()
})

const filteredShows = computed(() => {
  return shows.value.filter((show) => {
    const matchCategory = selectedCategory.value === 'Semua' || show.category === selectedCategory.value
    const matchSearch =
      searchQuery.value.trim() === '' ||
      show.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      show.originalTitle.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      show.date.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchCategory && matchSearch
  })
})

const totalShows = computed(() => shows.value.length)
const regularShows = computed(() => shows.value.filter(s => s.category === 'Regular Show').length)
const specialShows = computed(() => shows.value.filter(s => s.category === 'Spesial Seitansai').length)
const traineeShows = computed(() => shows.value.filter(s => s.category === 'Trainee Stage').length)

const openCreateModal = () => {
  modalMode.value = 'create'
  editingId.value = null
  form.title = ''
  form.originalTitle = ''
  form.category = 'Regular Show'
  form.date = ''
  form.time = '19:00 WIB'
  form.type = 'Regular Evening Show'
  form.status = 'Jadwal Terkonfirmasi'
  form.description = ''
  form.lineupText = ''
  isModalOpen.value = true
}

const openEditModal = (show: ShowItem) => {
  modalMode.value = 'edit'
  editingId.value = show.id
  form.title = show.title
  form.originalTitle = show.originalTitle
  form.category = show.category
  form.date = show.date
  form.time = show.time
  form.type = show.type
  form.status = show.status
  form.description = show.description
  form.lineupText = show.lineup.join(', ')
  isModalOpen.value = true
}

const handleSaveShow = () => {
  if (!form.title.trim() || !form.date.trim()) {
    alertMessage.value = { type: 'error', text: 'Judul dan tanggal pertunjukan wajib diisi.' }
    return
  }

  const parsedLineup = form.lineupText
    .split(',')
    .map(name => name.trim())
    .filter(Boolean)

  let statusColor: 'primary' | 'warning' | 'success' | 'neutral' = 'primary'
  if (form.category === 'Spesial Seitansai') statusColor = 'success'
  else if (form.status.toLowerCase().includes('siang')) statusColor = 'warning'
  else if (form.category === 'Trainee Stage') statusColor = 'neutral'

  if (modalMode.value === 'create') {
    const newShow: ShowItem = {
      id: Date.now(),
      title: form.title.trim(),
      originalTitle: form.originalTitle.trim() || form.title.trim(),
      category: form.category,
      date: form.date.trim(),
      time: form.time.trim() || '19:00 WIB',
      type: form.type.trim() || 'Evening Show',
      status: form.status.trim() || 'Jadwal Terkonfirmasi',
      statusColor,
      description: form.description.trim() || 'Pertunjukan teater mendatang.',
      lineup: parsedLineup.length ? parsedLineup : ['Lineup menyusul']
    }
    shows.value.unshift(newShow)
    alertMessage.value = { type: 'success', text: `Pertunjukan "${newShow.title}" berhasil ditambahkan!` }
  } else if (modalMode.value === 'edit' && editingId.value !== null) {
    const idx = shows.value.findIndex(s => s.id === editingId.value)
    if (idx !== -1) {
      shows.value[idx] = {
        ...shows.value[idx],
        title: form.title.trim(),
        originalTitle: form.originalTitle.trim() || form.title.trim(),
        category: form.category,
        date: form.date.trim(),
        time: form.time.trim(),
        type: form.type.trim(),
        status: form.status.trim(),
        statusColor,
        description: form.description.trim(),
        lineup: parsedLineup.length ? parsedLineup : shows.value[idx].lineup
      }
      alertMessage.value = { type: 'success', text: `Pertunjukan "${form.title}" berhasil diperbarui!` }
    }
  }

  saveShows()
  isModalOpen.value = false
  setTimeout(() => { alertMessage.value = null }, 3500)
}

const confirmDelete = (show: ShowItem) => {
  showToDelete.value = show
  isDeleteModalOpen.value = true
}

const handleDeleteShow = () => {
  if (!showToDelete.value) return
  shows.value = shows.value.filter(s => s.id !== showToDelete.value?.id)
  saveShows()
  alertMessage.value = { type: 'success', text: `Pertunjukan "${showToDelete.value.title}" telah dihapus.` }
  isDeleteModalOpen.value = false
  showToDelete.value = null
  setTimeout(() => { alertMessage.value = null }, 3500)
}

const viewLineup = (show: ShowItem) => {
  selectedShowForLineup.value = show
  isLineupModalOpen.value = true
}

const resetToDefaults = () => {
  shows.value = [...defaultShows]
  saveShows()
  alertMessage.value = { type: 'success', text: 'Data pertunjukan telah dikembalikan ke daftar awal.' }
  setTimeout(() => { alertMessage.value = null }, 3500)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 w-full max-w-7xl mx-auto">
    <!-- State 1: Verifikasi Sesi Sedang Berjalan -->
    <div v-if="isLoading && !isInitialized" class="py-20 text-center space-y-3">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary mx-auto" />
      <p class="text-sm text-neutral-500">Memverifikasi hak akses administrator...</p>
    </div>

    <!-- State 2: Belum Login (Guest) -->
    <div
      v-else-if="!user"
      class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 sm:p-12 text-center shadow-xs space-y-5"
    >
      <div class="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-lock" class="w-8 h-8" />
      </div>

      <div class="max-w-md mx-auto space-y-2">
        <h2 class="text-xl font-bold text-neutral-900 dark:text-white">
          Autentikasi Diperlukan
        </h2>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Halaman Management Show hanya dapat diakses oleh akun pengelola yang telah masuk dan memiliki label administrator.
        </p>
      </div>

      <div class="pt-2">
        <NuxtLink
          to="/login"
          class="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm shadow-primary/25 hover:bg-primary/90 transition-colors"
        >
          <UIcon name="i-lucide-log-in" class="w-4 h-4" />
          <span>Masuk ke Akun</span>
        </NuxtLink>
      </div>
    </div>

    <!-- State 3: Login tapi BUKAN Admin (Label tidak ada 'admin') -->
    <div
      v-else-if="!isAdmin"
      class="rounded-3xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-8 sm:p-12 text-center shadow-xs space-y-5"
    >
      <div class="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-shield-alert" class="w-8 h-8" />
      </div>

      <div class="max-w-md mx-auto space-y-2">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20 uppercase">
          Akses Ditolak &bull; 403 Forbidden
        </div>
        <h2 class="text-2xl font-black text-neutral-900 dark:text-white">
          Hak Akses Tidak Mencukupi
        </h2>
        <p class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Akun Anda (<strong>{{ user.email }}</strong>) saat ini belum memiliki label <code>admin</code>. Halaman ini hanya dibuka untuk pengelola dengan hak akses admin.
        </p>
      </div>

      <div class="pt-3 flex items-center justify-center gap-3">
        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-bold text-xs hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
        >
          <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </NuxtLink>
        <NuxtLink
          to="/profile"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm shadow-primary/25 hover:bg-primary/90 transition-colors"
        >
          <UIcon name="i-lucide-user" class="w-4 h-4" />
          <span>Lihat Profil Saya</span>
        </NuxtLink>
      </div>
    </div>

    <!-- State 4: Autentikasi Berhasil & User adalah Admin -->
    <div v-else class="space-y-8">
      <!-- Admin Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <div class="inline-flex items-center gap-2 text-xs font-bold text-amber-500 tracking-wide uppercase">
            <UIcon name="i-lucide-shield-check" class="w-4 h-4 text-amber-500" />
            Area Administrator
          </div>
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight mt-1 flex items-center gap-3">
            <UIcon name="i-lucide-calendar-cog" class="w-8 h-8 text-primary" />
            Management Show
          </h1>
          <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Kelola daftar jadwal panggung pertunjukan, status show, dan lineup member penampil.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <UButton
            color="primary"
            variant="solid"
            size="md"
            class="rounded-xl font-bold cursor-pointer shadow-md shadow-primary/25"
            @click="openCreateModal"
          >
            <template #leading>
              <UIcon name="i-lucide-plus" class="w-4 h-4" />
            </template>
            Tambah Show Baru
          </UButton>
        </div>
      </div>

      <!-- Alert Feedback -->
      <div
        v-if="alertMessage"
        :class="[
          'p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between border',
          alertMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
        ]"
      >
        <div class="flex items-center gap-2.5">
          <UIcon
            :name="alertMessage.type === 'success' ? 'i-lucide-check-circle-2' : 'i-lucide-alert-circle'"
            class="w-5 h-5 flex-shrink-0"
          />
          <span>{{ alertMessage.text }}</span>
        </div>
        <button type="button" class="text-neutral-400 hover:text-neutral-600 cursor-pointer" @click="alertMessage = null">
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>
      </div>

      <!-- Quick Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div class="text-xs text-neutral-500">Total Show Terdata</div>
          <div class="text-2xl font-black text-neutral-900 dark:text-white mt-1">{{ totalShows }}</div>
        </div>
        <div class="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div class="text-xs text-neutral-500">Regular Show</div>
          <div class="text-2xl font-black text-primary mt-1">{{ regularShows }}</div>
        </div>
        <div class="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div class="text-xs text-neutral-500">Seitansai / Spesial</div>
          <div class="text-2xl font-black text-emerald-500 mt-1">{{ specialShows }}</div>
        </div>
        <div class="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div class="text-xs text-neutral-500">Trainee Stage</div>
          <div class="text-2xl font-black text-amber-500 mt-1">{{ traineeShows }}</div>
        </div>
      </div>

      <!-- Search & Category Filters -->
      <div class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div class="w-full md:w-80">
          <UInput
            v-model="searchQuery"
            placeholder="Cari berdasarkan judul atau tanggal..."
            icon="i-lucide-search"
            size="sm"
            class="w-full"
          />
        </div>

        <div class="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
              selectedCategory === cat
                ? 'bg-primary text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            ]"
            @click="selectedCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Shows Table / List Card -->
      <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs overflow-hidden">
        <div class="p-5 sm:p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-lucide-list" class="w-4 h-4 text-primary" />
              Daftar Pertunjukan
            </h3>
            <p class="text-xs text-neutral-500 mt-0.5">Menampilkan {{ filteredShows.length }} dari {{ shows.length }} jadwal pertunjukan.</p>
          </div>

          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
            title="Reset ke data awal"
            @click="resetToDefaults"
          >
            <template #leading>
              <UIcon name="i-lucide-rotate-ccw" class="w-3.5 h-3.5" />
            </template>
            Reset Contoh
          </UButton>
        </div>

        <!-- Empty State -->
        <div v-if="!filteredShows.length" class="p-12 text-center space-y-3">
          <UIcon name="i-lucide-calendar-x" class="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto" />
          <p class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Tidak ada pertunjukan yang cocok.</p>
          <p class="text-xs text-neutral-400">Coba ubah kata kunci pencarian atau kategori filter.</p>
        </div>

        <!-- Table View -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-neutral-50/80 dark:bg-neutral-800/40 text-[11px] font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 dark:border-neutral-800">
              <tr>
                <th class="py-3.5 px-4 sm:px-6">Pertunjukan</th>
                <th class="py-3.5 px-4">Kategori</th>
                <th class="py-3.5 px-4">Jadwal & Waktu</th>
                <th class="py-3.5 px-4">Status</th>
                <th class="py-3.5 px-4">Lineup</th>
                <th class="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              <tr
                v-for="show in filteredShows"
                :key="show.id"
                class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors"
              >
                <!-- Title & Original Title -->
                <td class="py-4 px-4 sm:px-6">
                  <div class="font-bold text-neutral-900 dark:text-white">{{ show.title }}</div>
                  <div class="text-[11px] text-neutral-400 italic">{{ show.originalTitle }}</div>
                </td>

                <!-- Category -->
                <td class="py-4 px-4 whitespace-nowrap">
                  <span class="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {{ show.category }}
                  </span>
                </td>

                <!-- Date & Time -->
                <td class="py-4 px-4 whitespace-nowrap">
                  <div class="font-semibold text-neutral-900 dark:text-white">{{ show.date }}</div>
                  <div class="text-[11px] text-primary font-mono font-bold">{{ show.time }}</div>
                </td>

                <!-- Status -->
                <td class="py-4 px-4 whitespace-nowrap">
                  <UBadge
                    :color="show.statusColor"
                    variant="subtle"
                    size="xs"
                    class="font-bold"
                  >
                    {{ show.status }}
                  </UBadge>
                </td>

                <!-- Lineup Member -->
                <td class="py-4 px-4 whitespace-nowrap">
                  <button
                    type="button"
                    class="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    @click="viewLineup(show)"
                  >
                    <UIcon name="i-lucide-users" class="w-3.5 h-3.5" />
                    <span>{{ show.lineup.length }} Member</span>
                  </button>
                </td>

                <!-- Action Buttons -->
                <td class="py-4 px-4 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1.5">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      class="rounded-lg cursor-pointer"
                      title="Edit Data"
                      @click="openEditModal(show)"
                    >
                      <template #leading>
                        <UIcon name="i-lucide-pencil" class="w-3.5 h-3.5" />
                      </template>
                      Edit
                    </UButton>

                    <UButton
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      class="text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                      title="Hapus Show"
                      @click="confirmDelete(show)"
                    >
                      <template #leading>
                        <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
                      </template>
                    </UButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL: Tambah / Edit Show -->
    <UModal v-model:open="isModalOpen" :title="modalMode === 'create' ? 'Tambah Pertunjukan Baru' : 'Edit Pertunjukan'">
      <template #content>
        <form class="space-y-4 p-5" @submit.prevent="handleSaveShow">
          <div class="space-y-1">
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Nama Setlist / Judul Show *</label>
            <UInput v-model="form.title" placeholder="Contoh: Cara Meminum Ramune" required size="sm" class="w-full" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Judul Asli (Kanji/Romaji)</label>
            <UInput v-model="form.originalTitle" placeholder="Contoh: Ramune no Nomikata" size="sm" class="w-full" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Kategori</label>
              <select
                v-model="form.category"
                class="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              >
                <option v-for="opt in categoryOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Status Show</label>
              <UInput v-model="form.status" placeholder="Jadwal Terkonfirmasi / Show Siang" size="sm" class="w-full" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Tanggal Pertunjukan *</label>
              <UInput v-model="form.date" placeholder="Contoh: Jumat, 3 Oktober 2026" required size="sm" class="w-full" />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Waktu (WIB)</label>
              <UInput v-model="form.time" placeholder="Contoh: 19:00 WIB" size="sm" class="w-full" />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Deskripsi Ringkas</label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Deskripsi singkat tentang setlist dan suasana show..."
              class="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Lineup Member (Pisahkan dengan tanda koma)
            </label>
            <textarea
              v-model="form.lineupText"
              rows="3"
              placeholder="Freya Jayawardana, Angelina Christy, Shania Gracia, ..."
              class="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none"
            />
            <p class="text-[10px] text-neutral-400">Tuliskan nama-nama member yang tampil dipisahkan dengan koma.</p>
          </div>

          <div class="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
            <UButton
              type="button"
              color="neutral"
              variant="subtle"
              size="sm"
              class="rounded-xl cursor-pointer"
              @click="isModalOpen = false"
            >
              Batal
            </UButton>
            <UButton
              type="submit"
              color="primary"
              variant="solid"
              size="sm"
              class="rounded-xl font-bold cursor-pointer"
            >
              {{ modalMode === 'create' ? 'Tambah Show' : 'Simpan Perubahan' }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <!-- MODAL: Konfirmasi Hapus Show -->
    <UModal v-model:open="isDeleteModalOpen" title="Konfirmasi Hapus Pertunjukan">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-bold text-sm text-neutral-900 dark:text-white">
                Hapus "{{ showToDelete?.title }}"?
              </h4>
              <p class="text-xs text-neutral-500 mt-1 leading-relaxed">
                Pertunjukan pada tanggal <strong>{{ showToDelete?.date }}</strong> akan dihapus dari daftar manajemen show. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </div>

          <div class="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
            <UButton
              color="neutral"
              variant="subtle"
              size="sm"
              class="rounded-xl cursor-pointer"
              @click="isDeleteModalOpen = false"
            >
              Batal
            </UButton>
            <UButton
              color="error"
              variant="solid"
              size="sm"
              class="rounded-xl font-bold cursor-pointer"
              @click="handleDeleteShow"
            >
              Ya, Hapus
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- MODAL: Preview Lineup Member -->
    <UModal v-model:open="isLineupModalOpen" :title="`Lineup Member - ${selectedShowForLineup?.title || 'Show'}`">
      <template #content>
        <div class="p-6 space-y-4">
          <div>
            <div class="text-xs text-neutral-400">{{ selectedShowForLineup?.date }} &bull; {{ selectedShowForLineup?.time }}</div>
            <h4 class="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
              {{ selectedShowForLineup?.title }} ({{ selectedShowForLineup?.lineup?.length || 0 }} Member)
            </h4>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
            <div
              v-for="(member, idx) in selectedShowForLineup?.lineup || []"
              :key="idx"
              class="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex items-center gap-2"
            >
              <div class="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {{ idx + 1 }}
              </div>
              <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{{ member }}</span>
            </div>
          </div>

          <div class="pt-2 flex justify-end">
            <UButton
              color="neutral"
              variant="subtle"
              size="sm"
              class="rounded-xl cursor-pointer"
              @click="isLineupModalOpen = false"
            >
              Tutup
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
