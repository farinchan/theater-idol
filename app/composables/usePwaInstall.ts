import { ref, onMounted } from 'vue'

const deferredPrompt = ref<any>(null)
const isInstallable = ref<boolean>(false)
const isInstalled = ref<boolean>(false)
const showGuideModal = ref<boolean>(false)
const isDismissed = ref<boolean>(false)

// Tangkap beforeinstallprompt sedini mungkin di level modul agar tidak terlewat
if (typeof window !== 'undefined') {
  // Cek apakah sudah dalam mode Standalone
  const checkStandalone = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    )
  }

  if (checkStandalone()) {
    isInstalled.value = true
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferredPrompt.value = e
    isInstallable.value = true
    console.info('[PWA] beforeinstallprompt event captured')
  })

  window.addEventListener('appinstalled', () => {
    isInstalled.value = true
    isInstallable.value = false
    deferredPrompt.value = null
    console.info('[PWA] Aplikasi Theater Idol berhasil di-install')
  })
}

export const usePwaInstall = () => {
  const isIOS = ref(false)
  const isAndroid = ref(false)

  onMounted(() => {
    if (typeof window === 'undefined') return

    // Bersihkan legacy dismissal dari localStorage jika ada, gunakan sessionStorage agar tidak menghilang permanen saat testing
    localStorage.removeItem('pwa_prompt_dismissed_time')

    const dismissedInSession = sessionStorage.getItem('pwa_prompt_dismissed') === '1'
    if (dismissedInSession) {
      isDismissed.value = true
    }

    const ua = window.navigator.userAgent.toLowerCase()
    isIOS.value = /iphone|ipad|ipod/.test(ua)
    isAndroid.value = /android/.test(ua)

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    if (isStandalone) {
      isInstalled.value = true
    }
  })

  // Aksi instalasi aplikasi
  const install = async () => {
    if (deferredPrompt.value) {
      try {
        deferredPrompt.value.prompt()
        const { outcome } = await deferredPrompt.value.userChoice
        if (outcome === 'accepted') {
          isInstalled.value = true
          isInstallable.value = false
        }
        deferredPrompt.value = null
      } catch (err) {
        console.warn('[PWA] Prompt error, membuka panduan manual:', err)
        showGuideModal.value = true
      }
    } else {
      // Jika browser tidak mendukung native prompt (misal iOS Safari atau Firefox), buka panduan interaktif
      showGuideModal.value = true
    }
  }

  const dismiss = () => {
    isDismissed.value = true
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa_prompt_dismissed', '1')
    }
  }

  const resetDismiss = () => {
    isDismissed.value = false
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pwa_prompt_dismissed')
    }
  }

  return {
    deferredPrompt,
    isInstallable,
    isInstalled,
    isDismissed,
    showGuideModal,
    isIOS,
    isAndroid,
    install,
    dismiss,
    resetDismiss
  }
}
