<script setup lang="ts">
import { showService } from '~/services/show-service'
import type { ShowListItem } from '~/types/show'

const isShowsLoading = ref(true)
const shows = ref<ShowListItem[]>([])

useSeoMeta({
  title: 'Jadwal Show Theater Idol Terupdate & Terlengkap',
  ogTitle: 'Jadwal Show Theater Idol - Info Line Up Member & Jam Tayang',
  description: 'Cek jadwal pertunjukan panggung Theater Idol terbaru, informasi setlist, daftar member penampil, dan jam tayang live streaming.',
  ogDescription: 'Cek jadwal pertunjukan panggung Theater Idol terbaru, informasi setlist, daftar member penampil, dan jam tayang live streaming.',
  ogImage: '/icon.png',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Jadwal Show Theater Idol - Info Line Up Member & Jam Tayang',
  twitterDescription: 'Cek jadwal pertunjukan panggung Theater Idol terbaru, informasi setlist, daftar member penampil, dan jam tayang live streaming.',
  twitterImage: '/icon.png'
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': 'Jadwal Show Theater Idol',
        'description': 'Daftar jadwal show dan pertunjukan Theater Idol terkini',
        'url': 'https://theater-idol.web.id/jadwal'
      })
    }
  ]
})

const fetchSchedules = async () => {
  isShowsLoading.value = true
  try {
    const res = await showService.getSchedule(1, 50)
    if (res.data) {
      shows.value = res.data
    }
  } catch {
    shows.value = []
  } finally {
    isShowsLoading.value = false
  }
}

onMounted(() => {
  fetchSchedules()
})

// Helper formatters untuk penanganan ISO Datetime dan lokal Indonesia
const getFullFormattedDate = (dateVal?: string): string => {
  if (!dateVal) return '-'
  try {
    const d = new Date(dateVal)
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d)
    }
  } catch {}
  return dateVal
}

const getFormattedTime = (timeVal?: string, dateVal?: string): string => {
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

const allSchedules = computed(() => {
  return shows.value.map(s => {
    const lineupList = s.lineup ? s.lineup.split(',').map(m => m.trim()).filter(Boolean) : []
    return {
      id: s.id,
      title: s.setlist?.title_id || 'Pertunjukan Teater',
      originalTitle: s.setlist?.title_jp || '',
      category: 'Regular Show',
      date: s.date,
      time: getFormattedTime(s.time, s.date),
      description: s.description || (s.setlist ? `Pertunjukan setlist ${s.setlist.title_id}` : 'Pertunjukan teater mendatang.'),
      lineup: lineupList.length > 0 ? lineupList : ['Lineup menyusul'],
      poster: resolveMediaUrl(s.setlist?.image)
    }
  })
})
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
          <UIcon name="i-lucide-calendar-days" class="w-8 h-8 text-primary" />
          Jadwal Show Teater
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Daftar jadwal pertunjukan teater mendatang, tema setlist, dan lineup member penampil.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          to="/jadwal/riwayat"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-history"
          label="Riwayat"
          class="rounded-xl font-bold cursor-pointer hover:border-primary/50"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isShowsLoading" class="p-12 text-center space-y-3">
      <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
      <p class="text-xs text-neutral-500">Memuat jadwal pertunjukan...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="allSchedules.length === 0"
      class="p-12 text-center rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3"
    >
      <div class="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-calendar-x-2" class="w-6 h-6" />
      </div>
      <h3 class="font-bold text-neutral-900 dark:text-white text-base">Belum Ada Jadwal Pertunjukan Mendatang</h3>
      <p class="text-xs text-neutral-500 max-w-sm mx-auto">
        Jadwal show teater berikutnya sedang dipersiapkan. Anda dapat melihat arsip show sebelumnya pada menu Riwayat.
      </p>
      <div class="pt-2">
        <UButton
          to="/jadwal/riwayat"
          color="primary"
          variant="soft"
          size="sm"
          icon="i-lucide-history"
          label="Lihat Riwayat Show"
          class="rounded-xl font-bold cursor-pointer"
        />
      </div>
    </div>

    <!-- Schedule List Cards -->
    <div v-else class="space-y-4">
      <div
        v-for="show in allSchedules"
        :key="show.id"
        class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
      >
        <!-- Setlist Poster & Show Main Info -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
          <!-- Poster Setlist Box di Kiri (Rasio 16:9) -->
          <div class="w-full sm:w-52 md:w-56 aspect-video rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 flex-shrink-0 relative group-hover:shadow-md transition-all">
            <img
              v-if="show.poster"
              :src="show.poster"
              :alt="show.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 gap-1.5 p-2 text-center">
              <UIcon name="i-lucide-disc-3" class="w-8 h-8 text-primary/60" />
              <span class="text-[11px] font-bold">Poster Setlist</span>
            </div>
          </div>

          <!-- Show Details -->
          <div class="space-y-2 flex-1 min-w-0">
            <!-- Tanggal & Waktu Pertunjukan -->
            <div class="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              <UIcon name="i-lucide-calendar-days" class="w-4 h-4 text-primary" />
              <span>{{ getFullFormattedDate(show.date) }}</span>
              <span class="text-neutral-300 dark:text-neutral-700">&bull;</span>
              <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-primary" />
              <span>{{ show.time }}</span>
            </div>

            <!-- Title & Japanese Title -->
            <div>
              <h3 class="text-lg sm:text-xl font-black text-neutral-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
                {{ show.title }}
              </h3>
              <p v-if="show.originalTitle" class="text-xs text-neutral-500 dark:text-neutral-400 font-medium italic mt-0.5">
                {{ show.originalTitle }}
              </p>
            </div>

            <p class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
              {{ show.description }}
            </p>

            <!-- Lineup Member -->
            <div v-if="show.lineup && show.lineup.length" class="flex items-start gap-2 pt-1 text-xs">
              <span class="text-neutral-400 font-semibold text-[11px] mt-0.5">Lineup:</span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="m in show.lineup"
                  :key="m"
                  class="px-2.5 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50"
                >
                  {{ m }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
