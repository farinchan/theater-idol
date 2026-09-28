<script setup lang="ts">
import type { SetlistItem } from '~/composables/useAppwriteSetlist'
import type { ShowItem } from '~/composables/useAppwriteShow'

const router = useRouter()
const { user, isAdmin, isLoading: isAuthLoading, isInitialized } = useAppwriteAuth()

// Composable Setlist (Tab 1)
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
  tableId,
  bucketId
} = useAppwriteSetlist()

// Composable Show (Tab 2)
const {
  shows,
  isLoading: isShowsLoading,
  isActionLoading: isShowActionLoading,
  appwriteError: showAppwriteError,
  appwriteNotice: showAppwriteNotice,
  fetchShows,
  createShow,
  updateShow,
  deleteShow,
  showTableId
} = useAppwriteShow()

// Tab Navigation: Tab 1 = Setlist, Tab 2 = Jadwal Pertunjukan
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

// Form Setlist: Image, Judul Indonesia, Judul Jepang
const setlistForm = reactive({
  title_id: '',
  title_jp: '',
  image_preview: '',
  file: null as File | null
})
const setlistFileInputRef = ref<HTMLInputElement | null>(null)
const isSetlistDragging = ref(false)

const openCreateSetlistModal = () => {
  setlistModalMode.value = 'create'
  editingSetlistId.value = null
  editingSetlistFileId.value = undefined
  setlistForm.title_id = ''
  setlistForm.title_jp = ''
  setlistForm.image_preview = ''
  setlistForm.file = null
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
  isSetlistModalOpen.value = true
}

const handleSetlistFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processSetlistPhotoFile(file)
  }
}

const handleSetlistDrop = (e: DragEvent) => {
  isSetlistDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    processSetlistPhotoFile(file)
  }
}

const processSetlistPhotoFile = (file: File) => {
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

const handleSaveSetlist = async () => {
  if (!setlistForm.title_id.trim()) {
    setlistFeedback.value = { type: 'error', text: 'Judul Indonesia wajib diisi.' }
    return
  }
  if (!setlistForm.title_jp.trim()) {
    setlistFeedback.value = { type: 'error', text: 'Judul Jepang wajib diisi.' }
    return
  }

  if (setlistModalMode.value === 'create') {
    const res = await createSetlist({
      title_id: setlistForm.title_id,
      title_jp: setlistForm.title_jp,
      file: setlistForm.file || undefined,
      image_url: setlistForm.image_preview || undefined
    })

    if (res.success) {
      setlistFeedback.value = {
        type: 'success',
        text: `Setlist "${setlistForm.title_id}" berhasil ditambahkan!`
      }
    } else {
      setlistFeedback.value = { type: 'error', text: res.error || 'Gagal menambahkan setlist.' }
    }
  } else if (setlistModalMode.value === 'edit' && editingSetlistId.value) {
    const res = await updateSetlist(editingSetlistId.value, {
      title_id: setlistForm.title_id,
      title_jp: setlistForm.title_jp,
      file: setlistForm.file || undefined,
      image_url: setlistForm.image_preview || undefined,
      file_id: editingSetlistFileId.value
    })

    if (res.success) {
      setlistFeedback.value = {
        type: 'success',
        text: `Setlist "${setlistForm.title_id}" berhasil diperbarui!`
      }
    } else {
      setlistFeedback.value = { type: 'error', text: res.error || 'Gagal memperbarui setlist.' }
    }
  }

  isSetlistModalOpen.value = false
  setTimeout(() => {
    setlistFeedback.value = null
  }, 3500)
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
    setlistFeedback.value = { type: 'success', text: `Setlist "${title}" berhasil dihapus.` }
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
// TAB 2: SHOW STATE & METHODS (APPWRITE)
// Relasikan dengan: Setlist, Tanggal, Waktu, Deskripsi Ringkas, Lineup Member
// ==========================================
const searchShowQuery = ref('')
const showFeedback = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Modal Add/Edit Show
const isShowModalOpen = ref(false)
const showModalMode = ref<'create' | 'edit'>('create')
const editingShowId = ref<string | null>(null)

// Modal Delete Show
const isDeleteShowModalOpen = ref(false)
const showToDelete = ref<ShowItem | null>(null)

// Modal View Lineup
const isLineupModalOpen = ref(false)
const selectedShowForLineup = ref<ShowItem | null>(null)

// Form Show
const showForm = reactive({
  setlist_id: '',
  date: '',
  time: '19:00',
  description: '',
  lineupText: ''
})

// Helper: Format tanggal ke Bahasa Indonesia (Contoh: "Minggu, 4 Oktober 2026")
const formatIndonesianDate = (dateVal?: string): string => {
  if (!dateVal) return '-'
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return dateVal
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d)
  } catch {
    return dateVal
  }
}

// Helper: Format waktu ke WIB (Contoh: "19:00 WIB")
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

// Helper: Ekstrak YYYY-MM-DD untuk input date HTML
const getDateInputValue = (dateVal?: string): string => {
  if (!dateVal) return ''
  try {
    const d = new Date(dateVal)
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  } catch {}
  return dateVal.slice(0, 10)
}

// Helper: Ekstrak HH:mm untuk input time HTML
const getTimeInputValue = (timeVal?: string, dateVal?: string): string => {
  if (timeVal && timeVal.includes(':')) {
    return timeVal.slice(0, 5)
  }
  if (dateVal) {
    try {
      const d = new Date(dateVal)
      if (!isNaN(d.getTime())) {
        const h = String(d.getHours()).padStart(2, '0')
        const m = String(d.getMinutes()).padStart(2, '0')
        return `${h}:${m}`
      }
    } catch {}
  }
  return '19:00'
}

// Helper: ambil data setlist yang berelasi
const getRelatedSetlist = (setlistId?: string): SetlistItem | null => {
  if (!setlistId) return null
  return setlists.value.find(s => s.$id === setlistId || String(s.id) === String(setlistId)) || null
}

// Helper: parse string lineup ke array
const getLineupList = (lineupStr?: string): string[] => {
  if (!lineupStr) return []
  return lineupStr.split(',').map(s => s.trim()).filter(Boolean)
}

// Setlist terpilih pada form modal
const selectedFormSetlist = computed(() => {
  return getRelatedSetlist(showForm.setlist_id)
})

const filteredShows = computed(() => {
  return shows.value.filter((show) => {
    const related = getRelatedSetlist(show.setlist_id)
    const titleId = related?.title_id || ''
    const titleJp = related?.title_jp || ''
    const formattedDate = formatIndonesianDate(show.date).toLowerCase()
    const query = searchShowQuery.value.trim().toLowerCase()

    if (!query) return true

    return (
      titleId.toLowerCase().includes(query) ||
      titleJp.toLowerCase().includes(query) ||
      show.date.toLowerCase().includes(query) ||
      formattedDate.includes(query) ||
      show.time.toLowerCase().includes(query) ||
      (show.description && show.description.toLowerCase().includes(query)) ||
      (show.lineup && show.lineup.toLowerCase().includes(query))
    )
  })
})

const openCreateShowModal = () => {
  showModalMode.value = 'create'
  editingShowId.value = null
  showForm.setlist_id = setlists.value[0]?.$id || String(setlists.value[0]?.id || '')

  // Set default ke hari ini (YYYY-MM-DD)
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  showForm.date = `${year}-${month}-${day}`
  showForm.time = '19:00'
  showForm.description = ''
  showForm.lineupText = ''
  isShowModalOpen.value = true
}

const openEditShowModal = (show: ShowItem) => {
  showModalMode.value = 'edit'
  editingShowId.value = show.$id || String(show.id)
  showForm.setlist_id = show.setlist_id
  showForm.date = getDateInputValue(show.date)
  showForm.time = getTimeInputValue(show.time, show.date)
  showForm.description = show.description || ''
  showForm.lineupText = show.lineup || ''
  isShowModalOpen.value = true
}

const handleSaveShow = async () => {
  if (!showForm.setlist_id) {
    showFeedback.value = { type: 'error', text: 'Pilih setlist terlebih dahulu.' }
    return
  }
  if (!showForm.date.trim()) {
    showFeedback.value = { type: 'error', text: 'Tanggal pertunjukan wajib diisi.' }
    return
  }

  if (showModalMode.value === 'create') {
    const res = await createShow({
      setlist_id: showForm.setlist_id,
      date: showForm.date.trim(),
      time: showForm.time.trim() || '19:00 WIB',
      description: showForm.description.trim(),
      lineup: showForm.lineupText.trim()
    })

    if (res.success) {
      showFeedback.value = {
        type: 'success',
        text: 'Jadwal pertunjukan berhasil ditambahkan!'
      }
    } else {
      showFeedback.value = { type: 'error', text: res.error || 'Gagal menambahkan show.' }
    }
  } else if (showModalMode.value === 'edit' && editingShowId.value) {
    const res = await updateShow(editingShowId.value, {
      setlist_id: showForm.setlist_id,
      date: showForm.date.trim(),
      time: showForm.time.trim(),
      description: showForm.description.trim(),
      lineup: showForm.lineupText.trim()
    })

    if (res.success) {
      showFeedback.value = {
        type: 'success',
        text: 'Jadwal pertunjukan berhasil diperbarui!'
      }
    } else {
      showFeedback.value = { type: 'error', text: res.error || 'Gagal memperbarui show.' }
    }
  }

  isShowModalOpen.value = false
  setTimeout(() => { showFeedback.value = null }, 3500)
}

const confirmDeleteShow = (show: ShowItem) => {
  showToDelete.value = show
  isDeleteShowModalOpen.value = true
}

const handleDeleteShow = async () => {
  if (!showToDelete.value) return
  const targetId = showToDelete.value.$id || String(showToDelete.value.id)
  const res = await deleteShow(targetId)

  if (res.success) {
    showFeedback.value = { type: 'success', text: 'Jadwal pertunjukan berhasil dihapus.' }
  } else {
    showFeedback.value = { type: 'error', text: res.error || 'Gagal menghapus pertunjukan.' }
  }

  isDeleteShowModalOpen.value = false
  showToDelete.value = null
  setTimeout(() => { showFeedback.value = null }, 3500)
}

const viewLineup = (show: ShowItem) => {
  selectedShowForLineup.value = show
  isLineupModalOpen.value = true
}

// Inisialisasi data
onMounted(() => {
  fetchSetlists()
  fetchShows()
})

// Proteksi Halaman Admin
watch([isAuthLoading, isInitialized, user], () => {
  if (isInitialized.value && !isAuthLoading.value) {
    if (!user.value || !isAdmin.value) {
      router.replace('/')
    }
  }
}, { immediate: true })
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- Header (Mengikuti style halaman jadwal & stream) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold text-primary tracking-wide uppercase">
          <UIcon name="i-lucide-shield-check" class="w-3.5 h-3.5" />
          Panel Admin
        </div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight mt-1 flex items-center gap-3">
          <UIcon name="i-lucide-calendar-cog" class="w-8 h-8 text-primary" />
          Management Show
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Kelola daftar setlist teater dan jadwal pertunjukan panggung mendatang.
        </p>
      </div>

      <!-- Tombol Aksi Tambah Sesuai Tab Aktif -->
      <div v-if="user && isAdmin" class="flex items-center gap-3">
        <UButton
          v-if="activeTab === 'setlists'"
          color="primary"
          variant="solid"
          size="md"
          class="rounded-xl font-bold cursor-pointer shadow-sm shadow-primary/30"
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
          class="rounded-xl font-bold cursor-pointer shadow-sm shadow-primary/30"
          @click="openCreateShowModal"
        >
          <template #leading>
            <UIcon name="i-lucide-plus" class="w-4 h-4" />
          </template>
          Tambah Jadwal Show
        </UButton>
      </div>
    </div>

    <!-- State Loading Autentikasi -->
    <div v-if="isAuthLoading || !isInitialized" class="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span class="text-xs font-semibold text-neutral-500">Memverifikasi hak akses admin...</span>
    </div>

    <!-- Konten Khusus Admin -->
    <div v-else-if="user && isAdmin" class="space-y-6">
      <!-- ============================================== -->
      <!-- TABBAR NAVIGASI: TAB 1 (SETLIST), TAB 2 (SHOW) -->
      <!-- ============================================== -->
      <div class="border-b border-neutral-200 dark:border-neutral-800">
        <div class="flex items-center gap-2 sm:gap-4">
          <!-- TAB 1: SETLIST -->
          <button
            type="button"
            :class="[
              'flex items-center gap-2.5 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'setlists'
                ? 'border-primary text-primary dark:text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            ]"
            @click="activeTab = 'setlists'"
          >
            <UIcon name="i-lucide-disc-3" class="w-4 h-4" />
            <span>Setlist Teater</span>
            <span
              class="px-2 py-0.5 rounded-full text-[11px] font-bold"
              :class="activeTab === 'setlists' ? 'bg-primary/10 text-primary' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'"
            >
              {{ setlists.length }}
            </span>
          </button>

          <!-- TAB 2: JADWAL SHOW (RELASI SETLIST) -->
          <button
            type="button"
            :class="[
              'flex items-center gap-2.5 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'shows'
                ? 'border-primary text-primary dark:text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            ]"
            @click="activeTab = 'shows'"
          >
            <UIcon name="i-lucide-calendar-days" class="w-4 h-4" />
            <span>Jadwal Pertunjukan</span>
            <span
              class="px-2 py-0.5 rounded-full text-[11px] font-bold"
              :class="activeTab === 'shows' ? 'bg-primary/10 text-primary' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'"
            >
              {{ shows.length }}
            </span>
          </button>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- TAB 1 CONTENT: SETLIST (IMAGE, JUDUL ID, JP)   -->
      <!-- ============================================== -->
      <div v-if="activeTab === 'setlists'" class="space-y-6">
        <!-- Notifikasi Banner Feedback -->
        <div
          v-if="setlistFeedback"
          :class="[
            'p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 transition-all',
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

        <!-- Setlist Search & Bar -->
        <div class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div class="w-full sm:w-80">
            <UInput
              v-model="searchSetlist"
              placeholder="Cari judul Indonesia atau Jepang..."
              icon="i-lucide-search"
              size="sm"
              class="w-full"
            />
          </div>
        </div>

        <!-- Grid Kartu Setlist -->
        <div v-if="isSetlistsLoading" class="p-12 text-center space-y-3">
          <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p class="text-xs text-neutral-500">Memuat data setlist...</p>
        </div>

        <div v-else-if="!filteredSetlists.length" class="p-12 text-center rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
          <UIcon name="i-lucide-disc-3" class="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto" />
          <p class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Belum ada data setlist.</p>
          <UButton
            color="primary"
            variant="soft"
            size="sm"
            class="rounded-xl cursor-pointer"
            @click="openCreateSetlistModal"
          >
            Tambah Setlist Pertama
          </UButton>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <div
            v-for="item in filteredSetlists"
            :key="item.$id || item.id"
            class="group rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col"
          >
            <!-- Poster Foto Setlist -->
            <div class="relative aspect-4/3 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <img
                v-if="item.image_url"
                :src="item.image_url"
                :alt="item.title_id"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex flex-col items-center justify-center text-neutral-400 gap-1.5 p-4 text-center">
                <UIcon name="i-lucide-image" class="w-8 h-8" />
                <span class="text-[11px]">Tanpa Poster</span>
              </div>

              <div class="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white font-medium">
                <UIcon name="i-lucide-disc-3" class="w-3 h-3 text-primary" />
                <span>Setlist</span>
              </div>
            </div>

            <!-- Detail Setlist: Judul Indonesia & Judul Jepang -->
            <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div class="space-y-1.5">
                <h3 class="font-black text-base text-neutral-900 dark:text-white leading-snug line-clamp-2">
                  {{ item.title_id }}
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400 font-medium italic line-clamp-1">
                  {{ item.title_jp }}
                </p>
              </div>

              <!-- Tombol Aksi Edit & Hapus -->
              <div class="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-end gap-2">
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
                  color="error"
                  variant="subtle"
                  size="xs"
                  class="rounded-xl font-bold cursor-pointer"
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

      <!-- ============================================================== -->
      <!-- TAB 2 CONTENT: JADWAL SHOW (RELASI SETLIST, TANGGAL, WAKTU...) -->
      <!-- ============================================================== -->
      <div v-else class="space-y-6">
        <!-- Notifikasi Banner Feedback -->
        <div
          v-if="showFeedback"
          :class="[
            'p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 transition-all',
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

        <!-- Search Bar Show -->
        <div class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div class="w-full sm:w-80">
            <UInput
              v-model="searchShowQuery"
              placeholder="Cari setlist, tanggal, atau member..."
              icon="i-lucide-search"
              size="sm"
              class="w-full"
            />
          </div>
        </div>

        <!-- Tabel Show / Pertunjukan -->
        <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs overflow-hidden">
          <div class="p-5 sm:p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <h3 class="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-lucide-list" class="w-4 h-4 text-primary" />
                Daftar Jadwal Pertunjukan
              </h3>
              <p class="text-xs text-neutral-500 mt-0.5">Menampilkan {{ filteredShows.length }} jadwal pertunjukan aktif.</p>
            </div>
          </div>

          <div v-if="isShowsLoading" class="p-12 text-center space-y-3">
            <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p class="text-xs text-neutral-500">Memuat jadwal pertunjukan...</p>
          </div>

          <div v-else-if="!filteredShows.length" class="p-12 text-center space-y-3">
            <UIcon name="i-lucide-calendar-x" class="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto" />
            <p class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Tidak ada jadwal pertunjukan yang cocok.</p>
            <UButton
              color="primary"
              variant="soft"
              size="sm"
              class="rounded-xl cursor-pointer"
              @click="openCreateShowModal"
            >
              Tambah Jadwal Show Pertama
            </UButton>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-neutral-50/80 dark:bg-neutral-800/40 text-[11px] font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 dark:border-neutral-800">
                <tr>
                  <th class="py-3.5 px-4 sm:px-6">Setlist (Relasi)</th>
                  <th class="py-3.5 px-4">Tanggal & Waktu</th>
                  <th class="py-3.5 px-4">Deskripsi Ringkas</th>
                  <th class="py-3.5 px-4">Lineup Member</th>
                  <th class="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                <tr
                  v-for="show in filteredShows"
                  :key="show.$id || show.id"
                  class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <!-- 1. Setlist yang berelasi (Poster & Judul) -->
                  <td class="py-4 px-4 sm:px-6">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0 border border-neutral-200 dark:border-neutral-700">
                        <img
                          v-if="getRelatedSetlist(show.setlist_id)?.image_url"
                          :src="getRelatedSetlist(show.setlist_id)!.image_url"
                          :alt="getRelatedSetlist(show.setlist_id)?.title_id"
                          class="w-full h-full object-cover"
                        />
                        <div v-else class="w-full h-full flex items-center justify-center text-neutral-400">
                          <UIcon name="i-lucide-disc-3" class="w-5 h-5" />
                        </div>
                      </div>
                      <div class="min-w-0">
                        <div class="font-bold text-neutral-900 dark:text-white truncate">
                          {{ getRelatedSetlist(show.setlist_id)?.title_id || 'Setlist Terpilih' }}
                        </div>
                        <div class="text-[11px] text-neutral-400 italic truncate">
                          {{ getRelatedSetlist(show.setlist_id)?.title_jp || '-' }}
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- 2. Tanggal & Waktu -->
                  <td class="py-4 px-4 whitespace-nowrap">
                    <div class="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
                      <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5 text-neutral-400" />
                      <span>{{ formatIndonesianDate(show.date) }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-[11px] text-primary font-mono font-bold mt-0.5">
                      <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-primary" />
                      <span>{{ formatIndonesianTime(show.time, show.date) }}</span>
                    </div>
                  </td>

                  <!-- 3. Deskripsi Ringkas -->
                  <td class="py-4 px-4 max-w-xs">
                    <p class="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                      {{ show.description || '-' }}
                    </p>
                  </td>

                  <!-- 4. Lineup Member -->
                  <td class="py-4 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      class="px-2.5 py-1 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 flex items-center gap-1.5 cursor-pointer transition-colors"
                      @click="viewLineup(show)"
                    >
                      <UIcon name="i-lucide-users" class="w-3.5 h-3.5" />
                      <span>{{ getLineupList(show.lineup).length }} Member</span>
                    </button>
                  </td>

                  <!-- 5. Aksi: Edit & Hapus -->
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

    <!-- ============================================== -->
    <!-- MODAL 1: TAMBAH / EDIT SETLIST (IMAGE, ID, JP) -->
    <!-- ============================================== -->
    <UModal
      v-model:open="isSetlistModalOpen"
      :title="setlistModalMode === 'create' ? 'Tambah Setlist Baru' : 'Edit Setlist'"
    >
      <template #content>
        <form class="space-y-5 p-5 sm:p-6" @submit.prevent="handleSaveSetlist">
          <!-- 1. Foto / Image Setlist -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 block uppercase tracking-wider">
              Foto / Poster Setlist
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
                  Tarik gambar ke sini atau klik pilih. Format file yang didukung: JPG, PNG, atau WebP.
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
              icon="i-lucide-disc-3"
              size="sm"
              class="w-full"
              required
            />
          </div>

          <!-- Actions -->
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
              :loading="isSetlistActionLoading"
              class="rounded-xl font-bold cursor-pointer"
            >
              {{ setlistModalMode === 'create' ? 'Tambah Setlist' : 'Simpan Perubahan' }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <!-- MODAL: HAPUS SETLIST -->
    <UModal v-model:open="isDeleteSetlistModalOpen" title="Konfirmasi Hapus Setlist">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-bold text-sm text-neutral-900 dark:text-white">
                Hapus "{{ setlistToDelete?.title_id }}"?
              </h4>
              <p class="text-xs text-neutral-500 mt-1 leading-relaxed">
                Setlist dan file foto terkait akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
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
              :loading="isSetlistActionLoading"
              class="rounded-xl font-bold cursor-pointer"
              @click="handleDeleteSetlist"
            >
              Ya, Hapus
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- ============================================================== -->
    <!-- MODAL 2: TAMBAH / EDIT SHOW (RELASI SETLIST, TGL, WAKTU, DLL) -->
    <!-- ============================================================== -->
    <UModal
      v-model:open="isShowModalOpen"
      :title="showModalMode === 'create' ? 'Tambah Jadwal Show Baru' : 'Edit Jadwal Show'"
    >
      <template #content>
        <form class="space-y-4 p-5 sm:p-6" @submit.prevent="handleSaveShow">
          <!-- 1. Relasi Setlist -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
              Setlist Teater (Relasi) *
            </label>
            <select
              v-model="showForm.setlist_id"
              class="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              required
            >
              <option value="" disabled>-- Pilih Setlist yang Dipentaskan --</option>
              <option
                v-for="s in setlists"
                :key="s.$id || s.id"
                :value="s.$id || s.id"
              >
                {{ s.title_id }} ({{ s.title_jp }})
              </option>
            </select>

            <!-- Preview Setlist Terpilih -->
            <div
              v-if="selectedFormSetlist"
              class="mt-2 p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 flex items-center gap-3 border border-neutral-200/60 dark:border-neutral-700/60"
            >
              <div class="w-10 h-10 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700 flex-shrink-0">
                <img
                  v-if="selectedFormSetlist.image_url"
                  :src="selectedFormSetlist.image_url"
                  alt="Poster"
                  class="w-full h-full object-cover"
                />
                <UIcon v-else name="i-lucide-disc-3" class="w-5 h-5 m-2.5 text-neutral-400" />
              </div>
              <div class="min-w-0">
                <div class="font-bold text-xs text-neutral-900 dark:text-white truncate">
                  {{ selectedFormSetlist.title_id }}
                </div>
                <div class="text-[11px] text-neutral-400 italic truncate">
                  {{ selectedFormSetlist.title_jp }}
                </div>
              </div>
            </div>
          </div>

          <!-- 2 & 3. Tanggal & Waktu Pertunjukan -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Tanggal Pertunjukan *
              </label>
              <input
                v-model="showForm.date"
                type="date"
                required
                class="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p v-if="showForm.date" class="text-[11px] text-primary font-medium flex items-center gap-1 pt-0.5">
                <UIcon name="i-lucide-calendar" class="w-3 h-3" />
                <span>{{ formatIndonesianDate(showForm.date) }}</span>
              </p>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Waktu Pertunjukan *
              </label>
              <input
                v-model="showForm.time"
                type="time"
                required
                class="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p v-if="showForm.time" class="text-[11px] text-neutral-500 font-medium flex items-center gap-1 pt-0.5">
                <UIcon name="i-lucide-clock" class="w-3 h-3 text-primary" />
                <span>Format 24 Jam ({{ formatIndonesianTime(showForm.time) }})</span>
              </p>
            </div>
          </div>

          <!-- 4. Deskripsi Ringkas -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Deskripsi Ringkas</label>
            <textarea
              v-model="showForm.description"
              rows="2"
              placeholder="Deskripsi singkat mengenai pertunjukan ini..."
              class="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none"
            />
          </div>

          <!-- 5. Lineup Member -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">Lineup Member (Pisahkan dengan koma)</label>
            <textarea
              v-model="showForm.lineupText"
              rows="3"
              placeholder="Freya Jayawardana, Angelina Christy, Shania Gracia, Gita Sekar, ..."
              class="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none"
            />
            <p class="text-[10px] text-neutral-400">Tuliskan nama-nama member yang tampil dipisahkan dengan tanda koma.</p>
          </div>

          <!-- Actions -->
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
              :loading="isShowActionLoading"
              class="rounded-xl font-bold cursor-pointer"
            >
              {{ showModalMode === 'create' ? 'Tambah Show' : 'Simpan Perubahan' }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <!-- MODAL: KONFIRMASI HAPUS SHOW -->
    <UModal v-model:open="isDeleteShowModalOpen" title="Konfirmasi Hapus Pertunjukan">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-bold text-sm text-neutral-900 dark:text-white">
                Hapus Jadwal Show ini?
              </h4>
              <p class="text-xs text-neutral-500 mt-1 leading-relaxed">
                Pertunjukan pada tanggal <strong>{{ showToDelete?.date }}</strong> ({{ showToDelete?.time }}) akan dihapus dari daftar jadwal show.
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
              :loading="isShowActionLoading"
              class="rounded-xl font-bold cursor-pointer"
              @click="handleDeleteShow"
            >
              Ya, Hapus
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- MODAL: PREVIEW LINEUP MEMBER -->
    <UModal
      v-model:open="isLineupModalOpen"
      :title="`Lineup Member - ${getRelatedSetlist(selectedShowForLineup?.setlist_id)?.title_id || 'Show'}`"
    >
      <template #content>
        <div class="p-6 space-y-4">
          <div>
            <div class="text-xs text-neutral-400">
              {{ formatIndonesianDate(selectedShowForLineup?.date) }} &bull; {{ formatIndonesianTime(selectedShowForLineup?.time, selectedShowForLineup?.date) }}
            </div>
            <h4 class="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
              {{ getRelatedSetlist(selectedShowForLineup?.setlist_id)?.title_id || 'Pertunjukan' }}
            </h4>
          </div>

          <div class="space-y-2">
            <div class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Daftar Member Tampil ({{ getLineupList(selectedShowForLineup?.lineup).length }} Member):
            </div>
            <div class="flex flex-wrap gap-2 pt-1 max-h-60 overflow-y-auto pr-1">
              <span
                v-for="(member, idx) in getLineupList(selectedShowForLineup?.lineup)"
                :key="idx"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/50 dark:border-neutral-700/50 flex items-center gap-1.5"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-primary" />
                {{ member }}
              </span>
            </div>
          </div>

          <div class="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
            <UButton
              color="neutral"
              variant="subtle"
              size="sm"
              class="rounded-xl cursor-pointer font-bold"
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
