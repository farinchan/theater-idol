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

const isLoading = ref(true)
const isPlaying = ref(false)
const hasStarted = ref(false)
const isEnded = ref(false)
const hasError = ref(false)
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

// Helper Ekstraksi Timestamp Awal dari URL YouTube (?t=120s / &t=2m30s)
const getYouTubeStartTime = (url?: string): number => {
  if (!url) return 0
  const match = url.match(/[?&]t=([0-9hms]+)/i)
  if (!match) return 0
  const val = match[1]
  if (/^\d+$/.test(val)) return parseInt(val, 10)
  let total = 0
  const hours = val.match(/(\d+)h/i)
  const mins = val.match(/(\d+)m/i)
  const secs = val.match(/(\d+)s/i)
  if (hours) total += parseInt(hours[1], 10) * 3600
  if (mins) total += parseInt(mins[1], 10) * 60
  if (secs) total += parseInt(secs[1], 10)
  return total
}

const youtubeId = computed(() => getYouTubeVideoId(props.src))
const isYouTube = computed(() => Boolean(youtubeId.value))

// URL Embed YouTube Resmi yang Mendukung Pemilihan Resolusi Penuh & Kontrol Native
const youtubeEmbedUrl = computed(() => {
  if (!youtubeId.value) return ''
  const startSec = getYouTubeStartTime(props.src)
  const params = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1'
  })
  if (startSec > 0) {
    params.set('start', String(startSec))
  }
  return `https://www.youtube-nocookie.com/embed/${youtubeId.value}?${params.toString()}`
})

// Helper Cek apakah URL adalah HLS stream (.m3u8)
const isHlsUrl = (url?: string): boolean => {
  if (!url) return false
  const clean = url.split('?')[0].toLowerCase()
  return clean.endsWith('.m3u8') || clean.includes('/hls/') || clean.includes('application/x-mpegurl')
}

// Matikan subtitle / closed caption untuk HTML5 Video
const disableSubtitles = () => {
  if (!plyrInstance) return

  try {
    if (plyrInstance.captions) {
      plyrInstance.captions.active = false
    }
  } catch {}
}

// Play / Pause Toggle Universal (untuk video HTML5)
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

// Inisialisasi Player
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
  errorMessage.value = ''
  playerKey.value++

  // Jika URL adalah YouTube:
  // Gunakan pemutar resmi YouTube secara interaktif agar pengguna dapat bebas
  // memilih resolusi (1080p, 720p, 480p, dll.) lewat menu Setelan (⚙️) bawaan YouTube
  if (isYouTube.value) {
    isLoading.value = false
    return
  }

  await nextTick()

  // Untuk berkas langsung (MP4 / WebM / HLS):
  // Gunakan Plyr dengan tema sinematik dan aksen merah Theater
  try {
    const { default: Plyr } = await import('plyr')
    await nextTick()

    if (!mediaTargetRef.value) {
      isLoading.value = false
      return
    }

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
      controls: [
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
        'pip',
        'fullscreen'
      ],
      poster: props.poster || undefined,
      settings: ['speed'],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      seekTime: 10,
      clickToPlay: true,
      tooltips: { controls: true, seek: true },
      keyboard: { focused: true, global: false },
      captions: { active: false, update: false }
    })

    plyrInstance.on('ready', () => {
      isLoading.value = false
      disableSubtitles()
    })

    plyrInstance.on('play', () => {
      isPlaying.value = true
      isEnded.value = false
      hasStarted.value = true
      disableSubtitles()
    })

    plyrInstance.on('playing', () => {
      isLoading.value = false
      isPlaying.value = true
      isEnded.value = false
      hasStarted.value = true
      disableSubtitles()
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
  <div class="space-y-3">
    <!-- Kontainer Pemutar Replay Video -->
    <div
      ref="containerRef"
      class="theater-replay-container relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-neutral-800 select-none group"
      @contextmenu.prevent
    >
      <!-- 1. Pemutar YouTube Resmi (Mendukung pemilihan resolusi 1080p, 720p, 480p, dll.) -->
      <div v-if="src && isYouTube" class="w-full h-full relative">
        <iframe
          :key="youtubeId"
          :src="youtubeEmbedUrl"
          title="YouTube Video Player"
          class="w-full h-full border-0 absolute inset-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        />
      </div>

      <!-- 2. Pemutar Native HTML5 Video Element (MP4 / WebM / HLS) dengan Plyr -->
      <div v-else-if="src" :key="playerKey" class="w-full h-full relative">
        <video
          ref="mediaTargetRef"
          class="w-full h-full object-contain"
          playsinline
          crossorigin="anonymous"
          :poster="poster"
        />

        <!-- Area Klik Play/Pause Transparan (Hanya untuk HTML5 / non-YouTube) -->
        <div
          v-if="!hasError && !isEnded"
          class="absolute inset-x-0 top-0 bottom-14 z-10 cursor-pointer"
          @click="togglePlay"
        />

        <!-- Tombol Putar Tengah Saat Dijeda (Hanya untuk HTML5 / non-YouTube) -->
        <div
          v-if="!isPlaying && !isEnded && !isLoading && !hasError"
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

        <!-- Layar Putar Ulang Saat Video Selesai (Hanya untuk HTML5 / non-YouTube) -->
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

    <!-- Info Bar Resolusi Video Khusus YouTube -->
    <div
      v-if="src && isYouTube"
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs shadow-xs"
    >
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <UIcon name="i-lucide-settings-2" class="w-4 h-4" />
        </div>
        <div class="space-y-0.5">
          <div class="font-bold text-neutral-900 dark:text-neutral-200 flex items-center gap-2 flex-wrap">
            <span>Pilihan Resolusi Video</span>
            <span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
              1080p Full HD • 720p • 480p • 360p
            </span>
          </div>
          <p class="text-[11px] text-neutral-500 dark:text-neutral-400">
            Klik ikon roda gigi <strong>⚙️ (Setelan / Settings)</strong> pada bilah kontrol video di atas &rarr; pilih <strong>Kualitas (Quality)</strong> untuk mengganti resolusi.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
        <UBadge color="neutral" variant="subtle" size="xs" class="font-semibold gap-1">
          <UIcon name="i-lucide-check-circle-2" class="w-3.5 h-3.5 text-emerald-500" />
          <span>Pemutar YouTube Aktif</span>
        </UBadge>
      </div>
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

/* Sembunyikan tombol overlay bawaan Plyr agar tidak bertumpuk */
.theater-replay-container .plyr__control--overlaid {
  display: none !important;
}

/* Iframe YouTube Responsif, Proporsional & Interaktif (Dapat memilih resolusi) */
.theater-replay-container iframe {
  width: 100% !important;
  height: 100% !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  pointer-events: auto !important;
}

/* Native HTML5 video (MP4 / WebM / HLS) tampil proporsional tanpa crop */
.theater-replay-container video {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
}

/* Hilangkan Subtitle / Caption Plyr secara default */
.theater-replay-container .plyr__captions,
.theater-replay-container .plyr__caption {
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
