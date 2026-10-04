<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string
  }>(),
  {
    src: ''
  }
)

// Default Demo Stream for testing if .env has no STREAM_URL
const DEMO_STREAM_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'

// State
const containerRef = ref<HTMLDivElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const customUrlInput = ref('')
const activeSrc = ref(props.src)
const isUsingDemo = ref(false)

const isPlaying = ref(false)
const isLoading = ref(true)
const isMuted = ref(false)
const volume = ref(1) // 0 to 1
const isFullscreen = ref(false)
const isPipSupported = ref(false)
const showControls = ref(true)
const showQualityMenu = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

// Quality Levels
interface QualityLevel {
  id: number
  label: string
  height?: number
  bitrate?: number
}
const qualityLevels = ref<QualityLevel[]>([])
const selectedQuality = ref<number>(-1) // -1 = Auto
const activeResolution = ref<string>('Auto')

let hlsInstance: any = null
let controlsTimeout: ReturnType<typeof setTimeout> | null = null

const config = useRuntimeConfig()

// Helper untuk mendeteksi apakah stream URL memerlukan server proxy (mengatasi blokir CORS / 403 Forbidden)
const resolveStreamUrl = (rawUrl: string): string => {
  if (!rawUrl) return ''
  const trimmed = rawUrl.trim()

  if (trimmed.startsWith('/')) {
    return trimmed
  }

  // Jika proxy aktif di pengaturan (STREAM_USE_PROXY di .env), lewatkan melalui endpoint proxy server
  const isProxyDisabled =
    config.public.streamUseProxy === false || (config.public as any).streamUseProxy === 'false'

  if (!isProxyDisabled) {
    return `/api/stream/proxy?url=${encodeURIComponent(trimmed)}`
  }

  return trimmed
}

// Compute current effective URL
const effectiveSrc = computed(() => {
  if (activeSrc.value && activeSrc.value.trim() !== '') {
    return resolveStreamUrl(activeSrc.value.trim())
  }
  return ''
})

// Watch prop src changes
watch(
  () => props.src,
  (newVal) => {
    if (newVal) {
      activeSrc.value = newVal
      isUsingDemo.value = false
      initPlayer()
    }
  }
)

// Initialize HLS / HTML5 Video Player
const initPlayer = async () => {
  if (!import.meta.client || !videoRef.value) return

  cleanupHls()
  hasError.value = false
  errorMessage.value = ''
  isLoading.value = true
  qualityLevels.value = []

  const url = effectiveSrc.value
  if (!url) {
    isLoading.value = false
    return
  }

  try {
    const { default: Hls } = await import('hls.js')

    if (Hls.isSupported()) {
      hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 8
      })

      hlsInstance.attachMedia(videoRef.value)

      hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
        hlsInstance.loadSource(url)
      })

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_event: any, data: any) => {
        isLoading.value = false
        // Extract quality levels
        const levels: QualityLevel[] = [{ id: -1, label: 'Auto' }]
        if (data.levels && data.levels.length > 0) {
          data.levels.forEach((lvl: any, idx: number) => {
            levels.push({
              id: idx,
              label: lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)}k`,
              height: lvl.height,
              bitrate: lvl.bitrate
            })
          })
        }
        qualityLevels.value = levels

        // Attempt autoplay muted if needed
        videoRef.value?.play().then(() => {
          isPlaying.value = true
        }).catch(() => {
          // Autoplay was prevented by browser policy (expected if unmuted)
          isPlaying.value = false
        })
      })

      hlsInstance.on(Hls.Events.LEVEL_SWITCHED, (_event: any, data: any) => {
        const lvl = hlsInstance?.levels?.[data.level]
        if (lvl?.height) {
          activeResolution.value = `${lvl.height}p`
        }
      })

      hlsInstance.on(Hls.Events.ERROR, (_event: any, data: any) => {
        console.warn('HLS Event Error:', data)
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Jika terjadi network/CORS error pada URL langsung eksternal, alihkan ke proxy
              if (!url.startsWith('/api/stream') && activeSrc.value && !activeSrc.value.startsWith('/api/stream')) {
                console.warn('[HlsPlayer] Terjadi Network/CORS error. Beralih otomatis ke server proxy...')
                activeSrc.value = `/api/stream/proxy?url=${encodeURIComponent(activeSrc.value)}`
                initPlayer()
                return
              }
              console.error('Fatal network error encountered, trying to recover...')
              hlsInstance.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Fatal media error encountered, recovering...')
              hlsInstance.recoverMediaError()
              break
            default:
              console.error('Unrecoverable HLS error:', data)
              hasError.value = true
              errorMessage.value = 'Gagal memuat siaran video (format atau CORS tidak didukung).'
              cleanupHls()
              break
          }
        }
      })
    } else if (videoRef.value.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari iOS / macOS HLS support
      videoRef.value.src = url
      videoRef.value.addEventListener('loadedmetadata', () => {
        isLoading.value = false
        videoRef.value?.play().then(() => {
          isPlaying.value = true
        }).catch(() => {
          isPlaying.value = false
        })
      })
    } else {
      hasError.value = true
      errorMessage.value = 'Browser Anda tidak mendukung pemutaran HLS (HTTP Live Streaming).'
    }
  } catch (err: any) {
    console.error('Error initializing HLS:', err)
    hasError.value = true
    errorMessage.value = err.message || 'Terjadi kesalahan saat memuat HLS Player.'
    isLoading.value = false
  }
}

const cleanupHls = () => {
  if (hlsInstance) {
    try {
      hlsInstance.destroy()
    } catch (e) {
      console.warn('HLS destroy error', e)
    }
    hlsInstance = null
  }
  if (videoRef.value) {
    videoRef.value.removeAttribute('src')
    videoRef.value.load()
  }
}

// Player controls actions
const togglePlay = () => {
  if (!videoRef.value) return
  if (videoRef.value.paused) {
    videoRef.value.play().then(() => {
      isPlaying.value = true
    }).catch((err) => {
      console.warn('Play error:', err)
    })
  } else {
    videoRef.value.pause()
    isPlaying.value = false
  }
  triggerControlsActivity()
}

const toggleMute = () => {
  if (!videoRef.value) return
  isMuted.value = !isMuted.value
  videoRef.value.muted = isMuted.value
  triggerControlsActivity()
}

const onVolumeInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const val = parseFloat(target.value)
  volume.value = val
  if (videoRef.value) {
    videoRef.value.volume = val
    if (val === 0) {
      isMuted.value = true
      videoRef.value.muted = true
    } else if (isMuted.value) {
      isMuted.value = false
      videoRef.value.muted = false
    }
  }
  triggerControlsActivity()
}

const setQuality = (levelId: number) => {
  selectedQuality.value = levelId
  if (hlsInstance) {
    hlsInstance.currentLevel = levelId
    if (levelId === -1) {
      activeResolution.value = 'Auto'
    } else {
      const selected = qualityLevels.value.find((l) => l.id === levelId)
      activeResolution.value = selected ? selected.label : 'HD'
    }
  }
  showQualityMenu.value = false
  triggerControlsActivity()
}

const toggleFullscreen = async () => {
  if (!containerRef.value) return

  try {
    if (!document.fullscreenElement) {
      if (containerRef.value.requestFullscreen) {
        await containerRef.value.requestFullscreen()
      } else if ((containerRef.value as any).webkitRequestFullscreen) {
        await (containerRef.value as any).webkitRequestFullscreen()
      }
      isFullscreen.value = true
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      }
      isFullscreen.value = false
    }
  } catch (err) {
    console.warn('Fullscreen error:', err)
  }
  triggerControlsActivity()
}

const togglePiP = async () => {
  if (!videoRef.value) return
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    } else if (document.pictureInPictureEnabled) {
      await videoRef.value.requestPictureInPicture()
    }
  } catch (err) {
    console.warn('PiP error:', err)
  }
  triggerControlsActivity()
}

const jumpToLive = () => {
  if (!videoRef.value) return
  if (videoRef.value.seekable && videoRef.value.seekable.length > 0) {
    videoRef.value.currentTime = videoRef.value.seekable.end(videoRef.value.seekable.length - 1)
  }
  if (videoRef.value.paused) {
    videoRef.value.play()
  }
  triggerControlsActivity()
}

const reloadStream = () => {
  initPlayer()
}

const useDemoStream = () => {
  activeSrc.value = DEMO_STREAM_URL
  isUsingDemo.value = true
  initPlayer()
}

const applyCustomUrl = () => {
  if (!customUrlInput.value.trim()) return
  activeSrc.value = customUrlInput.value.trim()
  isUsingDemo.value = false
  initPlayer()
}

const useProxyStream = () => {
  if (activeSrc.value && !activeSrc.value.startsWith('/api/stream')) {
    activeSrc.value = `/api/stream/proxy?url=${encodeURIComponent(activeSrc.value)}`
  } else {
    activeSrc.value = '/api/stream/live.m3u8'
  }
  isUsingDemo.value = false
  initPlayer()
}

// Activity & Inactivity timers for controls auto-hide
const triggerControlsActivity = () => {
  showControls.value = true
  if (controlsTimeout) clearTimeout(controlsTimeout)
  if (isPlaying.value) {
    controlsTimeout = setTimeout(() => {
      if (!showQualityMenu.value) {
        showControls.value = false
      }
    }, 3000)
  }
}

const onMouseMove = () => {
  triggerControlsActivity()
}

const onMouseLeave = () => {
  if (isPlaying.value && !showQualityMenu.value) {
    showControls.value = false
  }
}

// Keyboard shortcuts
const onKeyDown = (e: KeyboardEvent) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return
  }
  if (e.code === 'Space') {
    e.preventDefault()
    togglePlay()
  } else if (e.code === 'KeyF') {
    e.preventDefault()
    toggleFullscreen()
  } else if (e.code === 'KeyM') {
    e.preventDefault()
    toggleMute()
  }
}

// Video Event Handlers
const onPlay = () => {
  isPlaying.value = true
  isLoading.value = false
  triggerControlsActivity()
}

const onPause = () => {
  isPlaying.value = false
  showControls.value = true
}

const onWaiting = () => {
  isLoading.value = true
}

const onPlaying = () => {
  isLoading.value = false
}

const onVideoError = () => {
  isLoading.value = false
  hasError.value = true
  errorMessage.value = 'Gagal memutar video live stream. Periksa URL atau koneksi jaringan.'
}

const onFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  if (import.meta.client) {
    isPipSupported.value = typeof document !== 'undefined' && 'pictureInPictureEnabled' in document
    document.addEventListener('fullscreenchange', onFullscreenChange)
    window.addEventListener('keydown', onKeyDown)

    // Check if initial src exists
    if (props.src && props.src.trim() !== '') {
      activeSrc.value = props.src.trim()
      initPlayer()
    } else {
      isLoading.value = false
    }
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    window.removeEventListener('keydown', onKeyDown)
    if (controlsTimeout) clearTimeout(controlsTimeout)
  }
  cleanupHls()
})
</script>

<template>
  <div
    ref="containerRef"
    class="relative bg-black rounded-2xl overflow-hidden aspect-video flex flex-col justify-between text-white group select-none"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    @dblclick="toggleFullscreen"
  >
    <!-- HTML5 Video Element -->
    <video
      ref="videoRef"
      class="absolute inset-0 w-full h-full object-cover cursor-pointer block"
      playsinline
      @click="togglePlay"
      @play="onPlay"
      @pause="onPause"
      @waiting="onWaiting"
      @playing="onPlaying"
      @error="onVideoError"
    />

    <!-- Ambient Gradient Overlay for readability of bottom controls -->
    <div
      class="absolute inset-0 pointer-events-none transition-opacity duration-300"
      :class="showControls || !isPlaying ? 'opacity-100' : 'opacity-0'"
    >
      <div class="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
    </div>

    <!-- Center Overlay: Buffering, Paused state, Error state, or Offline/No-URL state -->
    <div class="relative z-10 flex-1 flex items-center justify-center pointer-events-none">
      <!-- Buffering / Loading Spinner -->
      <div
        v-if="isLoading && effectiveSrc"
        class="flex flex-col items-center gap-3 bg-black/60 backdrop-blur-md px-6 py-4 rounded-2xl border border-neutral-800 text-white shadow-2xl"
      >
        <UIcon name="i-lucide-loader-2" class="w-9 h-9 text-primary animate-spin" />
        <span class="text-xs font-semibold tracking-wide">Menghubungkan ke Siaran...</span>
      </div>

      <!-- Error State -->
      <div
        v-else-if="hasError"
        class="pointer-events-auto max-w-md mx-4 text-center p-6 rounded-2xl bg-neutral-900/90 backdrop-blur-md border border-red-500/30 shadow-2xl space-y-4"
      >
        <div class="w-12 h-12 mx-auto rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
          <UIcon name="i-lucide-alert-triangle" class="w-6 h-6" />
        </div>
        <div>
          <h3 class="font-bold text-sm text-red-400">Gagal Memuat Siaran</h3>
          <p class="text-xs text-neutral-300 mt-1 leading-relaxed">{{ errorMessage }}</p>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            class="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            @click.stop="reloadStream"
          >
            <UIcon name="i-lucide-refresh-cw" class="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
          <button
            v-if="!effectiveSrc.startsWith('/api/stream')"
            class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/30"
            @click.stop="useProxyStream"
          >
            <UIcon name="i-lucide-shield-check" class="w-3.5 h-3.5" />
            <span>Putar via Server Proxy</span>
          </button>
          <button
            class="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition cursor-pointer"
            @click.stop="useDemoStream"
          >
            Uji Stream Demo
          </button>
        </div>
      </div>

      <!-- Offline / No URL State -->
      <div
        v-else-if="!effectiveSrc"
        class="pointer-events-auto max-w-lg mx-4 text-center p-6 sm:p-8 rounded-2xl bg-neutral-900/90 backdrop-blur-md border border-neutral-800 shadow-2xl space-y-4"
      >
        <div class="w-16 h-16 mx-auto rounded-full bg-neutral-800/80 text-primary flex items-center justify-center border border-neutral-700/60 shadow-inner">
          <UIcon name="i-lucide-radio" class="w-8 h-8 text-primary" />
        </div>
        <div>
          <span class="text-[11px] font-bold tracking-widest text-primary uppercase">Siaran Teater</span>
          <h3 class="text-lg sm:text-xl font-black text-white mt-1">Siaran Belum Aktif (Offline)</h3>
          <p class="text-xs text-neutral-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            URL stream belum dikonfigurasi di file <code class="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-200 font-mono text-[11px]">.env</code> (<span class="text-neutral-300 font-mono">STREAM_URL</span>) atau pertunjukan belum dimulai.
          </p>
        </div>

        <!-- Action to Test Demo or Input URL -->
        <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            class="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
            @click.stop="useDemoStream"
          >
            <UIcon name="i-lucide-play" class="w-4 h-4" />
            <span>Uji Coba Player (Demo HLS)</span>
          </button>
        </div>

        <!-- Quick input to test custom m3u8 url directly -->
        <div class="pt-2 border-t border-neutral-800 flex items-center gap-2 text-xs">
          <input
            v-model="customUrlInput"
            type="text"
            placeholder="Atau masukkan URL .m3u8 untuk tes..."
            class="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-primary"
            @keyup.enter="applyCustomUrl"
          />
          <button
            class="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition cursor-pointer"
            @click.stop="applyCustomUrl"
          >
            Putar
          </button>
        </div>
      </div>

      <!-- Big Centered Play Button when paused -->
      <button
        v-else-if="!isPlaying"
        class="pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 hover:bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/40 transition-transform transform hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-sm"
        title="Putar Siaran"
        @click.stop="togglePlay"
      >
        <UIcon name="i-lucide-play" class="w-8 h-8 sm:w-10 sm:h-10 ml-1 text-white" />
      </button>
    </div>

    <!-- Bottom Controls Bar -->
    <div
      class="relative z-20 flex items-center justify-between p-3 sm:p-5 transition-opacity duration-300 text-neutral-200"
      :class="showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    >
      <!-- Left: Play/Pause, Re-sync Live, Volume -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Play / Pause Button -->
        <button
          class="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white transition cursor-pointer"
          :title="isPlaying ? 'Jeda (Spasi)' : 'Putar (Spasi)'"
          @click.stop="togglePlay"
        >
          <UIcon :name="isPlaying ? 'i-lucide-pause' : 'i-lucide-play'" class="w-5 h-5" />
        </button>

        <!-- Jump to Live Button -->
        <button
          class="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer hover:bg-white/10"
          :class="isPlaying ? 'text-red-500' : 'text-neutral-400'"
          title="Sinkronkan ke Siaran Langsung"
          @click.stop="jumpToLive"
        >
          <span class="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>LIVE</span>
        </button>

        <span class="text-neutral-700 hidden sm:inline">|</span>

        <!-- Volume Control Group -->
        <div class="flex items-center gap-1.5 group/volume">
          <button
            class="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white transition cursor-pointer"
            :title="isMuted ? 'Bunyikan (M)' : 'Bisukan (M)'"
            @click.stop="toggleMute"
          >
            <UIcon
              :name="
                isMuted || volume === 0
                  ? 'i-lucide-volume-x'
                  : volume < 0.5
                    ? 'i-lucide-volume-1'
                    : 'i-lucide-volume-2'
              "
              class="w-5 h-5"
            />
          </button>

          <!-- Volume Slider -->
          <div class="w-0 sm:w-16 md:w-20 group-hover/volume:w-20 overflow-hidden transition-all duration-200 flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="isMuted ? 0 : volume"
              class="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary"
              @input="onVolumeInput"
              @click.stop
            />
          </div>
        </div>
      </div>

      <!-- Right: Quality Selector, PiP, Fullscreen -->
      <div class="flex items-center gap-1 sm:gap-2">
        <!-- Quality Selector Dropdown -->
        <div class="relative">
          <button
            class="px-2.5 py-1 rounded-lg hover:bg-white/10 flex items-center gap-1.5 text-xs font-semibold text-neutral-200 hover:text-white transition cursor-pointer"
            title="Pilih Kualitas Video"
            @click.stop="showQualityMenu = !showQualityMenu"
          >
            <UIcon name="i-lucide-settings" class="w-4 h-4 text-neutral-400" />
            <span class="text-[11px]">{{ activeResolution }}</span>
          </button>

          <!-- Quality Dropdown Menu -->
          <div
            v-if="showQualityMenu"
            class="absolute bottom-10 right-0 w-36 py-1.5 bg-neutral-900/95 backdrop-blur-md border border-neutral-700 rounded-xl shadow-2xl z-30 text-xs"
            @click.stop
          >
            <div class="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 mb-1">
              Kualitas Video
            </div>
            <button
              v-for="lvl in qualityLevels"
              :key="lvl.id"
              class="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-white/10 transition cursor-pointer"
              :class="selectedQuality === lvl.id ? 'text-primary font-bold' : 'text-neutral-200'"
              @click="setQuality(lvl.id)"
            >
              <span>{{ lvl.label }}</span>
              <UIcon
                v-if="selectedQuality === lvl.id"
                name="i-lucide-check"
                class="w-3.5 h-3.5 text-primary"
              />
            </button>
            <div v-if="qualityLevels.length === 0" class="px-3 py-1.5 text-neutral-500 text-[11px]">
              Auto HD
            </div>
          </div>
        </div>

        <!-- Picture in Picture (PiP) -->
        <button
          v-if="isPipSupported"
          class="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition cursor-pointer"
          title="Picture in Picture"
          @click.stop="togglePiP"
        >
          <UIcon name="i-lucide-tv" class="w-4 h-4" />
        </button>

        <!-- Fullscreen Button -->
        <button
          class="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition cursor-pointer"
          :title="isFullscreen ? 'Keluar Layar Penuh (F)' : 'Layar Penuh (F)'"
          @click.stop="toggleFullscreen"
        >
          <UIcon :name="isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
