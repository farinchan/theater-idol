<script setup lang="ts">
import { account } from '~/appwrite'
const route = useRoute()
const { appName } = useAppName()
const { user, isAdmin, isPremium, premiumUntil, checkSession, isLoading, isInitialized } = useAppwriteAuth()

useSeoMeta({
  title: 'Beli Membership Premium - Theater Idol',
  ogTitle: 'Beli Membership Premium - Theater Idol',
  description: 'Langganan Member Premium Theater Idol untuk menikmati tayangan live streaming tanpa batas, akses arsip replay eksklusif, dan badge interaktif.',
  ogDescription: 'Langganan Member Premium Theater Idol untuk menikmati tayangan live streaming tanpa batas, akses arsip replay eksklusif, dan badge interaktif.',
  ogImage: '/icon.png',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Beli Membership Premium - Theater Idol',
  twitterDescription: 'Langganan Member Premium Theater Idol untuk menikmati tayangan live streaming tanpa batas, akses arsip replay eksklusif, dan badge interaktif.',
  twitterImage: '/icon.png'
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Member Premium Theater Idol',
        'description': 'Akses langganan VIP untuk nonton live streaming dan arsip replay show Theater Idol.',
        'brand': {
          '@type': 'Brand',
          'name': 'Theater Idol'
        },
        'offers': {
          '@type': 'AggregateOffer',
          'priceCurrency': 'IDR',
          'lowPrice': '12000',
          'highPrice': '99000',
          'offerCount': '4'
        }
      })
    }
  ]
})

export interface PremiumPlanOption {
  id: string
  name: string
  durationDays: number
  price: number
  priceLabel: string
  badge: string
  badgeColor: 'neutral' | 'primary' | 'warning' | 'success'
  dailyPrice: string
  description: string
  features: string[]
  isPopular?: boolean
}

export interface PremiumTransaction {
  id: string
  date: string
  planId: string
  planName: string
  durationDays: number
  amount: number
  method: string
  status: 'completed' | 'pending' | 'failed' | 'expired'
  expiredAt?: string
  paymentLinkUrl?: string
}

// ==========================================
// 1. DAFTAR PAKET LANGGANAN PREMIUM
// ==========================================
const plans: PremiumPlanOption[] = [
  {
    id: 'plan_7d',
    name: 'Member Premium 7 Hari',
    durationDays: 7,
    price: 12000,
    priceLabel: 'Rp 12.000',
    badge: 'Paket Mingguan',
    badgeColor: 'neutral',
    dailyPrice: 'Rp 1.714 / hari',
    description: 'Akses penuh streaming live & katalog video replay selama 7 hari.',
    features: ['Akses Live Streaming Teater', 'Akses Seluruh Arsip Replay', 'Masa Aktif 7 Hari Penuh']
  },
  {
    id: 'plan_14d',
    name: 'Member Premium 14 Hari',
    durationDays: 14,
    price: 20000,
    priceLabel: 'Rp 20.000',
    badge: 'Paling Populer',
    badgeColor: 'primary',
    dailyPrice: 'Rp 1.428 / hari',
    description: 'Akses 2 minggu penuh untuk semua show teater & replay.',
    features: ['Akses Live Streaming Teater', 'Akses Seluruh Arsip Replay', 'Masa Aktif 14 Hari Penuh', 'Lebih Hemat Rp 4.000'],
    isPopular: true
  },
  {
    id: 'plan_30d',
    name: 'Member Premium 30 Hari',
    durationDays: 30,
    price: 30000,
    priceLabel: 'Rp 30.000',
    badge: 'Paling Untung (Best Value)',
    badgeColor: 'warning',
    dailyPrice: 'Rp 1.000 / hari',
    description: 'Akses 1 bulan penuh tanpa batas dengan biaya super hemat!',
    features: ['Akses Live Streaming Teater', 'Akses Seluruh Arsip Replay', 'Masa Aktif 30 Hari Penuh', 'Hemat Lebih dari 40%']
  }
]

// ==========================================
// 2. STATE MEMBER & PEMBAYARAN
// ==========================================
const isRefreshing = ref(false)
const selectedPlanId = ref<string>('plan_30d')
const isPlanModalOpen = ref(false)
const isPaymentModalOpen = ref(false)
const isSuccessModalOpen = ref(false)
const isCreatingPayment = ref(false)
const isCheckingStatus = ref(false)
const isSimulating = ref(false)
const copySuccess = ref(false)
const paymentError = ref<string | null>(null)
const currentOrder = ref<any>(null)
const successExpiryDate = ref<string | null>(null)

// Selected plan object computed
const selectedPlan = computed(() => {
  return plans.find(p => p.id === selectedPlanId.value) || plans[0]
})

// Cek status aktif premium
const isPremiumActive = computed(() => {
  return isPremium.value
})

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

// Format waktu jam menit
const formatIndoTime = (dateStr?: string | null) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB'
  } catch {
    return ''
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

// User Identity
const userDisplayName = computed(() => {
  return user.value?.name || user.value?.email?.split('@')[0] || 'Tamu / Pengunjung'
})

const userEmail = computed(() => {
  return user.value?.email || 'Belum masuk akun'
})

// ==========================================
// 3. RIWAYAT TRANSAKSI DARI SERVER & LOKAL
// ==========================================
const serverOrders = ref<any[]>([])

const fetchOrders = async () => {
  if (!import.meta.client) return
  if (!user.value?.$id) {
    serverOrders.value = []
    return
  }
  try {
    const params = new URLSearchParams()
    if (user.value.$id) params.set('user_id', user.value.$id)
    if (user.value.email) params.set('user_email', user.value.email)

    const headers: Record<string, string> = {}
    try {
      const jwtRes = await account.createJWT()
      if (jwtRes?.jwt) {
        headers['X-Appwrite-JWT'] = jwtRes.jwt
      }
    } catch {}

    const res = await $fetch<any>(`/api/payment/orders?${params.toString()}`, { headers })
    if (res?.success && Array.isArray(res.orders)) {
      serverOrders.value = res.orders
    } else {
      serverOrders.value = []
    }
  } catch (err) {
    console.error('Gagal mengambil daftar pesanan:', err)
  }
}

// Pantau perubahan status akun user untuk mengambil transaksi yang sesuai
watch(() => user.value?.$id, async (newId) => {
  if (newId) {
    await fetchOrders()
  } else {
    serverOrders.value = []
  }
})

// Gabungan transaksi khusus pengguna yang sedang login
const allTransactions = computed<PremiumTransaction[]>(() => {
  if (!user.value) return []

  const currentUserId = user.value.$id
  const currentUserEmail = user.value.email?.trim().toLowerCase()

  const list: PremiumTransaction[] = []

  // Hanya masukkan data dari server orders milik user ini
  for (const o of serverOrders.value) {
    const matchId = currentUserId && o.userId && o.userId === currentUserId
    const matchEmail = currentUserEmail && o.userEmail && o.userEmail.trim().toLowerCase() === currentUserEmail
    if (o.userId || o.userEmail) {
      if (!matchId && !matchEmail) continue
    }

    const dateFormatted = `${formatIndoDateTime(o.createdAt)}${formatIndoTime(o.createdAt) ? ', ' + formatIndoTime(o.createdAt) : ''}`
    list.push({
      id: o.id,
      date: dateFormatted,
      planId: o.planId,
      planName: o.planName,
      durationDays: o.durationDays,
      amount: o.amount,
      method: o.method || 'QRIS',
      status: o.status || 'pending',
      expiredAt: o.paidAt ? formatIndoDateTime(new Date(new Date(o.paidAt).getTime() + o.durationDays * 24 * 60 * 60 * 1000).toISOString()) : undefined,
      paymentLinkUrl: o.paymentLinkUrl
    })
  }

  return list
})

// Muat sesi dan pesanan saat halaman dibuka
onMounted(async () => {
  if (import.meta.client) {
    try {
      await checkSession()
      await fetchOrders()

      // Periksa query URL jika redirect kembali dari pembayaran
      if (route.query.status === 'success' && route.query.order_id) {
        const orderId = String(route.query.order_id)
        await checkSession()
        await fetchOrders()
        const found = serverOrders.value.find(o => o.id === orderId)
        if (found) {
          currentOrder.value = found
          isSuccessModalOpen.value = true
        }
      }
    } catch {}
  }
})

// Fungsi refresh manual status user dari Appwrite
const refreshUserStatus = async () => {
  isRefreshing.value = true
  try {
    await checkSession()
    await fetchOrders()
  } finally {
    isRefreshing.value = false
  }
}

// Buka Modal Pilih Paket
const openPlanModal = () => {
  paymentError.value = null
  isPlanModalOpen.value = true
}

// Pilih paket
const selectPlan = (planId: string) => {
  selectedPlanId.value = planId
}

// Buat Tagihan Pembayaran QRIS
const handleCreatePayment = async () => {
  if (!user.value) {
    paymentError.value = 'Silakan masuk ke akun Anda terlebih dahulu.'
    return
  }

  isCreatingPayment.value = true
  paymentError.value = null

  try {
    const payload = {
      plan_id: selectedPlan.value.id,
      user_id: user.value.$id,
      user_email: user.value.email,
      user_name: user.value.name || userDisplayName.value
    }

    const headers: Record<string, string> = {}
    try {
      const jwtRes = await account.createJWT()
      if (jwtRes?.jwt) {
        headers['X-Appwrite-JWT'] = jwtRes.jwt
      }
    } catch {}

    const res = await $fetch<any>('/api/payment/create', {
      method: 'POST',
      headers,
      body: payload
    })

    if (res?.success && res.order) {
      currentOrder.value = res.order
      isPlanModalOpen.value = false
      isPaymentModalOpen.value = true
      await fetchOrders()

      // Buka otomatis tautan pembayaran di tab baru
      if (res.order.paymentLinkUrl && import.meta.client) {
        window.open(res.order.paymentLinkUrl, '_blank')
      }
    } else {
      throw new Error(res?.message || 'Gagal membuat tagihan pembayaran.')
    }
  } catch (err: any) {
    console.error('Error creating payment:', err)
    paymentError.value = err?.data?.statusMessage || err?.message || 'Gagal membuat tagihan pembayaran QRIS.'
  } finally {
    isCreatingPayment.value = false
  }
}

// Buka link pembayaran QRIS
const openPaymentLink = () => {
  if (currentOrder.value?.paymentLinkUrl && import.meta.client) {
    window.open(currentOrder.value.paymentLinkUrl, '_blank')
  }
}

// Salin link pembayaran
const copyPaymentLink = async () => {
  if (!currentOrder.value?.paymentLinkUrl || !import.meta.client) return
  try {
    await navigator.clipboard.writeText(currentOrder.value.paymentLinkUrl)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2500)
  } catch {}
}

// Cek status pembayaran ke server
const checkPaymentStatus = async () => {
  if (!currentOrder.value?.id) return
  isCheckingStatus.value = true
  try {
    const res = await $fetch<any>(`/api/payment/orders?order_id=${currentOrder.value.id}`)
    if (res?.success && res.order) {
      currentOrder.value = res.order
      if (res.order.status === 'completed') {
        await checkSession()
        await fetchOrders()
        isPaymentModalOpen.value = false
        isSuccessModalOpen.value = true
      }
    }
  } catch (err) {
    console.error('Gagal mengecek status pesanan:', err)
  } finally {
    isCheckingStatus.value = false
  }
}

// Simulasi pembayaran sandbox selesai (berguna untuk pengujian)
const handleSimulateComplete = async () => {
  if (!currentOrder.value?.id) return
  isSimulating.value = true
  try {
    const headers: Record<string, string> = {}
    try {
      const jwtRes = await account.createJWT()
      if (jwtRes?.jwt) {
        headers['X-Appwrite-JWT'] = jwtRes.jwt
      }
    } catch {}

    const res = await $fetch<any>('/api/payment/simulate-complete', {
      method: 'POST',
      headers,
      body: { order_id: currentOrder.value.id }
    })

    if (res?.success) {
      if (res.newExpiry) {
        successExpiryDate.value = res.newExpiry
      }
      currentOrder.value = res.order
      await checkSession()
      await fetchOrders()
      isPaymentModalOpen.value = false
      isSuccessModalOpen.value = true
    }
  } catch (err: any) {
    console.error('Gagal simulasi pembayaran:', err)
  } finally {
    isSimulating.value = false
  }
}

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
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3 text-neutral-900 dark:text-white">
          <UIcon name="i-lucide-crown" class="w-8 h-8 text-primary" />
          Pembayaran & Member Premium
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Aktifkan status member premium akun Anda menggunakan QRIS dengan verifikasi otomatis.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UBadge color="primary" variant="subtle" size="md" class="px-3 py-1 font-semibold flex items-center gap-1.5">
          <UIcon name="i-lucide-shield-check" class="w-4 h-4 text-primary" />
          Pembayaran QRIS Resmi
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
                  class="font-bold px-3 py-1.5 rounded-xl cursor-pointer"
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

        <!-- Tombol Aksi & Pembayaran di Kanan -->
        <div class="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-center gap-3 flex-shrink-0 pt-2 md:pt-0">
          <!-- Tombol Utama: Aktifkan / Tambah Premium -->
          <UButton
            color="warning"
            :variant="isPremiumActive ? 'subtle' : 'solid'"
            size="md"
            :icon="isPremiumActive ? 'i-lucide-sparkles' : 'i-lucide-crown'"
            class="font-black px-5 py-2.5 rounded-2xl shadow-md cursor-pointer transition-all hover:scale-102 flex items-center gap-2"
            @click="openPlanModal"
          >
            <span>{{ isPremiumActive ? 'Tambah / Perpanjang Premium' : 'Aktifkan Member Premium' }}</span>
          </UButton>

          <!-- Tombol Segarkan Status -->
          <button
            v-if="user"
            type="button"
            :disabled="isRefreshing"
            class="text-[11px] text-neutral-400 hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Muat ulang status terbaru dari server"
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
    <section v-if="user" class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-xs space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div>
          <h2 class="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
            <UIcon name="i-lucide-receipt" class="w-5 h-5 text-primary" />
            Riwayat Transaksi Pembelian Premium
          </h2>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Daftar riwayat transaksi langganan dan perpanjangan member premium pada akun Anda via QRIS.
          </p>
        </div>
        <UBadge color="neutral" variant="subtle" size="sm" class="font-bold">
          Total {{ allTransactions.length }} Transaksi
        </UBadge>
      </div>

      <!-- Transactions List -->
      <div v-if="allTransactions.length > 0" class="divide-y divide-neutral-100 dark:divide-neutral-800/80">
        <div
          v-for="trx in allTransactions"
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
                <span class="text-neutral-600 dark:text-neutral-300 font-medium flex items-center gap-1">
                  <UIcon name="i-lucide-qr-code" class="w-3.5 h-3.5 text-primary" />
                  {{ trx.method }}
                </span>
                <template v-if="trx.expiredAt">
                  <span>&bull;</span>
                  <span class="text-neutral-500 dark:text-neutral-400 text-[11px]">
                    Masa Berlaku: <strong class="text-neutral-700 dark:text-neutral-200">{{ trx.expiredAt }}</strong>
                  </span>
                </template>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-4 pl-13 sm:pl-0">
            <div class="text-right">
              <div class="font-black text-sm sm:text-base text-neutral-900 dark:text-white">
                {{ formatRupiah(trx.amount) }}
              </div>
              <UBadge
                :color="trx.status === 'completed' ? 'success' : trx.status === 'pending' ? 'warning' : 'neutral'"
                variant="subtle"
                size="xs"
                class="mt-1 font-bold"
              >
                {{ trx.status === 'completed' ? 'Lunas / Berhasil' : trx.status === 'pending' ? 'Menunggu Pembayaran' : trx.status }}
              </UBadge>
            </div>

            <!-- Tombol jika status pending -->
            <div v-if="trx.status === 'pending' && trx.paymentLinkUrl">
              <UButton
                color="primary"
                variant="solid"
                size="xs"
                icon="i-lucide-external-link"
                class="font-bold rounded-xl"
                @click="() => { currentOrder = trx; isPaymentModalOpen = true }"
              >
                Bayar
              </UButton>
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
        <p class="text-xs text-neutral-400">Transaksi pembelian paket premium Anda via QRIS akan otomatis tercatat di sini.</p>
      </div>
    </section>

    <!-- ==================================================== -->
    <!-- 3. MODAL PILIH PAKET LANGGANAN PREMIUM               -->
    <!-- ==================================================== -->
    <UModal
      v-model:open="isPlanModalOpen"
      :ui="{ content: 'sm:max-w-2xl md:max-w-3xl' }"
      class="sm:max-w-2xl md:max-w-3xl"
    >
      <template #content>
        <div class="p-6 sm:p-7 space-y-6">
          <!-- Modal Header -->
          <div class="flex items-start justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <div class="flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <UIcon name="i-lucide-crown" class="w-6 h-6" />
              </div>
              <div>
                <h3 class="text-lg font-black text-neutral-900 dark:text-white">
                  {{ isPremiumActive ? 'Tambah / Perpanjang Masa Premium' : 'Pilih Paket Member Premium' }}
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Buka akses seluruh live stream panggung & katalog arsip replay.
                </p>
              </div>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-lucide-x"
              class="rounded-xl"
              @click="isPlanModalOpen = false"
            />
          </div>

          <!-- Jika Pengguna Belum Login -->
          <div v-if="!user" class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-3">
            <UIcon name="i-lucide-user-x" class="w-8 h-8 text-amber-500 mx-auto" />
            <div class="space-y-1">
              <h4 class="font-bold text-sm text-neutral-900 dark:text-white">Anda Belum Masuk Akun</h4>
              <p class="text-xs text-neutral-600 dark:text-neutral-400">
                Harap masuk akun terlebih dahulu agar masa aktif Member Premium otomatis masuk ke akun Anda setelah pembayaran selesai.
              </p>
            </div>
            <UButton
              to="/login"
              color="primary"
              variant="solid"
              size="sm"
              block
              icon="i-lucide-log-in"
              class="font-bold rounded-xl"
            >
              Masuk ke Akun Sekarang
            </UButton>
          </div>

          <!-- Pilihan Paket (Radio Cards) -->
          <div v-else class="space-y-4">
            <div class="space-y-3">
              <label class="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Pilih Durasi Paket Langganan
              </label>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  v-for="plan in plans"
                  :key="plan.id"
                  class="relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between"
                  :class="selectedPlanId === plan.id
                    ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40'"
                  @click="selectPlan(plan.id)"
                >
                  <!-- Badge Rekomendasi / Populer -->
                  <div class="flex items-center justify-between gap-1 mb-2">
                    <UBadge
                      :color="plan.badgeColor"
                      variant="subtle"
                      size="xs"
                      class="font-extrabold text-[10px]"
                    >
                      {{ plan.badge }}
                    </UBadge>

                    <div
                      class="w-5 h-5 rounded-full border flex items-center justify-center transition-colors"
                      :class="selectedPlanId === plan.id
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-neutral-300 dark:border-neutral-600'"
                    >
                      <UIcon v-if="selectedPlanId === plan.id" name="i-lucide-check" class="w-3.5 h-3.5 font-bold" />
                    </div>
                  </div>

                  <div class="space-y-1">
                    <div class="text-sm font-black text-neutral-900 dark:text-white">
                      {{ plan.durationDays }} Hari
                    </div>
                    <div class="text-lg font-black text-amber-600 dark:text-amber-400">
                      {{ plan.priceLabel }}
                    </div>
                    <div class="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {{ plan.dailyPrice }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Metode Pembayaran: QRIS Only -->
            <div class="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-neutral-500 uppercase tracking-wider">Metode Pembayaran</span>
                <UBadge color="primary" variant="subtle" size="xs" class="font-bold flex items-center gap-1">
                  <UIcon name="i-lucide-check-circle-2" class="w-3.5 h-3.5" />
                  Instan & Otomatis
                </UBadge>
              </div>

              <div class="p-3 rounded-xl border border-primary/30 bg-white dark:bg-neutral-900 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                    <UIcon name="i-lucide-qr-code" class="w-5 h-5" />
                  </div>
                  <div>
                    <div class="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                      <span>QRIS (Otomatis & Real-Time)</span>
                      <span class="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">Resmi</span>
                    </div>
                    <p class="text-[11px] text-neutral-500 dark:text-neutral-400">
                      GoPay, OVO, DANA, ShopeePay, BCA, Mandiri, BRI, BNI & seluruh mobile banking.
                    </p>
                  </div>
                </div>
                <UIcon name="i-lucide-check" class="w-5 h-5 text-primary flex-shrink-0" />
              </div>
            </div>

            <!-- Pesan Error jika ada -->
            <div v-if="paymentError" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <UIcon name="i-lucide-alert-circle" class="w-4 h-4 flex-shrink-0" />
              <span>{{ paymentError }}</span>
            </div>

            <!-- Ringkasan Total & Tombol Aksi -->
            <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-neutral-500">Paket yang Dipilih:</span>
                <span class="font-bold text-neutral-900 dark:text-white">{{ selectedPlan.name }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Total Pembayaran:</span>
                <span class="text-xl font-black text-primary">{{ formatRupiah(selectedPlan.price) }}</span>
              </div>

              <div class="pt-1 flex items-center gap-2">
                <UButton
                  color="neutral"
                  variant="subtle"
                  size="md"
                  class="flex-1 font-semibold rounded-xl justify-center cursor-pointer"
                  @click="isPlanModalOpen = false"
                >
                  Batal
                </UButton>

                <UButton
                  color="primary"
                  variant="solid"
                  size="md"
                  class="flex-2 font-black rounded-xl justify-center cursor-pointer shadow-md"
                  icon="i-lucide-qr-code"
                  :loading="isCreatingPayment"
                  @click="handleCreatePayment"
                >
                  Bayar dengan QRIS
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- ==================================================== -->
    <!-- 4. MODAL DETAIL PEMBAYARAN QRIS (CHECKOUT)           -->
    <!-- ==================================================== -->
    <UModal
      v-model:open="isPaymentModalOpen"
      :ui="{ content: 'sm:max-w-xl md:max-w-2xl' }"
      class="sm:max-w-xl md:max-w-2xl"
    >
      <template #content>
        <div class="p-6 sm:p-7 space-y-5 text-center">
          <div class="w-14 h-14 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-sm">
            <UIcon name="i-lucide-qr-code" class="w-8 h-8" />
          </div>

          <div class="space-y-1">
            <h3 class="text-xl font-black text-neutral-900 dark:text-white">
              Selesaikan Pembayaran QRIS
            </h3>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Silakan buka tautan pembayaran untuk memindai kode QRIS.
            </p>
          </div>

          <!-- Rincian Pesanan Box -->
          <div class="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 text-left text-xs space-y-2 border border-neutral-200 dark:border-neutral-700">
            <div class="flex justify-between">
              <span class="text-neutral-500">Nomor Pesanan:</span>
              <span class="font-mono font-bold text-neutral-900 dark:text-white">{{ currentOrder?.id }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">Paket Layanan:</span>
              <span class="font-bold text-neutral-900 dark:text-white">{{ currentOrder?.planName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">Metode:</span>
              <span class="font-bold text-neutral-900 dark:text-white">QRIS (Semua E-Wallet/Bank)</span>
            </div>
            <div class="flex justify-between pt-1 border-t border-neutral-200 dark:border-neutral-700">
              <span class="font-bold text-neutral-700 dark:text-neutral-300">Total Tagihan:</span>
              <span class="font-black text-base text-primary">{{ formatRupiah(currentOrder?.amount || 0) }}</span>
            </div>
          </div>

          <!-- Tombol Aksi Pembayaran -->
          <div class="space-y-2 pt-1">
            <UButton
              color="primary"
              variant="solid"
              size="lg"
              block
              icon="i-lucide-external-link"
              class="font-black rounded-xl py-3 shadow-md cursor-pointer justify-center"
              @click="openPaymentLink"
            >
              Buka Halaman Pembayaran QRIS
            </UButton>

            <div class="flex items-center gap-2">
              <UButton
                color="neutral"
                variant="subtle"
                size="sm"
                block
                class="flex-1 font-semibold rounded-xl justify-center cursor-pointer"
                icon="i-lucide-copy"
                @click="copyPaymentLink"
              >
                {{ copySuccess ? 'Tautan Disalin!' : 'Salin Tautan' }}
              </UButton>

              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                block
                class="flex-1 font-bold rounded-xl justify-center cursor-pointer"
                icon="i-lucide-refresh-cw"
                :loading="isCheckingStatus"
                @click="checkPaymentStatus"
              >
                Cek Status
              </UButton>
            </div>

            <!-- Tombol Bantuan Simulator Pembayaran Sandbox (Khusus Admin) -->
            <div v-if="isAdmin" class="pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                :disabled="isSimulating"
                class="text-xs text-neutral-400 hover:text-amber-500 transition-colors flex items-center justify-center gap-1 mx-auto underline cursor-pointer disabled:opacity-50"
                title="Simulasi pembayaran selesai langsung di lingkungan Sandbox"
                @click="handleSimulateComplete"
              >
                <UIcon name="i-lucide-zap" class="w-3.5 h-3.5 text-amber-500" />
                <span>{{ isSimulating ? 'Memproses simulasi...' : 'Simulasi Pembayaran Sukses (Sandbox Test)' }}</span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- ==================================================== -->
    <!-- 5. MODAL SUKSES AKTIVASI MEMBER PREMIUM              -->
    <!-- ==================================================== -->
    <UModal
      v-model:open="isSuccessModalOpen"
      :ui="{ content: 'sm:max-w-lg md:max-w-xl' }"
      class="sm:max-w-lg md:max-w-xl"
    >
      <template #content>
        <div class="p-6 sm:p-8 space-y-5 text-center">
          <div class="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <UIcon name="i-lucide-check-circle" class="w-10 h-10" />
          </div>

          <div class="space-y-1.5">
            <h3 class="text-2xl font-black text-neutral-900 dark:text-white">
              Pembayaran Berhasil!
            </h3>
            <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Selamat, akun Anda telah resmi terdaftar sebagai <strong class="text-amber-500">MEMBER PREMIUM</strong>.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left text-xs space-y-2">
            <div class="flex justify-between">
              <span class="text-neutral-600 dark:text-neutral-400">Status Keanggotaan:</span>
              <span class="font-extrabold text-amber-600 dark:text-amber-400">MEMBER PREMIUM</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-600 dark:text-neutral-400">Masa Aktif Premium:</span>
              <span class="font-bold text-neutral-900 dark:text-white">{{ formatIndoDateTime(activePremiumUntil) }}</span>
            </div>
          </div>

          <div class="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <UButton
              to="/stream"
              color="primary"
              variant="solid"
              size="md"
              block
              class="flex-1 font-bold rounded-xl justify-center cursor-pointer shadow-md"
              icon="i-lucide-tv"
            >
              Nonton Live Stream
            </UButton>
            <UButton
              color="neutral"
              variant="subtle"
              size="md"
              block
              class="flex-1 font-semibold rounded-xl justify-center cursor-pointer"
              @click="isSuccessModalOpen = false"
            >
              Tutup
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
