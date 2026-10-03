<script setup lang="ts">
const { appName } = useAppName()

useHead({
  title: `Kebijakan Privasi (Privacy Policy) - ${appName.value}`,
  meta: [
    {
      name: 'description',
      content: `Kebijakan privasi portal komunitas ${appName.value}. Pelajari bagaimana kami melindungi data akun, privasi pengguna, dan keamanan transaksi Anda.`
    }
  ]
})

const lastUpdated = '3 Oktober 2026'

const privacySections = [
  {
    id: 'pendahuluan',
    icon: 'i-lucide-info',
    title: '1. Pendahuluan & Lingkup Komunitas',
    content: `Selamat datang di portal komunitas ${appName.value}. Kami menghargai dan memprioritaskan privasi Anda sebagai sesama penggemar panggung teater idol. Dokumen Kebijakan Privasi ini menjelaskan jenis data pribadi apa saja yang kami kumpulkan saat Anda mengakses situs, bagaimana data tersebut disimpan dan digunakan, serta hak-hak privasi yang Anda miliki. Harap diperhatikan bahwa situs ini merupakan proyek independen komunitas penggemar dan bukan bagian resmi dari manajemen teater atau grup idol manapun.`
  },
  {
    id: 'data-dikumpulkan',
    icon: 'i-lucide-database',
    title: '2. Informasi yang Kami Kumpulkan',
    content: `Kami hanya mengumpulkan data yang esensial demi kelancaran pengalaman berselancar dan berinteraksi di portal:`,
    bullets: [
      'Data Akun & Autentikasi: Saat Anda mendaftar atau masuk, kami menyimpan nama tampilan (display name), alamat email, dan identifikasi pengguna unik yang dikelola melalui layanan backend aman Appwrite Cloud.',
      'Data Preferensi & Avatar: Foto profil atau tautan avatar, preferensi tema tampilan (Gelap/Terang), serta status masa aktif Member Premium yang tersimpan di preferensi akun pengguna.',
      'Aktivitas Live Chat: Pesan obrolan yang Anda kirimkan pada fitur Live Chat Teater secara publik ditampilkan beserta nama pengguna Anda demi kebutuhan interaksi komunitas saat pertunjukan berlangsung.',
      'Data Transaksi Pembayaran: Riwayat nomor pesanan (order ID), nominal transaksi, metode pembayaran yang dipilih (QRIS/E-Wallet), serta status pembayaran yang diteruskan dari payment gateway resmi Sumopod Pay.'
    ]
  },
  {
    id: 'penggunaan-data',
    icon: 'i-lucide-cpu',
    title: '3. Bagaimana Kami Menggunakan Informasi Anda',
    content: `Informasi yang dikumpulkan digunakan semata-mata untuk kebutuhan operasional situs, antara lain:`,
    bullets: [
      'Menyediakan dan memvalidasi akses siaran langsung (Live Stream) dan arsip rekaman pertunjukan (Replay).',
      'Mengautentikasi sesi masuk akun Anda dan mencegah akses tidak sah.',
      'Mengaktifkan durasi paket Member Premium secara otomatis setelah transaksi diverifikasi melalui webhook pembayaran.',
      'Menjaga ketertiban, keamanan, dan moderasi pesan di fitur Live Chat Komunitas dari tindakan spam atau pelecehan.',
      'Menyimpan preferensi personal Anda agar pengalaman menonton tetap nyaman di semua perangkat.'
    ]
  },
  {
    id: 'keamanan-data',
    icon: 'i-lucide-shield-check',
    title: '4. Keamanan & Penyimpanan Informasi',
    content: `Kami menerapkan prinsip keamanan industri dalam memproses data:`,
    bullets: [
      'Enkripsi Sandi & Data Akun: Seluruh kata sandi di-hash dan dienkripsi secara aman oleh Appwrite Cloud. Kami tidak pernah melihat maupun menyimpan kata sandi Anda dalam bentuk teks terbuka (plain text).',
      'Kerahasiaan Transaksi Finansial: Portal kami tidak pernah meminta atau menyimpan nomor kartu kredit, PIN, atau data perbankan sensitif Anda. Seluruh proses pembayaran diselesaikan langsung di halaman antarmuka pembayaran berlisensi (Sumopod Pay).',
      'Koneksi Aman SSL/TLS: Setiap komunikasi antara perangkat Anda dan server situs dilindungi enkripsi standar HTTPS untuk mencegah intersepsi pihak ketiga.'
    ]
  },
  {
    id: 'cookie-storage',
    icon: 'i-lucide-cookie',
    title: '5. Penggunaan Cookie & Penyimpanan Lokal',
    content: `Portal ini memanfaatkan cookie sesi dan LocalStorage pada peramban (browser) Anda untuk tujuan fungsional:`,
    bullets: [
      'Menyimpan status sesi masuk (session authentication) agar Anda tidak perlu masuk ulang setiap membuka halaman baru.',
      'Menyimpan preferensi tema tampilan (Dark Mode / Light Mode).',
      'Menyimpan cache data jadwal pertunjukan lokal untuk mempercepat waktu pemuatan halaman.'
    ]
  },
  {
    id: 'pihak-ketiga',
    icon: 'i-lucide-external-link',
    title: '6. Layanan Pihak Ketiga',
    content: `Dalam menyediakan fitur-fitur portal, kami bekerja sama dengan penyedia infrastruktur terpercaya:`,
    bullets: [
      'Appwrite Cloud: Digunakan sebagai penyedia otentikasi akun, database informasi pertunjukan, dan realtime live chat.',
      'Sumopod Pay: Digunakan sebagai gateway pembayaran terintegrasi untuk aktivasi paket langganan pendukung komunitas.',
      'CDN & Media Streaming: Konten siaran video panggung disalurkan melalui jaringan distribusi konten (CDN) berkecepatan tinggi.'
    ]
  },
  {
    id: 'hak-pengguna',
    icon: 'i-lucide-user-check',
    title: '7. Hak dan Kendali Pengguna',
    content: `Sebagai pemilik akun di ${appName.value}, Anda memiliki hak penuh untuk:`,
    bullets: [
      'Melihat dan memperbarui informasi profil akun Anda kapan saja melalui menu Profil Pengguna (/profile).',
      'Mengubah kata sandi secara berkala demi keamanan akun.',
      'Mengajukan permintaan penonaktifan atau penghapusan permanen akun beserta riwayat obrolan Anda dengan menghubungi pengelola komunitas.'
    ]
  },
  {
    id: 'kontak-perubahan',
    icon: 'i-lucide-mail',
    title: '8. Pembaruan Kebijakan & Kontak Pengelola',
    content: `Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu seiring penambahan fitur baru pada portal. Setiap perubahan penting akan dicantumkan tanggal pembaruannya di bagian atas halaman ini. Jika Anda memiliki pertanyaan, keluhan, atau saran seputar privasi data Anda, silakan hubungi tim pengelola komunitas melalui saluran obrolan admin atau media komunitas yang tertera.`
  }
]
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
    <!-- Header Banner -->
    <div class="rounded-3xl bg-gradient-to-br from-primary/10 via-neutral-100 to-rose-500/5 dark:from-primary/15 dark:via-neutral-900 dark:to-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-6 sm:p-10 shadow-xs relative overflow-hidden">
      <!-- Decorative Background Accent -->
      <div class="absolute -right-8 -top-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div class="relative z-10 space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge color="primary" variant="subtle" size="xs" class="font-bold uppercase tracking-wider">
            Privasi & Keamanan Data
          </UBadge>
          <UBadge color="neutral" variant="outline" size="xs" class="font-mono">
            Pembaruan Terakhir: {{ lastUpdated }}
          </UBadge>
        </div>

        <div class="space-y-2">
          <h1 class="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
            <UIcon name="i-lucide-shield-check" class="w-9 h-9 text-primary flex-shrink-0" />
            <span>Kebijakan Privasi</span>
          </h1>
          <p class="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-3xl">
            Transparansi mengenai bagaimana portal komunitas <strong>{{ appName }}</strong> menghormati, mengumpulkan, dan melindungi privasi serta data pribadi Anda saat menggunakan layanan kami.
          </p>
        </div>

        <!-- Quick navigation chips -->
        <div class="pt-2 flex flex-wrap items-center gap-2 text-xs">
          <UButton
            to="/terms"
            color="neutral"
            variant="outline"
            size="xs"
            icon="i-lucide-file-text"
            label="Ketentuan Layanan"
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
        v-for="section in privacySections"
        :key="section.id"
        :id="section.id"
        class="border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-primary/30 transition-all rounded-2xl"
        :ui="{
          header: 'p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-850/50',
          body: 'p-4 sm:p-6 space-y-4'
        }"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
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
            <UIcon name="i-lucide-check-circle-2" class="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>{{ bullet }}</span>
          </li>
        </ul>
      </UCard>
    </div>

    <!-- Bottom Action Footer Card -->
    <div class="p-6 rounded-2xl bg-neutral-100/80 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="space-y-1 text-center sm:text-left">
        <h3 class="font-bold text-sm text-neutral-900 dark:text-white">
          Ada Pertanyaan Seputar Privasi Data?
        </h3>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">
          Tim pengelola komunitas siap membantu klarifikasi atau permohonan terkait data akun Anda.
        </p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <UButton
          to="/profile"
          color="primary"
          variant="solid"
          size="sm"
          icon="i-lucide-user"
          label="Kelola Profil Saya"
          class="font-bold rounded-xl"
        />
        <UButton
          to="/terms"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-file-text"
          label="Ketentuan Layanan"
          class="font-bold rounded-xl"
        />
      </div>
    </div>
  </div>
</template>
