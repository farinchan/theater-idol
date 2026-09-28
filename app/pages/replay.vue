<script setup lang="ts">
const searchQuery = ref('')
const selectedCategory = ref('Semua')
const activePlayingReplay = ref<any>(null)
const isModalOpen = ref(false)

const categories = [
  'Semua',
  'Ramune no Nomikata',
  'Renai Kinshi Jourei',
  'Tunas di Balik Kaca',
  'Pajama Drive',
  'Spesial Seitansai'
]

const replays = [
  {
    id: 1,
    title: 'Cara Meminum Ramune - Senshuraku Final Show',
    category: 'Ramune no Nomikata',
    date: '21 September 2026',
    duration: '2 Jam 18 Menit',
    quality: '1080p FHD 60fps',
    thumbnailColor: 'from-red-900 to-neutral-900',
    views: '24,520 views',
    description: 'Pertunjukan penutup spektakuler setlist Ramune no Nomikata yang dibawakan dengan emosional oleh seluruh member.',
    members: ['Freya', 'Christy', 'Zee', 'Gracia', 'Marsha', 'Feni', 'Gita', 'Muthe']
  },
  {
    id: 2,
    title: 'Tunas di Balik Kaca - Shonichi Premiere Stage',
    category: 'Tunas di Balik Kaca',
    date: '14 September 2026',
    duration: '2 Jam 05 Menit',
    quality: '1080p FHD',
    thumbnailColor: 'from-neutral-900 to-red-950',
    views: '18,910 views',
    description: 'Panggung pembuka perdana membawakan aransemen teatrikal baru Tunas di Balik Kaca.',
    members: ['Adel', 'Ella', 'Lulu', 'Indah', 'Kathrina', 'Jessi', 'Flora', 'Oniel']
  },
  {
    id: 3,
    title: 'Pajama Drive - Special Trainee Generation Stage',
    category: 'Pajama Drive',
    date: '07 September 2026',
    duration: '1 Jam 52 Menit',
    quality: '1080p FHD',
    thumbnailColor: 'from-red-950 to-neutral-900',
    views: '31,200 views',
    description: 'Penampilan penuh semangat generasi penerus JKT48 membawakan setlist bersejarah Pajama Drive.',
    members: ['Trainee Gen 12 & 13', 'Gendis', 'Erine', 'Oline', 'Aralie', 'Ribka']
  },
  {
    id: 4,
    title: 'Aturan Anti Cinta - Special 12th Anniversary Stage',
    category: 'Renai Kinshi Jourei',
    date: '24 Agustus 2026',
    duration: '2 Jam 25 Menit',
    quality: '1080p FHD',
    thumbnailColor: 'from-neutral-950 via-red-950 to-neutral-900',
    views: '45,800 views',
    description: 'Panggung perayaan ulang tahun teater dengan penampilan bintang tamu dan aransemen spesial.',
    members: ['All Member Lineup', 'Zee', 'Freya', 'Gracia', 'Feni', 'Christy']
  },
  {
    id: 5,
    title: 'Seitansai Freya Jayawardana - Special Birthday Show',
    category: 'Spesial Seitansai',
    date: '15 Agustus 2026',
    duration: '2 Jam 30 Menit',
    quality: '1080p FHD',
    thumbnailColor: 'from-red-900 via-neutral-900 to-red-950',
    views: '52,100 views',
    description: 'Momen perayaan ulang tahun Freya bersama para fans dengan kejutan surat dan ucapan hangat.',
    members: ['Freya Jayawardana', 'Christy', 'Zee', 'Gracia', 'Marsha', 'Feni']
  },
  {
    id: 6,
    title: 'Banzai JKT48 - Teater Festival Revival Stage',
    category: 'Semua',
    date: '02 Agustus 2026',
    duration: '2 Jam 10 Menit',
    quality: '1080p FHD',
    thumbnailColor: 'from-neutral-900 to-red-900',
    views: '22,400 views',
    description: 'Kompilasi lagu-lagu hit festival JKT48 yang dibawakan dalam format teater yang energik.',
    members: ['Gita', 'Muthe', 'Lulu', 'Oniel', 'Flora', 'Eli', 'Jessi']
  }
]

const filteredReplays = computed(() => {
  return replays.filter(item => {
    const matchesCategory = selectedCategory.value === 'Semua' || item.category === selectedCategory.value
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesCategory && matchesSearch
  })
})

const openReplay = (replay: any) => {
  activePlayingReplay.value = replay
  isModalOpen.value = true
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold text-primary tracking-wide uppercase">
          <UIcon name="i-lucide-film" class="w-3.5 h-3.5" />
          Video On Demand Archive
        </div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight mt-1 flex items-center gap-3">
          <UIcon name="i-lucide-play-circle" class="w-8 h-8 text-primary" />
          Replay & Video Show Teater
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Koleksi rekaman pertunjukan teater dalam format Full HD untuk ditonton kapan saja.
        </p>
      </div>

      <div class="w-full sm:w-72">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Cari arsip replay..."
          size="sm"
          class="w-full"
        />
      </div>
    </div>

    <!-- Category Pills Filter -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        v-for="cat in categories"
        :key="cat"
        :class="[
          'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
          selectedCategory === cat
            ? 'bg-primary text-white shadow-sm shadow-primary/30 font-bold'
            : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-primary/50 hover:text-primary'
        ]"
        @click="selectedCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Featured Replay Hero Banner -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 via-neutral-900 to-neutral-950 border border-neutral-800 p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="max-w-xl space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-white border border-primary/40">
          <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5 text-primary" />
          Featured Replay Show
        </div>
        <h2 class="text-2xl sm:text-3xl font-black leading-tight">
          Cara Meminum Ramune - Senshuraku Show
        </h2>
        <p class="text-neutral-300 text-xs sm:text-sm leading-relaxed">
          Tonton kembali sensasi dan keharuan malam terakhir setlist Ramune no Nomikata bersama seluruh member formasi panggung spesial.
        </p>
        <div class="flex items-center gap-4 text-xs text-neutral-300">
          <span class="flex items-center gap-1.5"><UIcon name="i-lucide-clock" class="w-4 h-4 text-primary" /> 2 Jam 18 Menit</span>
          <span>&bull;</span>
          <span class="flex items-center gap-1.5"><UIcon name="i-lucide-tv" class="w-4 h-4 text-primary" /> 1080p FHD</span>
          <span>&bull;</span>
          <span>24.5K Views</span>
        </div>
      </div>

      <div class="flex-shrink-0">
        <UButton
          color="primary"
          size="lg"
          icon="i-lucide-play"
          label="Putar Show Sekarang"
          class="shadow-lg shadow-primary/40 font-bold"
          @click="openReplay(replays[0])"
        />
      </div>
    </div>

    <!-- Replays Catalog Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="item in filteredReplays"
        :key="item.id"
        class="hover:border-primary/50 transition-all duration-200 overflow-hidden flex flex-col justify-between group"
      >
        <template #header>
          <!-- Thumbnail Box -->
          <div :class="['relative -mx-6 -mt-6 h-48 bg-gradient-to-br flex items-center justify-center p-4 text-white overflow-hidden cursor-pointer', item.thumbnailColor]" @click="openReplay(item)">
            <div class="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-primary transition-all shadow-xl">
              <UIcon name="i-lucide-play" class="w-7 h-7 ml-0.5" />
            </div>

            <div class="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono">
              <span class="bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-neutral-200">{{ item.duration }}</span>
              <span class="bg-primary px-2 py-0.5 rounded text-white font-bold">{{ item.quality }}</span>
            </div>
          </div>
        </template>

        <div class="space-y-3 pt-2">
          <div class="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5 text-primary" />
              {{ item.date }}
            </span>
            <span>{{ item.views }}</span>
          </div>

          <h3 class="font-bold text-base text-neutral-900 dark:text-white leading-snug group-hover:text-primary transition-colors cursor-pointer" @click="openReplay(item)">
            {{ item.title }}
          </h3>

          <p class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
            {{ item.description }}
          </p>

          <!-- Member Chips -->
          <div class="flex flex-wrap gap-1 pt-1">
            <span
              v-for="mem in item.members.slice(0, 4)"
              :key="mem"
              class="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium text-neutral-600 dark:text-neutral-300"
            >
              {{ mem }}
            </span>
            <span v-if="item.members.length > 4" class="px-1.5 py-0.5 text-[10px] text-neutral-400">
              +{{ item.members.length - 4 }} lagi
            </span>
          </div>
        </div>

        <template #footer>
          <UButton
            color="primary"
            variant="soft"
            block
            icon="i-lucide-play"
            label="Tonton Replay"
            @click="openReplay(item)"
          />
        </template>
      </UCard>
    </div>

    <!-- Playback Modal Preview -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <div v-if="activePlayingReplay" class="p-6 space-y-4">
          <div class="flex items-start justify-between">
            <div>
              <span class="text-xs text-primary font-bold uppercase tracking-wider">Video On Demand</span>
              <h3 class="font-black text-xl text-neutral-900 dark:text-white mt-0.5">
                {{ activePlayingReplay.title }}
              </h3>
            </div>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isModalOpen = false" />
          </div>

          <!-- Video Screen Preview -->
          <div class="relative bg-black rounded-xl aspect-video flex flex-col items-center justify-center text-white border border-neutral-800 p-6 text-center">
            <div class="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/40 mb-3 animate-pulse">
              <UIcon name="i-lucide-play" class="w-8 h-8 ml-0.5" />
            </div>
            <p class="font-bold text-sm">Memutar Arsip Pertunjukan Teater</p>
            <p class="text-xs text-neutral-400 mt-1">Format: {{ activePlayingReplay.quality }} &bull; Durasi: {{ activePlayingReplay.duration }}</p>
          </div>

          <p class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {{ activePlayingReplay.description }}
          </p>

          <div class="flex items-center justify-end gap-2 pt-2">
            <UButton color="neutral" variant="subtle" label="Tutup" @click="isModalOpen = false" />
            <UButton color="primary" icon="i-lucide-maximize" label="Layar Penuh" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
