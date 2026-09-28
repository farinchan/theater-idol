<script setup lang="ts">
import { client } from '~/appwrite'

const { appName } = useAppName()

useHead({
  titleTemplate: (title) => (title ? `${title} - ${appName.value}` : appName.value)
})
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
