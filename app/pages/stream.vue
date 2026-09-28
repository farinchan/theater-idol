<script setup lang="ts">
const selectedCam = ref('Cam 1: Center')
const isMuted = ref(false)
const chatInput = ref('')
const liveChatMessages = ref([
  { id: 1, user: 'Rian_OshiFreya', time: '19:24', text: 'Freya center Faint auranya gokil banget malam ini! 🔥' },
  { id: 2, user: 'WotaJakarta', time: '19:25', text: 'Koreografi unit song-nya makin sinkron dan rapi!' },
  { id: 3, user: 'ChristyFansID', time: '19:26', text: 'Hai! Hai! Semangat semuanya member JKT48! ❤️' },
  { id: 4, user: 'TeaterLover', time: '19:27', text: 'Kualitas video 1080p-nya jernih banget, audionya juga bening.' }
])

const cameras = ['Cam 1: Center', 'Cam 2: Close-up', 'Cam 3: Wide Stage']

const activeShow = {
  title: 'Aturan Anti Cinta (Renai Kinshi Jourei)',
  currentSong: 'M05. Gomen ne Jewel (Permata Permintaan Maaf)',
  status: 'Sedang Berlangsung',
  viewers: '14,820 Penonton',
  date: 'Malam Ini, 28 September 2026',
  time: '19:00 - 21:00 WIB',
  platform: 'SHOWROOM & IDN Live',
  setlist: 'Renai Kinshi Jourei',
  description: 'Pertunjukan setlist legendaris Renai Kinshi Jourei dibawakan dengan penuh penghayatan dan energi panggung oleh member JKT48 langsung dari panggung teater.',
  lineup: [
    'Freya Jayawardana', 'Angelina Christy', 'Shania Gracia', 'Azizi Asadel',
    'Marsha Lenathea', 'Feni Fitriyanti', 'Gita Sekar', 'Mutiara Azzahra',
    'Kathrina Irene', 'Jessi', 'Lulu Salsabila', 'Indah Cahya',
    'Adel Reva', 'Ella', 'Flora Shafiq', 'Oniel'
  ],
  setlistTracks: [
    { no: 'M00', title: 'Overture', done: true },
    { no: 'M01', title: 'Nagai Hikari (Cahaya Panjang)', done: true },
    { no: 'M02', title: 'Squall no Aida ni (Di Tengah Hujan Badai Tiba-tiba)', done: true },
    { no: 'M03', title: 'JKT Sanjou! (JKT Datang!)', done: true },
    { no: 'M04', title: 'Heart Gata Virus (Virus Tipe Hati)', done: true },
    { no: 'M05', title: 'Gomen ne Jewel (Permata Permintaan Maaf)', playing: true },
    { no: 'M06', title: 'Kuroi Tenshi (Malaikat Hitam)', done: false },
    { no: 'M07', title: 'Heart Ereki (Heart Electric)', done: false },
    { no: 'M08', title: 'Renai Kinshi Jourei (Aturan Anti Cinta)', done: false }
  ]
}

const upcomingStreams = [
  {
    id: 1,
    title: 'Cara Meminum Ramune (Ramune no Nomikata)',
    date: 'Jumat, 3 Oktober 2026',
    time: '19:00 WIB',
    platform: 'SHOWROOM JKT48',
    status: 'Segera Hadir'
  },
  {
    id: 2,
    title: 'Tunas di Balik Kaca - Special Seitansai Show',
    date: 'Minggu, 5 Oktober 2026',
    time: '16:00 WIB',
    platform: 'IDN Live & SHOWROOM',
    status: 'Segera Hadir'
  }
]

const sendChatMessage = () => {
  if (!chatInput.value.trim()) return
  liveChatMessages.value.push({
    id: Date.now(),
    user: 'Anda',
    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    text: chatInput.value.trim()
  })
  chatInput.value = ''
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- Stream Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold text-primary tracking-wide uppercase">
          <span class="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
          Live Theater Broadcast
        </div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight mt-1 flex items-center gap-3">
          <UIcon name="i-lucide-radio" class="w-8 h-8 text-primary" />
          Theater Live Stream
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Siaran langsung pertunjukan panggung Teater JKT48 dengan multi-angle HD.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <UBadge color="primary" variant="solid" size="md" class="px-3 py-1 font-bold animate-pulse">
          LIVE NOW
        </UBadge>
        <span class="text-xs font-semibold px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
          {{ activeShow.viewers }}
        </span>
      </div>
    </div>

    <!-- Main Live Stream Grid (Player + Chat) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Video Player & Controls Area -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Live Player Box -->
        <div class="relative bg-neutral-950 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 aspect-video flex flex-col justify-between p-4 sm:p-6 text-white group">
          <div class="absolute inset-0 bg-radial from-neutral-800/30 via-neutral-950/80 to-black pointer-events-none" />

          <!-- Top Player Bar -->
          <div class="relative z-10 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UBadge color="primary" variant="solid" size="xs" class="font-bold tracking-wider">
                LIVE
              </UBadge>
              <span class="text-xs bg-black/60 px-2 py-0.5 rounded font-mono text-neutral-300">
                1080p FHD 60fps
              </span>
            </div>

            <!-- Angle Switcher -->
            <div class="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-neutral-800 text-xs">
              <button
                v-for="cam in cameras"
                :key="cam"
                :class="[
                  'px-2 py-1 rounded-md transition-colors font-medium text-[11px]',
                  selectedCam === cam ? 'bg-primary text-white font-bold' : 'text-neutral-400 hover:text-white'
                ]"
                @click="selectedCam = cam"
              >
                {{ cam }}
              </button>
            </div>
          </div>

          <!-- Center Stage Playing Indicator -->
          <div class="relative z-10 text-center space-y-2 py-8">
            <div class="w-16 h-16 mx-auto rounded-full bg-primary/80 text-white flex items-center justify-center shadow-lg shadow-primary/30">
              <UIcon name="i-lucide-play" class="w-8 h-8 ml-0.5" />
            </div>
            <div>
              <span class="text-xs text-primary font-semibold uppercase tracking-wider">Lagu Sedang Dimainkan</span>
              <h2 class="text-lg sm:text-2xl font-black text-white mt-0.5">{{ activeShow.currentSong }}</h2>
              <p class="text-xs text-neutral-400 mt-1">Setlist: {{ activeShow.title }} &bull; Sudut: {{ selectedCam }}</p>
            </div>
          </div>

          <!-- Bottom Control Bar -->
          <div class="relative z-10 flex items-center justify-between text-xs text-neutral-300 pt-2 border-t border-neutral-800/60">
            <div class="flex items-center gap-4">
              <button class="hover:text-primary transition-colors flex items-center gap-1" @click="isMuted = !isMuted">
                <UIcon :name="isMuted ? 'i-lucide-volume-x' : 'i-lucide-volume-2'" class="w-4 h-4 text-primary" />
                <span>{{ isMuted ? 'Unmute' : 'Audio Aktif' }}</span>
              </button>
              <span class="text-neutral-500 hidden sm:inline">&bull;</span>
              <span class="text-neutral-400 hidden sm:inline">Server: ID-JKT-01 (Stabil)</span>
            </div>

            <div class="flex items-center gap-2">
              <a
                href="https://www.showroom-live.com"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-primary transition-colors text-xs flex items-center gap-1 font-semibold"
              >
                <span>Buka di SHOWROOM</span>
                <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <!-- Show Meta & Description Card -->
        <UCard>
          <template #header>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span class="text-xs font-semibold text-primary uppercase tracking-wider">Informasi Pertunjukan</span>
                <h3 class="font-extrabold text-xl text-neutral-900 dark:text-white mt-0.5">
                  {{ activeShow.title }}
                </h3>
              </div>
              <div class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <UIcon name="i-lucide-calendar" class="w-4 h-4 text-primary" />
                <span>{{ activeShow.date }}</span>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {{ activeShow.description }}
            </p>

            <!-- Lineup Member Badges -->
            <div>
              <div class="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Lineup Tampil Hari Ini (16 Member)
              </div>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="member in activeShow.lineup"
                  :key="member"
                  class="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-medium hover:bg-primary hover:text-white transition-colors cursor-default"
                >
                  {{ member }}
                </span>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Live Chat & Tracklist Column -->
      <div class="space-y-6">
        <!-- Live Chat Card -->
        <UCard class="flex flex-col h-[420px]">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-bold text-sm">
                <UIcon name="i-lucide-messages-square" class="w-4 h-4 text-primary" />
                <span>Live Chat Teater</span>
              </div>
              <UBadge color="primary" variant="subtle" size="xs">Aktif</UBadge>
            </div>
          </template>

          <!-- Chat List -->
          <div class="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            <div
              v-for="msg in liveChatMessages"
              :key="msg.id"
              class="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800"
            >
              <div class="flex items-center justify-between font-semibold mb-1">
                <span class="text-primary font-bold">{{ msg.user }}</span>
                <span class="text-[10px] text-neutral-400">{{ msg.time }}</span>
              </div>
              <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">{{ msg.text }}</p>
            </div>
          </div>

          <template #footer>
            <form class="flex items-center gap-2" @submit.prevent="sendChatMessage">
              <UInput
                v-model="chatInput"
                placeholder="Kirim chant atau pesan..."
                size="sm"
                class="flex-1"
              />
              <UButton
                type="submit"
                color="primary"
                size="sm"
                icon="i-lucide-send"
              />
            </form>
          </template>
        </UCard>

        <!-- Setlist Tracklist Progress -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2 font-bold text-sm">
              <UIcon name="i-lucide-list-music" class="w-4 h-4 text-primary" />
              <span>Daftar Lagu Setlist</span>
            </div>
          </template>

          <div class="space-y-2 text-xs">
            <div
              v-for="track in activeShow.setlistTracks"
              :key="track.no"
              :class="[
                'flex items-center justify-between p-2 rounded-lg transition-colors',
                track.playing ? 'bg-primary/10 text-primary font-bold border border-primary/30' : 'text-neutral-600 dark:text-neutral-400'
              ]"
            >
              <div class="flex items-center gap-2">
                <span class="font-mono text-[11px] opacity-70">{{ track.no }}</span>
                <span>{{ track.title }}</span>
              </div>
              <span v-if="track.playing" class="text-[10px] uppercase font-bold bg-primary text-white px-1.5 py-0.5 rounded">
                Playing
              </span>
              <UIcon v-else-if="track.done" name="i-lucide-check" class="w-3.5 h-3.5 text-neutral-400" />
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Upcoming Streams Section -->
    <div class="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
      <h3 class="font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
        <UIcon name="i-lucide-calendar-clock" class="w-5 h-5 text-primary" />
        Siaran Live Stream Berikutnya
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="item in upcomingStreams"
          :key="item.id"
          class="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4"
        >
          <div>
            <span class="text-xs text-primary font-bold uppercase">{{ item.status }}</span>
            <h4 class="font-bold text-base text-neutral-900 dark:text-white mt-0.5">{{ item.title }}</h4>
            <div class="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              <span>{{ item.date }} &bull; {{ item.time }}</span>
              <span>{{ item.platform }}</span>
            </div>
          </div>

          <UButton
            color="primary"
            variant="outline"
            size="sm"
            icon="i-lucide-bell"
            label="Ingatkan Saya"
          />
        </div>
      </div>
    </div>
  </div>
</template>
