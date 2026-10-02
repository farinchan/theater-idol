// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['plyr/dist/plyr.css', '~/assets/css/main.css'],
  app: {
    head: {
      meta: [
        { name: 'referrer', content: 'strict-origin-when-cross-origin' }
      ]
    }
  },
  runtimeConfig: {
    sumopodApiKey: process.env.SUMOPOD_API_KEY || '',
    sumopodPayEndpoint: process.env.SUMOPOD_PAY_ENDPOINT || '',
    sumopodWebhookSecret: process.env.SUMOPOD_WEBHOOK_SECRET || '',
    sumopodWebhookToken: process.env.SUMOPOD_WEBHOOK_TOKEN || '',
    appwriteApiKey: process.env.APPWRITE_API_KEY || '',
    streamUrl: process.env.STREAM_URL || '',
    streamUseProxy: process.env.STREAM_USE_PROXY !== 'false',
    streamProxyOrigin: process.env.STREAM_PROXY_ORIGIN || '',
    public: {
      appName: process.env.APP_NAME || 'Pekerja48',
      streamUrl: process.env.STREAM_URL || process.env.NUXT_PUBLIC_STREAM_URL || '',
      streamUseProxy: process.env.STREAM_USE_PROXY !== 'false',
      appwriteEndpoint: process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1',
      appwriteProjectId: process.env.APPWRITE_PROJECT_ID || '',
      appwriteDatabaseId: process.env.APPWRITE_DATABASE_ID || '',
      appwriteTableSetlistId: process.env.APPWRITE_TABLE_SETLIST_ID || process.env.APPWRITE_COLLECTION_SETLIST_ID || '',
      appwriteCollectionSetlistId: process.env.APPWRITE_COLLECTION_SETLIST_ID || process.env.APPWRITE_TABLE_SETLIST_ID || '',
      appwriteBucketId: process.env.APPWRITE_BUCKET_ID || '',
      appwriteTableShowId: process.env.APPWRITE_TABLE_SHOW_ID || '',
      appwriteTableChatId: process.env.APPWRITE_TABLE_CHAT_ID || process.env.APPWRITE_COLLECTION_CHAT_ID || ''
    }
  }
})