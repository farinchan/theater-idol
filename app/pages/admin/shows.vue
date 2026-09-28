<script setup lang="ts">
import type { SetlistItem } from '~/composables/useAppwriteSetlist'

const router = useRouter()
const { user, isAdmin, isLoading: isAuthLoading, isInitialized } = useAppwriteAuth()
const {
  setlists,
  isLoading: isSetlistsLoading,
  isActionLoading: isSetlistActionLoading,
  appwriteError: setlistAppwriteError,
  appwriteNotice: setlistAppwriteNotice,
  fetchSetlists,
  createSetlist,
  updateSetlist,
  deleteSetlist,
  dbId,
  collectionId,
  bucketId
} = useAppwriteSetlist()

// Tab Navigation: Tab 1 = Setlist (first), Tab 2 = Jadwal Pertunjukan
const activeTab = ref<'setlists' | 'shows'>('setlists')

// ==========================================
// TAB 1: SETLIST STATE & METHODS (APPWRITE)
// ==========================================
const searchSetlist = ref('')
const setlistFeedback = ref<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

// Modal Add/Edit Setlist
const isSetlistModalOpen = ref(false)
const setlistModalMode = ref<'create' | 'edit'>('create')
const editingSetlistId = ref<string | null>(null)
const editingSetlistFileId = ref<string | undefined>(undefined)

// Modal Delete Setlist
const isDeleteSetlistModalOpen = ref(false)
const setlistToDelete = ref<SetlistItem | null>(null)

// Form Setlist: "image, judul indonesia, lalu judul jepang gitu aja"
const setlistForm = reactive({
  title_id: '',
  title_jp: '',
  image_preview: '',
  file: null as File | null
})
const setlistFileInputRef = ref<HTMLInputElement | null>(null)
const isSetlistDragging = ref(false)

const handleSetlistFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processSetlistImageFile(file)
  }
}

const handleSetlistDrop = (e: DragEvent) => {
  isSetlistDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    processSetlistImageFile(file)
  }
}

const processSetlistImageFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    setlistFeedback.value = { type: 'error', text: 'Berkas harus berupa gambar (JPG, PNG, WebP).' }
    return
  }
  setlistForm.file = file
  const reader = new FileReader()
  reader.onload = (e) => {
    setlistForm.image_preview = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const triggerSetlistFileInput = () => {
  setlistFileInputRef.value?.click()
}

const removeSetlistPhoto = () => {
  setlistForm.file = null
  setlistForm.image_preview = ''
  if (setlistFileInputRef.value) {
    setlistFileInputRef.value.value = ''
  }
}

const openCreateSetlistModal = () => {
  setlistModalMode.value = 'create'
  editingSetlistId.value = null
  editingSetlistFileId.value = undefined
  setlistForm.title_id = ''
  setlistForm.title_jp = ''
  setlistForm.image_preview = ''
  setlistForm.file = null
  if (setlistFileInputRef.value) {
    setlistFileInputRef.value.value = ''
  }
  isSetlistModalOpen.value = true
}

const openEditSetlistModal = (item: SetlistItem) => {
  setlistModalMode.value = 'edit'
  editingSetlistId.value = item.$id || String(item.id)
  editingSetlistFileId.value = item.file_id
  setlistForm.title_id = item.title_id
  setlistForm.title_jp = item.title_jp
  setlistForm.image_preview = item.image_url
  setlistForm.file = null
  if (setlistFileInputRef.value) {
    setlistFileInputRef.value.value = ''
  }
  isSetlistModalOpen.value = true
}

const handleSaveSetlist = async () => {
  if (!setlistForm.title_id.trim()) {
    setlistFeedback.value = { type: 'error', text: 'Judul Indonesia tidak boleh kosong.' }
    return
  }
  if (!setlistForm.title_jp.trim()) {
    setlistFeedback.value = { type: 'error', text: 'Judul Jepang tidak boleh kosong.' }
    return
  }

  if (setlistModalMode.value === 'create') {
    const res = await createSetlist({
      title_id: setlistForm.title_id,
      title_jp: setlistForm.title_jp,
      file: setlistForm.file || undefined,
      image_url: setlistForm.image_preview || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80'
    })

    if (res.success) {
      setlistFeedback.value = {
        type: 'success',
        text: `Setlist "${setlistForm.title_id}" berhasil disimpan ke Appwrite!`
      }
      isSetlistModalOpen.value = false
    } else {
      setlistFeedback.value = { type: 'error', text: res.error || 'Gagal menyimpan ke Appwrite.' }
    }
  } else if (setlistModalMode.value === 'edit' && editingSetlistId.value) {
    const res = await updateSetlist(editingSetlistId.value, {
      title_id: setlistForm.title_id,
      title_jp: setlistForm.title_jp,
      file: setlistForm.file || undefined,
      image_url: setlistForm.image_preview,
      file_id: editingSetlistFileId.value
    })

    if (res.success) {
      setlistFeedback.value = {
        type: 'success',
        text: `Setlist "${setlistForm.title_id}" berhasil diperbarui!`
      }
      isSetlistModalOpen.value = false
    } else {
      setlistFeedback.value = { type: 'error', text: res.error || 'Gagal memperbarui setlist.' }
    }
  }

  setTimeout(() => {
    setlistFeedback.value = null
  }, 4000)
}

const confirmDeleteSetlist = (item: SetlistItem) => {
  setlistToDelete.value = item
  isDeleteSetlistModalOpen.value = true
}

const handleDeleteSetlist = async () => {
  if (!setlistToDelete.value) return
  const targetId = setlistToDelete.value.$id || String(setlistToDelete.value.id)
  const fileId = setlistToDelete.value.file_id
  const title = setlistToDelete.value.title_id

  const res = await deleteSetlist(targetId, fileId)
  if (res.success) {
    setlistFeedback.value = { type: 'success', text: `Setlist "${title}" berhasil dihapus dari Appwrite.` }
  } else {
    setlistFeedback.value = { type: 'error', text: res.error || 'Gagal menghapus setlist.' }
  }

  isDeleteSetlistModalOpen.value = false
  setlistToDelete.value = null
  setTimeout(() => {
    setlistFeedback.value = null
  }, 3500)
}

const filteredSetlists = computed(() => {
  if (!searchSetlist.value.trim()) return setlists.value
  const q = searchSetlist.value.toLowerCase()
  return setlists.value.filter(
    s => s.title_id.toLowerCase().includes(q) || s.title_jp.toLowerCase().includes(q)
  )
})

// ==========================================
// TAB 2: JADWAL SHOW STATE & METHODS
// ==========================================
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
    description: 'Pertunjukan penuh energi dan kesegaran masa muda khas setlist Ramune no Nomikata.',
    lineup: [
      'Freya Jayawardana', 'Angelina Christy', 'Shania Gracia', 'Azizi Asadel',
      'Marsha Lenathea', 'Feni Fitriyanti', 'Gita Sekar', 'Mutiara Azzahra'
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
    description: 'Setlist legendaris yang membawakan lagu-lagu nostalgia.',
    lineup: [
      'Gita Sekar', 'Mutiara Azzahra', 'Marsha Lenathea', 'Feni Fitriyanti',
      'Kathrina Irene', 'Jessi', 'Lulu Salsabila', 'Indah Cahya'
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
    description: 'Pertunjukan malam penuh semangat dengan antusiasme penonton di teater.',
    lineup: [
      'Freya Jayawardana', 'Christy', 'Gracia', 'Zee',
      'Marsha', 'Feni', 'Gita', 'Muthe'
    ]
  }
]

const shows = ref<ShowItem[]>([])
const searchShowQuery = ref('')
const selectedCategory = ref('Semua')
const showFeedback = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Modal Add/Edit Show
const isShowModalOpen = ref(false)
const showModalMode = ref<'create' | 'edit'>('create')
const editingShowId = ref<number | string | null>(null)

// Modal Delete Show
const isDeleteShowModalOpen = ref(false)
const showToDelete = ref<ShowItem | null>(null)

// Modal View Lineup
const isLineupModalOpen = ref(false)
const selectedShowForLineup = ref<ShowItem | null>(null)

const showForm = reactive({
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
  fetchSetlists()
})

const filteredShows = computed(() => {
  return shows.value.filter((show) => {
    const matchCategory = selectedCategory.value === 'Semua' || show.category === selectedCategory.value
    const matchSearch =
      searchShowQuery.value.trim() === '' ||
      show.title.toLowerCase().includes(searchShowQuery.value.toLowerCase()) ||
      show.originalTitle.toLowerCase().includes(searchShowQuery.value.toLowerCase()) ||
      show.date.toLowerCase().includes(searchShowQuery.value.toLowerCase())
    return matchCategory && matchSearch
  })
})

const openCreateShowModal = () => {
  showModalMode.value = 'create'
  editingShowId.value = null
  showForm.title = ''
  showForm.originalTitle = ''
  showForm.category = 'Regular Show'
  showForm.date = ''
  showForm.time = '19:00 WIB'
  showForm.type = 'Regular Evening Show'
  showForm.status = 'Jadwal Terkonfirmasi'
  showForm.description = ''
  showForm.lineupText = ''
  isShowModalOpen.value = true
}

const openEditShowModal = (show: ShowItem) => {
  showModalMode.value = 'edit'
  editingShowId.value = show.id
  showForm.title = show.title
  showForm.originalTitle = show.originalTitle
  showForm.category = show.category
  showForm.date = show.date
  showForm.time = show.time
  showForm.type = show.type
  showForm.status = show.status
  showForm.description = show.description
  showForm.lineupText = show.lineup.join(', ')
  isShowModalOpen.value = true
}

const handleSaveShow = () => {
  if (!showForm.title.trim() || !showForm.date.trim()) {
    showFeedback.value = { type: 'error', text: 'Judul dan tanggal pertunjukan wajib diisi.' }
    return
  }

  const parsedLineup = showForm.lineupText
    .split(',')
    .map(name => name.trim())
    .filter(Boolean)

  let statusColor: 'primary' | 'warning' | 'success' | 'neutral' = 'primary'
  if (showForm.category === 'Spesial Seitansai') statusColor = 'success'
  else if (showForm.status.toLowerCase().includes('siang')) statusColor = 'warning'
  else if (showForm.category === 'Trainee Stage') statusColor = 'neutral'

  if (showModalMode.value === 'create') {
    const newShow: ShowItem = {
      id: Date.now(),
      title: showForm.title.trim(),
      originalTitle: showForm.originalTitle.trim() || showForm.title.trim(),
      category: showForm.category,
      date: showForm.date.trim(),
      time: showForm.time.trim() || '19:00 WIB',
      type: showForm.type.trim() || 'Evening Show',
      status: showForm.status.trim() || 'Jadwal Terkonfirmasi',
      statusColor,
      description: showForm.description.trim() || 'Pertunjukan teater mendatang.',
      lineup: parsedLineup.length ? parsedLineup : ['Lineup menyusul']
    }
    shows.value.unshift(newShow)
    showFeedback.value = { type: 'success', text: `Pertunjukan "${newShow.title}" berhasil ditambahkan!` }
  } else if (showModalMode.value === 'edit' && editingShowId.value !== null) {
    const idx = shows.value.findIndex(s => s.id === editingShowId.value)
    if (idx !== -1) {
      shows.value[idx] = {
        ...shows.value[idx],
        title: showForm.title.trim(),
        originalTitle: showForm.originalTitle.trim() || showForm.title.trim(),
        category: showForm.category,
        date: showForm.date.trim(),
        time: showForm.time.trim(),
        type: showForm.type.trim(),
        status: showForm.status.trim(),
        statusColor,
        description: showForm.description.trim(),
        lineup: parsedLineup.length ? parsedLineup : shows.value[idx].lineup
      }
      showFeedback.value = { type: 'success', text: `Pertunjukan "${showForm.title}" berhasil diperbarui!` }
    }
  }

  saveShows()
  isShowModalOpen.value = false
  setTimeout(() => { showFeedback.value = null }, 3500)
}

const confirmDeleteShow = (show: ShowItem) => {
  showToDelete.value = show
  isDeleteShowModalOpen.value = true
}

const handleDeleteShow = () => {
  if (!showToDelete.value) return
  shows.value = shows.value.filter(s => s.id !== showToDelete.value?.id)
  saveShows()
  showFeedback.value = { type: 'success', text: `Pertunjukan "${showToDelete.value.title}" telah dihapus.` }
  isDeleteShowModalOpen.value = false
  showToDelete.value = null
  setTimeout(() => { showFeedback.value = null }, 3500)
}

const viewLineup = (show: ShowItem) => {
  selectedShowForLineup.value = show
  isLineupModalOpen.value = true
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 w-full max-w-7xl mx-auto">
    <!-- State 1: Verifikasi Sesi Sedang Berjalan -->
    <div v-if="isAuthLoading && !isInitialized" class="py-20 text-center space-y-3">
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
            Kelola data setlist (database & storage Appwrite) dan jadwal pertunjukan panggung.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Button Tambah sesuai tab aktif -->
          <UButton
            v-if="activeTab === 'setlists'"
            color="primary"
            variant="solid"
            size="md"
            class="rounded-xl font-bold cursor-pointer shadow-md shadow-primary/25"
            @click="openCreateSetlistModal"
          >
            <template #leading>
              <UIcon name="i-lucide-plus" class="w-4 h-4" />
            </template>
            Tambah Setlist
          </UButton>

          <UButton
            v-else
            color="primary"
            variant="solid"
            size="md"
            class="rounded-xl font-bold cursor-pointer shadow-md shadow-primary/25"
            @click="openCreateShowModal"
          >
            <template #leading>
              <UIcon name="i-lucide-plus" class="w-4 h-4" />
            </template>
            Tambah Show
          </UButton>
        </div>
      </div>

      <!-- Tab Navigation System: Tab 1 = Setlist, Tab 2 = Jadwal Show -->
      <div class="space-y-6">
        <div class="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3 overflow-x-auto">
          <!-- Tab 1: Setlist (First Tab as requested) -->
          <button
            type="button"
            :class="[
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'setlists'
                ? 'bg-primary text-white shadow-sm shadow-primary/25'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            ]"
            @click="activeTab = 'setlists'"
          >
            <UIcon name="i-lucide-disc-3" class="w-4 h-4" />
            <span>Setlist</span>
            <UBadge
              v-if="setlists.length"
              :color="activeTab === 'setlists' ? 'neutral' : 'primary'"
              :variant="activeTab === 'setlists' ? 'subtle' : 'solid'"
              size="xs"
              class="ml-1 text-[10px]"
            >
              {{ setlists.length }}
            </UBadge>
          </button>

          <!-- Tab 2: Jadwal Pertunjukan -->
          <button
            type="button"
            :class="[
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'shows'
                ? 'bg-primary text-white shadow-sm shadow-primary/25'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            ]"
            @click="activeTab = 'shows'"
          >
            <UIcon name="i-lucide-calendar-days" class="w-4 h-4" />
            <span>Jadwal Pertunjukan</span>
            <UBadge
              v-if="shows.length"
              :color="activeTab === 'shows' ? 'neutral' : 'primary'"
              :variant="activeTab === 'shows' ? 'subtle' : 'solid'"
              size="xs"
              class="ml-1 text-[10px]"
            >
              {{ shows.length }}
            </UBadge>
          </button>
        </div>

        <!-- ============================================== -->
        <!-- TAB 1 CONTENT: SETLIST MANAGEMENT (APPWRITE)    -->
        <!-- ============================================== -->
        <div v-if="activeTab === 'setlists'" class="space-y-6">
          <!-- Notice / Error feedback -->
          <div
            v-if="setlistFeedback"
            :class="[
              'p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between border',
              setlistFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <UIcon
                :name="setlistFeedback.type === 'success' ? 'i-lucide-check-circle-2' : 'i-lucide-alert-circle'"
                class="w-5 h-5 flex-shrink-0"
              />
              <span>{{ setlistFeedback.text }}</span>
            </div>
            <button type="button" class="text-neutral-400 hover:text-neutral-600 cursor-pointer" @click="setlistFeedback = null">
              <UIcon name="i-lucide-x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Appwrite Configuration Helper Note -->
          <div
            v-if="setlistAppwriteNotice"
            class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-3"
          >
            <UIcon name="i-lucide-database" class="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
            <div class="space-y-1">
              <div class="font-bold">Koneksi Appwrite Database & Storage:</div>
              <p class="leading-relaxed">{{ setlistAppwriteNotice }}</p>
              <p class="text-[11px] opacity-80 pt-0.5">
                Pastikan Database (<code>{{ dbId }}</code>), Collection (<code>{{ collectionId }}</code>), dan Bucket (<code>{{ bucketId }}</code>) telah dibuat di Appwrite Console.
              </p>
            </div>
          </div>

          <!-- Setlist Search & Bar -->
          <div class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div class="w-full sm:w-80">
              <UInput
                v-model="searchSetlist"
                placeholder="Cari judul Indonesia atau Jepang..."
                icon="i-lucide-search"
                size="sm"
                class="w-full"
              />
            </div>

            <div class="flex items-center gap-2">
              <UButton
                color="neutral"
                variant="subtle"
                size="xs"
                class="rounded-xl cursor-pointer"
                :loading="isSetlistsLoading"
                @click="fetchSetlists"
              >
                <template #leading>
                  <UIcon name="i-lucide-refresh-cw" class="w-3.5 h-3.5" />
                </template>
                Segarkan Data
              </UButton>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isSetlistsLoading && !setlists.length" class="py-16 text-center text-xs text-neutral-500">
            <UIcon name="i-lucide-loader-2" class="w-7 h-7 animate-spin text-primary mx-auto mb-2" />
            Memuat data setlist dari Appwrite...
          </div>

          <!-- Empty State -->
          <div
            v-else-if="!filteredSetlists.length"
            class="p-12 text-center rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3"
          >
            <UIcon name="i-lucide-disc-3" class="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto" />
            <p class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Belum ada data setlist yang sesuai.</p>
            <p class="text-xs text-neutral-400">Klik tombol "Tambah Setlist" untuk menambahkan poster dan data setlist baru.</p>
          </div>

          <!-- Setlists Grid Cards: Image, Judul Indonesia, Judul Jepang -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div
              v-for="item in filteredSetlists"
              :key="item.$id || item.id"
              class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              <!-- Poster / Image -->
              <div class="relative aspect-video sm:aspect-4/3 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  :alt="item.title_id"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-neutral-400">
                  <UIcon name="i-lucide-image" class="w-10 h-10" />
                </div>

                <div class="absolute top-2.5 right-2.5">
                  <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                    Setlist
                  </span>
                </div>
              </div>

              <!-- Information: Judul Indonesia & Judul Jepang -->
              <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div class="space-y-1">
                  <!-- Judul Indonesia -->
                  <h4 class="font-extrabold text-base text-neutral-900 dark:text-white leading-snug">
                    {{ item.title_id }}
                  </h4>
                  <!-- Judul Jepang -->
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 italic">
                    {{ item.title_jp }}
                  </p>
                </div>

                <!-- Actions: Edit & Hapus -->
                <div class="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <UButton
                    color="neutral"
                    variant="subtle"
                    size="xs"
                    class="rounded-xl font-bold cursor-pointer"
                    @click="openEditSetlistModal(item)"
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
                    class="text-red-500 hover:bg-red-500/10 rounded-xl cursor-pointer"
                    title="Hapus Setlist"
                    @click="confirmDeleteSetlist(item)"
                  >
                    <template #leading>
                      <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
                    </template>
                    Hapus
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================== -->
        <!-- TAB 2 CONTENT: JADWAL SHOW MANAGEMENT          -->
        <!-- ============================================== -->
        <div v-if="activeTab === 'shows'" class="space-y-6">
          <!-- Alert Feedback -->
          <div
            v-if="showFeedback"
            :class="[
              'p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between border',
              showFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <UIcon
                :name="showFeedback.type === 'success' ? 'i-lucide-check-circle-2' : 'i-lucide-alert-circle'"
                class="w-5 h-5 flex-shrink-0"
              />
              <span>{{ showFeedback.text }}</span>
            </div>
            <button type="button" class="text-neutral-400 hover:text-neutral-600 cursor-pointer" @click="showFeedback = null">
              <UIcon name="i-lucide-x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Search & Category Filters -->
          <div class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div class="w-full md:w-80">
              <UInput
                v-model="searchShowQuery"
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

          <!-- Shows Table -->
          <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs overflow-hidden">
            <div class="p-5 sm:p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 class="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <UIcon name="i-lucide-list" class="w-4 h-4 text-primary" />
                  Daftar Pertunjukan
                </h3>
                <p class="text-xs text-neutral-500 mt-0.5">Menampilkan {{ filteredShows.length }} jadwal pertunjukan.</p>
              </div>
            </div>

            <div v-if="!filteredShows.length" class="p-12 text-center space-y-3">
              <UIcon name="i-lucide-calendar-x" class="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto" />
              <p class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Tidak ada pertunjukan yang cocok.</p>
            </div>

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
                    <td class="py-4 px-4 sm:px-6">
                      <div class="font-bold text-neutral-900 dark:text-white">{{ show.title }}</div>
                      <div class="text-[11px] text-neutral-400 italic">{{ show.originalTitle }}</div>
                    </td>
                    <td class="py-4 px-4 whitespace-nowrap">
                      <span class="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {{ show.category }}
                      </span>
                    </td>
                    <td class="py-4 px-4 whitespace-nowrap">
                      <div class="font-semibold text-neutral-900 dark:text-white">{{ show.date }}</div>
                      <div class="text-[11px] text-primary font-mono font-bold">{{ show.time }}</div>
                    </td>
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
                    <td class="py-4 px-4 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end gap-1.5">
                        <UButton
                          color="neutral"
                          variant="ghost"
                          size="xs"
                          class="rounded-lg cursor-pointer"
                          @click="openEditShowModal(show)"
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
                          @click="confirmDeleteShow(show)"
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
      </div>
    </div>

    <!-- ============================================== -->
    <!-- MODAL 1: TAMBAH / EDIT SETLIST (IMAGE, ID, JP) -->
    <!-- ============================================== -->
    <UModal
      v-model:open="isSetlistModalOpen"
      :title="setlistModalMode === 'create' ? 'Tambah Setlist Baru' : 'Edit Setlist'"
    >
      <template #content>
        <form class="space-y-5 p-5 sm:p-6" @submit.prevent="handleSaveSetlist">
          <!-- 1. Foto / Image Setlist (Appwrite Storage) -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 block uppercase tracking-wider">
              Foto / Poster Setlist (Appwrite Storage)
            </label>

            <div
              :class="[
                'p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-center gap-4',
                isSetlistDragging
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40'
              ]"
              @dragover.prevent="isSetlistDragging = true"
              @dragleave.prevent="isSetlistDragging = false"
              @drop.prevent="handleSetlistDrop"
            >
              <!-- Image Preview Box -->
              <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex-shrink-0 flex items-center justify-center border border-white dark:border-neutral-600 shadow-xs">
                <img
                  v-if="setlistForm.image_preview"
                  :src="setlistForm.image_preview"
                  alt="Preview Setlist"
                  class="w-full h-full object-cover"
                />
                <UIcon v-else name="i-lucide-image" class="w-8 h-8 text-neutral-400" />
              </div>

              <!-- Action button & notes -->
              <div class="space-y-2 text-center sm:text-left flex-1 min-w-0">
                <input
                  ref="setlistFileInputRef"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  class="hidden"
                  @change="handleSetlistFileChange"
                />

                <div class="flex items-center justify-center sm:justify-start gap-2">
                  <UButton
                    type="button"
                    color="primary"
                    variant="solid"
                    size="xs"
                    class="rounded-xl font-bold cursor-pointer shadow-xs"
                    @click="triggerSetlistFileInput"
                  >
                    <template #leading>
                      <UIcon name="i-lucide-upload" class="w-3.5 h-3.5" />
                    </template>
                    {{ setlistForm.image_preview ? 'Ganti Foto' : 'Pilih Foto' }}
                  </UButton>

                  <UButton
                    v-if="setlistForm.image_preview"
                    type="button"
                    color="neutral"
                    variant="outline"
                    size="xs"
                    class="text-red-500 rounded-xl cursor-pointer"
                    @click="removeSetlistPhoto"
                  >
                    Hapus
                  </UButton>
                </div>

                <p class="text-[11px] text-neutral-400 dark:text-neutral-500 leading-snug">
                  Tarik gambar ke sini atau klik pilih. Berkas foto akan otomatis diunggah ke Appwrite Storage bucket.
                </p>
              </div>
            </div>
          </div>

          <!-- 2. Judul Indonesia -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
              Judul Indonesia *
            </label>
            <UInput
              v-model="setlistForm.title_id"
              placeholder="Contoh: Cara Meminum Ramune"
              icon="i-lucide-disc-3"
              size="sm"
              class="w-full"
              required
            />
          </div>

          <!-- 3. Judul Jepang -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
              Judul Jepang *
            </label>
            <UInput
              v-model="setlistForm.title_jp"
              placeholder="Contoh: Ramune no Nomikata (ラムネの飲み方)"
              icon="i-lucide-globe"
              size="sm"
              class="w-full"
              required
            />
          </div>

          <!-- Footer Buttons -->
          <div class="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
            <UButton
              type="button"
              color="neutral"
              variant="subtle"
              size="sm"
              class="rounded-xl cursor-pointer"
              @click="isSetlistModalOpen = false"
            >
              Batal
            </UButton>
            <UButton
              type="submit"
              color="primary"
              variant="solid"
              size="sm"
              class="rounded-xl font-bold cursor-pointer shadow-sm shadow-primary/20"
              :loading="isSetlistActionLoading"
            >
              <template #leading>
                <UIcon name="i-lucide-database" class="w-4 h-4" />
              </template>
              {{ setlistModalMode === 'create' ? 'Simpan ke Appwrite' : 'Perbarui Setlist' }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <!-- MODAL: Konfirmasi Hapus Setlist -->
    <UModal v-model:open="isDeleteSetlistModalOpen" title="Hapus Setlist dari Appwrite">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-bold text-sm text-neutral-900 dark:text-white">
                Hapus setlist "{{ setlistToDelete?.title_id }}"?
              </h4>
              <p class="text-xs text-neutral-500 mt-1 leading-relaxed">
                Dokumen pada Database Appwrite dan berkas gambar di Appwrite Storage akan dihapus secara permanen.
              </p>
            </div>
          </div>

          <div class="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
            <UButton
              color="neutral"
              variant="subtle"
              size="sm"
              class="rounded-xl cursor-pointer"
              @click="isDeleteSetlistModalOpen = false"
            >
              Batal
            </UButton>
            <UButton
              color="error"
              variant="solid"
              size="sm"
              class="rounded-xl font-bold cursor-pointer"
              :loading="isSetlistActionLoading"
              @click="handleDeleteSetlist"
            >
              Ya, Hapus
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- MODAL: Tambah / Edit Show (Jadwal) -->
    <UModal v-model:open="isShowModalOpen" :title="showModalMode === 'create' ? 'Tambah Jadwal Show' : 'Edit Jadwal Show'">
      <template #content>
        <form class="space-y-4 p-5 sm:p-6" @submit.prevent="handleSaveShow">
          <div class="space-y-1">
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Nama Setlist / Judul Show *</label>
            <UInput v-model="showForm.title" placeholder="Contoh: Cara Meminum Ramune" required size="sm" class="w-full" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Judul Asli (Kanji/Romaji)</label>
            <UInput v-model="showForm.originalTitle" placeholder="Contoh: Ramune no Nomikata" size="sm" class="w-full" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Kategori</label>
              <select
                v-model="showForm.category"
                class="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              >
                <option v-for="opt in categoryOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Status Show</label>
              <UInput v-model="showForm.status" placeholder="Jadwal Terkonfirmasi / Show Siang" size="sm" class="w-full" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Tanggal Pertunjukan *</label>
              <UInput v-model="showForm.date" placeholder="Contoh: Jumat, 3 Oktober 2026" required size="sm" class="w-full" />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Waktu (WIB)</label>
              <UInput v-model="showForm.time" placeholder="Contoh: 19:00 WIB" size="sm" class="w-full" />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Deskripsi Ringkas</label>
            <textarea
              v-model="showForm.description"
              rows="2"
              placeholder="Deskripsi singkat tentang setlist dan suasana show..."
              class="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Lineup Member (Pisahkan dengan koma)</label>
            <textarea
              v-model="showForm.lineupText"
              rows="2"
              placeholder="Freya Jayawardana, Angelina Christy, Shania Gracia, ..."
              class="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none"
            />
          </div>

          <div class="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
            <UButton
              type="button"
              color="neutral"
              variant="subtle"
              size="sm"
              class="rounded-xl cursor-pointer"
              @click="isShowModalOpen = false"
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
              {{ showModalMode === 'create' ? 'Tambah Show' : 'Simpan Perubahan' }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <!-- MODAL: Konfirmasi Hapus Show -->
    <UModal v-model:open="isDeleteShowModalOpen" title="Konfirmasi Hapus Pertunjukan">
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
                Pertunjukan pada tanggal <strong>{{ showToDelete?.date }}</strong> akan dihapus dari daftar jadwal show.
              </p>
            </div>
          </div>

          <div class="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
            <UButton
              color="neutral"
              variant="subtle"
              size="sm"
              class="rounded-xl cursor-pointer"
              @click="isDeleteShowModalOpen = false"
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
