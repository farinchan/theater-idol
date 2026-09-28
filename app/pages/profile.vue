<script setup lang="ts">
const colorMode = useColorMode()

const user = ref({
  name: 'Fajri',
  username: '@fajri_wota',
  fanId: 'OFC-2026-88219',
  membership: 'Official Fan Club (OFC)',
  joinedDate: 'Januari 2023',
  primaryOshi: 'Freya Jayawardana',
  oshiNickname: 'Freya',
  oshiGeneration: 'Generasi 7',
  oshiQuote: 'Gadis koleris yang suka menjelajah!',
  totalShowsAttended: 18,
  favoriteSetlist: 'Ramune no Nomikata',
  totalHoursWatched: '46 Jam'
})

const attendanceHistory = [
  {
    id: 1,
    title: 'Cara Meminum Ramune - Senshuraku Show',
    date: '21 September 2026',
    seat: 'Row C - No. 14',
    type: 'Regular Show'
  },
  {
    id: 2,
    title: 'Seitansai Freya Jayawardana',
    date: '15 Agustus 2026',
    seat: 'Row B - No. 08',
    type: 'Special Birthday Show'
  },
  {
    id: 3,
    title: 'Aturan Anti Cinta',
    date: '02 Agustus 2026',
    seat: 'Row E - No. 21',
    type: 'Regular Show'
  },
  {
    id: 4,
    title: 'Tunas di Balik Kaca - Shonichi Premiere',
    date: '14 Juli 2026',
    seat: 'Row D - No. 11',
    type: 'Regular Show'
  }
]

const badges = [
  { name: 'OFC Active 2026', desc: 'Member Komunitas Fans JKT48', icon: 'i-lucide-shield-check' },
  { name: 'Seitansai Hunter', desc: 'Hadir di Special Birthday Show', icon: 'i-lucide-cake' },
  { name: 'Ramune Loyalist', desc: 'Menonton Senshuraku Ramune', icon: 'i-lucide-award' },
  { name: '10+ Teater Club', desc: 'Lebih dari 10 kali hadir di Teater', icon: 'i-lucide-sparkles' }
]
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- Profile Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold text-primary tracking-wide uppercase">
          <UIcon name="i-lucide-user" class="w-3.5 h-3.5" />
          Fan & Member Profile
        </div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight mt-1 flex items-center gap-3">
          <UIcon name="i-lucide-id-card" class="w-8 h-8 text-primary" />
          Profil Fans Teater
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Identitas akun fans, oshimen favorit, riwayat kehadiran show, dan status keanggotaan.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UBadge color="primary" variant="solid" size="md" class="px-3 py-1 font-bold">
          {{ user.membership }}
        </UBadge>
      </div>
    </div>

    <!-- Main Profile Card -->
    <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- User Avatar & Identity -->
      <div class="flex flex-col items-center sm:items-start text-center sm:text-left space-y-4 border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-800 pb-6 lg:pb-0 lg:pr-8">
        <div class="relative">
          <div class="w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary to-rose-400 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-primary/30">
            FJ
          </div>
          <span class="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-3 border-white dark:border-neutral-900" />
        </div>

        <div>
          <h2 class="text-2xl font-black text-neutral-900 dark:text-white">{{ user.name }}</h2>
          <p class="text-xs font-mono text-neutral-500">{{ user.username }} &bull; ID: {{ user.fanId }}</p>
          <div class="inline-block mt-2 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            {{ user.membership }}
          </div>
        </div>

        <div class="w-full text-xs text-neutral-500 dark:text-neutral-400 space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div class="flex justify-between">
            <span>Bergabung Sejak:</span>
            <span class="font-semibold text-neutral-800 dark:text-neutral-200">{{ user.joinedDate }}</span>
          </div>
          <div class="flex justify-between">
            <span>Lokasi Utama:</span>
            <span class="font-semibold text-neutral-800 dark:text-neutral-200">Jakarta, ID</span>
          </div>
        </div>
      </div>

      <!-- Oshimen Showcase Card -->
      <div class="space-y-4 flex flex-col justify-between">
        <div>
          <span class="text-xs font-bold text-primary uppercase tracking-wider">Oshimen Utama</span>
          <div class="mt-2 p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-md shadow-primary/30">
                <UIcon name="i-lucide-heart" class="w-6 h-6 fill-white" />
              </div>
              <div>
                <h3 class="font-black text-lg text-neutral-900 dark:text-white">{{ user.primaryOshi }}</h3>
                <span class="text-xs text-primary font-semibold">{{ user.oshiGeneration }}</span>
              </div>
            </div>
            <p class="text-xs text-neutral-600 dark:text-neutral-400 italic">
              "{{ user.oshiQuote }}"
            </p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-2">
          <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 text-center">
            <div class="text-lg font-black text-primary">{{ user.totalShowsAttended }}x</div>
            <div class="text-[11px] text-neutral-500">Show Dihadiri</div>
          </div>
          <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 text-center">
            <div class="text-lg font-black text-neutral-900 dark:text-white">{{ user.totalHoursWatched }}</div>
            <div class="text-[11px] text-neutral-500">Waktu Tonton VOD</div>
          </div>
        </div>
      </div>

      <!-- Badges & Achievements -->
      <div class="space-y-4">
        <span class="text-xs font-bold text-neutral-400 uppercase tracking-wider">Lencana & Prestasi Fans</span>
        <div class="grid grid-cols-1 gap-2.5">
          <div
            v-for="b in badges"
            :key="b.name"
            class="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3"
          >
            <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <UIcon :name="b.icon" class="w-4 h-4" />
            </div>
            <div>
              <div class="text-xs font-bold text-neutral-900 dark:text-white">{{ b.name }}</div>
              <div class="text-[10px] text-neutral-500">{{ b.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Attendance History -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-black text-xl text-neutral-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-lucide-history" class="w-5 h-5 text-primary" />
          Riwayat Pertunjukan Terakhir
        </h3>
        <span class="text-xs text-neutral-500">Total: {{ attendanceHistory.length }} Catatan</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="show in attendanceHistory"
          :key="show.id"
          class="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4"
        >
          <div>
            <span class="text-[10px] font-bold text-primary uppercase">{{ show.type }}</span>
            <h4 class="font-bold text-base text-neutral-900 dark:text-white mt-0.5">{{ show.title }}</h4>
            <div class="flex items-center gap-3 text-xs text-neutral-500 mt-1">
              <span>{{ show.date }}</span>
              <span>&bull;</span>
              <span class="font-mono font-semibold">{{ show.seat }}</span>
            </div>
          </div>

          <div class="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 flex-shrink-0">
            <UIcon name="i-lucide-check-circle-2" class="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
