import { tablesDB, databases, storage, ID } from '~/appwrite'

export interface SetlistItem {
  $id?: string
  id?: string | number
  title_id: string // Judul Indonesia
  title_jp: string // Judul Jepang
  image_url: string // URL Gambar / Foto
  file_id?: string // ID Berkas di Appwrite Storage
  $createdAt?: string
}

const defaultSetlists: SetlistItem[] = [
  {
    $id: 'setlist-1',
    id: 1,
    title_id: 'Cara Meminum Ramune',
    title_jp: 'Ramune no Nomikata (ラムネの飲み方)',
    image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    $createdAt: new Date().toISOString()
  },
  {
    $id: 'setlist-2',
    id: 2,
    title_id: 'Aturan Anti Cinta',
    title_jp: 'Renai Kinshi Jourei (恋愛禁止条例)',
    image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    $createdAt: new Date().toISOString()
  },
  {
    $id: 'setlist-3',
    id: 3,
    title_id: 'Tunas Dibalik Seragam',
    title_jp: 'Seifuku no Me (制服の芽)',
    image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    $createdAt: new Date().toISOString()
  },
  {
    $id: 'setlist-4',
    id: 4,
    title_id: 'Pajama Drive',
    title_jp: 'Pajama Drive (パジャマドライブ)',
    image_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
    $createdAt: new Date().toISOString()
  }
]

export const useAppwriteSetlist = () => {
  const config = useRuntimeConfig()
  const dbId = computed(() => (config.public.appwriteDatabaseId as string) || 'theater-db')
  const tableId = computed(() => (config.public.appwriteTableSetlistId as string) || (config.public.appwriteCollectionSetlistId as string) || 'setlists')
  const collectionId = computed(() => (config.public.appwriteCollectionSetlistId as string) || tableId.value)
  const bucketId = computed(() => (config.public.appwriteBucketId as string) || 'setlist-photos')

  const setlists = useState<SetlistItem[]>('appwrite_setlists', () => [])
  const isLoading = ref(false)
  const isActionLoading = ref(false)
  const appwriteError = ref<string | null>(null)
  const appwriteNotice = ref<string | null>(null)

  // Local storage cache helper
  const loadLocalCache = (): SetlistItem[] => {
    if (!import.meta.client) return [...defaultSetlists]
    try {
      const saved = localStorage.getItem('cached_setlists')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch {
      // ignore
    }
    return [...defaultSetlists]
  }

  const saveLocalCache = (items: SetlistItem[]) => {
    if (!import.meta.client) return
    try {
      localStorage.setItem('cached_setlists', JSON.stringify(items))
    } catch {
      // ignore
    }
  }

  // Fetch setlists from Appwrite TablesDB (with Databases fallback)
  const fetchSetlists = async () => {
    isLoading.value = true
    appwriteError.value = null
    appwriteNotice.value = null

    try {
      // 1. Try Appwrite TablesDB first
      try {
        const res = await tablesDB.listRows(dbId.value, tableId.value)
        const mapped: SetlistItem[] = (res.rows || []).map((row: any) => ({
          $id: row.$id,
          id: row.$id,
          title_id: row.title_id || row.title || '',
          title_jp: row.title_jp || row.originalTitle || '',
          image_url: row.image_url || row.imageUrl || '',
          file_id: row.file_id || '',
          $createdAt: row.$createdAt
        }))

        setlists.value = mapped
        if (import.meta.client) {
          saveLocalCache(mapped)
        }
        return
      } catch (tablesErr: any) {
        // If not found in TablesDB, try classic Databases Documents as fallback
        try {
          const docRes = await databases.listDocuments(dbId.value, collectionId.value)
          const mapped: SetlistItem[] = docRes.documents.map((doc: any) => ({
            $id: doc.$id,
            id: doc.$id,
            title_id: doc.title_id || doc.title || '',
            title_jp: doc.title_jp || doc.originalTitle || '',
            image_url: doc.image_url || doc.imageUrl || '',
            file_id: doc.file_id || '',
            $createdAt: doc.$createdAt
          }))

          setlists.value = mapped
          if (import.meta.client) {
            saveLocalCache(mapped)
          }
          return
        } catch {
          // Rethrow the primary TablesDB error to handle below
          throw tablesErr
        }
      }
    } catch (err: any) {
      if (import.meta.client) {
        const cached = loadLocalCache()
        if (cached.length > 0) setlists.value = cached
      }
      if (err.code === 404) {
        appwriteNotice.value = `Data sementara disimpan secara lokal.`
      } else {
        appwriteNotice.value = err?.message || 'Gagal memuat data, menggunakan cache lokal.'
      }
    } finally {
      isLoading.value = false
    }
  }

  // Upload Photo to Appwrite Storage
  const uploadPhoto = async (file: File): Promise<{ fileId: string; url: string }> => {
    try {
      const res = await storage.createFile(bucketId.value, ID.unique(), file)
      // View URL
      const fileUrl = storage.getFileView(bucketId.value, res.$id)
      return {
        fileId: res.$id,
        url: fileUrl.toString()
      }
    } catch (err: any) {
      // If bucket does not exist or upload fails, create fallback local data URL
      const fallbackUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })
      appwriteNotice.value = `Bucket Storage '${bucketId.value}' belum dibuat di Appwrite Console. Gambar disimpan secara lokal sementara.`
      return {
        fileId: `local-${Date.now()}`,
        url: fallbackUrl
      }
    }
  }

  // Create new Setlist in Appwrite TablesDB
  const createSetlist = async (data: {
    title_id: string
    title_jp: string
    file?: File
    image_url?: string
  }) => {
    isActionLoading.value = true
    appwriteError.value = null

    try {
      let finalImageUrl = data.image_url || ''
      let finalFileId = ''

      if (data.file) {
        const uploadRes = await uploadPhoto(data.file)
        finalImageUrl = uploadRes.url
        finalFileId = uploadRes.fileId
      }

      const rowPayload = {
        title_id: data.title_id.trim(),
        title_jp: data.title_jp.trim(),
        image_url: finalImageUrl,
        file_id: finalFileId
      }

      try {
        let createdId = ID.unique()
        let createdAt = new Date().toISOString()
        let createdData: any = rowPayload

        try {
          // Primary: createRow in TablesDB
          const rowRes = await tablesDB.createRow(
            dbId.value,
            tableId.value,
            createdId,
            rowPayload
          )
          createdId = rowRes.$id
          createdAt = rowRes.$createdAt
          createdData = rowRes
        } catch (tablesErr: any) {
          // Fallback: createDocument in Databases
          const docRes = await databases.createDocument(
            dbId.value,
            collectionId.value,
            createdId,
            rowPayload
          )
          createdId = docRes.$id
          createdAt = docRes.$createdAt
          createdData = docRes
        }

        const newItem: SetlistItem = {
          $id: createdId,
          id: createdId,
          title_id: createdData.title_id || rowPayload.title_id,
          title_jp: createdData.title_jp || rowPayload.title_jp,
          image_url: createdData.image_url || rowPayload.image_url,
          file_id: createdData.file_id || rowPayload.file_id,
          $createdAt: createdAt
        }

        setlists.value.unshift(newItem)
        saveLocalCache(setlists.value)
        return { success: true, item: newItem }
      } catch (dbErr: any) {
        // Fallback local save if remote database/table doesn't exist yet
        const localItem: SetlistItem = {
          $id: `local-${Date.now()}`,
          id: `local-${Date.now()}`,
          ...rowPayload,
          $createdAt: new Date().toISOString()
        }
        setlists.value.unshift(localItem)
        saveLocalCache(setlists.value)
        return { success: true, item: localItem, fallback: true }
      }
    } catch (err: any) {
      appwriteError.value = err?.message || 'Gagal menyimpan setlist.'
      return { success: false, error: appwriteError.value }
    } finally {
      isActionLoading.value = false
    }
  }

  // Update existing Setlist in Appwrite TablesDB
  const updateSetlist = async (
    id: string,
    data: {
      title_id: string
      title_jp: string
      file?: File
      image_url?: string
      file_id?: string
    }
  ) => {
    isActionLoading.value = true
    appwriteError.value = null

    try {
      let finalImageUrl = data.image_url || ''
      let finalFileId = data.file_id || ''

      if (data.file) {
        const uploadRes = await uploadPhoto(data.file)
        finalImageUrl = uploadRes.url
        finalFileId = uploadRes.fileId
      }

      const updatePayload = {
        title_id: data.title_id.trim(),
        title_jp: data.title_jp.trim(),
        image_url: finalImageUrl,
        file_id: finalFileId
      }

      try {
        // Try TablesDB updateRow
        try {
          await tablesDB.updateRow(dbId.value, tableId.value, id, updatePayload)
        } catch {
          // Fallback to Databases updateDocument
          await databases.updateDocument(dbId.value, collectionId.value, id, updatePayload)
        }
      } catch {
        // local fallback
      }

      const idx = setlists.value.findIndex(s => s.$id === id || s.id === id)
      if (idx !== -1) {
        setlists.value[idx] = {
          ...setlists.value[idx],
          ...updatePayload
        }
        saveLocalCache(setlists.value)
      }

      return { success: true }
    } catch (err: any) {
      appwriteError.value = err?.message || 'Gagal memperbarui setlist.'
      return { success: false, error: appwriteError.value }
    } finally {
      isActionLoading.value = false
    }
  }

  // Delete Setlist in Appwrite TablesDB
  const deleteSetlist = async (id: string, fileId?: string) => {
    isActionLoading.value = true
    try {
      try {
        // Try TablesDB deleteRow
        try {
          await tablesDB.deleteRow(dbId.value, tableId.value, id)
        } catch {
          // Fallback to Databases deleteDocument
          await databases.deleteDocument(dbId.value, collectionId.value, id)
        }
      } catch {
        // ignore if not in remote DB
      }

      if (fileId && !fileId.startsWith('local-')) {
        try {
          await storage.deleteFile(bucketId.value, fileId)
        } catch {
          // ignore
        }
      }

      setlists.value = setlists.value.filter(s => s.$id !== id && s.id !== id)
      saveLocalCache(setlists.value)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghapus setlist.' }
    } finally {
      isActionLoading.value = false
    }
  }

  return {
    setlists,
    isLoading,
    isActionLoading,
    appwriteError,
    appwriteNotice,
    fetchSetlists,
    createSetlist,
    updateSetlist,
    deleteSetlist,
    dbId,
    tableId,
    collectionId,
    bucketId
  }
}
