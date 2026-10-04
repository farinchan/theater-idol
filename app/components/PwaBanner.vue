<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { usePwaInstall } from '~/composables/usePwaInstall'

const {
  isInstallable,
  isInstalled,
  isDismissed,
  showGuideModal,
  isIOS,
  isAndroid,
  install,
  dismiss
} = usePwaInstall()

const isBannerVisible = ref(false)

onMounted(() => {
  // Tampilkan banner setelah jeda singkat
  setTimeout(() => {
    if (!isInstalled.value && !isDismissed.value) {
      isBannerVisible.value = true
    }
  }, 1000)
})

watch([isInstalled, isDismissed], ([installed, dismissed]) => {
  if (installed || dismissed) {
    isBannerVisible.value = false
  }
})

const handleInstallClick = () => {
  install()
}

const handleDismissClick = () => {
  isBannerVisible.value = false
  dismiss()
}
</script>

<template>
  <div>
    <!-- Floating Bottom Banner -->
    <Transition
      enter-active-class="transition duration-400 ease-out transform"
      enter-from-class="translate-y-12 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in transform"
      leave-from-class="translate-y-0 opacity-100 scale-100"
      leave-to-class="translate-y-12 opacity-0 scale-95"
    >
      <div
        v-if="isBannerVisible && !isInstalled && !isDismissed"
        class="fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:max-w-md p-4 rounded-3xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-3.5 ring-1 ring-primary/20"
      >
        <div class="flex items-start gap-3.5">
          <img
            src="/icon.png"
            alt="Theater Idol Logo"
            class="w-12 h-12 rounded-2xl object-cover shrink-0 border border-neutral-200/60 dark:border-neutral-700/60 shadow-xs"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h4 class="font-extrabold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                <span>Install Theater Idol</span>
                <UBadge color="primary" variant="subtle" size="xs" class="font-bold text-[10px]">PWA App</UBadge>
              </h4>
              <button
                type="button"
                class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 -mr-1 rounded-lg cursor-pointer"
                aria-label="Tutup Banner"
                @click="handleDismissClick"
              >
                <UIcon name="i-lucide-x" class="w-4 h-4" />
              </button>
            </div>
            <p class="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug mt-1">
              Pasang aplikasi di layar utama HP atau desktop Anda untuk nonton live streaming & replay lebih lancar tanpa browser.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800/80">
          <button
            type="button"
            class="text-[11px] font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline underline-offset-2 cursor-pointer"
            @click="showGuideModal = true"
          >
            Lihat panduan install
          </button>

          <div class="flex items-center gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              label="Nanti Saja"
              class="cursor-pointer"
              @click="handleDismissClick"
            />
            <UButton
              color="primary"
              variant="solid"
              size="xs"
              icon="i-lucide-download"
              label="Install Aplikasi"
              class="font-bold rounded-xl cursor-pointer shadow-xs"
              @click="handleInstallClick"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal Panduan Instalasi Manual / Multi-Device -->
    <UModal
      v-model:open="showGuideModal"
      :ui="{ content: 'sm:max-w-md' }"
      class="sm:max-w-md"
    >
      <template #content>
        <div class="p-6 space-y-5">
          <!-- Modal Header -->
          <div class="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <div class="flex items-center gap-3">
              <img
                src="/icon.png"
                alt="Theater Idol Logo"
                class="w-10 h-10 rounded-2xl object-cover border border-neutral-200/60 dark:border-neutral-700/60 shadow-xs"
              />
              <div>
                <h3 class="font-bold text-base text-neutral-900 dark:text-white">Cara Install Theater Idol</h3>
                <p class="text-xs text-neutral-400">Jadikan aplikasi di layar utama perangkat Anda</p>
              </div>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-x"
              @click="showGuideModal = false"
            />
          </div>

          <!-- Petunjuk Berdasarkan Perangkat -->
          <div class="space-y-4 text-xs text-neutral-600 dark:text-neutral-300">
            <!-- Jika iOS (Safari) -->
            <div v-if="isIOS" class="space-y-3">
              <div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <UIcon name="i-lucide-smartphone" class="w-4 h-4 shrink-0" />
                <span class="font-bold">Panduan iPhone & iPad (Safari):</span>
              </div>
              <ol class="space-y-2.5 list-decimal list-inside pl-1 text-[13px] leading-relaxed">
                <li>Buka situs ini menggunakan browser <strong>Safari</strong>.</li>
                <li>
                  Tekan ikon <strong>Bagikan / Share</strong>
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[11px] font-mono">
                    <UIcon name="i-lucide-share" class="w-3 h-3 inline mr-1" /> Share
                  </span>
                  di bilah menu Safari.
                </li>
                <li>
                  Gulir ke bawah dan pilih opsi <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
                </li>
                <li>Tekan tombol <strong>"Tambah" (Add)</strong> di pojok kanan atas. Selesai!</li>
              </ol>
            </div>

            <!-- Jika Android atau browser umum -->
            <div v-else-if="isAndroid" class="space-y-3">
              <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <UIcon name="i-lucide-smartphone" class="w-4 h-4 shrink-0" />
                <span class="font-bold">Panduan Android (Google Chrome):</span>
              </div>
              <ol class="space-y-2.5 list-decimal list-inside pl-1 text-[13px] leading-relaxed">
                <li>Tekan tombol <strong>titik tiga (⋮)</strong> di pojok kanan atas Chrome.</li>
                <li>Pilih menu <strong>"Install aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                <li>Tekan <strong>"Install"</strong> pada pop-up konfirmasi.</li>
              </ol>
            </div>

            <!-- Jika Desktop / Laptop -->
            <div v-else class="space-y-3">
              <div class="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center gap-2">
                <UIcon name="i-lucide-monitor" class="w-4 h-4 shrink-0" />
                <span class="font-bold">Panduan Komputer / Laptop (Chrome & Edge):</span>
              </div>
              <ol class="space-y-2.5 list-decimal list-inside pl-1 text-[13px] leading-relaxed">
                <li>
                  Klik ikon <strong>Install</strong>
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[11px] font-mono">
                    <UIcon name="i-lucide-download" class="w-3 h-3 inline mr-1" /> Install
                  </span>
                  di sebelah kanan bilah alamat (URL bar) browser Anda.
                </li>
                <li>Atau klik menu titik tiga browser (⋮) &gt; pilih <strong>"Install Theater Idol..."</strong>.</li>
                <li>Aplikasi akan langsung terbuka seperti aplikasi desktop mandiri tanpa jendela browser.</li>
              </ol>
            </div>
          </div>

          <!-- Tombol Aksi Bawah -->
          <div class="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <UButton
              color="primary"
              variant="solid"
              label="Saya Mengerti"
              class="font-bold rounded-xl cursor-pointer"
              @click="showGuideModal = false"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
