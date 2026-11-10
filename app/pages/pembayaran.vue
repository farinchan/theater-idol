<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { membershipService } from '~/services/membership-service'
import type { MembershipPlan, MembershipTransaction, MembershipStatus } from '~/types/membership'

const route = useRoute()
const appName = ref('Theater Idol')
const { state } = useAuth()

const user = computed(() => state.user)
const isAdmin = computed(() => state.isAdmin)
const isPremium = computed(() => state.isPremium)

const membershipStatus = ref<MembershipStatus | null>(null)
const isStatusLoading = ref(false)
const isPlansLoading = ref(false)
const isOrdersLoading = ref(false)

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
        }
      })
    }
  ]
})

export interface PremiumPlanOption {
  id: string
  code: string
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

// Fallback plans jika API belum merespons
const defaultPlans: PremiumPlanOption[] = [
  {
    id: '3_days',
    code: '3_days',
    name: 'Membership 3 Hari',
    durationDays: 3,
    price: 5000,
    priceLabel: 'Rp 5.000',
    badge: 'Paket Uji Coba',
    badgeColor: 'neutral',
    dailyPrice: 'Rp 1.666 / hari',
    description: 'Akses penuh streaming live & katalog video replay selama 3 hari.',
    features: ['Akses Live Streaming Teater', 'Akses Seluruh Arsip Replay', 'Masa Aktif 3 Hari']
  },
  {
    id: '7_days',
    code: '7_days',
    name: 'Membership 7 Hari',
    durationDays: 7,
    price: 10000,
    priceLabel: 'Rp 10.000',
    badge: 'Paling Populer',
    badgeColor: 'primary',
    dailyPrice: 'Rp 1.428 / hari',
    description: 'Akses 1 minggu penuh untuk semua show teater & replay.',
    features: ['Akses Live Streaming Teater', 'Akses Seluruh Arsip Replay', 'Masa Aktif 7 Hari Penuh'],
    isPopular: true
  },
  {
    id: '30_days',
    code: '30_days',
    name: 'Membership 30 Hari',
    durationDays: 30,
    price: 30000,
    priceLabel: 'Rp 30.000',
    badge: 'Paling Untung (Best Value)',
    badgeColor: 'warning',
    dailyPrice: 'Rp 1.000 / hari',
    description: 'Akses 1 bulan penuh tanpa batas dengan biaya super hemat!',
    features: ['Akses Live Streaming Teater', 'Akses Seluruh Arsip Replay', 'Masa Aktif 30 Hari Penuh']
  }
]

const plans = ref<PremiumPlanOption[]>(defaultPlans)
const selectedPlanId = ref<string>('7_days')

const isRefreshing = ref(false)
const isPlanModalOpen = ref(false)
const isPaymentModalOpen = ref(false)
const isSuccessModalOpen = ref(false)
const isCreatingPayment = ref(false)
const isCheckingStatus = ref(false)
const isSimulating = ref(false)
const copySuccess = ref(false)
const paymentError = ref<string | null>(null)
const currentOrder = ref<any>(null)

// Format Rupiah
const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val)
}

// Fetch plans dari backend
const fetchPlans = async () => {
  isPlansLoading.value = true
  try {
    const res = await membershipService.getPlans()
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      plans.value = res.data.map(p => {
        let badge = 'Paket Hemat'
        let badgeColor: 'neutral' | 'primary' | 'warning' | 'success' = 'neutral'
        let isPopular = false

        if (p.days === 7 || p.code === '7_days') {
          badge = 'Paling Populer'
          badgeColor = 'primary'
          isPopular = true
        } else if (p.days >= 30 || p.code === '30_days') {
          badge = 'Paling Untung (Best Value)'
          badgeColor = 'warning'
        }

        const daily = p.days > 0 ? formatRupiah(Math.round(p.price / p.days)) + ' / hari' : ''

        return {
          id: p.code,
          code: p.code,
          name: p.name,
          durationDays: p.days,
          price: p.price,
          priceLabel: formatRupiah(p.price),
          badge,
          badgeColor,
          dailyPrice: daily,
          description: p.description || `Akses membership selama ${p.days} hari`,
          features: ['Akses Live Streaming Teater', 'Akses Seluruh Arsip Replay', `Masa Aktif ${p.days} Hari Penuh`],
          isPopular
        }
      })
      if (!plans.value.some(p => p.id === selectedPlanId.value)) {
        selectedPlanId.value = plans.value[0]?.id || '7_days'
      }
    }
  } catch {} finally {
    isPlansLoading.value = false
  }
}

// Fetch user status
const fetchMembershipStatus = async () => {
  if (!state.isLoggedIn) return
  isStatusLoading.value = true
  try {
    const res = await membershipService.getStatus()
    if (res.data) {
      membershipStatus.value = res.data
    }
  } catch {} finally {
    isStatusLoading.value = false
  }
}

// Fetch riwayat pesanan
const serverOrders = ref<MembershipTransaction[]>([])

const fetchOrders = async () => {
  if (!state.isLoggedIn) {
    serverOrders.value = []
    return
  }
  isOrdersLoading.value = true
  try {
    const res = await membershipService.getHistory(1, 50)
    if (res.data && Array.isArray(res.data)) {
      serverOrders.value = res.data
    }
  } catch {} finally {
    isOrdersLoading.value = false
  }
}

// Selected plan object computed
const selectedPlan = computed(() => {
  return plans.value.find(p => p.id === selectedPlanId.value) || plans.value[0] || defaultPlans[0]
})

// Cek status aktif premium
const isPremiumActive = computed(() => {
  return Boolean(membershipStatus.value?.is_member || isPremium.value)
})

const activePremiumUntil = computed(() => {
  return membershipStatus.value?.membership_expires_at || null
})

// Format tanggal Indonesia
const formatIndoDateTime = (dateStr?: string | null) => {
  if (!dateStr) return '-'
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
  if (!isPremiumActive.value) return ''
  if (membershipStatus.value && typeof membershipStatus.value.remaining_days === 'number') {
    return `${membershipStatus.value.remaining_days} Hari Lagi`
  }
  if (!activePremiumUntil.value) return ''
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

// Gabungan transaksi
const allTransactions = computed(() => {
  return serverOrders.value.map(o => {
    const dateFormatted = `${formatIndoDateTime(o.created_at)}${formatIndoTime(o.created_at) ? ', ' + formatIndoTime(o.created_at) : ''}`
    return {
      id: o.order_id || String(o.id),
      date: dateFormatted,
      planId: o.plan_code,
      planName: o.plan_code ? `Membership ${o.days || 7} Hari` : 'Member Premium',
      durationDays: o.days || 7,
      amount: o.amount,
      method: o.payment_method?.toUpperCase() || 'QRIS',
      status: o.status || 'pending',
      expiredAt: o.paid_at && o.days ? formatIndoDateTime(new Date(new Date(o.paid_at).getTime() + o.days * 24 * 60 * 60 * 1000).toISOString()) : undefined,
      paymentLinkUrl: o.payment_link_url
    }
  })
})

// Muat sesi dan pesanan saat halaman dibuka
onMounted(async () => {
  await fetchPlans()
  if (state.isLoggedIn) {
    await Promise.allSettled([
      fetchMembershipStatus(),
      fetchOrders()
    ])

    // Cek query URL jika redirect kembali dari pembayaran Nagastra
    if (route.query.status === 'success' || route.query.order_id) {
      await fetchMembershipStatus()
      await fetchOrders()
      isSuccessModalOpen.value = true
    }
  }
})

// Fungsi refresh manual status user
const refreshUserStatus = async () => {
  isRefreshing.value = true
  try {
    await Promise.allSettled([
      fetchMembershipStatus(),
      fetchOrders()
    ])
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

// Buat Tagihan Pembayaran QRIS via backend checkout
const handleCreatePayment = async () => {
  if (!state.isLoggedIn) {
    paymentError.value = 'Silakan masuk ke akun Anda terlebih dahulu.'
    return
  }

  isCreatingPayment.value = true
  paymentError.value = null

  try {
    const res = await membershipService.checkout({ plan_code: selectedPlan.value.code })
    if (res.data) {
      currentOrder.value = {
        id: res.data.order_id,
        planName: res.data.plan_name || selectedPlan.value.name,
        amount: res.data.amount || selectedPlan.value.price,
        paymentLinkUrl: res.data.payment_link_url,
        status: res.data.status,
        expiresAt: res.data.expires_at
      }
      isPlanModalOpen.value = false
      isPaymentModalOpen.value = true
      await fetchOrders()
    }
  } catch (err: any) {
    paymentError.value = err?.message || 'Gagal membuat transaksi pembayaran.'
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
    const res = await membershipService.getTransaction(currentOrder.value.id)
    if (res.data) {
      if (res.data.status === 'completed' || res.data.status === 'paid') {
        currentOrder.value.status = 'completed'
        isPaymentModalOpen.value = false
        isSuccessModalOpen.value = true
        await Promise.allSettled([
          fetchMembershipStatus(),
          fetchOrders()
        ])
      }
    }
  } catch {} finally {
    isCheckingStatus.value = false
  }
}

// Simulasi pembayaran sandbox (admin)
const handleSimulateComplete = async () => {
  if (!currentOrder.value?.id) return
  isSimulating.value = true
  try {
    currentOrder.value.status = 'completed'
    isPaymentModalOpen.value = false
    isSuccessModalOpen.value = true
    await Promise.allSettled([
      fetchMembershipStatus(),
      fetchOrders()
    ])
  } finally {
    isSimulating.value = false
  }
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

    <!-- 1. CARD STATUS MEMBER & PREMIUM HINGGA -->
    <section
      class="rounded-3xl border transition-all p-6 sm:p-8 shadow-sm relative overflow-hidden"
      :class="isPremiumActive
        ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white dark:to-neutral-900 shadow-amber-500/5'
        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'"
    >
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

            <!-- Jika Belum Login -->
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

            <!-- Jika Member Premium -->
            <div v-else-if="isPremiumActive" class="space-y-1.5 pt-0.5">
              <div class="flex items-center gap-2 flex-wrap text-xs sm:text-sm text-neutral-700 dark:text-neutral-200">
                <span class="text-neutral-500 dark:text-neutral-400 font-medium">Premium Hingga:</span>
                <span class="font-extrabold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <UIcon name="i-lucide-calendar-check" class="w-4 h-4 text-amber-500" />
                  {{ formatIndoDateTime(activePremiumUntil) }}
                </span>
                <span v-if="remainingDaysText" class="text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                  {{ remainingDaysText }}
                </span>
              </div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Anda memiliki akses penuh untuk menyaksikan Live Stream panggung teater dan seluruh katalog video arsip replay.
              </p>
            </div>

            <!-- Jika Member Biasa -->
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

        <!-- Tombol Aksi di Kanan -->
        <div class="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-center gap-3 flex-shrink-0 pt-2 md:pt-0">
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

    <!-- 2. CARD RIWAYAT TRANSAKSI PEMBELIAN PREMIUM -->
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

      <!-- Loading State -->
      <div v-if="isOrdersLoading && allTransactions.length === 0" class="py-8 text-center space-y-2">
        <div class="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
        <p class="text-xs text-neutral-500">Memuat riwayat transaksi...</p>
      </div>

      <!-- Transactions List -->
      <div v-else-if="allTransactions.length > 0" class="divide-y divide-neutral-100 dark:divide-neutral-800/80">
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

      <!-- Empty State -->
      <div v-else class="py-12 text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
          <UIcon name="i-lucide-receipt" class="w-6 h-6" />
        </div>
        <p class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Belum Ada Riwayat Transaksi</p>
        <p class="text-xs text-neutral-400">Transaksi pembelian paket premium Anda via QRIS akan otomatis tercatat di sini.</p>
      </div>
    </section>

    <!-- 3. MODAL PILIH PAKET LANGGANAN PREMIUM -->
    <UModal
      v-model:open="isPlanModalOpen"
      :ui="{ content: 'sm:max-w-2xl md:max-w-3xl' }"
      class="sm:max-w-2xl md:max-w-3xl"
    >
      <template #content>
        <div class="p-6 sm:p-7 space-y-6">
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

          <!-- Jika Belum Login -->
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

          <!-- Pilihan Paket -->
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
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'"
                  @click="selectPlan(plan.id)"
                >
                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-1">
                      <UBadge
                        :color="plan.badgeColor"
                        variant="subtle"
                        size="xs"
                        class="font-bold text-[10px]"
                      >
                        {{ plan.badge }}
                      </UBadge>
                      <div
                        class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
                        :class="selectedPlanId === plan.id ? 'border-amber-500 bg-amber-500' : 'border-neutral-300 dark:border-neutral-700'"
                      >
                        <div v-if="selectedPlanId === plan.id" class="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    </div>

                    <div>
                      <h4 class="font-black text-sm text-neutral-900 dark:text-white leading-tight">
                        {{ plan.name }}
                      </h4>
                      <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {{ plan.description }}
                      </p>
                    </div>
                  </div>

                  <div class="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 mt-3">
                    <div class="text-base font-black text-neutral-900 dark:text-white">
                      {{ plan.priceLabel }}
                    </div>
                    <div class="text-[10px] text-neutral-400 font-medium">
                      {{ plan.dailyPrice }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Metode Pembayaran QRIS Info -->
            <div class="space-y-2 pt-2">
              <label class="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Metode Pembayaran
              </label>

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

            <!-- Pesan Error -->
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

    <!-- 4. MODAL DETAIL PEMBAYARAN QRIS (CHECKOUT) -->
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

            <!-- Tombol Simulator Sandbox (Admin) -->
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

    <!-- 5. MODAL SUKSES AKTIVASI MEMBER PREMIUM -->
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
