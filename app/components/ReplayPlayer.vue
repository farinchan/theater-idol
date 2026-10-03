<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string
    poster?: string
    title?: string
  }>(),
  {
    src: '',
    poster: '',
    title: ''
  }
)

const containerRef = ref<HTMLDivElement | null>(null)
const mediaTargetRef = ref<HTMLElement | null>(null)

let plyrInstance: any = null
let hlsInstance: any = null
let captionCheckTimer: ReturnType<typeof setTimeout> | null = null
let menuObserver: MutationObserver | null = null

const isLoading = ref(true)
const isPlaying = ref(false)
const hasStarted = ref(false)
const isEnded = ref(false)
const hasError = ref(false)
const isMenuOpen = ref(false)
const errorMessage = ref('')
const playerKey = ref(0)

// Helper Deteksi YouTube ID dari berbagai format URL
const getYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null
  const trimmed = url.trim()
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/i
  )
  return match ? match[1] : null
}

const youtubeId = computed(() => getYouTubeVideoId(props.src))
const isYouTube = computed(() => Boolean(youtubeId.value))

// Helper Cek apakah URL adalah HLS stream (.m3u8)
const isHlsUrl = (url?: string): boolean => {
  if (!url) return false
  const clean = url.split('?')[0].toLowerCase()
  return clean.endsWith('.m3u8') || clean.includes('/hls/') || clean.includes('application/x-mpegurl')
}

// Matikan subtitle / closed caption secara paksa
const disableSubtitles = () => {
  if (!plyrInstance) return

  try {
    if (plyrInstance.captions) {
      plyrInstance.captions.active = false
    }
  } catch {}

  if (plyrInstance.embed) {
    try {
      if (typeof plyrInstance.embed.unloadModule === 'function') {
        plyrInstance.embed.unloadModule('captions')
        plyrInstance.embed.unloadModule('cc')
      }
      if (typeof plyrInstance.embed.setOption === 'function') {
        plyrInstance.embed.setOption('captions', 'track', {})
        plyrInstance.embed.setOption('cc', 'track', {})
        plyrInstance.embed.setOption('captions', 'reload', false)
      }
    } catch {}
  }
}

// Terapkan kualitas video (YouTube & HLS/HTML5)
const applyQuality = (player: any, val: number | string) => {
  const ytQualityMap: Record<string, string> = {
    '1080': 'hd1080',
    '720': 'hd720',
    '480': 'large',
    '360': 'medium',
    '240': 'small',
    'auto': 'default'
  }
  const ytQuality = ytQualityMap[String(val)] || 'default'

  // 1. YouTube IFrame API methods jika tersedia
  if (player?.embed) {
    try {
      if (typeof player.embed.setPlaybackQualityRange === 'function') {
        player.embed.setPlaybackQualityRange(ytQuality)
      }
      if (typeof player.embed.setPlaybackQuality === 'function') {
        player.embed.setPlaybackQuality(ytQuality)
      }
      if (typeof player.embed.setOption === 'function') {
        player.embed.setOption('quality', ytQuality)
      }
    } catch (e) {
      console.warn('Gagal mengatur kualitas embed:', e)
    }
  }

  // 2. Kirim pesan postMessage ke iframe YouTube
  try {
    const iframe = containerRef.value?.querySelector('iframe')
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'setPlaybackQuality',
          args: [ytQuality]
        }),
        '*'
      )
      iframe.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'setPlaybackQualityRange',
          args: [ytQuality]
        }),
        '*'
      )
    }
  } catch {}

  // 3. Jika menggunakan HLS, ubah level bitrate
  if (hlsInstance && hlsInstance.levels?.length) {
    if (val === 'auto') {
      hlsInstance.currentLevel = -1
    } else {
      const idx = hlsInstance.levels.findIndex((l: any) => l.height === Number(val))
      if (idx !== -1) {
        hlsInstance.currentLevel = idx
      }
    }
  }
}

// Inisialisasi Menu Pemilihan Kualitas / Resolusi pada Plyr Settings
const setupQualityMenu = (player: any) => {
  if (!player || !player.elements?.settings?.panels?.quality) return

  const qualityBtn = player.elements.settings.buttons.quality
  const qualityPane = player.elements.settings.panels.quality
  const menuList = qualityPane.querySelector('[role="menu"]')
  if (!qualityBtn || !qualityPane || !menuList) return

  // Tampilkan tombol Kualitas di menu Settings utama
  qualityBtn.removeAttribute('hidden')
  qualityBtn.style.display = ''

  // Pantau status buka-tutup menu agar tombol dan bar kontrol tidak hilang saat mouse bergerak ke atas
  const container = player.elements?.container
  if (container && !menuObserver) {
    menuObserver = new MutationObserver(() => {
      const open = container.classList.contains('plyr--menu-open') || Boolean(container.querySelector('[aria-expanded="true"]'))
      isMenuOpen.value = open
      if (open && player.elements?.controls) {
        player.elements.controls.hover = true
      }
    })
    menuObserver.observe(container, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    })
  }

  // Jaga agar controls tetap dianggap aktif saat mouse di atas popup menu settings
  const popup = player.elements?.settings?.popup || player.elements?.settings?.menu
  if (popup) {
    popup.addEventListener('mouseenter', () => {
      isMenuOpen.value = true
      if (player.elements?.controls) {
        player.elements.controls.hover = true
      }
    })
    popup.addEventListener('mousemove', () => {
      isMenuOpen.value = true
      if (player.elements?.controls) {
        player.elements.controls.hover = true
      }
    })
  }

  const settingsBtn = player.elements?.buttons?.settings
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      isMenuOpen.value = true
      if (player.elements?.controls) {
        player.elements.controls.hover = true
      }
    })
  }

  // Baca kualitas yang sebelumnya tersimpan (default 720p)
  let currentVal: number | string = 720
  try {
    const saved = localStorage.getItem('theater_replay_quality')
    if (saved) {
      currentVal = isNaN(Number(saved)) ? saved : Number(saved)
    }
  } catch {}

  const valueSpan = qualityBtn.querySelector('.plyr__menu__value')
  const updateValueLabel = (val: number | string) => {
    if (valueSpan) {
      valueSpan.textContent = val === 'auto' || val === 0 ? 'Otomatis' : `${val}p`
    }
  }
  updateValueLabel(currentVal)

  // Daftar pilihan resolusi
  const qualityOptions: Array<{ value: number | string; label: string; badge?: string }> = [
    { value: 1080, label: '1080p', badge: 'HD' },
    { value: 720, label: '720p', badge: 'HD' },
    { value: 480, label: '480p', badge: 'SD' },
    { value: 360, label: '360p' },
    { value: 240, label: '240p' },
    { value: 'auto', label: 'Otomatis' }
  ]

  menuList.innerHTML = ''

  qualityOptions.forEach(opt => {
    const itemBtn = document.createElement('button')
    itemBtn.type = 'button'
    itemBtn.className = 'plyr__control'
    itemBtn.setAttribute('role', 'menuitemradio')
    const isChecked = String(currentVal) === String(opt.value)
    itemBtn.setAttribute('aria-checked', isChecked ? 'true' : 'false')
    itemBtn.value = String(opt.value)

    const flexSpan = document.createElement('span')
    flexSpan.textContent = opt.label

    if (opt.badge) {
      const badgeSpan = document.createElement('span')
      badgeSpan.className = 'plyr__badge'
      badgeSpan.textContent = opt.badge
      flexSpan.appendChild(badgeSpan)
    }

    itemBtn.appendChild(flexSpan)

    itemBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()

      // Perbarui status checked pada menu
      menuList.querySelectorAll('[role="menuitemradio"]').forEach((el: any) => {
        el.setAttribute('aria-checked', 'false')
      })
      itemBtn.setAttribute('aria-checked', 'true')

      currentVal = opt.value
      updateValueLabel(opt.value)
      try {
        localStorage.setItem('theater_replay_quality', String(opt.value))
      } catch {}

      // Terapkan perubahan kualitas ke video
      applyQuality(player, opt.value)

      // Kembali ke menu utama Settings
      if (player.elements?.settings?.panels?.home) {
        qualityPane.hidden = true
        player.elements.settings.panels.home.hidden = false
      }
    })

    menuList.appendChild(itemBtn)
  })

  // Terapkan kualitas awal
  applyQuality(player, currentVal)
}

// Play / Pause Toggle Universal
const togglePlay = () => {
  if (!plyrInstance) return
  if (isEnded.value) {
    try {
      plyrInstance.currentTime = 0
    } catch {}
    isEnded.value = false
  }
  try {
    plyrInstance.togglePlay()
  } catch (e) {
    console.warn('Toggle play error:', e)
  }
}

// Bersihkan instance pemutar sebelum inisialisasi ulang
const destroyPlayer = () => {
  if (menuObserver) {
    menuObserver.disconnect()
    menuObserver = null
  }
  isMenuOpen.value = false

  if (captionCheckTimer) {
    clearTimeout(captionCheckTimer)
    captionCheckTimer = null
  }
  if (plyrInstance) {
    try {
      plyrInstance.destroy()
    } catch (e) {
      console.warn('Error destroying Plyr instance:', e)
    }
    plyrInstance = null
  }
  if (hlsInstance) {
    try {
      hlsInstance.destroy()
    } catch (e) {
      console.warn('Error destroying HLS instance:', e)
    }
    hlsInstance = null
  }
}

// Inisialisasi Plyr Player
const initPlayer = async () => {
  if (!import.meta.client || !props.src) {
    isLoading.value = false
    return
  }

  destroyPlayer()
  isLoading.value = true
  isPlaying.value = false
  hasStarted.value = false
  isEnded.value = false
  hasError.value = false
  isMenuOpen.value = false
  errorMessage.value = ''
  playerKey.value++

  await nextTick()

  try {
    const { default: Plyr } = await import('plyr')
    await nextTick()

    if (!mediaTargetRef.value) {
      isLoading.value = false
      return
    }

    const commonControls = [
      'restart',
      'rewind',
      'play',
      'fast-forward',
      'progress',
      'current-time',
      'duration',
      'mute',
      'volume',
      'settings',
      'fullscreen'
    ]

    const plyrI18n = {
      quality: 'Kualitas',
      speed: 'Kecepatan',
      normal: 'Normal'
    }

    if (isYouTube.value) {
      plyrInstance = new Plyr(mediaTargetRef.value, {
        controls: commonControls,
        poster: props.poster || undefined,
        settings: ['quality', 'speed'],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
        quality: { default: 720, options: [1080, 720, 480, 360, 240] },
        seekTime: 10,
        clickToPlay: true,
        tooltips: { controls: true, seek: true },
        keyboard: { focused: true, global: false },
        captions: { active: false, update: false, language: 'none' },
        i18n: plyrI18n,
        youtube: {
          noCookie: true,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          cc_load_policy: 0,
          disablekb: 1,
          playsinline: 1,
          fs: 0
        }
      })

      plyrInstance.on('ready', () => {
        isLoading.value = false
        disableSubtitles()
        setupQualityMenu(plyrInstance)

        const iframe = containerRef.value?.querySelector('iframe')
        if (iframe) {
          iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
          iframe.setAttribute(
            'allow',
            'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
          )
        }
      })

      plyrInstance.on('play', () => {
        isPlaying.value = true
        isEnded.value = false
        hasStarted.value = true
        disableSubtitles()
        setupQualityMenu(plyrInstance)

        if (captionCheckTimer) clearTimeout(captionCheckTimer)
        captionCheckTimer = setTimeout(() => {
          disableSubtitles()
        }, 1000)
      })

      plyrInstance.on('playing', () => {
        isLoading.value = false
        isPlaying.value = true
        isEnded.value = false
        hasStarted.value = true
        disableSubtitles()
        setupQualityMenu(plyrInstance)
      })

      plyrInstance.on('pause', () => {
        isPlaying.value = false
      })

      plyrInstance.on('ended', () => {
        isPlaying.value = false
        isEnded.value = true
      })

      plyrInstance.on('error', (event: any) => {
        isLoading.value = false
        hasError.value = true
        errorMessage.value =
          event?.detail?.message ||
          'Video replay ini tidak dapat dimuat atau telah dibatasi pemutarannya.'
      })
    } else {
      const videoEl = mediaTargetRef.value as HTMLVideoElement

      if (isHlsUrl(props.src)) {
        const { default: Hls } = await import('hls.js')
        if (Hls.isSupported()) {
          hlsInstance = new Hls({ enableWorker: true, backBufferLength: 60 })
          hlsInstance.loadSource(props.src.trim())
          hlsInstance.attachMedia(videoEl)
        } else {
          videoEl.src = props.src.trim()
        }
      } else {
        videoEl.src = props.src.trim()
      }

      plyrInstance = new Plyr(videoEl, {
        controls: [...commonControls, 'pip'],
        poster: props.poster || undefined,
        settings: ['quality', 'speed'],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
        quality: { default: 720, options: [1080, 720, 480, 360, 240] },
        seekTime: 10,
        clickToPlay: true,
        tooltips: { controls: true, seek: true },
        keyboard: { focused: true, global: false },
        captions: { active: false, update: false },
        i18n: plyrI18n
      })

      plyrInstance.on('ready', () => {
        isLoading.value = false
        disableSubtitles()
        setupQualityMenu(plyrInstance)
      })

      plyrInstance.on('play', () => {
        isPlaying.value = true
        isEnded.value = false
        hasStarted.value = true
        disableSubtitles()
        setupQualityMenu(plyrInstance)
      })

      plyrInstance.on('playing', () => {
        isLoading.value = false
        isPlaying.value = true
        isEnded.value = false
        hasStarted.value = true
        disableSubtitles()
        setupQualityMenu(plyrInstance)
      })

      plyrInstance.on('pause', () => {
        isPlaying.value = false
      })

      plyrInstance.on('ended', () => {
        isPlaying.value = false
        isEnded.value = true
      })

      plyrInstance.on('error', () => {
        isLoading.value = false
        hasError.value = true
        errorMessage.value = 'Gagal memutar video. Format atau berkas video tidak valid.'
      })
    }
  } catch (err: any) {
    isLoading.value = false
    hasError.value = true
    errorMessage.value = err?.message || 'Gagal memuat pemutar video.'
  }
}

watch(
  () => props.src,
  () => {
    initPlayer()
  }
)

onMounted(() => {
  initPlayer()
})

onBeforeUnmount(() => {
  destroyPlayer()
})
</script>

<template>
  <div
    ref="containerRef"
    class="theater-replay-container relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-neutral-800 select-none group"
    @contextmenu.prevent
  >
    <!-- Container Player Dinamis (YouTube atau MP4 via Plyr) -->
    <div v-if="src" :key="playerKey" class="w-full h-full relative">
      <!-- 1. YouTube Mount Element untuk Plyr -->
      <div
        v-if="isYouTube"
        ref="mediaTargetRef"
        data-plyr-provider="youtube"
        :data-plyr-embed-id="youtubeId"
        class="w-full h-full"
      />

      <!-- 2. Native HTML5 Video Element (MP4 / WebM / HLS) untuk Plyr -->
      <video
        v-else
        ref="mediaTargetRef"
        class="w-full h-full object-contain"
        playsinline
        crossorigin="anonymous"
        :poster="poster"
      />
    </div>

    <!-- Area Klik Play/Pause Transparan (Nonaktif ketika menu settings sedang terbuka) -->
    <div
      v-if="src && !hasError && !isEnded && !isMenuOpen"
      class="video-click-overlay absolute inset-x-0 top-0 bottom-14 z-10 cursor-pointer"
      @click="togglePlay"
    />

    <!-- Tombol Putar Tengah Saat Dijeda (Video Tetap Terlihat 100% di Belakangnya) -->
    <div
      v-if="src && !isPlaying && !isEnded && !isLoading && !hasError"
      class="absolute inset-x-0 top-0 bottom-14 z-15 flex items-center justify-center pointer-events-none transition-opacity duration-200"
    >
      <div
        class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 hover:bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/50 transform hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer backdrop-blur-xs"
        :title="hasStarted ? 'Lanjutkan Putar (Spasi)' : 'Putar Video (Spasi)'"
        @click.stop="togglePlay"
      >
        <UIcon name="i-lucide-play" class="w-8 h-8 sm:w-10 sm:h-10 ml-0.5 text-white" />
      </div>
    </div>

    <!-- Layar Putar Ulang Saat Video Selesai (Hanya muncul saat video berakhir sepenuhnya) -->
    <div
      v-if="isEnded && !hasError"
      class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 cursor-pointer text-center p-6 space-y-3"
      @click="togglePlay"
    >
      <div
        class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center shadow-2xl shadow-primary/60 transform hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer"
        title="Putar Ulang Pertunjukan"
      >
        <UIcon name="i-lucide-rotate-ccw" class="w-8 h-8 sm:w-10 sm:h-10 text-white" />
      </div>
      <p class="text-xs sm:text-sm font-semibold text-white drop-shadow">
        Pertunjukan telah selesai • Klik untuk putar ulang
      </p>
    </div>

    <!-- Error State jika video tidak dapat dimuat -->
    <div
      v-if="hasError"
      class="absolute inset-0 z-40 bg-neutral-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4"
    >
      <div class="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
        <UIcon name="i-lucide-alert-triangle" class="w-7 h-7" />
      </div>
      <div class="max-w-md space-y-1.5">
        <h4 class="font-bold text-base text-white">Tidak Dapat Memutar Replay</h4>
        <p class="text-xs text-neutral-400 leading-relaxed">{{ errorMessage }}</p>
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition shadow-lg shadow-primary/30 cursor-pointer"
          @click="initPlayer"
        >
          <UIcon name="i-lucide-refresh-cw" class="w-4 h-4" />
          <span>Muat Ulang Pemutar</span>
        </button>
      </div>
    </div>

    <!-- Empty State jika tidak ada URL -->
    <div
      v-else-if="!src"
      class="w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-center p-6 text-neutral-400 space-y-2"
    >
      <UIcon name="i-lucide-video-off" class="w-10 h-10 text-neutral-600" />
      <p class="text-sm font-semibold text-neutral-300">Tautan video replay tidak tersedia.</p>
    </div>
  </div>
</template>

<style>
/* Kustomisasi Tema Plyr - Theater Red Accent */
.theater-replay-container {
  --plyr-color-main: #D61515;
  --plyr-video-background: #000000;
  --plyr-video-controls-background: linear-gradient(to top, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.4), transparent);
  --plyr-control-radius: 8px;
  --plyr-range-thumb-background: #ffffff;
  --plyr-range-thumb-shadow: 0 0 10px rgba(214, 21, 21, 0.7);
  --plyr-range-fill-background: #D61515;
  --plyr-menu-background: rgba(18, 18, 18, 0.96);
  --plyr-menu-color: #f5f5f5;
  --plyr-menu-radius: 12px;
  --plyr-menu-border-color: rgba(255, 255, 255, 0.1);
  --plyr-tooltip-background: rgba(0, 0, 0, 0.9);
  --plyr-tooltip-color: #ffffff;
  --plyr-tooltip-radius: 6px;
  --plyr-font-family: inherit;
}

.theater-replay-container .plyr {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background-color: #000;
}

/* Pastikan Plyr Controls berada di atas agar timeline seekbar tetap bisa digunakan */
.theater-replay-container .plyr__controls {
  z-index: 30 !important;
  position: absolute !important;
}

/* Jangan pernah sembunyikan kontrol ketika menu pengaturan (settings/quality/speed) sedang terbuka */
.theater-replay-container .plyr.plyr--menu-open .plyr__controls,
.theater-replay-container .plyr--hide-controls.plyr--menu-open .plyr__controls,
.theater-replay-container .plyr:has(.plyr__menu__container:not([hidden])) .plyr__controls,
.theater-replay-container .plyr:has([aria-expanded="true"]) .plyr__controls,
.theater-replay-container:has(.plyr--menu-open) .plyr__controls,
.theater-replay-container:has([aria-expanded="true"]) .plyr__controls {
  opacity: 1 !important;
  pointer-events: auto !important;
  transform: translateY(0) !important;
  visibility: visible !important;
}

/* Pastikan popup menu settings selalu berada di atas semua overlay */
.theater-replay-container .plyr__menu__container {
  z-index: 50 !important;
  pointer-events: auto !important;
}

/* Matikan overlay play/pause ketika menu settings sedang terbuka agar mouse bisa bebas memilih opsi */
.theater-replay-container .plyr--menu-open ~ .video-click-overlay,
.theater-replay-container:has(.plyr--menu-open) .video-click-overlay,
.theater-replay-container:has([aria-expanded="true"]) .video-click-overlay {
  pointer-events: none !important;
}

/* Sembunyikan tombol overlay bawaan Plyr agar tidak bertumpuk */
.theater-replay-container .plyr__control--overlaid {
  display: none !important;
}

/* Hilangkan Identitas YouTube & 'More Videos' (ytp-pause-overlay):
   1. pointer-events: none pada iframe agar hover cards, logo, dan link luar YouTube tidak pernah terpicu
   2. height: 135% dan top: -17% memotong rak 'More Videos' (ytp-pause-overlay) ke luar batas bawah kontainer
      sekaligus memotong judul atas ke luar batas atas, sementara isi video tetap presisi dan terlihat jelas saat dijeda */
.theater-replay-container .plyr__video-embed {
  overflow: hidden !important;
  position: relative !important;
  width: 100% !important;
  height: 100% !important;
}

.theater-replay-container .plyr__video-embed iframe {
  width: 100% !important;
  height: 135% !important;
  top: -17% !important;
  left: 0 !important;
  position: absolute !important;
  pointer-events: none !important;
}

/* Native HTML5 video (MP4 / WebM / HLS) tampil proporsional tanpa crop */
.theater-replay-container video {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
}

/* Hilangkan Subtitle / Caption secara default */
.theater-replay-container .plyr__captions,
.theater-replay-container .plyr__caption,
.theater-replay-container .ytp-caption-window-bottom,
.theater-replay-container .ytp-caption-window,
.theater-replay-container .caption-window {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
}

/* Scrubber / Progress Bar Theater */
.theater-replay-container .plyr--video .plyr__progress__buffer {
  color: rgba(255, 255, 255, 0.25);
}

.theater-replay-container .plyr--full-ui input[type=range] {
  color: #D61515;
}
</style>
