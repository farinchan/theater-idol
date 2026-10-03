<script setup lang="ts">
const { user, isAdmin, isLoading: isAuthLoading } = useAppwriteAuth()
const {
  settings,
  isLoading: isSettingsLoading,
  isSaving,
  error: settingsError,
  successNotice,
  fetchSettings,
  saveSettings
} = useSiteSettings()

useHead({
  title: 'Pengaturan Website - Admin'
})

// Local form state
const form = reactive({
  appName: '',
  isStreamEnabled: true,
  isReplayEnabled: true,
  isStreamRequireLogin: false,
  isReplayRequireLogin: false,
  isStreamRequirePremium: false,
  isReplayRequirePremium: false,
  streamNotice: '',
  replayNotice: ''
})

// Inisialisasi nilai form dari settings Appwrite
const syncFormWithSettings = () => {
  if (settings.value) {
    form.appName = settings.value.appName || 'Theater Idol'
    form.isStreamEnabled = settings.value.isStreamEnabled ?? true
    form.isReplayEnabled = settings.value.isReplayEnabled ?? true
    form.isStreamRequireLogin = settings.value.isStreamRequireLogin ?? false
    form.isReplayRequireLogin = settings.value.isReplayRequireLogin ?? false
    form.isStreamRequirePremium = settings.value.isStreamRequirePremium ?? false
    form.isReplayRequirePremium = settings.value.isReplayRequirePremium ?? false
    form.streamNotice = settings.value.streamNotice || 'Fitur Live Stream saat ini sedang ditutup atau dinonaktifkan sementara oleh administrator.'
    form.replayNotice = settings.value.replayNotice || 'Fitur Arsip Replay saat ini sedang ditutup atau dinonaktifkan sementara oleh administrator.'
  }
}

onMounted(async () => {
  await fetchSettings()
  syncFormWithSettings()
})

watch(settings, () => {
  syncFormWithSettings()
}, { deep: true })

// Deteksi perubahan form (unsaved changes)
const isDirty = computed(() => {
  if (!settings.value) return false
  return (
    form.appName !== (settings.value.appName || 'Theater Idol') ||
    form.isStreamEnabled !== (settings.value.isStreamEnabled ?? true) ||
    form.isReplayEnabled !== (settings.value.isReplayEnabled ?? true) ||
    form.isStreamRequireLogin !== (settings.value.isStreamRequireLogin ?? false) ||
    form.isReplayRequireLogin !== (settings.value.isReplayRequireLogin ?? false) ||
    form.isStreamRequirePremium !== (settings.value.isStreamRequirePremium ?? false) ||
    form.isReplayRequirePremium !== (settings.value.isReplayRequirePremium ?? false) ||
    form.streamNotice !== (settings.value.streamNotice || 'Fitur Live Stream saat ini sedang ditutup atau dinonaktifkan sementara oleh administrator.') ||
    form.replayNotice !== (settings.value.replayNotice || 'Fitur Arsip Replay saat ini sedang ditutup atau dinonaktifkan sementara oleh administrator.')
  )
})

// Jika require premium diaktifkan, otomatis pastikan require login juga aktif
watch(() => form.isStreamRequirePremium, (val) => {
  if (val) form.isStreamRequireLogin = true
})
watch(() => form.isReplayRequirePremium, (val) => {
  if (val) form.isReplayRequireLogin = true
})

// Action Simpan
const handleSave = async () => {
  if (!form.appName.trim()) {
    return
  }

  await saveSettings({
    appName: form.appName.trim(),
    isStreamEnabled: form.isStreamEnabled,
    isReplayEnabled: form.isReplayEnabled,
    isStreamRequireLogin: form.isStreamRequireLogin,
    isReplayRequireLogin: form.isReplayRequireLogin,
    isStreamRequirePremium: form.isStreamRequirePremium,
    isReplayRequirePremium: form.isReplayRequirePremium,
    streamNotice: form.streamNotice.trim(),
    replayNotice: form.replayNotice.trim()
  })
}

// Action Reset ke Default
const handleResetToDefault = () => {
  if (confirm('Kembalikan semua formulir pengaturan ke konfigurasi default?')) {
    form.appName = 'Theater Idol'
    form.isStreamEnabled = true
    form.isReplayEnabled = true
    form.isStreamRequireLogin = false
    form.isReplayRequireLogin = false
    form.isStreamRequirePremium = false
    form.isReplayRequirePremium = false
    form.streamNotice = 'Fitur Live Stream saat ini sedang ditutup atau dinonaktifkan sementara oleh administrator.'
    form.replayNotice = 'Fitur Arsip Replay saat ini sedang ditutup atau dinonaktifkan sementara oleh administrator.'
  }
}

// Action Batalkan Perubahan (Kembalikan ke data database saat ini)
const handleDiscardChanges = () => {
  syncFormWithSettings()
}

// Format waktu pembaruan terakhir
const formattedUpdatedAt = computed(() => {
  if (!settings.value?.updatedAt) return 'Belum pernah diperbarui'
  try {
    const d = new Date(settings.value.updatedAt)
    return d.toLocaleString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' WIB'
  } catch {
    return settings.value.updatedAt
  }
})
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- State 1: Loading Auth -->
    <div v-if="isAuthLoading" class="py-24 flex flex-col items-center justify-center gap-3">
      <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span class="text-xs font-semibold text-neutral-500">Memverifikasi hak akses admin...</span>
    </div>

    <!-- State 2: Akses Ditolak -->
    <div v-else-if="!user || !isAdmin" class="py-16 text-center max-w-md mx-auto space-y-4">
      <div class="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-shield-alert" class="w-8 h-8" />
      </div>
      <div class="space-y-1">
        <h2 class="text-xl font-bold text-neutral-900 dark:text-white">Akses Terbatas Admin</h2>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Halaman pengaturan website hanya dapat diakses oleh akun dengan peran Administrator.
        </p>
      </div>
      <UButton
        to="/login"
        color="primary"
        variant="solid"
        size="sm"
        icon="i-lucide-log-in"
        label="Masuk sebagai Admin"
        class="font-bold rounded-xl"
      />
    </div>

    <!-- State 3: Konten Utama Admin -->
    <div v-else class="space-y-6">
      <!-- Header Title & Info -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
            <UIcon name="i-lucide-database" class="w-3.5 h-3.5" />
            Appwrite Database Cloud (Sites Ready)
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Pengaturan Website
          </h1>
          <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Konfigurasi nama website, kendali aktif/nonaktif fitur, hak akses login, dan proteksi Member Premium untuk Live Stream serta Arsip Replay.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <UButton
            to="/"
            target="_blank"
            color="neutral"
            variant="ghost"
            size="md"
            icon="i-lucide-external-link"
            label="Buka Website"
            class="text-neutral-600 dark:text-neutral-300 font-medium rounded-xl"
          />
          <UButton
            color="primary"
            variant="solid"
            size="md"
            icon="i-lucide-save"
            label="Simpan Pengaturan"
            :loading="isSaving"
            class="font-bold rounded-xl cursor-pointer shadow-sm shadow-primary/20"
            @click="handleSave"
          />
        </div>
      </div>

      <!-- Feedback Alert Notice: Success -->
      <div
        v-if="successNotice"
        class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs"
      >
        <div class="flex items-center gap-2.5">
          <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span class="font-medium">{{ successNotice }}</span>
        </div>
        <button type="button" class="text-emerald-600 hover:text-emerald-700 cursor-pointer" @click="successNotice = null">
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>
      </div>

      <!-- Feedback Alert Notice: Error -->
      <div
        v-if="settingsError"
        class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs"
      >
        <div class="flex items-center gap-2.5">
          <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span class="font-medium">{{ settingsError }}</span>
        </div>
        <button type="button" class="text-rose-600 hover:text-rose-700 cursor-pointer" @click="settingsError = null">
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>
      </div>

      <!-- Unsaved Changes Alert Banner -->
      <div
        v-if="isDirty"
        class="p-3.5 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-info" class="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span class="font-medium">Ada perubahan pengaturan yang belum disimpan ke database.</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline cursor-pointer"
            @click="handleDiscardChanges"
          >
            Batalkan
          </button>
          <button
            type="button"
            class="text-xs font-bold text-primary hover:underline cursor-pointer"
            @click="handleSave"
          >
            Simpan Sekarang
          </button>
        </div>
      </div>

      <!-- Loading State Settings -->
      <div v-if="isSettingsLoading && !settings" class="py-16 flex flex-col items-center justify-center gap-3">
        <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span class="text-xs font-semibold text-neutral-500">Memuat data pengaturan dari Appwrite...</span>
      </div>

      <!-- Main Form Grid (2 Columns) -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <!-- Left Column: Form Controls (2 cols) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Card 1: Nama Website -->
          <div class="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-globe" class="w-5 h-5 text-primary" />
                  <h3 class="font-bold text-base text-neutral-900 dark:text-white">Identitas & Nama Website</h3>
                </div>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  Nama ini langsung dipakai pada seluruh navigasi navbar, judul halaman meta, hero banner, dan footer.
                </p>
              </div>
              <UBadge color="primary" variant="subtle" size="xs" class="font-bold">
                Aktif: {{ form.appName || 'Theater Idol' }}
              </UBadge>
            </div>

            <div class="space-y-1.5 pt-1">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Nama Portal Website <span class="text-primary">*</span>
              </label>
              <UInput
                v-model="form.appName"
                placeholder="Contoh: Theater Idol"
                size="md"
                icon="i-lucide-type"
                class="w-full font-bold"
              />
              <p class="text-[11px] text-neutral-400">
                Disarankan nama pendek dan padat (1-2 kata). Default: <strong>Theater Idol</strong>.
              </p>
            </div>
          </div>

          <!-- Card 2: Kontrol Fitur Live Stream -->
          <div class="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-radio" class="w-5 h-5 text-primary" />
                  <h3 class="font-bold text-base text-neutral-900 dark:text-white">Fitur Live Stream</h3>
                </div>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  Aktifkan atau nonaktifkan halaman streaming langsung teater untuk pengunjung.
                </p>
              </div>

              <!-- Switch Toggle Enable/Disable -->
              <div class="flex items-center gap-2.5">
                <span class="text-xs font-bold" :class="form.isStreamEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'">
                  {{ form.isStreamEnabled ? 'ENABLE' : 'DISABLE' }}
                </span>
                <USwitch
                  v-model="form.isStreamEnabled"
                  color="primary"
                  size="md"
                />
              </div>
            </div>

            <div
              class="p-3.5 rounded-2xl text-xs flex items-center justify-between"
              :class="form.isStreamEnabled ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700'"
            >
              <span class="flex items-center gap-2 font-medium">
                <UIcon :name="form.isStreamEnabled ? 'i-lucide-check-circle' : 'i-lucide-ban'" class="w-4 h-4 flex-shrink-0" />
                <span>
                  {{ form.isStreamEnabled ? 'Menu Stream tampil di navbar dan halaman /stream dapat ditonton oleh penonton.' : 'Menu Stream disembunyikan dari navbar dan halaman /stream ditutup sementara.' }}
                </span>
              </span>
            </div>

            <!-- Opsi 1 Pembatasan Akses: Wajib Login -->
            <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4">
              <div class="space-y-0.5">
                <div class="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <UIcon name="i-lucide-lock" class="w-3.5 h-3.5 text-primary" />
                  <span>Wajib Login untuk Menonton Live Stream</span>
                </div>
                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {{ form.isStreamRequireLogin ? 'Pengunjung wajib masuk (login) ke akun sebelum dapat mengakses streaming.' : 'Live stream dapat ditonton bebas oleh publik tanpa perlu login.' }}
                </p>
              </div>
              <USwitch
                v-model="form.isStreamRequireLogin"
                color="primary"
                size="md"
              />
            </div>

            <!-- Opsi 2 Pembatasan Akses: Khusus Member Premium -->
            <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4">
              <div class="space-y-0.5">
                <div class="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <UIcon name="i-lucide-crown" class="w-3.5 h-3.5 text-amber-500" />
                  <span class="text-amber-600 dark:text-amber-400 font-extrabold">Khusus Member Premium</span>
                </div>
                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {{ form.isStreamRequirePremium ? 'Hanya akun dengan status Member Premium yang aktif (dan admin) yang dapat menonton live stream.' : 'Member biasa (tanpa paket premium) tetap dapat menyaksikan live streaming.' }}
                </p>
              </div>
              <USwitch
                v-model="form.isStreamRequirePremium"
                color="warning"
                size="md"
              />
            </div>

            <div v-if="!form.isStreamEnabled" class="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Pesan Pemberitahuan Saat Stream Dinonaktifkan
              </label>
              <UTextarea
                v-model="form.streamNotice"
                :rows="2"
                placeholder="Tuliskan pesan yang tampil kepada penonton saat membuka /stream..."
                class="w-full text-xs font-normal"
              />
            </div>
          </div>

          <!-- Card 3: Kontrol Fitur Arsip Replay -->
          <div class="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-play-circle" class="w-5 h-5 text-primary" />
                  <h3 class="font-bold text-base text-neutral-900 dark:text-white">Fitur Arsip Replay</h3>
                </div>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  Aktifkan atau nonaktifkan katalog video rekaman pertunjukan teater.
                </p>
              </div>

              <!-- Switch Toggle Enable/Disable -->
              <div class="flex items-center gap-2.5">
                <span class="text-xs font-bold" :class="form.isReplayEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'">
                  {{ form.isReplayEnabled ? 'ENABLE' : 'DISABLE' }}
                </span>
                <USwitch
                  v-model="form.isReplayEnabled"
                  color="primary"
                  size="md"
                />
              </div>
            </div>

            <div
              class="p-3.5 rounded-2xl text-xs flex items-center justify-between"
              :class="form.isReplayEnabled ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700'"
            >
              <span class="flex items-center gap-2 font-medium">
                <UIcon :name="form.isReplayEnabled ? 'i-lucide-check-circle' : 'i-lucide-ban'" class="w-4 h-4 flex-shrink-0" />
                <span>
                  {{ form.isReplayEnabled ? 'Menu Replay tampil di navbar dan halaman katalog /replay dapat diakses.' : 'Menu Replay disembunyikan dari navbar dan katalog /replay ditutup sementara.' }}
                </span>
              </span>
            </div>

            <!-- Opsi 1 Pembatasan Akses: Wajib Login -->
            <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4">
              <div class="space-y-0.5">
                <div class="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <UIcon name="i-lucide-lock" class="w-3.5 h-3.5 text-primary" />
                  <span>Wajib Login untuk Menonton Arsip Replay</span>
                </div>
                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {{ form.isReplayRequireLogin ? 'Pengunjung wajib masuk (login) ke akun sebelum dapat membuka katalog dan video replay.' : 'Katalog video replay dapat ditonton bebas oleh publik tanpa perlu login.' }}
                </p>
              </div>
              <USwitch
                v-model="form.isReplayRequireLogin"
                color="primary"
                size="md"
              />
            </div>

            <!-- Opsi 2 Pembatasan Akses: Khusus Member Premium -->
            <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4">
              <div class="space-y-0.5">
                <div class="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <UIcon name="i-lucide-crown" class="w-3.5 h-3.5 text-amber-500" />
                  <span class="text-amber-600 dark:text-amber-400 font-extrabold">Khusus Member Premium</span>
                </div>
                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {{ form.isReplayRequirePremium ? 'Hanya akun dengan status Member Premium yang aktif (dan admin) yang dapat mengakses arsip replay.' : 'Member biasa (tanpa paket premium) tetap dapat menonton video arsip replay.' }}
                </p>
              </div>
              <USwitch
                v-model="form.isReplayRequirePremium"
                color="warning"
                size="md"
              />
            </div>

            <div v-if="!form.isReplayEnabled" class="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Pesan Pemberitahuan Saat Replay Dinonaktifkan
              </label>
              <UTextarea
                v-model="form.replayNotice"
                :rows="2"
                placeholder="Tuliskan pesan yang tampil kepada penonton saat membuka /replay..."
                class="w-full text-xs font-normal"
              />
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div class="flex items-center gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                icon="i-lucide-rotate-ccw"
                label="Reset Default"
                class="text-neutral-500 cursor-pointer"
                @click="handleResetToDefault"
              />
              <UButton
                v-if="isDirty"
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-lucide-undo-2"
                label="Batal Ubah"
                class="text-neutral-600 dark:text-neutral-300 cursor-pointer"
                @click="handleDiscardChanges"
              />
            </div>

            <UButton
              color="primary"
              variant="solid"
              size="md"
              icon="i-lucide-save"
              label="Simpan Pengaturan Sekarang"
              :loading="isSaving"
              class="font-bold rounded-xl cursor-pointer shadow-sm shadow-primary/20 px-6"
              @click="handleSave"
            />
          </div>
        </div>

        <!-- Right Column: Info & Cloud Status (1 col) -->
        <div class="space-y-6">
          <!-- Appwrite Database Storage Information Card -->
          <div class="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <UIcon name="i-lucide-database" class="w-4 h-4" />
              </div>
              <div>
                <h4 class="font-bold text-sm text-neutral-900 dark:text-white">Status Database Cloud</h4>
                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Appwrite Database (TablesDB)</p>
              </div>
            </div>

            <div class="space-y-3 text-xs pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <div class="flex items-center justify-between">
                <span class="text-neutral-500 dark:text-neutral-400">Tabel Appwrite:</span>
                <code class="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-primary font-mono text-[11px] font-bold">
                  settings (global_settings)
                </code>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-neutral-500 dark:text-neutral-400">Mode Penyimpanan:</span>
                <span class="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <UIcon name="i-lucide-check-circle" class="w-3.5 h-3.5" />
                  Appwrite Sites Ready
                </span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-neutral-500 dark:text-neutral-400">Persistensi Data:</span>
                <span class="font-bold text-emerald-600 dark:text-emerald-400">100% Cloud Persisten</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-neutral-500 dark:text-neutral-400">Waktu Simpan:</span>
                <span class="text-neutral-700 dark:text-neutral-300 text-[11px] text-right max-w-[150px] truncate font-medium" :title="formattedUpdatedAt">
                  {{ formattedUpdatedAt }}
                </span>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed space-y-1.5">
              <div class="font-bold flex items-center gap-1.5">
                <UIcon name="i-lucide-cloud" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Cloud Database Terhubung
              </div>
              <p class="text-[11px] opacity-90">
                Pengaturan website disimpan langsung di Appwrite Database sehingga data selalu persisten saat aplikasi di-redeploy atau di-host di Appwrite Sites.
              </p>
            </div>
          </div>

          <!-- Quick Preview Card -->
          <div class="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
            <h4 class="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-lucide-eye" class="w-4 h-4 text-primary" />
              Preview Menu & Hak Akses
            </h4>
            <div class="space-y-2 text-xs">
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <div class="space-y-0.5">
                  <div class="font-medium text-neutral-700 dark:text-neutral-300">Home (Beranda)</div>
                  <div class="text-[10px] text-neutral-400">Akses: Publik Bebas</div>
                </div>
                <UBadge color="success" variant="subtle" size="xs">Aktif</UBadge>
              </div>

              <!-- Live Stream Preview -->
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <div class="space-y-0.5">
                  <div class="font-medium text-neutral-700 dark:text-neutral-300">Live Stream</div>
                  <div
                    class="text-[10px] font-bold"
                    :class="form.isStreamRequirePremium
                      ? 'text-amber-500 dark:text-amber-400'
                      : (form.isStreamRequireLogin ? 'text-primary' : 'text-emerald-600 dark:text-emerald-400')"
                  >
                    {{ form.isStreamRequirePremium ? 'Khusus Premium' : (form.isStreamRequireLogin ? 'Wajib Login' : 'Akses Publik') }}
                  </div>
                </div>
                <UBadge :color="form.isStreamEnabled ? 'success' : 'neutral'" variant="subtle" size="xs">
                  {{ form.isStreamEnabled ? 'Aktif' : 'Nonaktif' }}
                </UBadge>
              </div>

              <!-- Arsip Replay Preview -->
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <div class="space-y-0.5">
                  <div class="font-medium text-neutral-700 dark:text-neutral-300">Arsip Replay</div>
                  <div
                    class="text-[10px] font-bold"
                    :class="form.isReplayRequirePremium
                      ? 'text-amber-500 dark:text-amber-400'
                      : (form.isReplayRequireLogin ? 'text-primary' : 'text-emerald-600 dark:text-emerald-400')"
                  >
                    {{ form.isReplayRequirePremium ? 'Khusus Premium' : (form.isReplayRequireLogin ? 'Wajib Login' : 'Akses Publik') }}
                  </div>
                </div>
                <UBadge :color="form.isReplayEnabled ? 'success' : 'neutral'" variant="subtle" size="xs">
                  {{ form.isReplayEnabled ? 'Aktif' : 'Nonaktif' }}
                </UBadge>
              </div>

              <div class="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <div class="space-y-0.5">
                  <div class="font-medium text-neutral-700 dark:text-neutral-300">Jadwal Show</div>
                  <div class="text-[10px] text-neutral-400">Akses: Publik Bebas</div>
                </div>
                <UBadge color="success" variant="subtle" size="xs">Aktif</UBadge>
              </div>

              <div class="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <div class="space-y-0.5">
                  <div class="font-medium text-neutral-700 dark:text-neutral-300">Pembayaran</div>
                  <div class="text-[10px] text-neutral-400">Akses: Publik Bebas</div>
                </div>
                <UBadge color="success" variant="subtle" size="xs">Aktif</UBadge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
