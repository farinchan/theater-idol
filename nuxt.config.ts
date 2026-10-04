// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@vite-pwa/nuxt'],
  css: ['plyr/dist/plyr.css', '~/assets/css/main.css'],
  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
      }
    },
    '/api/**': {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    }
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'id',
        dir: 'ltr'
      },
      titleTemplate: '%s · Theater Idol',
      title: 'Theater Idol - Nonton Live Streaming & Replay Pertunjukan Theater Idol',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover' },
        { name: 'referrer', content: 'strict-origin-when-cross-origin' },
        { name: 'description', content: 'Platform streaming dan arsip video replay pertunjukan Theater Idol terlengkap dengan kualitas audio visual HD terbaik.' },
        { name: 'keywords', content: 'theater idol, nonton theater idol, streaming theater idol, live streaming theater idol, replay theater idol, setlist idol, jadwal show theater idol, pertunjukan theater idol' },
        { name: 'author', content: 'Theater Idol' },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { name: 'theme-color', content: '#e11d48' },
        { name: 'msapplication-TileColor', content: '#e11d48' },
        { name: 'application-name', content: 'Theater Idol' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Theater Idol' },
        { property: 'og:site_name', content: 'Theater Idol' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'id_ID' },
        { property: 'og:image', content: '/icon.png' },
        { property: 'og:image:width', content: '512' },
        { property: 'og:image:height', content: '512' },
        { property: 'og:url', content: 'https://theater-idol.web.id' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:url', content: 'https://theater-idol.web.id' },
        { name: 'twitter:image', content: '/icon.png' }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'canonical', href: 'https://theater-idol.web.id' },
        { rel: 'icon', type: 'image/png', href: '/icon.png' },
        { rel: 'shortcut icon', type: 'image/png', href: '/icon.png' },
        { rel: 'apple-touch-icon', href: '/icon.png' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/pwa-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/pwa-512x512.png' }
      ]
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Theater Idol',
      short_name: 'Theater Idol',
      description: 'Platform Nonton Live Streaming & Video Replay Pertunjukan Theater Idol kualitas HD.',
      theme_color: '#e11d48',
      background_color: '#0a0a0a',
      display: 'standalone',
      orientation: 'portrait-primary',
      start_url: '/',
      scope: '/',
      lang: 'id',
      icons: [
        {
          src: '/pwa-64x64.png',
          sizes: '64x64',
          type: 'image/png'
        },
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
      shortcuts: [
        {
          name: 'Live Streaming',
          short_name: 'Live',
          description: 'Nonton Siaran Langsung Theater Idol',
          url: '/stream',
          icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
        },
        {
          name: 'Jadwal Show',
          short_name: 'Jadwal',
          description: 'Cek Jadwal Show Theater Idol',
          url: '/jadwal',
          icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
        },
        {
          name: 'Replay Show',
          short_name: 'Replay',
          description: 'Koleksi Replay Theater Idol',
          url: '/replay',
          icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}']
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: true,
      type: 'module'
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
      appName: process.env.APP_NAME || 'Theater Idol',
      siteUrl: process.env.SITE_URL || 'https://theater-idol.web.id',
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