<script setup lang="ts">
import HlsPlayer from '~/components/HlsPlayer.vue'

const config = useRuntimeConfig()
const streamUrl = computed(() => (config.public.streamUrl as string) || '')

const chatInput = ref('')
const liveChatMessages = ref([
  { id: 1, user: 'Rian_OshiFreya', time: '19:24', text: 'Freya center Faint auranya gokil banget malam ini! 🔥' },
  { id: 2, user: 'WotaJakarta', time: '19:25', text: 'Koreografi unit song-nya makin sinkron dan rapi!' },
  { id: 3, user: 'ChristyFansID', time: '19:26', text: 'Hai! Hai! Semangat semuanya member JKT48! ❤️' },
  { id: 4, user: 'TeaterLover', time: '19:27', text: 'Kualitas video 1080p-nya jernih banget, audionya juga bening.' }
])

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
  ]
}

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
        <!-- Live Player Component -->
        <HlsPlayer :src="streamUrl" />

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

      <!-- Live Chat Column -->
      <div class="flex flex-col">
        <!-- Live Chat Card -->
        <UCard class="flex flex-col h-[520px] lg:h-full">
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
      </div>
    </div>
  </div>
</template>
