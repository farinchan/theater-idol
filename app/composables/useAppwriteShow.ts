import { tablesDB, ID } from '~/appwrite'

export interface ShowItem {
  $id?: string
  id?: string | number
  setlist_id: string
  setlist?: any
  date: string // Format ISO 8601 DateTime (e.g. 2026-10-04T12:00:00.000Z)
  time: string // Format HH:mm (e.g. 19:00)
  description?: string
  lineup?: string
  $createdAt?: string
}

// Helper untuk memastikan format ISO 8601 DateTime pada kolom datetime Appwrite
const formatIsoDatetime = (dateStr: string, timeStr?: string): string => {
  try {
    if (dateStr && dateStr.includes('T')) {
      const parsed = new Date(dateStr)
      if (!isNaN(parsed.getTime())) return parsed.toISOString()
    }
    const cleanDate = (dateStr || '').trim()
    const cleanTime = (timeStr || '19:00').trim().slice(0, 5)
    const combined = new Date(`${cleanDate}T${cleanTime}:00`)
    if (!isNaN(combined.getTime())) {
      return combined.toISOString()
    }
  } catch {}
  return new Date().toISOString()
}

export const useAppwriteShow = () => {
  const config = useRuntimeConfig()
  const dbId = computed(() => (config.public.appwriteDatabaseId as string) || '6aba9a7300316352ddb0')
  const showTableId = computed(() => (config.public.appwriteTableShowId as string) || 'shows')

  const shows = useState<ShowItem[]>('appwrite_shows', () => [])
  const isLoading = ref(false)
  const isActionLoading = ref(false)
  const appwriteError = ref<string | null>(null)
  const appwriteNotice = ref<string | null>(null)

  // Local cache helper
  const loadLocalCache = (): ShowItem[] => {
    if (!import.meta.client) return []
    try {
      const saved = localStorage.getItem('cached_shows')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  }

  const saveLocalCache = (items: ShowItem[]) => {
    if (!import.meta.client) return
    try {
      localStorage.setItem('cached_shows', JSON.stringify(items))
    } catch {}
  }

  const fetchShows = async () => {
    if (!import.meta.client) return
    isLoading.value = true
    appwriteError.value = null
    appwriteNotice.value = null

    try {
      const res = await tablesDB.listRows(dbId.value, showTableId.value)
      const mapped: ShowItem[] = (res.rows || []).map((row: any) => ({
        $id: row.$id,
        id: row.$id,
        setlist_id: row.setlist_id || (typeof row.setlist === 'string' ? row.setlist : row.setlist?.$id) || '',
        setlist: row.setlist,
        date: row.date || '',
        time: row.time || '',
        description: row.description || '',
        lineup: row.lineup || '',
        $createdAt: row.$createdAt
      }))
      shows.value = mapped
      saveLocalCache(mapped)
    } catch (err: any) {
      const cached = loadLocalCache()
      if (cached.length > 0) shows.value = cached
      if (err.code === 404) {
        appwriteNotice.value = 'Data jadwal sementara disimpan secara lokal.'
      } else {
        appwriteNotice.value = err?.message || 'Gagal memuat jadwal show.'
      }
    } finally {
      isLoading.value = false
    }
  }

  const createShow = async (data: {
    setlist_id: string
    date: string
    time: string
    description?: string
    lineup?: string
  }) => {
    isActionLoading.value = true
    appwriteError.value = null

    try {
      const newId = ID.unique()
      const cleanTime = (data.time || '19:00').trim().slice(0, 5)
      const isoDate = formatIsoDatetime(data.date, cleanTime)

      const payload = {
        setlist: data.setlist_id,
        setlist_id: data.setlist_id,
        date: isoDate,
        time: cleanTime,
        description: (data.description || '').trim(),
        lineup: (data.lineup || '').trim()
      }

      try {
        const rowRes = await tablesDB.createRow(
          dbId.value,
          showTableId.value,
          newId,
          payload
        )
        const newItem: ShowItem = {
          $id: rowRes.$id,
          id: rowRes.$id,
          setlist_id: rowRes.setlist_id || payload.setlist_id,
          setlist: rowRes.setlist || payload.setlist,
          date: rowRes.date || payload.date,
          time: rowRes.time || payload.time,
          description: rowRes.description || payload.description,
          lineup: rowRes.lineup || payload.lineup,
          $createdAt: rowRes.$createdAt
        }
        shows.value.unshift(newItem)
        saveLocalCache(shows.value)
        return { success: true, item: newItem }
      } catch (err: any) {
        // Fallback local save if remote issue
        const localItem: ShowItem = {
          $id: `local-${Date.now()}`,
          id: `local-${Date.now()}`,
          ...payload,
          $createdAt: new Date().toISOString()
        }
        shows.value.unshift(localItem)
        saveLocalCache(shows.value)
        return { success: true, item: localItem, fallback: true }
      }
    } catch (err: any) {
      appwriteError.value = err?.message || 'Gagal menyimpan pertunjukan.'
      return { success: false, error: appwriteError.value }
    } finally {
      isActionLoading.value = false
    }
  }

  const updateShow = async (
    id: string,
    data: {
      setlist_id: string
      date: string
      time: string
      description?: string
      lineup?: string
    }
  ) => {
    isActionLoading.value = true
    appwriteError.value = null

    try {
      const cleanTime = (data.time || '19:00').trim().slice(0, 5)
      const isoDate = formatIsoDatetime(data.date, cleanTime)

      const payload = {
        setlist: data.setlist_id,
        setlist_id: data.setlist_id,
        date: isoDate,
        time: cleanTime,
        description: (data.description || '').trim(),
        lineup: (data.lineup || '').trim()
      }

      try {
        await tablesDB.updateRow(dbId.value, showTableId.value, id, payload)
      } catch {}

      const idx = shows.value.findIndex(s => s.$id === id || s.id === id)
      if (idx !== -1) {
        shows.value[idx] = {
          ...shows.value[idx],
          ...payload
        }
        saveLocalCache(shows.value)
      }
      return { success: true }
    } catch (err: any) {
      appwriteError.value = err?.message || 'Gagal memperbarui pertunjukan.'
      return { success: false, error: appwriteError.value }
    } finally {
      isActionLoading.value = false
    }
  }

  const deleteShow = async (id: string) => {
    isActionLoading.value = true
    try {
      try {
        await tablesDB.deleteRow(dbId.value, showTableId.value, id)
      } catch {}

      shows.value = shows.value.filter(s => s.$id !== id && s.id !== id)
      saveLocalCache(shows.value)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghapus pertunjukan.' }
    } finally {
      isActionLoading.value = false
    }
  }

  return {
    shows,
    isLoading,
    isActionLoading,
    appwriteError,
    appwriteNotice,
    fetchShows,
    createShow,
    updateShow,
    deleteShow,
    showTableId,
    dbId
  }
}
