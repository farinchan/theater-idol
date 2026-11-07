<script setup lang="ts">
const appName = 'Theater Idol'

useHead({
  titleTemplate: (title) => (title ? `${title} - ${appName}` : appName),
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
