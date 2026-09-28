// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      appName: process.env.APP_NAME || 'Pekerja48',
      appwriteEndpoint: process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1',
      appwriteProjectId: process.env.APPWRITE_PROJECT_ID || '6a869957002a80bc5060',
      appwriteDatabaseId: process.env.APPWRITE_DATABASE_ID || 'theater-db',
      appwriteCollectionSetlistId: process.env.APPWRITE_COLLECTION_SETLIST_ID || 'setlists',
      appwriteBucketId: process.env.APPWRITE_BUCKET_ID || 'setlist-photos'
    }
  }
})