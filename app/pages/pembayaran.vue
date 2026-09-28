<script setup lang="ts">
interface Transaction {
  id: string
  date: string
  title: string
  category: string
  amount: number
  method: string
  status: 'completed' | 'pending' | 'failed'
}

const selectedCategory = ref('project_fans')
const customAmount = ref<number | ''>(50000)
const selectedMethod = ref('qris')
const senderName = ref('Fajri')
const fanNote = ref('Semoga project seitansai Freya tahun ini sukses besar!')
const isSubmitting = ref(false)
const showSuccessModal = ref(false)
const currentInvoice = ref('')

const quickAmounts = [25000, 50000, 100000, 250000, 500000]

const categories = [
  { id: 'project_fans', name: 'Project Seitansai Oshi', desc: 'Bunga, LED board, & perayaan ulang tahun member' },
  { id: 'nobar', name: 'Gathering & Nobar Teater', desc: 'Sewa venue & sound system kumpul komunitas wota' },
  { id: 'merch', name: 'Merchandise Fanbase', desc: 'T-Shirt, lanyards, photocard unofficial fanbase' },
  { id: 'operasional', name: 'Donasi Server Fansite', desc: 'Bantu biaya cloud server streaming & arsip replay' }
]

const paymentMethods = [
  {
    id: 'qris',
    name: 'QRIS (Semua E-Wallet & M-Banking)',
    desc: 'BCA, Mandiri, GoPay, OVO, DANA, ShopeePay',
    icon: 'i-lucide-qr-code',
    tag: 'Instan & Otomatis',
    badgeColor: 'primary' as const
  },
  {
    id: 'va_bca',
    name: 'BCA Virtual Account',
    desc: 'Verifikasi instan tanpa bukti transfer manual',
    icon: 'i-lucide-building-2',
    tag: '24 Jam Aktif',
    badgeColor: 'neutral' as const
  },
  {
    id: 'va_mandiri',
    name: 'Mandiri Virtual Account',
    desc: 'Bayar via Livin by Mandiri atau ATM',
    icon: 'i-lucide-credit-card',
    tag: 'Otomatis',
    badgeColor: 'neutral' as const
  },
  {
    id: 'ewallet_gopay',
    name: 'GoPay / GoPay Later',
    desc: 'Langsung hubungkan akun aplikasi Gojek',
    icon: 'i-lucide-smartphone',
    tag: 'Populer',
    badgeColor: 'neutral' as const
  }
]

const transactions = ref<Transaction[]>([
  {
    id: 'INV-202609-0091',
    date: '25 Sep 2026, 14:32',
    title: 'Project Seitansai Freya - Bunga & Handbanner',
    category: 'Project Seitansai',
    amount: 100000,
    method: 'QRIS GoPay',
    status: 'completed'
  },
  {
    id: 'INV-202609-0042',
    date: '18 Sep 2026, 19:15',
    title: 'Donasi Sewa Server Replay Fansite',
    category: 'Donasi Fansite',
    amount: 50000,
    method: 'BCA Virtual Account',
    status: 'completed'
  },
  {
    id: 'INV-202608-0112',
    date: '12 Agu 2026, 10:20',
    title: 'Fan Gathering Nobar Senshuraku Ramune',
    category: 'Gathering Nobar',
    amount: 75000,
    method: 'QRIS DANA',
    status: 'completed'
  }
])

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val)
}

const handlePaymentSubmit = () => {
  if (!customAmount.value || customAmount.value <= 0) return

  isSubmitting.value = true
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  currentInvoice.value = `INV-202609-${randomNum}`

  setTimeout(() => {
    isSubmitting.value = false
    showSuccessModal.value = true

    const categoryObj = categories.find(c => c.id === selectedCategory.value)
    const methodObj = paymentMethods.find(m => m.id === selectedMethod.value)

    transactions.value.unshift({
      id: currentInvoice.value,
      date: 'Baru saja',
      title: categoryObj?.name || 'Dukungan Komunitas Fans',
      category: categoryObj?.name || 'Komunitas',
      amount: Number(customAmount.value),
      method: methodObj?.name.split(' (')[0] || 'QRIS',
      status: 'completed'
    })
  }, 1200)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
      <div>
        <div class="inline-flex items-center gap-2 text-xs font-bold text-primary tracking-wide uppercase">
          <UIcon name="i-lucide-credit-card" class="w-3.5 h-3.5" />
          Menu Lainnya &bull; Layanan Fansite
        </div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight mt-1 flex items-center gap-3">
          <UIcon name="i-lucide-wallet" class="w-8 h-8 text-primary" />
          Pembayaran & Transaksi Fans
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Pusat pembayaran donasi proyek komunitas fans, patungan seitansai oshi, dan operasional portal fansite.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UBadge color="primary" variant="subtle" size="md" class="px-3 py-1 font-semibold flex items-center gap-1.5">
          <UIcon name="i-lucide-shield-check" class="w-4 h-4 text-primary" />
          Verifikasi Otomatis 24 Jam
        </UBadge>
      </div>
    </div>

    <!-- Unofficial Notice Banner -->
    <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-start gap-3">
      <UIcon name="i-lucide-info" class="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
      <div>
        <span class="font-bold">Pemberitahuan Penting:</span> Halaman pembayaran ini dikelola secara independen oleh komunitas fans untuk proyek dukungan penggemar (seitansai, gathering, dan pemeliharaan web fansite). Portal ini <u>tidak menjual tiket teater resmi JKT48</u>.
      </div>
    </div>

    <!-- Main Payment Grid: Form & Methods -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Column: Payment Form (2 cols on lg) -->
      <div class="lg:col-span-2 space-y-6">
        <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-xs space-y-6">
          <h2 class="text-lg font-bold flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-primary" />
            Formulir Donasi & Pembayaran Fans
          </h2>

          <!-- Step 1: Select Category -->
          <div class="space-y-3">
            <label class="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
              1. Pilih Kategori Keperluan
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                v-for="cat in categories"
                :key="cat.id"
                type="button"
                :class="[
                  'text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between',
                  selectedCategory === cat.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40'
                ]"
                @click="selectedCategory = cat.id"
              >
                <div class="flex items-center justify-between w-full mb-1">
                  <span class="font-bold text-sm text-neutral-900 dark:text-white">{{ cat.name }}</span>
                  <UIcon
                    :name="selectedCategory === cat.id ? 'i-lucide-check-circle-2' : 'i-lucide-circle'"
                    :class="selectedCategory === cat.id ? 'text-primary' : 'text-neutral-300 dark:text-neutral-600'"
                    class="w-4 h-4 flex-shrink-0"
                  />
                </div>
                <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ cat.desc }}</span>
              </button>
            </div>
          </div>

          <!-- Step 2: Choose Amount -->
          <div class="space-y-3">
            <label class="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
              2. Pilih atau Masukkan Nominal (IDR)
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="amt in quickAmounts"
                :key="amt"
                type="button"
                :class="[
                  'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer',
                  customAmount === amt
                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                    : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-primary text-neutral-700 dark:text-neutral-300'
                ]"
                @click="customAmount = amt"
              >
                {{ formatRupiah(amt) }}
              </button>
            </div>

            <!-- Custom Input -->
            <div class="pt-1">
              <UInput
                v-model="customAmount"
                type="number"
                placeholder="Masukkan nominal custom..."
                icon="i-lucide-coins"
                size="md"
                class="w-full"
              />
            </div>
          </div>

          <!-- Step 3: Select Payment Method -->
          <div class="space-y-3">
            <label class="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
              3. Metode Pembayaran
            </label>
            <div class="space-y-2.5">
              <button
                v-for="meth in paymentMethods"
                :key="meth.id"
                type="button"
                :class="[
                  'w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between',
                  selectedMethod === meth.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40'
                ]"
                @click="selectedMethod = meth.id"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      selectedMethod === meth.id ? 'bg-primary text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                    ]"
                  >
                    <UIcon :name="meth.icon" class="w-5 h-5" />
                  </div>
                  <div>
                    <div class="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                      {{ meth.name }}
                      <UBadge :color="meth.badgeColor" variant="subtle" size="xs">
                        {{ meth.tag }}
                      </UBadge>
                    </div>
                    <div class="text-xs text-neutral-500 dark:text-neutral-400">
                      {{ meth.desc }}
                    </div>
                  </div>
                </div>
                <UIcon
                  :name="selectedMethod === meth.id ? 'i-lucide-check-circle-2' : 'i-lucide-circle'"
                  :class="selectedMethod === meth.id ? 'text-primary' : 'text-neutral-300 dark:text-neutral-600'"
                  class="w-5 h-5"
                />
              </button>
            </div>
          </div>

          <!-- Step 4: Sender Info & Notes -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                Nama Pengirim / Fans
              </label>
              <UInput v-model="senderName" placeholder="Contoh: Fajri (Wota Freya)" icon="i-lucide-user" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
                Pesan / Ucapan Semangat
              </label>
              <UInput v-model="fanNote" placeholder="Pesan singkat..." icon="i-lucide-message-square" />
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span class="text-xs text-neutral-500 block">Total yang akan dibayar:</span>
              <span class="text-xl font-black text-primary">{{ formatRupiah(Number(customAmount) || 0) }}</span>
            </div>

            <UButton
              color="primary"
              variant="solid"
              size="lg"
              class="px-8 py-3 rounded-2xl font-bold shadow-md shadow-primary/25"
              :loading="isSubmitting"
              :disabled="!customAmount || customAmount <= 0"
              @click="handlePaymentSubmit"
            >
              <template #leading>
                <UIcon name="i-lucide-lock" class="w-4 h-4 mr-1" />
              </template>
              Bayar Sekarang
            </UButton>
          </div>
        </div>
      </div>

      <!-- Right Column: Security, Quick Summary & Methods Guide -->
      <div class="space-y-6">
        <!-- Security & Guarantee Card -->
        <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-xs space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UIcon name="i-lucide-shield-check" class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-bold text-base text-neutral-900 dark:text-white">Transaksi Aman & Transparan</h3>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Setiap donasi dan patungan proyek fanbase tercatat secara real-time di sistem pembukuan komunitas. Laporan pengeluaran diumumkan berkala di grup fanbase.
            </p>
          </div>

          <div class="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>QRIS Standar Bank Indonesia</span>
            </div>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Verifikasi otomatis tanpa unggah struk</span>
            </div>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Tercatat otomatis di profil akun fans Anda</span>
            </div>
          </div>
        </div>

        <!-- Contact Support Card -->
        <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-xs space-y-3">
          <h3 class="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
            <UIcon name="i-lucide-help-circle" class="w-4 h-4 text-primary" />
            Butuh Bantuan Pembayaran?
          </h3>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Jika transaksi Anda mengalami kendala atau membutuhkan konfirmasi manual dari admin fanbase, hubungi kami:
          </p>
          <div class="pt-1">
            <a
              href="mailto:support@fans-theaterjkt48.id"
              class="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
            >
              <UIcon name="i-lucide-mail" class="w-4 h-4" />
              support@fans-theaterjkt48.id
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Transaction History Section -->
    <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-xs space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div>
          <h2 class="text-lg font-bold flex items-center gap-2">
            <UIcon name="i-lucide-history" class="w-5 h-5 text-primary" />
            Riwayat Transaksi & Donasi Terakhir
          </h2>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Daftar pembayaran yang telah dilakukan melalui akun fans Anda.
          </p>
        </div>
        <UBadge color="neutral" variant="subtle" size="sm">
          Total {{ transactions.length }} Transaksi
        </UBadge>
      </div>

      <!-- Transactions List -->
      <div class="divide-y divide-neutral-100 dark:divide-neutral-800/80">
        <div
          v-for="trx in transactions"
          :key="trx.id"
          class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div class="flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <UIcon name="i-lucide-receipt" class="w-5 h-5" />
            </div>
            <div>
              <div class="font-bold text-sm text-neutral-900 dark:text-white">
                {{ trx.title }}
              </div>
              <div class="flex items-center gap-2 mt-1 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
                <span class="font-mono text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">{{ trx.id }}</span>
                <span>&bull;</span>
                <span>{{ trx.date }}</span>
                <span>&bull;</span>
                <span class="text-neutral-600 dark:text-neutral-300 font-medium">{{ trx.method }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-4 pl-13 sm:pl-0">
            <div class="text-right">
              <div class="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white">
                {{ formatRupiah(trx.amount) }}
              </div>
              <UBadge
                :color="trx.status === 'completed' ? 'success' : trx.status === 'pending' ? 'warning' : 'error'"
                variant="subtle"
                size="xs"
                class="mt-1"
              >
                {{ trx.status === 'completed' ? 'Lunas / Berhasil' : trx.status === 'pending' ? 'Menunggu' : 'Gagal' }}
              </UBadge>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Modal Simulation -->
    <UModal v-model:open="showSuccessModal">
      <template #content>
        <div class="p-6 text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <UIcon name="i-lucide-check-circle-2" class="w-10 h-10" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-neutral-900 dark:text-white">Pembayaran Diterima!</h3>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Nomor Referensi: <span class="font-mono font-bold text-neutral-700 dark:text-neutral-200">{{ currentInvoice }}</span>
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 text-left text-xs space-y-2">
            <div class="flex justify-between">
              <span class="text-neutral-500">Nama Donatur / Fans:</span>
              <span class="font-bold text-neutral-900 dark:text-white">{{ senderName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">Jumlah Dibayar:</span>
              <span class="font-bold text-primary">{{ formatRupiah(Number(customAmount) || 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">Status:</span>
              <span class="font-bold text-emerald-500">Terverifikasi Otomatis</span>
            </div>
          </div>

          <p class="text-[11px] text-neutral-400">
            Terima kasih atas kontribusi Anda untuk mendukung proyek komunitas fans Theater JKT48!
          </p>

          <UButton
            color="primary"
            variant="solid"
            size="md"
            class="w-full justify-center rounded-xl font-bold mt-2"
            @click="showSuccessModal = false"
          >
            Tutup
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
