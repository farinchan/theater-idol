import { databases, storage, ID } from '~/appwrite'

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
  const collectionId = computed(() => (config.public.appwriteCollectionSetlistId as string) || 'setlists')
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

  // Fetch setlists from Appwrite Database
  const fetchSetlists = async () => {
    if (!import.meta.client) return
    isLoading.value = true
    appwriteError.value = null
    appwriteNotice.value = null

    try {
      const res = await databases.listDocuments(dbId.value, collectionId.value)
      const mapped: SetlistItem[] = res.documents.map((doc: any) => ({
        $id: doc.$id,
        id: doc.$id,
        title_id: doc.title_id || doc.title || '',
        title_jp: doc.title_jp || doc.originalTitle || '',
        image_url: doc.image_url || doc.imageUrl || '',
        file_id: doc.file_id || '',
        $createdAt: doc.$createdAt
      }))

      setlists.value = mapped
      saveLocalCache(mapped)
    } catch (err: any) {
      // If database or collection does not exist yet (404), use local cache with notice
      const cached = loadLocalCache()
      setlists.value = cached
      if (err.code === 404) {
        appwriteNotice.value = `Database atau Collection '${collectionId.value}' belum dibuat di Appwrite Console. Data sementara disimpan secara lokal.`
      } else {
        appwriteNotice.value = err?.message || 'Gagal memuat data dari Appwrite Database, menggunakan cache lokal.'
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

  // Create new Setlist in Appwrite Database
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

      const docData = {
        title_id: data.title_id.trim(),
        title_jp: data.title_jp.trim(),
        image_url: finalImageUrl,
        file_id: finalFileId
      }

      try {
        const docRes = await databases.createDocument(
          dbId.value,
          collectionId.value,
          ID.unique(),
          docData
        )

        const newItem: SetlistItem = {
          $id: docRes.$id,
          id: docRes.$id,
          title_id: docRes.title_id || docData.title_id,
          title_jp: docRes.title_jp || docData.title_jp,
          image_url: docRes.image_url || docData.image_url,
          file_id: docRes.file_id || docData.file_id,
          $createdAt: docRes.$createdAt
        }

        setlists.value.unshift(newItem)
        saveLocalCache(setlists.value)
        return { success: true, item: newItem }
      } catch (dbErr: any) {
        // Fallback local save if database doesn't exist yet
        const localItem: SetlistItem = {
          $id: `local-${Date.now()}`,
          id: `local-${Date.now()}`,
          ...docData,
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

  // Update existing Setlist
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
        await databases.updateDocument(dbId.value, collectionId.value, id, updatePayload)
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

  // Delete Setlist
  const deleteSetlist = async (id: string, fileId?: string) => {
    isActionLoading.value = true
    try {
      try {
        await databases.deleteDocument(dbId.value, collectionId.value, id)
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
    collectionId,
    bucketId
  }
}
