<script setup lang="ts">
import { ref, onMounted } from 'vue'

const deferredPrompt = ref<any>(null)
const isInstallable = ref(false)
const isDismissed = ref(false)
const isInstalled = ref(false)

onMounted(() => {
  if (typeof window === 'undefined') return

  // Cek apakah sudah dalam mode PWA Standalone
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
  if (isStandalone) {
    isInstalled.value = true
    return
  }

  // Cek apakah user pernah menutup banner dalam 7 hari terakhir
  const dismissedTime = localStorage.getItem('pwa_prompt_dismissed')
  if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 7 * 24 * 60 * 60 * 1000) {
    isDismissed.value = true
  }

  // Tangkap event install prompt bawaan browser
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferredPrompt.value = e
    isInstallable.value = true
  })

  window.addEventListener('appinstalled', () => {
    isInstalled.value = true
    isInstallable.value = false
    deferredPrompt.value = null
  })
})

const handleInstall = async () => {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') {
    isInstallable.value = false
    isInstalled.value = true
  }
  deferredPrompt.value = null
}

const handleDismiss = () => {
  isDismissed.value = true
  if (typeof window !== 'undefined') {
    localStorage.setItem('pwa_prompt_dismissed', String(Date.now()))
  }
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out transform"
    enter-from-class="translate-y-8 opacity-0 scale-95"
    enter-to-class="translate-y-0 opacity-100 scale-100"
    leave-active-class="transition duration-200 ease-in transform"
    leave-from-class="translate-y-0 opacity-100 scale-100"
    leave-to-class="translate-y-8 opacity-0 scale-95"
  >
    <div
      v-if="isInstallable && !isDismissed && !isInstalled"
      class="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-96 p-4 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-3"
    >
      <div class="flex items-start gap-3">
        <img
          src="/icon.png"
          alt="Theater Idol Logo"
          class="w-11 h-11 rounded-xl object-cover shrink-0 border border-neutral-200/60 dark:border-neutral-700/60 shadow-xs"
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <h4 class="font-extrabold text-sm text-neutral-900 dark:text-white truncate">
              Install Theater Idol
            </h4>
            <button
              type="button"
              class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 -mr-1 rounded-lg cursor-pointer"
              aria-label="Tutup"
              @click="handleDismiss"
            >
              <UIcon name="i-lucide-x" class="w-4 h-4" />
            </button>
          </div>
          <p class="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug mt-0.5">
            Akses live stream & replay lebih cepat langsung dari layar utama perangkat Anda.
          </p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800/80">
        <UButton
          color="neutral"
          variant="ghost"
          size="xs"
          label="Nanti saja"
          class="cursor-pointer"
          @click="handleDismiss"
        />
        <UButton
          color="primary"
          variant="solid"
          size="xs"
          icon="i-lucide-download"
          label="Install Sekarang"
          class="font-bold rounded-xl cursor-pointer shadow-xs"
          @click="handleInstall"
        />
      </div>
    </div>
  </Transition>
</template>
