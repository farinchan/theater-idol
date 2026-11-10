<script setup lang="ts">
import { setGlobalToast } from '~/composables/error-helper'

const appName = 'Theater Idol'

try {
  const toast = useToast()
  setGlobalToast(toast)
} catch {
  // SSR fallback
}

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
