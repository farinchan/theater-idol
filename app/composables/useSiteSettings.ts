export interface SiteSettings {
  appName: string
  isStreamEnabled: boolean
  isReplayEnabled: boolean
  streamNotice?: string
  replayNotice?: string
  updatedAt?: string
}

export const useSiteSettings = () => {
  const settings = useState<SiteSettings>('site_settings', () => ({
    appName: 'Pekerja48',
    isStreamEnabled: true,
    isReplayEnabled: true,
    streamNotice: 'Fitur Live Stream saat ini sedang ditutup atau dinonaktifkan sementara oleh administrator.',
    replayNotice: 'Fitur Arsip Replay saat ini sedang ditutup atau dinonaktifkan sementara oleh administrator.',
    updatedAt: new Date().toISOString()
  }))

  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const successNotice = ref<string | null>(null)

  const isStreamEnabled = computed(() => settings.value?.isStreamEnabled ?? true)
  const isReplayEnabled = computed(() => settings.value?.isReplayEnabled ?? true)
  const appName = computed(() => settings.value?.appName || 'Pekerja48')
  const streamNotice = computed(() => settings.value?.streamNotice || 'Fitur Live Stream sedang ditutup.')
  const replayNotice = computed(() => settings.value?.replayNotice || 'Fitur Arsip Replay sedang ditutup.')

  // Memuat pengaturan dari API file server (/api/settings)
  const fetchSettings = async () => {
    isLoading.value = true
    try {
      const data = await $fetch<SiteSettings>('/api/settings')
      if (data) {
        settings.value = {
          ...settings.value,
          ...data
        }
        error.value = null
      }
    } catch (err: any) {
      console.warn('[useSiteSettings] Menggunakan data fallback:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Menyimpan pengaturan baru ke file server (/api/settings)
  const saveSettings = async (newSettings: Partial<SiteSettings>) => {
    isSaving.value = true
    error.value = null
    successNotice.value = null
    try {
      const res = await $fetch<{ success: boolean; settings: SiteSettings }>('/api/settings', {
        method: 'POST',
        body: newSettings
      })
      if (res && res.settings) {
        settings.value = res.settings
        successNotice.value = 'Pengaturan berhasil disimpan ke data/settings.json!'
        return { success: true, settings: res.settings }
      }
      return { success: false }
    } catch (err: any) {
      const msg = err?.data?.statusMessage || err?.message || 'Gagal menyimpan pengaturan ke file.'
      error.value = msg
      return { success: false, error: msg }
    } finally {
      isSaving.value = false
    }
  }

  return {
    settings,
    isStreamEnabled,
    isReplayEnabled,
    appName,
    streamNotice,
    replayNotice,
    isLoading,
    isSaving,
    error,
    successNotice,
    fetchSettings,
    saveSettings
  }
}
