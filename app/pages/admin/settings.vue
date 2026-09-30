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
  streamNotice: '',
  replayNotice: ''
})

// Inisialisasi nilai form dari settings
const syncFormWithSettings = () => {
  if (settings.value) {
    form.appName = settings.value.appName || 'Pekerja48'
    form.isStreamEnabled = settings.value.isStreamEnabled ?? true
    form.isReplayEnabled = settings.value.isReplayEnabled ?? true
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

// Action Simpan
const handleSave = async () => {
  if (!form.appName.trim()) {
    return
  }

  await saveSettings({
    appName: form.appName.trim(),
    isStreamEnabled: form.isStreamEnabled,
    isReplayEnabled: form.isReplayEnabled,
    streamNotice: form.streamNotice.trim(),
    replayNotice: form.replayNotice.trim()
  })
}

// Action Reset ke Default
const handleResetToDefault = () => {
  form.appName = 'Pekerja48'
  form.isStreamEnabled = true
  form.isReplayEnabled = true
  form.streamNotice = 'Fitur Live Stream saat ini sedang ditutup atau dinonaktifkan sementara oleh administrator.'
  form.replayNotice = 'Fitur Arsip Replay saat ini sedang ditutup atau dinonaktifkan sementara oleh administrator.'
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
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary mb-2">
            <UIcon name="i-lucide-file-code" class="w-3.5 h-3.5" />
            Penyimpanan File Tanpa Database (Zero-DB)
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Pengaturan Website
          </h1>
          <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Konfigurasi nama website serta kendali aktif/nonaktif fitur Live Stream dan Arsip Replay.
          </p>
        </div>

        <div class="flex items-center gap-2">
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

      <!-- Feedback Alert Notice -->
      <div
        v-if="successNotice"
        class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2.5">
          <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span>{{ successNotice }}</span>
        </div>
        <button type="button" class="text-emerald-600 hover:text-emerald-700" @click="successNotice = null">
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>
      </div>

      <div
        v-if="settingsError"
        class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs sm:text-sm flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2.5">
          <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>{{ settingsError }}</span>
        </div>
        <button type="button" class="text-rose-600 hover:text-rose-700" @click="settingsError = null">
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>
      </div>

      <!-- Main Form Grid (2 Columns) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
                  Nama ini akan langsung dipakai di seluruh navigasi navbar, judul halaman meta, hero banner beranda, dan footer.
                </p>
              </div>
              <UBadge color="primary" variant="subtle" size="xs" class="font-bold">
                Aktif: {{ form.appName || 'Pekerja48' }}
              </UBadge>
            </div>

            <div class="space-y-1.5 pt-1">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Nama Portal Website <span class="text-primary">*</span>
              </label>
              <UInput
                v-model="form.appName"
                placeholder="Contoh: Pekerja48"
                size="md"
                icon="i-lucide-type"
                class="w-full font-bold"
              />
              <p class="text-[11px] text-neutral-400">
                Disarankan nama pendek dan padat (1-2 kata). Default: <strong>Pekerja48</strong>.
              </p>
            </div>
          </div>

          <!-- Card 2: Kontrol Fitur Live Stream -->
          <div class="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
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

              <!-- Switch Toggle -->
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold" :class="form.isStreamEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'">
                  {{ form.isStreamEnabled ? 'ENABLE' : 'DISABLE' }}
                </span>
                <input
                  v-model="form.isStreamEnabled"
                  type="checkbox"
                  class="w-5 h-5 accent-primary cursor-pointer rounded"
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
                  {{ form.isStreamEnabled ? 'Menu Stream tampil di navbar dan halaman /stream dapat ditonton.' : 'Menu Stream disembunyikan dari navbar dan halaman /stream ditutup sementara.' }}
                </span>
              </span>
            </div>

            <div v-if="!form.isStreamEnabled" class="space-y-1.5 pt-2">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Pesan Pemberitahuan Saat Stream Dinonaktifkan
              </label>
              <textarea
                v-model="form.streamNotice"
                rows="2"
                placeholder="Tuliskan pesan yang tampil kepada penonton saat membuka /stream..."
                class="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-neutral-900 dark:text-white focus:outline-primary"
              />
            </div>
          </div>

          <!-- Card 3: Kontrol Fitur Arsip Replay -->
          <div class="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
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

              <!-- Switch Toggle -->
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold" :class="form.isReplayEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'">
                  {{ form.isReplayEnabled ? 'ENABLE' : 'DISABLE' }}
                </span>
                <input
                  v-model="form.isReplayEnabled"
                  type="checkbox"
                  class="w-5 h-5 accent-primary cursor-pointer rounded"
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

            <div v-if="!form.isReplayEnabled" class="space-y-1.5 pt-2">
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Pesan Pemberitahuan Saat Replay Dinonaktifkan
              </label>
              <textarea
                v-model="form.replayNotice"
                rows="2"
                placeholder="Tuliskan pesan yang tampil kepada penonton saat membuka /replay..."
                class="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-neutral-900 dark:text-white focus:outline-primary"
              />
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="flex items-center justify-between gap-4 pt-2">
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-lucide-rotate-ccw"
              label="Reset ke Default"
              class="text-neutral-500 cursor-pointer"
              @click="handleResetToDefault"
            />

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

        <!-- Right Column: Info & Storage Best Practice Status (1 col) -->
        <div class="space-y-6">
          <!-- File Storage Information Card -->
          <div class="p-6 rounded-3xl bg-neutral-900 text-white border border-neutral-800 shadow-xl space-y-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <UIcon name="i-lucide-hard-drive" class="w-4 h-4" />
              </div>
              <div>
                <h4 class="font-bold text-sm">Status File Storage</h4>
                <p class="text-[11px] text-neutral-400">Penyimpanan JSON Server-Side</p>
              </div>
            </div>

            <div class="space-y-3 text-xs pt-1 border-t border-neutral-800">
              <div class="flex items-center justify-between">
                <span class="text-neutral-400">File Target:</span>
                <code class="px-2 py-0.5 rounded bg-neutral-800 text-primary font-mono text-[11px]">
                  data/settings.json
                </code>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-neutral-400">Mode Database:</span>
                <span class="font-bold text-emerald-400 flex items-center gap-1">
                  <UIcon name="i-lucide-check" class="w-3.5 h-3.5" />
                  Zero-Database (File)
                </span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-neutral-400">Persistensi Build:</span>
                <span class="font-bold text-emerald-400">Aman / Persisten</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-neutral-400">Waktu Simpan:</span>
                <span class="text-neutral-300 text-[11px] text-right max-w-[150px] truncate" :title="formattedUpdatedAt">
                  {{ formattedUpdatedAt }}
                </span>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/50 text-[11px] text-neutral-300 leading-relaxed space-y-1.5">
              <div class="font-bold text-white flex items-center gap-1.5">
                <UIcon name="i-lucide-info" class="w-3.5 h-3.5 text-primary" />
                Best Practice Build
              </div>
              <p>
                File disimpan di luar folder <code>.output</code> sehingga saat aplikasi di-build ulang (<code>npm run build</code>) data pengaturan tidak akan terhapus.
              </p>
            </div>
          </div>

          <!-- Quick Preview Card -->
          <div class="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
            <h4 class="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-lucide-eye" class="w-4 h-4 text-primary" />
              Preview Menu Navigasi
            </h4>
            <div class="space-y-2 text-xs">
              <div class="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <span class="font-medium">Home (Beranda)</span>
                <UBadge color="success" variant="subtle" size="xs">Aktif</UBadge>
              </div>
              <div class="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <span class="font-medium">Live Stream</span>
                <UBadge :color="form.isStreamEnabled ? 'success' : 'neutral'" variant="subtle" size="xs">
                  {{ form.isStreamEnabled ? 'Aktif' : 'Nonaktif' }}
                </UBadge>
              </div>
              <div class="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <span class="font-medium">Arsip Replay</span>
                <UBadge :color="form.isReplayEnabled ? 'success' : 'neutral'" variant="subtle" size="xs">
                  {{ form.isReplayEnabled ? 'Aktif' : 'Nonaktif' }}
                </UBadge>
              </div>
              <div class="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <span class="font-medium">Jadwal Show</span>
                <UBadge color="success" variant="subtle" size="xs">Aktif</UBadge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
