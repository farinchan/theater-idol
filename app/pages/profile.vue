<script setup lang="ts">
const router = useRouter()
const {
  user,
  logout,
  isLoading,
  getSessions,
  revokeSession,
  revokeAllOtherSessions,
  updateProfile,
  updatePassword
} = useAppwriteAuth()

const activeTab = ref<'sessions' | 'edit-profile'>('sessions')

// Sessions state
const sessions = ref<any[]>([])
const isSessionsLoading = ref(false)
const sessionMessage = ref<string | null>(null)
const isRevokingOther = ref(false)

// Edit profile state
const editName = ref('')
const editBio = ref('')
const avatarPreview = ref('')
const photoSizeKB = ref<number | null>(null)
const isUpdatingProfile = ref(false)
const profileUpdateSuccess = ref<string | null>(null)
const profileUpdateError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isImageProcessing = ref(false)
const isDragging = ref(false)

// Custom URL input toggle
const showUrlInput = ref(false)
const customUrlInput = ref('')

// Change password state
const showPasswordSection = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const isUpdatingPassword = ref(false)
const passwordSuccess = ref<string | null>(null)
const passwordError = ref<string | null>(null)

// Preset avatars
const presetAvatars = [
  {
    name: 'Ruby Robot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=JktRuby&backgroundColor=d61515'
  },
  {
    name: 'Rose Sakura',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=JktRose&backgroundColor=f43f5e'
  },
  {
    name: 'Sapphire Glow',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=JktBlue&backgroundColor=0284c7'
  },
  {
    name: 'Emerald Forest',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=JktEmerald&backgroundColor=059669'
  },
  {
    name: 'Amber Sunset',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=JktAmber&backgroundColor=d97706'
  },
  {
    name: 'Dark Obsidian',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=JktDark&backgroundColor=1e293b'
  }
]

const userInitials = computed(() => {
  if (!user.value) return 'U'
  const name = user.value.name || user.value.email || 'User'
  return name.slice(0, 2).toUpperCase()
})

const userJoinDate = computed(() => {
  if (!user.value?.$createdAt) return '-'
  const d = new Date(user.value.$createdAt)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
})

const savedAvatar = computed(() => user.value?.prefs?.avatar || '')
const savedBio = computed(() => user.value?.prefs?.bio || '')

const isProfileChanged = computed(() => {
  const currentName = user.value?.name || ''
  return (
    editName.value.trim() !== currentName ||
    avatarPreview.value !== savedAvatar.value ||
    editBio.value.trim() !== savedBio.value
  )
})

const passwordMatch = computed(() => {
  if (!newPassword.value || !confirmPassword.value) return null
  return newPassword.value === confirmPassword.value
})

const initFormData = () => {
  if (user.value) {
    editName.value = user.value.name || ''
    avatarPreview.value = savedAvatar.value
    editBio.value = savedBio.value
    photoSizeKB.value = null
  }
}

const loadSessions = async () => {
  if (!user.value) return
  isSessionsLoading.value = true
  try {
    const list = await getSessions()
    sessions.value = list
  } catch {
    sessions.value = []
  } finally {
    isSessionsLoading.value = false
  }
}

onMounted(() => {
  if (user.value) {
    loadSessions()
    initFormData()
  }
})

watch(user, (newUser) => {
  if (newUser) {
    loadSessions()
    initFormData()
  }
})

const formatSessionDate = (dateStr: string) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

const getDeviceIcon = (session: any) => {
  const os = (session?.osName || '').toLowerCase()
  if (os.includes('ios') || os.includes('android')) return 'i-lucide-smartphone'
  if (os.includes('mac') || os.includes('win') || os.includes('linux')) return 'i-lucide-laptop'
  return 'i-lucide-globe'
}

const handleRevokeSession = async (sessionId: string) => {
  const res = await revokeSession(sessionId)
  if (res.success) {
    sessionMessage.value = 'Sesi berhasil diakhiri.'
    await loadSessions()
    setTimeout(() => { sessionMessage.value = null }, 3000)
  }
}

const handleRevokeAllOthers = async () => {
  isRevokingOther.value = true
  const res = await revokeAllOtherSessions()
  if (res.success) {
    sessionMessage.value = 'Semua sesi perangkat lain telah diakhiri.'
    await loadSessions()
    setTimeout(() => { sessionMessage.value = null }, 3000)
  }
  isRevokingOther.value = false
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// Client-side downscale and compression to stay safely under 64KB prefs limit
const compressImage = (file: File, maxDim = 180, quality = 0.8): Promise<{ dataUrl: string; sizeKB: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          const raw = e.target?.result as string
          resolve({ dataUrl: raw, sizeKB: Math.round(raw.length / 1024) })
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        const sizeKB = Math.round((compressedDataUrl.length * 3) / 4 / 1024)
        resolve({ dataUrl: compressedDataUrl, sizeKB })
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const processFile = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    profileUpdateError.value = 'File yang dipilih harus berupa gambar (JPG, PNG, WebP).'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    profileUpdateError.value = 'Ukuran file foto maksimal 5MB sebelum dioptimasi.'
    return
  }

  profileUpdateError.value = null
  isImageProcessing.value = true

  try {
    const { dataUrl, sizeKB } = await compressImage(file, 180, 0.8)
    avatarPreview.value = dataUrl
    photoSizeKB.value = sizeKB
  } catch {
    profileUpdateError.value = 'Gagal memproses gambar. Coba gambar lain.'
  } finally {
    isImageProcessing.value = false
  }
}

const handlePhotoUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await processFile(file)
  }
}

const handleDrop = async (e: DragEvent) => {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    await processFile(file)
  }
}

const selectPresetAvatar = (url: string) => {
  avatarPreview.value = url
  photoSizeKB.value = null
  profileUpdateError.value = null
}

const applyCustomUrl = () => {
  if (!customUrlInput.value.trim()) return
  avatarPreview.value = customUrlInput.value.trim()
  photoSizeKB.value = null
  showUrlInput.value = false
  customUrlInput.value = ''
  profileUpdateError.value = null
}

const removeAvatar = () => {
  avatarPreview.value = ''
  photoSizeKB.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const resetProfileForm = () => {
  initFormData()
  profileUpdateError.value = null
  profileUpdateSuccess.value = null
}

const handleSaveProfile = async () => {
  if (!editName.value.trim()) {
    profileUpdateError.value = 'Nama lengkap tidak boleh kosong.'
    return
  }

  if (!isProfileChanged.value) {
    profileUpdateSuccess.value = 'Data profil sudah sesuai, tidak ada perubahan.'
    setTimeout(() => { profileUpdateSuccess.value = null }, 2500)
    return
  }

  isUpdatingProfile.value = true
  profileUpdateSuccess.value = null
  profileUpdateError.value = null

  const res = await updateProfile({
    name: editName.value.trim(),
    avatar: avatarPreview.value,
    bio: editBio.value.trim()
  })

  if (res.success) {
    profileUpdateSuccess.value = 'Profil dan foto berhasil disimpan!'
    photoSizeKB.value = null
    setTimeout(() => {
      profileUpdateSuccess.value = null
    }, 3500)
  } else {
    profileUpdateError.value = res.error || 'Gagal memperbarui profil.'
  }

  isUpdatingProfile.value = false
}

const handleSavePassword = async () => {
  passwordError.value = null
  passwordSuccess.value = null

  if (!newPassword.value || newPassword.value.length < 8) {
    passwordError.value = 'Kata sandi baru minimal harus 8 karakter.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Konfirmasi kata sandi baru tidak cocok.'
    return
  }

  isUpdatingPassword.value = true
  const res = await updatePassword(newPassword.value, oldPassword.value || undefined)

  if (res.success) {
    passwordSuccess.value = 'Kata sandi berhasil diperbarui!'
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(() => {
      passwordSuccess.value = null
      showPasswordSection.value = false
    }, 2500)
  } else {
    passwordError.value = res.error || 'Gagal memperbarui kata sandi.'
  }

  isUpdatingPassword.value = false
}

const handleLogout = async () => {
  await logout()
  router.push('/login')
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 w-full max-w-7xl mx-auto">
    <!-- Profile Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
          <UIcon name="i-lucide-id-card" class="w-8 h-8 text-primary" />
          Profil Saya
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Kelola informasi profil, foto avatar, dan sesi aktif perangkat Anda.
        </p>
      </div>

      <div v-if="user" class="flex items-center gap-3">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          class="text-neutral-600 dark:text-neutral-300 hover:text-red-500 hover:border-red-500/40 rounded-xl font-bold cursor-pointer"
          :loading="isLoading"
          @click="handleLogout"
        >
          <template #leading>
            <UIcon name="i-lucide-log-out" class="w-4 h-4" />
          </template>
          Keluar dari Akun
        </UButton>
      </div>
    </div>

    <!-- Logged In View -->
    <div v-if="user" class="space-y-8">
      <!-- Fullwidth User Overview Card -->
      <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-xs">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <!-- Avatar & Primary Info -->
          <div class="flex items-center gap-5 md:col-span-2">
            <div class="relative flex-shrink-0">
              <div class="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-tr from-primary to-rose-400 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-primary/25 overflow-hidden border-2 border-white dark:border-neutral-800">
                <img
                  v-if="savedAvatar"
                  :src="savedAvatar"
                  alt="Avatar"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ userInitials }}</span>
              </div>
              <span class="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900" />
            </div>

            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white truncate">
                  {{ user.name || 'Pengguna' }}
                </h2>
                <UBadge color="success" variant="subtle" size="xs" class="font-bold">
                  Aktif
                </UBadge>
              </div>
              <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 truncate">{{ user.email }}</p>
              <p v-if="savedBio" class="text-xs text-neutral-600 dark:text-neutral-300 italic line-clamp-1 pt-0.5">
                "{{ savedBio }}"
              </p>
              <div class="text-[11px] text-neutral-400 pt-1 flex items-center gap-1.5">
                <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5 text-neutral-400" />
                <span>Terdaftar sejak {{ userJoinDate }}</span>
              </div>
            </div>
          </div>

          <!-- Quick Account Meta -->
          <div class="flex md:justify-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800">
            <div class="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 text-center min-w-[120px]">
              <div class="text-lg font-black text-primary">{{ sessions.length || 1 }}</div>
              <div class="text-[11px] text-neutral-500">Sesi Aktif</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation System (Fullwidth) -->
      <div class="space-y-6">
        <div class="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3 overflow-x-auto">
          <!-- Tab 1: Session Management (First Tab) -->
          <button
            type="button"
            :class="[
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'sessions'
                ? 'bg-primary text-white shadow-sm shadow-primary/25'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            ]"
            @click="activeTab = 'sessions'"
          >
            <UIcon name="i-lucide-laptop" class="w-4 h-4" />
            <span>Session Management</span>
            <UBadge
              v-if="sessions.length"
              :color="activeTab === 'sessions' ? 'neutral' : 'primary'"
              :variant="activeTab === 'sessions' ? 'subtle' : 'solid'"
              size="xs"
              class="ml-1 text-[10px]"
            >
              {{ sessions.length }}
            </UBadge>
          </button>

          <!-- Tab 2: Update Profile (Second Tab) -->
          <button
            type="button"
            :class="[
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'edit-profile'
                ? 'bg-primary text-white shadow-sm shadow-primary/25'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            ]"
            @click="activeTab = 'edit-profile'"
          >
            <UIcon name="i-lucide-user-pen" class="w-4 h-4" />
            <span>Update Profil</span>
            <span
              v-if="isProfileChanged"
              class="w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-1"
              title="Perubahan belum disimpan"
            />
          </button>
        </div>

        <!-- Alert Notification for Session Actions -->
        <div
          v-if="sessionMessage"
          class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-check-circle" class="w-4 h-4 flex-shrink-0" />
            <span>{{ sessionMessage }}</span>
          </div>
          <button type="button" class="text-neutral-400 hover:text-neutral-600 cursor-pointer" @click="sessionMessage = null">
            <UIcon name="i-lucide-x" class="w-4 h-4" />
          </button>
        </div>

        <!-- Tab 1 Content: Session Management -->
        <div v-if="activeTab === 'sessions'" class="space-y-6">
          <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-xs space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-5">
              <div>
                <h3 class="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <UIcon name="i-lucide-monitor-smartphone" class="w-5 h-5 text-primary" />
                  Daftar Sesi Perangkat Aktif
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Daftar perangkat dan browser yang saat ini terhubung ke akun Anda.
                </p>
              </div>

              <div class="flex items-center gap-2">
                <UButton
                  color="neutral"
                  variant="subtle"
                  size="xs"
                  class="rounded-xl cursor-pointer"
                  :loading="isSessionsLoading"
                  @click="loadSessions"
                >
                  <template #leading>
                    <UIcon name="i-lucide-refresh-cw" class="w-3.5 h-3.5" />
                  </template>
                  Segarkan
                </UButton>

                <UButton
                  v-if="sessions.length > 1"
                  color="neutral"
                  variant="outline"
                  size="xs"
                  class="text-red-500 border-red-500/30 hover:bg-red-500/10 rounded-xl cursor-pointer font-bold"
                  :loading="isRevokingOther"
                  @click="handleRevokeAllOthers"
                >
                  <template #leading>
                    <UIcon name="i-lucide-shield-alert" class="w-3.5 h-3.5" />
                  </template>
                  Keluar dari Perangkat Lain
                </UButton>
              </div>
            </div>

            <!-- Sessions List -->
            <div v-if="isSessionsLoading && !sessions.length" class="py-8 text-center text-xs text-neutral-500">
              <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              Memuat sesi aktif...
            </div>

            <div v-else-if="sessions.length" class="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              <div
                v-for="s in sessions"
                :key="s.$id"
                class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <!-- Device Info -->
                <div class="flex items-start gap-4">
                  <div
                    :class="[
                      'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5',
                      s.current
                        ? 'bg-primary text-white shadow-sm shadow-primary/20'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                    ]"
                  >
                    <UIcon :name="getDeviceIcon(s)" class="w-5 h-5" />
                  </div>

                  <div class="space-y-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-bold text-sm text-neutral-900 dark:text-white">
                        {{ s.osName || 'Sistem Tidak Diketahui' }} {{ s.osVersion || '' }}
                      </span>
                      <span class="text-xs text-neutral-400">&bull;</span>
                      <span class="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                        {{ s.clientName || 'Browser' }} {{ s.clientVersion || '' }}
                      </span>
                      <UBadge
                        v-if="s.current"
                        color="primary"
                        variant="subtle"
                        size="xs"
                        class="text-[10px] font-bold"
                      >
                        Perangkat Saat Ini
                      </UBadge>
                    </div>

                    <div class="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
                      <span class="font-mono text-[11px]">IP: {{ s.ip || '127.0.0.1' }}</span>
                      <span v-if="s.countryName">&bull;</span>
                      <span v-if="s.countryName">{{ s.countryName }}</span>
                      <span>&bull;</span>
                      <span>Aktif sejak: {{ formatSessionDate(s.$createdAt) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Action Button -->
                <div class="flex items-center sm:justify-end">
                  <span
                    v-if="s.current"
                    class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"
                  >
                    <UIcon name="i-lucide-check-circle-2" class="w-4 h-4" />
                    Sedang Digunakan
                  </span>
                  <UButton
                    v-else
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    class="text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl cursor-pointer"
                    @click="handleRevokeSession(s.$id)"
                  >
                    <template #leading>
                      <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                    </template>
                    Akhiri Sesi
                  </UButton>
                </div>
              </div>
            </div>

            <!-- Single fallback session if list is empty but logged in -->
            <div v-else class="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                  <UIcon name="i-lucide-laptop" class="w-5 h-5" />
                </div>
                <div>
                  <div class="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                    Browser Anda Saat Ini
                    <UBadge color="primary" variant="subtle" size="xs">Aktif</UBadge>
                  </div>
                  <div class="text-xs text-neutral-500 mt-0.5">Sesi aktif berjalan pada perangkat ini.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2 Content: Update Profile (Termasuk Foto) -->
        <div v-if="activeTab === 'edit-profile'" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left 2 Cols: Form Utama (Foto, Nama, Bio, Email) -->
            <div class="lg:col-span-2 space-y-6">
              <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-xs space-y-6">
                <!-- Header with Status Indicator -->
                <div class="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
                  <div>
                    <h3 class="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <UIcon name="i-lucide-user-pen" class="w-5 h-5 text-primary" />
                      Informasi Profil & Foto
                    </h3>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Perbarui foto profil avatar, nama tampilan, dan bio Anda.
                    </p>
                  </div>

                  <div>
                    <UBadge
                      v-if="isProfileChanged"
                      color="warning"
                      variant="subtle"
                      size="sm"
                      class="font-semibold flex items-center gap-1.5"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      Ada Perubahan
                    </UBadge>
                    <UBadge
                      v-else
                      color="neutral"
                      variant="subtle"
                      size="sm"
                      class="text-neutral-500 dark:text-neutral-400 font-medium"
                    >
                      Tersimpan
                    </UBadge>
                  </div>
                </div>

                <!-- Feedback Alerts -->
                <div
                  v-if="profileUpdateSuccess"
                  class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm flex items-center justify-between"
                >
                  <div class="flex items-center gap-2.5">
                    <UIcon name="i-lucide-check-circle-2" class="w-5 h-5 flex-shrink-0" />
                    <span>{{ profileUpdateSuccess }}</span>
                  </div>
                  <button type="button" class="text-neutral-400 hover:text-neutral-600 cursor-pointer" @click="profileUpdateSuccess = null">
                    <UIcon name="i-lucide-x" class="w-4 h-4" />
                  </button>
                </div>

                <div
                  v-if="profileUpdateError"
                  class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center justify-between"
                >
                  <div class="flex items-center gap-2.5">
                    <UIcon name="i-lucide-alert-circle" class="w-5 h-5 flex-shrink-0" />
                    <span>{{ profileUpdateError }}</span>
                  </div>
                  <button type="button" class="text-neutral-400 hover:text-neutral-600 cursor-pointer" @click="profileUpdateError = null">
                    <UIcon name="i-lucide-x" class="w-4 h-4" />
                  </button>
                </div>

                <form class="space-y-6" @submit.prevent="handleSaveProfile">
                  <!-- Section 1: Photo Avatar (Interactive Dropzone & Preview) -->
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                        Foto Profil / Avatar
                      </label>
                      <span v-if="photoSizeKB" class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Foto dioptimasi: ~{{ photoSizeKB }} KB
                      </span>
                    </div>

                    <div
                      :class="[
                        'p-5 sm:p-6 rounded-3xl border-2 transition-all flex flex-col sm:flex-row items-center sm:items-start gap-6',
                        isDragging
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/40'
                      ]"
                      @dragover.prevent="isDragging = true"
                      @dragleave.prevent="isDragging = false"
                      @drop.prevent="handleDrop"
                    >
                      <!-- Live Preview Avatar -->
                      <div class="relative flex-shrink-0 group">
                        <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-primary to-rose-400 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden border-2 border-white dark:border-neutral-700">
                          <img
                            v-if="avatarPreview"
                            :src="avatarPreview"
                            alt="Preview Foto Profil"
                            class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                          />
                          <span v-else>{{ userInitials }}</span>
                        </div>

                        <!-- Spinner during processing -->
                        <div
                          v-if="isImageProcessing"
                          class="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white text-xs font-bold"
                        >
                          <UIcon name="i-lucide-loader-2" class="w-7 h-7 animate-spin" />
                        </div>
                      </div>

                      <!-- Photo Action Buttons, Drop Helper & Presets -->
                      <div class="space-y-3.5 text-center sm:text-left flex-1 min-w-0">
                        <input
                          ref="fileInputRef"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          class="hidden"
                          @change="handlePhotoUpload"
                        />

                        <!-- Primary Photo Buttons -->
                        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                          <UButton
                            type="button"
                            color="primary"
                            variant="solid"
                            size="sm"
                            class="rounded-xl font-bold cursor-pointer shadow-sm shadow-primary/25"
                            :loading="isImageProcessing"
                            @click="triggerFileInput"
                          >
                            <template #leading>
                              <UIcon name="i-lucide-upload" class="w-4 h-4" />
                            </template>
                            Pilih Berkas Foto
                          </UButton>

                          <UButton
                            type="button"
                            color="neutral"
                            variant="subtle"
                            size="sm"
                            class="rounded-xl font-medium cursor-pointer"
                            @click="showUrlInput = !showUrlInput"
                          >
                            <template #leading>
                              <UIcon name="i-lucide-link" class="w-4 h-4" />
                            </template>
                            Link URL Foto
                          </UButton>

                          <UButton
                            v-if="avatarPreview"
                            type="button"
                            color="neutral"
                            variant="outline"
                            size="sm"
                            class="text-neutral-600 dark:text-neutral-300 hover:text-red-500 hover:border-red-500/30 rounded-xl cursor-pointer"
                            @click="removeAvatar"
                          >
                            <template #leading>
                              <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                            </template>
                            Hapus Foto
                          </UButton>
                        </div>

                        <!-- Dropzone note -->
                        <p class="text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed">
                          Tarik dan lepas gambar ke sini, atau klik tombol pilih. Gambar otomatis diperkecil agar optimal.
                        </p>

                        <!-- Expandable Custom URL Input -->
                        <div v-if="showUrlInput" class="p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 space-y-2">
                          <div class="flex gap-2">
                            <UInput
                              v-model="customUrlInput"
                              type="url"
                              placeholder="https://example.com/avatar.jpg"
                              size="xs"
                              class="flex-1"
                            />
                            <UButton
                              type="button"
                              color="primary"
                              variant="solid"
                              size="xs"
                              class="rounded-xl font-bold cursor-pointer"
                              @click="applyCustomUrl"
                            >
                              Terapkan
                            </UButton>
                          </div>
                        </div>

                        <!-- Quick Theme Avatars Presets -->
                        <div class="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60">
                          <span class="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 block mb-2">
                            Atau gunakan avatar siap pakai:
                          </span>
                          <div class="flex items-center gap-2.5 justify-center sm:justify-start flex-wrap">
                            <button
                              v-for="preset in presetAvatars"
                              :key="preset.name"
                              type="button"
                              :title="preset.name"
                              :class="[
                                'w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer hover:scale-110 shadow-xs',
                                avatarPreview === preset.url
                                  ? 'border-primary ring-2 ring-primary/30 scale-105'
                                  : 'border-neutral-200 dark:border-neutral-700 hover:border-primary'
                              ]"
                              @click="selectPresetAvatar(preset.url)"
                            >
                              <img :src="preset.url" :alt="preset.name" class="w-full h-full object-cover" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Section 2: Full Name -->
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                        Nama Lengkap
                      </label>
                      <span class="text-[11px] text-neutral-400">
                        {{ editName.length }}/128
                      </span>
                    </div>
                    <UInput
                      v-model="editName"
                      type="text"
                      maxlength="128"
                      placeholder="Masukkan nama lengkap atau nama tampilan..."
                      icon="i-lucide-user"
                      size="md"
                      class="w-full"
                      required
                    />
                  </div>

                  <!-- Section 3: Bio / Short Description -->
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                        Bio Singkat
                      </label>
                      <span class="text-[11px] text-neutral-400">
                        {{ editBio.length }}/160
                      </span>
                    </div>
                    <textarea
                      v-model="editBio"
                      rows="3"
                      maxlength="160"
                      placeholder="Tuliskan catatan atau bio singkat tentang Anda..."
                      class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                    />
                  </div>

                  <!-- Section 4: Registered Email (Readonly) -->
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                        Alamat Email
                      </label>
                      <span class="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                        <UIcon name="i-lucide-lock" class="w-3 h-3 text-neutral-400" />
                        Email terdaftar
                      </span>
                    </div>
                    <UInput
                      :model-value="user.email"
                      type="email"
                      icon="i-lucide-mail"
                      size="md"
                      class="w-full opacity-75 cursor-not-allowed"
                      disabled
                    />
                    <p class="text-[11px] text-neutral-400 dark:text-neutral-500">
                      Email ini digunakan untuk masuk ke akun dan tidak dapat diubah di sini.
                    </p>
                  </div>

                  <!-- Submit & Reset Buttons -->
                  <div class="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-3 flex-wrap">
                    <UButton
                      type="submit"
                      color="primary"
                      variant="solid"
                      size="lg"
                      class="px-8 rounded-2xl font-bold shadow-md shadow-primary/25 cursor-pointer"
                      :loading="isUpdatingProfile"
                    >
                      <template #leading>
                        <UIcon name="i-lucide-save" class="w-4 h-4" />
                      </template>
                      Simpan Perubahan
                    </UButton>

                    <UButton
                      v-if="isProfileChanged"
                      type="button"
                      color="neutral"
                      variant="outline"
                      size="md"
                      class="rounded-xl font-semibold cursor-pointer"
                      @click="resetProfileForm"
                    >
                      <template #leading>
                        <UIcon name="i-lucide-rotate-ccw" class="w-4 h-4" />
                      </template>
                      Batal
                    </UButton>
                  </div>
                </form>
              </div>
            </div>

            <!-- Right 1 Col: Keamanan Sandi & Tips -->
            <div class="space-y-6">
              <!-- Change Password Card -->
              <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-xs space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-lock" class="w-5 h-5 text-primary" />
                    <h4 class="font-bold text-sm text-neutral-900 dark:text-white">Kata Sandi</h4>
                  </div>
                  <UButton
                    type="button"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                    class="rounded-xl cursor-pointer font-bold"
                    @click="showPasswordSection = !showPasswordSection"
                  >
                    {{ showPasswordSection ? 'Tutup' : 'Ubah Sandi' }}
                  </UButton>
                </div>

                <p class="text-xs text-neutral-500 leading-relaxed">
                  Perbarui kata sandi secara berkala untuk menjaga keamanan akun Anda.
                </p>

                <!-- Feedback for Password -->
                <div
                  v-if="passwordSuccess"
                  class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2"
                >
                  <UIcon name="i-lucide-check-circle-2" class="w-4 h-4 flex-shrink-0" />
                  <span>{{ passwordSuccess }}</span>
                </div>

                <div
                  v-if="passwordError"
                  class="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
                >
                  <UIcon name="i-lucide-alert-circle" class="w-4 h-4 flex-shrink-0" />
                  <span>{{ passwordError }}</span>
                </div>

                <!-- Form Password Expandable -->
                <form
                  v-if="showPasswordSection"
                  class="space-y-3.5 pt-2 border-t border-neutral-100 dark:border-neutral-800"
                  @submit.prevent="handleSavePassword"
                >
                  <!-- Old Password -->
                  <div class="space-y-1">
                    <label class="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Kata Sandi Saat Ini</label>
                    <div class="relative">
                      <UInput
                        v-model="oldPassword"
                        :type="showOldPassword ? 'text' : 'password'"
                        placeholder="Kata sandi lama (opsional)..."
                        icon="i-lucide-key"
                        size="sm"
                        class="w-full"
                      />
                      <button
                        type="button"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                        @click="showOldPassword = !showOldPassword"
                      >
                        <UIcon :name="showOldPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <!-- New Password -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <label class="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Kata Sandi Baru</label>
                      <span class="text-[10px] text-neutral-400">Min. 8 karakter</span>
                    </div>
                    <div class="relative">
                      <UInput
                        v-model="newPassword"
                        :type="showNewPassword ? 'text' : 'password'"
                        placeholder="Minimal 8 karakter..."
                        icon="i-lucide-lock"
                        size="sm"
                        class="w-full"
                        required
                      />
                      <button
                        type="button"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                        @click="showNewPassword = !showNewPassword"
                      >
                        <UIcon :name="showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <!-- Confirm Password -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <label class="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Ulangi Kata Sandi Baru</label>
                      <span
                        v-if="confirmPassword"
                        :class="[
                          'text-[10px] font-bold',
                          passwordMatch ? 'text-emerald-500' : 'text-rose-500'
                        ]"
                      >
                        {{ passwordMatch ? 'Cocok' : 'Belum cocok' }}
                      </span>
                    </div>
                    <div class="relative">
                      <UInput
                        v-model="confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        placeholder="Konfirmasi sandi baru..."
                        icon="i-lucide-shield-check"
                        size="sm"
                        class="w-full"
                        required
                      />
                      <button
                        type="button"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                        @click="showConfirmPassword = !showConfirmPassword"
                      >
                        <UIcon :name="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <UButton
                    type="submit"
                    color="primary"
                    variant="solid"
                    size="sm"
                    class="w-full justify-center rounded-xl font-bold cursor-pointer mt-2 shadow-sm shadow-primary/20"
                    :loading="isUpdatingPassword"
                  >
                    Simpan Sandi Baru
                  </UButton>
                </form>
              </div>

              <!-- Security Information Note -->
              <div class="p-5 rounded-3xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
                <div class="flex items-center gap-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  <UIcon name="i-lucide-shield-check" class="w-4 h-4 text-emerald-500" />
                  <span>Keamanan & Privasi Akun</span>
                </div>
                <p class="text-xs text-neutral-500 leading-relaxed">
                  Perubahan nama, foto profil, dan bio akan langsung tersinkronisasi ke seluruh bagian situs dan sesi perangkat Anda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Logged Out View (Guest) -->
    <div v-else class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 sm:p-12 text-center shadow-xs space-y-5">
      <div class="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-user-x" class="w-8 h-8" />
      </div>

      <div class="max-w-md mx-auto space-y-2">
        <h2 class="text-xl font-bold text-neutral-900 dark:text-white">
          Anda Belum Masuk
        </h2>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Silakan masuk atau daftar untuk mengakses profil akun, memperbarui foto, dan manajemen sesi perangkat Anda.
        </p>
      </div>

      <div class="pt-2">
        <NuxtLink
          to="/login"
          class="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm shadow-primary/25 hover:bg-primary/90 transition-colors"
        >
          <UIcon name="i-lucide-log-in" class="w-4 h-4" />
          <span>Masuk / Daftar</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
