<script setup lang="ts">
import { client } from '~/appwrite'

const { fetchSettings } = useSiteSettings()
await useAsyncData('global_site_settings', async () => {
  await fetchSettings()
  return true
})

onMounted(() => {
  fetchSettings()
})

const { appName } = useAppName()

useHead({
  titleTemplate: (title) => (title ? `${title} - ${appName.value}` : appName.value),
  meta: [
    { name: 'referrer', content: 'strict-origin-when-cross-origin' }
  ]
})
</script>

<template>
  <VitePwaManifest />
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
