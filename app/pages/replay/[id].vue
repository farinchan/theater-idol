<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { appName } = useAppName()
const showId = computed(() => route.params.id as string)

const { shows: appwriteShows, fetchShows, isLoading: isShowsLoading } = useAppwriteShow()
const { setlists, fetchSetlists, isLoading: isSetlistsLoading } = useAppwriteSetlist()

// Muat data show & setlist (SSR & Client Hydration)
await useAsyncData(`replay_detail_${showId.value}`, async () => {
  await Promise.all([fetchShows(), fetchSetlists()])
  return true
})

onMounted(() => {
  fetchShows()
  fetchSetlists()
})

// Helper hitung timestamp dari date & time pertunjukan
const getShowTimestamp = (dateVal?: string, timeVal?: string): number => {
  if (!dateVal) return 0
  try {
    const d = new Date(dateVal)
    if (!isNaN(d.getTime())) {
      let hours = 19
      let minutes = 0
      if (timeVal) {
        const match = timeVal.match(/(\d{1,2}):(\d{2})/)
        if (match) {
          hours = parseInt(match[1], 10)
          minutes = parseInt(match[2], 10)
        }
      }
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes, 0).getTime()
    }
  } catch {}
  return 0
}

// Format Tanggal Indonesia
const formatIndonesianDate = (dateVal?: string): string => {
  if (!dateVal) return '-'
  try {
    const d = new Date(dateVal)
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d)
    }
  } catch {}
  return dateVal
}

// Format Waktu WIB
const formatIndonesianTime = (timeVal?: string, dateVal?: string): string => {
  if (timeVal && timeVal.includes(':')) {
    return `${timeVal.slice(0, 5)} WIB`
  }
  if (dateVal) {
    try {
      const d = new Date(dateVal)
      if (!isNaN(d.getTime())) {
        const h = String(d.getHours()).padStart(2, '0')
        const m = String(d.getMinutes()).padStart(2, '0')
        return `${h}:${m} WIB`
      }
    } catch {}
  }
  return timeVal || '19:00 WIB'
}

// Show yang sedang diputar
const currentShow = computed(() => {
  return appwriteShows.value.find(
    s => s.$id === showId.value || String(s.id) === showId.value
  ) || null
})

// Setlist terkait
const relatedSetlist = computed(() => {
  if (!currentShow.value) return null
  return setlists.value.find(
    s => s.$id === currentShow.value?.setlist_id || String(s.id) === String(currentShow.value?.setlist_id)
  ) || null
})

// Lineup member
const lineupList = computed(() => {
  if (!currentShow.value?.lineup) return []
  return currentShow.value.lineup
    .split(/[\n,]+/)
    .map(m => m.trim())
    .filter(Boolean)
})

// Title & Meta SEO
const pageTitle = computed(() => {
  const showTitle = relatedSetlist.value?.title_id || 'Pertunjukan Teater'
  return `Replay: ${showTitle} - ${appName}`
})

useHead({
  title: pageTitle
})

// Pertunjukan replay lainnya (Rekomendasi replay lainnya)
const otherReplays = computed(() => {
  const now = Date.now()
  return appwriteShows.value
    .filter(s => {
      const isDifferent = (s.$id || String(s.id)) !== showId.value
      const hasReplayUrl = Boolean(s.replay_url && s.replay_url.trim())
      const ts = getShowTimestamp(s.date, s.time)
      const isPast = ts > 0 && ts <= now
      return isDifferent && hasReplayUrl && isPast
    })
    .map(s => {
      const rel = setlists.value.find(
        set => set.$id === s.setlist_id || String(set.id) === String(s.setlist_id)
      )
      return {
        id: s.$id || String(s.id),
        title: rel?.title_id || 'Pertunjukan Teater',
        originalTitle: rel?.title_jp || '',
        date: formatIndonesianDate(s.date),
        time: formatIndonesianTime(s.time, s.date),
        poster: rel?.image_url || '',
        replay_url: s.replay_url
      }
    })
    .slice(0, 3)
})

// Copy link video replay
const copied = ref(false)
const copyReplayLink = () => {
  if (!import.meta.client) return
  navigator.clipboard.writeText(window.location.href)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2500)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- Top Navigation / Breadcrumb -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
      <div class="flex items-center gap-3">
        <UButton
          to="/replay"
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-lucide-arrow-left"
          label="Daftar Replay"
          class="cursor-pointer font-semibold rounded-xl"
        />
        <span class="text-neutral-300 dark:text-neutral-700">/</span>
        <UBadge color="primary" variant="subtle" size="xs" class="font-bold tracking-wide">
          <UIcon name="i-lucide-play-circle" class="w-3.5 h-3.5 mr-1" />
          Replay
        </UBadge>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="soft"
          size="xs"
          :icon="copied ? 'i-lucide-check' : 'i-lucide-share-2'"
          :label="copied ? 'Tautan Disalin!' : 'Bagikan'"
          class="rounded-xl font-medium cursor-pointer"
          @click="copyReplayLink"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isShowsLoading && !currentShow" class="py-24 text-center space-y-3">
      <div class="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin mx-auto" />
      <p class="text-sm text-neutral-500 font-medium">Memuat data rekaman pertunjukan...</p>
    </div>

    <!-- Not Found State -->
    <div
      v-else-if="!currentShow || !currentShow.replay_url"
      class="p-10 sm:p-14 text-center rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-4 max-w-xl mx-auto"
    >
      <div class="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-alert-circle" class="w-7 h-7" />
      </div>
      <div class="space-y-1.5">
        <h3 class="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
          Video Replay Tidak Ditemukan
        </h3>
        <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Pertunjukan ini mungkin belum selesai, belum memiliki rekaman stream resmi, atau ID tidak valid.
        </p>
      </div>
      <div class="pt-2">
        <UButton
          to="/replay"
          color="primary"
          variant="solid"
          size="md"
          icon="i-lucide-arrow-left"
          label="Kembali ke Katalog Replay"
          class="rounded-xl font-bold cursor-pointer"
        />
      </div>
    </div>

    <!-- Video Playback & Show Details -->
    <div v-else class="space-y-8">
      <!-- Main Replay Player (Mendukung YouTube & MP4 dengan Timeline) -->
      <ReplayPlayer
        :src="currentShow.replay_url"
        :title="relatedSetlist?.title_id"
        :poster="relatedSetlist?.image_url"
      />

      <!-- Show Details Section (Full Row, Tanpa Card) -->
      <div class="space-y-6 pt-2">
        <!-- Header Info Row -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div class="space-y-1.5 min-w-0">

            <h1 class="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {{ relatedSetlist?.title_id || 'Pertunjukan Teater' }}
            </h1>
            <p v-if="relatedSetlist?.title_jp" class="text-xs sm:text-sm text-neutral-500 font-medium">
              {{ relatedSetlist.title_jp }}
            </p>
          </div>

          <!-- Schedule Pills -->
          <div class="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <UIcon name="i-lucide-calendar" class="w-4 h-4 text-primary" />
              <span>{{ formatIndonesianDate(currentShow.date) }}</span>
            </div>
            <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <UIcon name="i-lucide-clock" class="w-4 h-4 text-primary" />
              <span>Pukul: {{ formatIndonesianTime(currentShow.time, currentShow.date) }}</span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <p class="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-4xl">
          {{ currentShow.description || (relatedSetlist ? `Rekaman penuh pertunjukan setlist ${relatedSetlist.title_id} yang dibawakan langsung dari panggung Teater JKT48.` : 'Rekaman arsip pertunjukan panggung Teater JKT48.') }}
        </p>

        <!-- Lineup Member Section -->
        <div class="space-y-3 pt-2">
          <div class="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            <UIcon name="i-lucide-users" class="w-4 h-4 text-primary" />
            <span>Lineup Member Tampil</span>
            <span v-if="lineupList.length > 0" class="text-[11px] font-normal text-neutral-500">
              ({{ lineupList.length }} Member)
            </span>
          </div>

          <div v-if="lineupList.length > 0" class="flex flex-wrap gap-2">
            <span
              v-for="member in lineupList"
              :key="member"
              class="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/90 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-primary hover:text-white transition-colors cursor-default"
            >
              {{ member }}
            </span>
          </div>
          <div v-else class="text-xs text-neutral-400 italic">
            Lineup member tidak tercatat untuk arsip ini.
          </div>
        </div>
      </div>

      <!-- Rekomendasi Replay Lainnya -->
      <div v-if="otherReplays.length > 0" class="pt-8 border-t border-neutral-200/80 dark:border-neutral-800/80 space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-extrabold text-lg sm:text-xl text-neutral-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-lucide-film" class="w-5 h-5 text-primary" />
              Replay Pertunjukan Lainnya
            </h3>
            <p class="text-xs text-neutral-500 mt-0.5">Tonton kembali panggung teater lainnya yang telah lewat.</p>
          </div>
          <UButton
            to="/replay"
            variant="ghost"
            color="primary"
            size="xs"
            label="Lihat Semua"
            icon="i-lucide-arrow-right"
            trailing
            class="font-bold cursor-pointer"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            v-for="item in otherReplays"
            :key="item.id"
            :to="`/replay/${item.id}`"
            class="group block p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 transition-all bg-white dark:bg-neutral-900/60"
          >
            <div class="relative aspect-video rounded-xl bg-neutral-950 overflow-hidden mb-3">
              <img
                v-if="item.poster"
                :src="item.poster"
                :alt="item.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-neutral-600">
                <UIcon name="i-lucide-play" class="w-8 h-8" />
              </div>
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                  <UIcon name="i-lucide-play" class="w-5 h-5 ml-0.5 text-white" />
                </div>
              </div>
              <div class="absolute bottom-2 left-2 flex items-center text-[10px] font-mono text-white">
                <span class="bg-black/70 px-1.5 py-0.5 rounded">{{ item.time }}</span>
              </div>
            </div>

            <div class="space-y-1">
              <div class="text-[11px] text-neutral-400 flex items-center gap-1 font-medium">
                <UIcon name="i-lucide-calendar" class="w-3 h-3 text-primary" />
                {{ item.date }}
              </div>
              <h4 class="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                {{ item.title }}
              </h4>
              <p v-if="item.originalTitle" class="text-[11px] text-neutral-400 italic line-clamp-1">
                {{ item.originalTitle }}
              </p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
