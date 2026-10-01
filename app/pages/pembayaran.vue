<script setup lang="ts">
const { appName } = useAppName()
const { user, isPremium, premiumUntil, checkSession, isLoading, isInitialized } = useAppwriteAuth()

useHead({
  title: `Pembayaran & Member Premium - ${appName.value}`
})

export interface PremiumTransaction {
  id: string
  date: string
  planId: string
  planName: string
  durationDays: number
  amount: number
  method: string
  status: 'completed' | 'pending' | 'failed'
  expiredAt: string
}

// ==========================================
// 1. STATE MEMBER (PREMIUM / REGULAR DARI APPWRITE AUTH)
// ==========================================
const isRefreshing = ref(false)

// Muat sesi terbaru dari Appwrite saat halaman dibuka
onMounted(async () => {
  if (import.meta.client) {
    try {
      await checkSession()
    } catch {}
  }
})

// Fungsi refresh manual status user dari Appwrite
const refreshUserStatus = async () => {
  isRefreshing.value = true
  try {
    await checkSession()
  } finally {
    isRefreshing.value = false
  }
}

// Cek apakah premium masih aktif secara waktu berdasarkan user.prefs.premium dari Appwrite Auth
const isPremiumActive = computed(() => {
  return isPremium.value
})

// Waktu kedaluwarsa premium yang aktif
const activePremiumUntil = computed(() => {
  return premiumUntil.value
})

// Format tanggal Indonesia
const formatIndoDateTime = (dateStr?: string | null) => {
  if (!dateStr) return '-'
  if (dateStr.toLowerCase().includes('permanen') || dateStr.toLowerCase().includes('lifetime')) {
    return 'Permanen / Akses Seumur Hidup'
  }
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

// Perhitungan sisa hari premium
const remainingDaysText = computed(() => {
  if (!activePremiumUntil.value || !isPremiumActive.value) return ''
  if (activePremiumUntil.value.toLowerCase().includes('permanen') || activePremiumUntil.value.toLowerCase().includes('lifetime')) {
    return 'Seumur Hidup'
  }
  const expTime = new Date(activePremiumUntil.value).getTime()
  if (isNaN(expTime)) return ''
  const diffMs = expTime - Date.now()
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Berakhir hari ini'
  return `${days} Hari Lagi`
})

// Nama & email pengguna
const userDisplayName = computed(() => {
  return user.value?.name || user.value?.email?.split('@')[0] || 'Tamu / Pengunjung'
})

const userEmail = computed(() => {
  return user.value?.email || 'Belum masuk akun'
})

// ==========================================
// 2. RIWAYAT TRANSAKSI PEMBELIAN PREMIUM
// ==========================================
const transactions = ref<PremiumTransaction[]>([
  {
    id: 'INV-PREM-202609-8812',
    date: '25 Sep 2026, 14:32 WIB',
    planId: 'plan_1m',
    planName: 'Langganan Member Premium - 1 Bulan (30 Hari)',
    durationDays: 30,
    amount: 35000,
    method: 'QRIS GoPay',
    status: 'completed',
    expiredAt: '25 Okt 2026'
  },
  {
    id: 'INV-PREM-202608-4109',
    date: '25 Agu 2026, 19:15 WIB',
    planId: 'plan_1m',
    planName: 'Langganan Member Premium - 1 Bulan (30 Hari)',
    durationDays: 30,
    amount: 35000,
    method: 'BCA Virtual Account',
    status: 'completed',
    expiredAt: '24 Sep 2026'
  }
])

// Load transactions from localStorage
onMounted(() => {
  if (import.meta.client) {
    try {
      const savedTrx = localStorage.getItem('user_premium_transactions')
      if (savedTrx) {
        const parsed = JSON.parse(savedTrx)
        if (Array.isArray(parsed) && parsed.length > 0) {
          transactions.value = parsed
        }
      }
    } catch {}
  }
})

// Format Rupiah
const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
          <UIcon name="i-lucide-crown" class="w-8 h-8 text-primary" />
          Pembayaran & Status Member
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Informasi status keanggotaan akun Anda, masa aktif premium, dan riwayat transaksi.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UBadge color="primary" variant="subtle" size="md" class="px-3 py-1 font-semibold flex items-center gap-1.5">
          <UIcon name="i-lucide-shield-check" class="w-4 h-4 text-primary" />
          Status Akun Terverifikasi
        </UBadge>
      </div>
    </div>

    <!-- ==================================================== -->
    <!-- 1. CARD STATUS MEMBER & PREMIUM HINGGA (TOP CARD)    -->
    <!-- ==================================================== -->
    <section
      class="rounded-3xl border transition-all p-6 sm:p-8 shadow-sm relative overflow-hidden"
      :class="isPremiumActive
        ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white dark:to-neutral-900 shadow-amber-500/5'
        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'"
    >
      <!-- Background Ambient Glow saat Premium -->
      <div v-if="isPremiumActive" class="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <!-- User Info & Membership Status -->
        <div class="flex items-start sm:items-center gap-4 sm:gap-6">
          <!-- Avatar Icon with Crown -->
          <div class="relative flex-shrink-0">
            <div
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center font-black text-2xl transition-all shadow-md"
              :class="isPremiumActive
                ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white shadow-amber-500/30'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500'"
            >
              <UIcon :name="isPremiumActive ? 'i-lucide-crown' : 'i-lucide-user'" class="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div
              v-if="isPremiumActive"
              class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-neutral-950 text-xs shadow-sm"
              title="Member Premium Aktif"
            >
              <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5" />
            </div>
          </div>

          <!-- Membership Details -->
          <div class="space-y-1.5 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Badge Member Premium / Member Biasa -->
              <UBadge
                :color="isPremiumActive ? 'warning' : 'neutral'"
                :variant="isPremiumActive ? 'solid' : 'subtle'"
                size="sm"
                class="font-extrabold uppercase tracking-wider flex items-center gap-1.5 px-3 py-1 rounded-xl"
              >
                <UIcon :name="isPremiumActive ? 'i-lucide-crown' : 'i-lucide-shield'" class="w-3.5 h-3.5" />
                <span>{{ isPremiumActive ? 'MEMBER PREMIUM' : 'MEMBER BIASA' }}</span>
              </UBadge>

              <span
                v-if="isPremiumActive"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Aktif
              </span>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                {{ userDisplayName }}
              </h2>
              <span class="text-xs text-neutral-400 font-mono">({{ userEmail }})</span>
            </div>

            <!-- Jika Pengguna Belum Login -->
            <div v-if="!user" class="space-y-2 pt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              <p class="leading-relaxed">
                Anda belum masuk ke akun. Silakan <strong class="text-neutral-700 dark:text-neutral-200">Masuk Akun</strong> terlebih dahulu agar status Member Premium akun Anda terdeteksi.
              </p>
              <div>
                <UButton
                  to="/login"
                  color="primary"
                  variant="solid"
                  size="xs"
                  icon="i-lucide-log-in"
                  class="font-bold px-3 py-1.5 rounded-xl"
                >
                  Masuk ke Akun
                </UButton>
              </div>
            </div>

            <!-- Jika Member Premium: Tampilkan Tanggal Premium Hingga -->
            <div v-else-if="isPremiumActive" class="space-y-1.5 pt-0.5">
              <div class="flex items-center gap-2 flex-wrap text-xs sm:text-sm text-neutral-700 dark:text-neutral-200">
                <span class="text-neutral-500 dark:text-neutral-400 font-medium">Premium Hingga:</span>
                <span class="font-extrabold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <UIcon name="i-lucide-calendar-check" class="w-4 h-4 text-amber-500" />
                  {{ formatIndoDateTime(activePremiumUntil) }}
                </span>
                <span class="text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                  {{ remainingDaysText }}
                </span>
              </div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Anda memiliki akses penuh untuk menyaksikan Live Stream panggung teater dan seluruh katalog video arsip replay.
              </p>
            </div>

            <!-- Jika Member Biasa: Keterangan Status Free -->
            <div v-else class="space-y-1.5 pt-0.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              <p>
                Status saat ini: <strong class="text-neutral-700 dark:text-neutral-300">Member Biasa (Akses Terbatas)</strong>.
              </p>
              <p class="text-xs leading-relaxed max-w-xl">
                Akun Anda saat ini belum memiliki paket aktif Member Premium untuk membuka akses siaran langsung panggung dan katalog arsip rekaman.
              </p>
            </div>
          </div>
        </div>

        <!-- Status Akses & Tombol Refresh di Kanan -->
        <div class="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-center gap-2.5 flex-shrink-0 pt-2 md:pt-0">
          <div
            class="px-3.5 py-2 rounded-2xl border text-xs flex items-center gap-2"
            :class="isPremiumActive
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'
              : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500'"
          >
            <UIcon :name="isPremiumActive ? 'i-lucide-check-circle-2' : 'i-lucide-info'" class="w-4 h-4 text-amber-500" />
            <span class="font-bold">{{ isPremiumActive ? 'Akses Premium Aktif' : 'Akses Member Terbatas' }}</span>
          </div>

          <button
            v-if="user"
            type="button"
            :disabled="isRefreshing"
            class="text-[11px] text-neutral-400 hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Muat ulang preferensi terbaru dari Appwrite Auth"
            @click="refreshUserStatus"
          >
            <UIcon name="i-lucide-refresh-cw" class="w-3 h-3" :class="{ 'animate-spin': isRefreshing }" />
            <span>{{ isRefreshing ? 'Menyegarkan...' : 'Segarkan Status' }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ==================================================== -->
    <!-- 2. CARD RIWAYAT TRANSAKSI PEMBELIAN PREMIUM (BOTTOM) -->
    <!-- ==================================================== -->
    <section class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-xs space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div>
          <h2 class="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
            <UIcon name="i-lucide-receipt" class="w-5 h-5 text-primary" />
            Riwayat Transaksi Pembelian Premium
          </h2>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Daftar riwayat transaksi langganan dan perpanjangan member premium pada akun Anda.
          </p>
        </div>
        <UBadge color="neutral" variant="subtle" size="sm" class="font-bold">
          Total {{ transactions.length }} Transaksi
        </UBadge>
      </div>

      <!-- Transactions List -->
      <div v-if="transactions.length > 0" class="divide-y divide-neutral-100 dark:divide-neutral-800/80">
        <div
          v-for="trx in transactions"
          :key="trx.id"
          class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 px-3 rounded-2xl transition-colors"
        >
          <div class="flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
              <UIcon name="i-lucide-crown" class="w-5 h-5" />
            </div>
            <div class="space-y-1">
              <div class="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2 flex-wrap">
                <span>{{ trx.planName }}</span>
                <span class="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                  +{{ trx.durationDays }} Hari Aktif
                </span>
              </div>
              <div class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
                <span class="font-mono text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">{{ trx.id }}</span>
                <span>&bull;</span>
                <span>{{ trx.date }}</span>
                <span>&bull;</span>
                <span class="text-neutral-600 dark:text-neutral-300 font-medium">{{ trx.method }}</span>
                <span>&bull;</span>
                <span class="text-neutral-500 dark:text-neutral-400 text-[11px]">
                  Masa Berlaku: <strong class="text-neutral-700 dark:text-neutral-200">{{ trx.expiredAt }}</strong>
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-4 pl-13 sm:pl-0">
            <div class="text-right">
              <div class="font-black text-sm sm:text-base text-neutral-900 dark:text-white">
                {{ formatRupiah(trx.amount) }}
              </div>
              <UBadge
                color="success"
                variant="subtle"
                size="xs"
                class="mt-1 font-bold"
              >
                Lunas / Berhasil
              </UBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State jika belum ada transaksi -->
      <div v-else class="py-12 text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
          <UIcon name="i-lucide-receipt" class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Belum Ada Riwayat Transaksi</p>
        <p class="text-xs text-neutral-400">Transaksi pembelian paket premium Anda akan otomatis tercatat di sini.</p>
      </div>
    </section>
  </div>
</template>
