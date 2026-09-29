// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      appName: process.env.APP_NAME || 'Pekerja48',
      streamUrl: process.env.STREAM_URL || process.env.NUXT_PUBLIC_STREAM_URL || '',
      appwriteEndpoint: process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1',
      appwriteProjectId: process.env.APPWRITE_PROJECT_ID || '6a869957002a80bc5060',
      appwriteDatabaseId: process.env.APPWRITE_DATABASE_ID || '6aba9a7300316352ddb0',
      appwriteTableSetlistId: process.env.APPWRITE_TABLE_SETLIST_ID || process.env.APPWRITE_COLLECTION_SETLIST_ID || '6abacdde002ba14e3aa8',
      appwriteCollectionSetlistId: process.env.APPWRITE_COLLECTION_SETLIST_ID || process.env.APPWRITE_TABLE_SETLIST_ID || '6abacdde002ba14e3aa8',
      appwriteBucketId: process.env.APPWRITE_BUCKET_ID || 'setlist-photos',
      appwriteTableShowId: process.env.APPWRITE_TABLE_SHOW_ID || 'shows'
    }
  }
})