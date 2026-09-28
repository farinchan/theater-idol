<script setup lang="ts">
const { appName } = useAppName()

const stats = [
  { label: 'Setlist Aktif', value: '4 Setlist', icon: 'i-lucide-disc-3' },
  { label: 'Member Lineup', value: '45+ Member', icon: 'i-lucide-users' },
  { label: 'Panggung Show', value: 'Teater Utama', icon: 'i-lucide-sparkles' },
  { label: 'Kapasitas', value: '±350 Kursi', icon: 'i-lucide-armchair' }
]

const liveSpotlight = {
  title: 'Aturan Anti Cinta (Renai Kinshi Jourei)',
  currentSong: 'M05. Gomen ne Jewel',
  viewers: '14.8K Penonton',
  time: '19:00 - 21:00 WIB',
  platform: 'SHOWROOM & IDN Live',
  featuredMembers: ['Freya', 'Christy', 'Zee', 'Gracia', 'Marsha']
}

const upcomingShowsPreview = [
  {
    id: 1,
    title: 'Cara Meminum Ramune',
    date: 'Jumat, 3 Oktober 2026',
    time: '19:00 WIB',
    status: 'Jadwal Terkonfirmasi',
    color: 'primary' as const
  },
  {
    id: 2,
    title: 'Aturan Anti Cinta',
    date: 'Sabtu, 4 Oktober 2026',
    time: '14:00 WIB',
    status: 'Matinee Show',
    color: 'warning' as const
  },
  {
    id: 3,
    title: 'Tunas di Balik Kaca (Seitansai Freya)',
    date: 'Minggu, 5 Oktober 2026',
    time: '16:00 WIB',
    status: 'Spesial Seitansai',
    color: 'primary' as const
  }
]

const recentReplays = [
  {
    id: 1,
    title: 'Cara Meminum Ramune - Senshuraku Final Show',
    date: '21 Sep 2026',
    duration: '2 Jam 18 Menit',
    thumbnailColor: 'from-red-900 to-neutral-900',
    views: '24.5K views'
  },
  {
    id: 2,
    title: 'Tunas di Balik Kaca - Shonichi Premiere',
    date: '14 Sep 2026',
    duration: '2 Jam 05 Menit',
    thumbnailColor: 'from-neutral-900 to-red-950',
    views: '18.9K views'
  },
  {
    id: 3,
    title: 'Pajama Drive - Special Trainee Generation',
    date: '07 Sep 2026',
    duration: '1 Jam 52 Menit',
    thumbnailColor: 'from-red-950 to-neutral-900',
    views: '31.2K views'
  }
]
</script>

<template>
  <div class="flex-1 flex flex-col">
    <!-- Main Content Area -->
    <main class="flex-1 p-4 sm:p-6 lg:p-8 space-y-12 max-w-7xl w-full mx-auto">
      <!-- Hero Banner -->
      <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 text-white p-6 sm:p-10 lg:p-12 border border-neutral-800 shadow-2xl">
        <div class="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary/25 blur-3xl pointer-events-none" />
        <div class="absolute right-1/4 -bottom-20 w-64 h-64 rounded-full bg-primary/15 blur-2xl pointer-events-none" />

        <div class="relative z-10 max-w-2xl space-y-5">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-white border border-primary/40 backdrop-blur-sm">
            <span class="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Portal {{ appName }}
          </div>

          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Selamat Datang di <span class="text-primary underline decoration-primary/40 underline-offset-8">{{ appName }}</span>
          </h1>

          <p class="text-neutral-300 text-sm sm:text-base leading-relaxed">
            Pusat pertunjukan teater idola nomor satu di Indonesia. Tonton siaran langsung lewat <strong>Stream</strong>, nikmati koleksi <strong>Replay</strong> pertunjukan, atau pantau <strong>Jadwal Show</strong> panggung mendatang.
          </p>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <UButton
              to="/stream"
              color="primary"
              size="md"
              icon="i-lucide-radio"
              label="Buka Live Stream"
            />
            <UButton
              to="/jadwal"
              color="neutral"
              variant="outline"
              size="md"
              icon="i-lucide-calendar-days"
              label="Jadwal Panggung"
            />
            <UButton
              to="/replay"
              color="neutral"
              variant="ghost"
              size="md"
              icon="i-lucide-play-circle"
              label="Arsip Replay"
            />
          </div>
        </div>
      </section>

      <!-- Stats Grid -->
      <section class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="item in stats"
          :key="item.label"
          class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4"
        >
          <div class="p-3 rounded-xl bg-primary/10 text-primary">
            <UIcon :name="item.icon" class="w-6 h-6" />
          </div>
          <div>
            <div class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{{ item.label }}</div>
            <div class="text-lg font-bold text-neutral-900 dark:text-white">{{ item.value }}</div>
          </div>
        </div>
      </section>

      <!-- Live Stream Spotlight Card -->
      <section class="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/5 via-white dark:via-neutral-900 to-white dark:to-neutral-900 p-6 sm:p-8 shadow-sm">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-3 flex-1">
            <div class="flex items-center gap-2">
              <UBadge color="primary" variant="solid" size="xs" class="font-bold animate-pulse">
                SEDANG LIVE SEKARANG
              </UBadge>
              <span class="text-xs font-semibold text-neutral-500">{{ liveSpotlight.viewers }}</span>
            </div>

            <h2 class="text-2xl font-black text-neutral-900 dark:text-white">
              {{ liveSpotlight.title }}
            </h2>

            <p class="text-xs text-neutral-600 dark:text-neutral-400">
              Lagu saat ini: <strong class="text-primary">{{ liveSpotlight.currentSong }}</strong> &bull; Siaran multi-angle HD langsung dari panggung teater.
            </p>

            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-neutral-400 text-xs font-semibold mr-1">Lineup:</span>
              <span
                v-for="m in liveSpotlight.featuredMembers"
                :key="m"
                class="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium"
              >
                {{ m }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-3 flex-shrink-0">
            <UButton
              to="/stream"
              color="primary"
              size="lg"
              icon="i-lucide-play"
              label="Masuk ke Live Stream"
              class="shadow-md shadow-primary/30 font-bold"
            />
          </div>
        </div>
      </section>

      <!-- 2 Columns: Upcoming Shows & Recent Replays -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Upcoming Shows Preview -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-black text-xl text-neutral-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-lucide-calendar-days" class="w-5 h-5 text-primary" />
              Jadwal Terdekat
            </h3>
            <NuxtLink to="/jadwal" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>Semua Jadwal</span>
              <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5" />
            </NuxtLink>
          </div>

          <div class="space-y-3">
            <div
              v-for="show in upcomingShowsPreview"
              :key="show.id"
              class="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 transition-colors flex items-center justify-between gap-4"
            >
              <div>
                <div class="flex items-center gap-2">
                  <UBadge :color="show.color" variant="subtle" size="xs">
                    {{ show.status }}
                  </UBadge>
                  <span class="text-xs text-neutral-500">{{ show.time }}</span>
                </div>
                <h4 class="font-bold text-base text-neutral-900 dark:text-white mt-1">{{ show.title }}</h4>
                <div class="text-xs text-neutral-500 mt-0.5">{{ show.date }}</div>
              </div>

              <UButton
                to="/jadwal"
                color="primary"
                variant="soft"
                size="sm"
                icon="i-lucide-calendar"
                label="Detail"
              />
            </div>
          </div>
        </div>

        <!-- Recent Replays Preview -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-black text-xl text-neutral-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-lucide-play-circle" class="w-5 h-5 text-primary" />
              Replay Pilihan
            </h3>
            <NuxtLink to="/replay" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>Katalog VOD</span>
              <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5" />
            </NuxtLink>
          </div>

          <div class="space-y-3">
            <div
              v-for="rep in recentReplays"
              :key="rep.id"
              class="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 transition-colors flex items-center justify-between gap-4"
            >
              <div class="flex items-center gap-3">
                <div :class="['w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0', rep.thumbnailColor]">
                  <UIcon name="i-lucide-play" class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1">{{ rep.title }}</h4>
                  <div class="text-xs text-neutral-500 mt-0.5">
                    {{ rep.date }} &bull; {{ rep.duration }}
                  </div>
                </div>
              </div>

              <UButton
                to="/replay"
                color="neutral"
                variant="subtle"
                size="sm"
                icon="i-lucide-play"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Theater Info Banner -->
      <section class="rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 flex-shrink-0">
            <UIcon name="i-lucide-sparkles" class="w-6 h-6" />
          </div>
          <div>
            <h4 class="font-bold text-neutral-900 dark:text-white">Panggung Teater JKT48</h4>
            <p class="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              Tempat bertemunya idola dan penggemar dalam pertunjukan panggung penuh energi, musik, dan koreografi setiap pekannya.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            to="https://jkt48.com"
            target="_blank"
            color="primary"
            variant="outline"
            size="sm"
            icon="i-lucide-external-link"
            label="Situs Resmi JKT48.com"
          />
        </div>
      </section>
    </main>
  </div>
</template>
