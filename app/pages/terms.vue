<script setup lang="ts">
const { appName } = useAppName()

useHead({
  title: `Ketentuan Layanan (Terms of Service) - ${appName.value}`,
  meta: [
    {
      name: 'description',
      content: `Syarat dan ketentuan layanan penggunaan portal komunitas penggemar ${appName.value}. Tata tertib live stream, arsip replay, etika live chat, dan transaksi membership.`
    }
  ]
})

const lastUpdated = '3 Oktober 2026'

const termsSections = [
  {
    id: 'penerimaan',
    icon: 'i-lucide-check-square',
    title: '1. Penerimaan Ketentuan Penggunaan',
    content: `Dengan mengakses, mendaftar akun, maupun menikmati fitur di portal ${appName.value}, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh isi Ketentuan Layanan ini. Jika Anda tidak menyetujui sebagian atau seluruh ketentuan ini, mohon untuk tidak melanjutkan penggunaan portal.`
  },
  {
    id: 'disclaimer-hak-cipta',
    icon: 'i-lucide-alert-triangle',
    title: '2. Penafian Hak Cipta & Proyek Non-Resmi',
    content: `${appName.value} merupakan portal independen yang dikembangkan oleh dan untuk komunitas penggemar panggung teater idol:`,
    bullets: [
      'Bukan Entitas Resmi: Portal ini BUKAN website resmi, bukan representasi, dan tidak terafiliasi secara resmi dengan manajemen teater, agensi grup idol, maupun pemegang lisensi resmi manapun.',
      'Hak Cipta Konten & Musik: Seluruh hak kekayaan intelektual (HAKI) atas nama artis, member, lagu, musik, lirik, kostum, koreografi, dan nama setlist pertunjukan sepenuhnya merupakan hak milik pemegang hak cipta resmi yang bersangkutan.',
      'Tujuan Hiburan Komunitas: Seluruh konten dan siaran disediakan semata-mata untuk tujuan dokumentasi komunitas, hiburan, dan sarana apresiasi karya bagi sesama penggemar.'
    ]
  },
  {
    id: 'akun-keamanan',
    icon: 'i-lucide-user-shield',
    title: '3. Akun Pengguna & Kewajiban Keamanan',
    content: `Saat membuat akun di portal ini, Anda bertanggung jawab penuh atas:`,
    bullets: [
      'Menjaga kerahasiaan kata sandi dan kredensial akun pribadi Anda dari pihak lain.',
      'Memberikan alamat email yang valid dan aktif saat proses pendaftaran.',
      'Dilarang keras menyebarluaskan akun secara publik, menjualbelikan akun, atau mencoba meretas / mengeksploitasi sistem keamanan portal.',
      'Pengelola berhak membekukan atau menghapus akun yang terindikasi melakukan penyalahgunaan atau pelanggaran keamanan.'
    ]
  },
  {
    id: 'layanan-stream-replay',
    icon: 'i-lucide-tv',
    title: '4. Siaran Langsung (Live Stream) & Replay',
    content: `Layanan pemutaran video panggung teater disediakan dengan ketentuan:`,
    bullets: [
      'Ketersediaan Bergantung Jadwal: Penayangan siaran langsung sepenuhnya mengikuti jadwal resmi pertunjukan panggung teater aktual yang diumumkan.',
      'Kualitas & Stabilitas Koneksi: Kecepatan dan kelancaran penayangan dapat bervariasi bergantung pada kapasitas jaringan internet pengguna dan stabilitas server siaran.',
      'Larangan Pembajakan: Pengguna dilarang merekam secara ilegal dan mengomersialkan kembali siaran yang disediakan di portal ini ke platform publik berbayar lainnya.'
    ]
  },
  {
    id: 'member-premium-transaksi',
    icon: 'i-lucide-crown',
    title: '5. Paket Member Premium & Donasi Komunitas',
    content: `Fitur Member Premium disediakan sebagai bentuk partisipasi komunitas dalam menopang biaya infrastruktur server:`,
    bullets: [
      'Bentuk Dukungan Server: Nominal transaksi paket premium dialokasikan untuk biaya pemeliharaan server, bandwidth CDN streaming, dan pengembangan portal komunitas.',
      'Aktivasi Otomatis: Masa aktif paket (7 hari, 14 hari, atau 30 hari) akan otomatis aktif di akun Anda setelah pembayaran berhasil dikonfirmasi oleh sistem payment gateway.',
      'Kebijakan Pengembalian Dana (No-Refund): Seluruh transaksi bersifat final dan tidak dapat dikembalikan (non-refundable), kecuali terjadi kesalahan teknis penagihan ganda (double charge) yang terverifikasi oleh pengelola.'
    ]
  },
  {
    id: 'etika-live-chat',
    icon: 'i-lucide-messages-square',
    title: '6. Tata Tertib & Etika Live Chat Komunitas',
    content: `Fitur Live Chat Teater dirancang sebagai ruang apresiasi bersama yang positif dan suportif. Pengguna WAJIB mematuhi aturan berikut:`,
    bullets: [
      'Sopan & Santun: Dilarang melontarkan ujaran kebencian (hate speech), kata-kata kasar, pelecehan seksual, maupun penghinaan terhadap member idol atau sesama fans.',
      'Anti-Spam & Flooding: Dilarang mengirimkan pesan berulang secara masif (spamming), huruf kapital berlebihan (capslock abuse), atau teks promosi/iklan tidak sah.',
      'Privasi Orang Lain: Dilarang menyebarkan informasi pribadi (doxxing) milik siapa pun.',
      'Moderasi & Tindakan Sanksi: Admin dan moderator berhak menghapus pesan, mengaktifkan slow mode, membisukan sementara (mute), atau memblokir permanen pengguna yang melanggar tata tertib.'
    ]
  },
  {
    id: 'batasan-tanggung-jawab',
    icon: 'i-lucide-shield-alert',
    title: '7. Pembatasan Tanggung Jawab',
    content: `Layanan di portal ini disediakan dengan prinsip "sebagaimana adanya" (as-is) dan "sebagaimana tersedia" (as-available):`,
    bullets: [
      'Pengelola tidak bertanggung jawab atas gangguan teknis di luar kendali wajar kami, seperti pemadaman penyedia internet (ISP), gangguan penyedia cloud eksternal, atau pembatalan show mendadak oleh manajemen teater.',
      'Pengelola berhak melakukan pemeliharaan server (maintenance) terjadwal maupun darurat sewaktu-waktu demi stabilitas portal.'
    ]
  },
  {
    id: 'perubahan-syarat',
    icon: 'i-lucide-refresh-cw',
    title: '8. Perubahan Ketentuan Layanan',
    content: `Pengelola portal dapat merevisi Ketentuan Layanan ini sewaktu-waktu. Penggunaan berkelanjutan atas portal setelah perubahan diumumkan mengindikasikan persetujuan Anda terhadap ketentuan yang diperbarui.`
  }
]
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
    <!-- Header Banner -->
    <div class="rounded-3xl bg-gradient-to-br from-amber-500/10 via-neutral-100 to-primary/10 dark:from-amber-500/15 dark:via-neutral-900 dark:to-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-6 sm:p-10 shadow-xs relative overflow-hidden">
      <!-- Decorative Background Accent -->
      <div class="absolute -right-8 -top-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div class="relative z-10 space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge color="warning" variant="subtle" size="xs" class="font-bold uppercase tracking-wider">
            Aturan & Syarat Penggunaan
          </UBadge>
          <UBadge color="neutral" variant="outline" size="xs" class="font-mono">
            Pembaruan Terakhir: {{ lastUpdated }}
          </UBadge>
        </div>

        <div class="space-y-2">
          <h1 class="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
            <UIcon name="i-lucide-file-text" class="w-9 h-9 text-amber-500 flex-shrink-0" />
            <span>Ketentuan Layanan</span>
          </h1>
          <p class="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-3xl">
            Panduan aturan, tata tertib komunitas, dan batasan tanggung jawab dalam menggunakan portal panggung teater <strong>{{ appName }}</strong>.
          </p>
        </div>

        <!-- Quick navigation chips -->
        <div class="pt-2 flex flex-wrap items-center gap-2 text-xs">
          <UButton
            to="/privacy"
            color="neutral"
            variant="outline"
            size="xs"
            icon="i-lucide-shield-check"
            label="Kebijakan Privasi"
            class="font-semibold rounded-lg"
          />
          <UButton
            to="/"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-arrow-left"
            label="Kembali ke Beranda"
            class="font-semibold rounded-lg"
          />
        </div>
      </div>
    </div>

    <!-- Main Content Cards -->
    <div class="space-y-6">
      <UCard
        v-for="section in termsSections"
        :key="section.id"
        :id="section.id"
        class="border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-amber-500/30 transition-all rounded-2xl"
        :ui="{
          header: 'p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-850/50',
          body: 'p-4 sm:p-6 space-y-4'
        }"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
              <UIcon :name="section.icon" class="w-4 h-4" />
            </div>
            <h2 class="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
              {{ section.title }}
            </h2>
          </div>
        </template>

        <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {{ section.content }}
        </p>

        <ul v-if="section.bullets" class="space-y-2.5 pt-1 pl-1">
          <li
            v-for="(bullet, bIdx) in section.bullets"
            :key="bIdx"
            class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 flex items-start gap-2.5 leading-relaxed"
          >
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>{{ bullet }}</span>
          </li>
        </ul>
      </UCard>
    </div>

    <!-- Bottom Action Footer Card -->
    <div class="p-6 rounded-2xl bg-neutral-100/80 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="space-y-1 text-center sm:text-left">
        <h3 class="font-bold text-sm text-neutral-900 dark:text-white">
          Persetujuan Ketentuan Layanan
        </h3>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">
          Dengan menikmati pertunjukan dan berinteraksi di portal, Anda bersama komunitas mewujudkan lingkungan yang positif dan suportif.
        </p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <UButton
          to="/privacy"
          color="primary"
          variant="solid"
          size="sm"
          icon="i-lucide-shield-check"
          label="Kebijakan Privasi"
          class="font-bold rounded-xl"
        />
        <UButton
          to="/"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-home"
          label="Ke Beranda"
          class="font-bold rounded-xl"
        />
      </div>
    </div>
  </div>
</template>
