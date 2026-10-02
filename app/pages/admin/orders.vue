<script setup lang="ts">
import type { OrderItem } from '~/composables/useAppwriteOrders'

const { user, isAdmin, isLoading: isAuthLoading } = useAppwriteAuth()
const {
  orders,
  isLoading: isOrdersLoading,
  isActionLoading,
  error: ordersError,
  notice: ordersNotice,
  fetchOrders,
  updateOrderStatus,
  stats
} = useAppwriteOrders()

useHead({
  title: 'Riwayat Pembayaran - Admin'
})

// Lifecycle
onMounted(async () => {
  await fetchOrders()
})

// Search & Filter State
const searchQuery = ref('')
const selectedStatus = ref<'all' | 'completed' | 'pending' | 'failed' | 'expired'>('all')
const selectedPlan = ref<string>('all')
const sortBy = ref<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')

// Pagination State
const currentPage = ref(1)
const itemsPerPage = ref(15)

// Filter & Sort Logic
const filteredOrders = computed(() => {
  let list = [...orders.value]

  // Filter Status
  if (selectedStatus.value !== 'all') {
    list = list.filter(o => o.status === selectedStatus.value)
  }

  // Filter Plan
  if (selectedPlan.value !== 'all') {
    list = list.filter(o => o.planId === selectedPlan.value)
  }

  // Filter Search
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(o => {
      const matchId = o.id.toLowerCase().includes(q)
      const matchPaymentId = o.paymentId?.toLowerCase().includes(q)
      const matchName = o.userName?.toLowerCase().includes(q)
      const matchEmail = o.userEmail?.toLowerCase().includes(q)
      const matchPlan = o.planName.toLowerCase().includes(q)
      const matchUserId = o.userId?.toLowerCase().includes(q)
      return matchId || matchPaymentId || matchName || matchEmail || matchPlan || matchUserId
    })
  }

  // Sort
  if (sortBy.value === 'newest') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (sortBy.value === 'oldest') {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } else if (sortBy.value === 'highest') {
    list.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
  } else if (sortBy.value === 'lowest') {
    list.sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0))
  }

  return list
})

// Total Pages & Paginated Items
const totalPages = computed(() => Math.max(1, Math.ceil(filteredOrders.value.length / itemsPerPage.value)))

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredOrders.value.slice(start, start + itemsPerPage.value)
})

// Reset pagination when filter changes
watch([searchQuery, selectedStatus, selectedPlan, sortBy, itemsPerPage], () => {
  currentPage.value = 1
})

// Detail Modal State
const isDetailModalOpen = ref(false)
const selectedOrder = ref<OrderItem | null>(null)

const openDetailModal = (order: OrderItem) => {
  selectedOrder.value = order
  isDetailModalOpen.value = true
}

// Manual Status Update Confirmation State
const isConfirmModalOpen = ref(false)
const orderToUpdate = ref<OrderItem | null>(null)
const targetStatus = ref<OrderItem['status']>('completed')
const actionFeedback = ref<string | null>(null)

const promptUpdateStatus = (order: OrderItem, status: OrderItem['status']) => {
  orderToUpdate.value = order
  targetStatus.value = status
  isConfirmModalOpen.value = true
}

const handleConfirmUpdateStatus = async () => {
  if (!orderToUpdate.value) return
  actionFeedback.value = null
  const result = await updateOrderStatus(orderToUpdate.value.id, targetStatus.value)
  if (result.success) {
    if (selectedOrder.value && selectedOrder.value.id === orderToUpdate.value.id) {
      selectedOrder.value = { ...selectedOrder.value, status: targetStatus.value }
    }
    isConfirmModalOpen.value = false
    orderToUpdate.value = null
  }
}

// Copy to Clipboard Feedback
const copiedId = ref<string | null>(null)
const copyToClipboard = (text: string, id: string) => {
  if (!import.meta.client) return
  navigator.clipboard.writeText(text)
  copiedId.value = id
  setTimeout(() => {
    if (copiedId.value === id) copiedId.value = null
  }, 2000)
}

// Helpers Formatting
const formatRupiah = (val: number | string): string => {
  const num = Number(val) || 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num)
}

const formatDateTime = (dateVal?: string): string => {
  if (!dateVal) return '-'
  try {
    const d = new Date(dateVal)
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d) + ' WIB'
    }
  } catch {}
  return dateVal
}

const getStatusBadge = (status: OrderItem['status']) => {
  switch (status) {
    case 'completed':
      return {
        label: 'Selesai',
        color: 'success' as const,
        icon: 'i-lucide-check-circle-2',
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      }
    case 'pending':
      return {
        label: 'Menunggu',
        color: 'warning' as const,
        icon: 'i-lucide-clock',
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      }
    case 'failed':
      return {
        label: 'Gagal',
        color: 'error' as const,
        icon: 'i-lucide-x-circle',
        bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
      }
    case 'expired':
    default:
      return {
        label: 'Kedaluwarsa',
        color: 'neutral' as const,
        icon: 'i-lucide-alert-circle',
        bg: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20'
      }
  }
}

// Export CSV
const exportToCSV = () => {
  if (!import.meta.client || filteredOrders.value.length === 0) return

  const headers = ['Order ID', 'Payment ID', 'User ID', 'Nama Pengguna', 'Email', 'Paket', 'Durasi (Hari)', 'Nominal (Rp)', 'Metode', 'Status', 'Tanggal Dibuat', 'Tanggal Dibayar']
  const rows = filteredOrders.value.map(o => [
    `"${o.id}"`,
    `"${o.paymentId || ''}"`,
    `"${o.userId || ''}"`,
    `"${o.userName || ''}"`,
    `"${o.userEmail || ''}"`,
    `"${o.planName}"`,
    o.durationDays,
    o.amount,
    `"${o.method}"`,
    `"${o.status}"`,
    `"${o.createdAt}"`,
    `"${o.paidAt || ''}"`
  ])

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `riwayat-transaksi-${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
    <!-- State 1: Loading Auth -->
    <div v-if="isAuthLoading" class="py-24 flex flex-col items-center justify-center gap-3">
      <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span class="text-xs font-semibold text-neutral-500">Memverifikasi hak akses admin...</span>
    </div>

    <!-- State 2: Akses Ditolak -->
    <div v-else-if="!user || !isAdmin" class="py-16 text-center max-w-md mx-auto space-y-4">
      <div class="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-shield-alert" class="w-8 h-8" />
      </div>
      <div class="space-y-1">
        <h2 class="text-xl font-bold text-neutral-900 dark:text-white">Akses Terbatas Admin</h2>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Halaman riwayat pembayaran hanya dapat diakses oleh akun dengan peran Administrator.
        </p>
      </div>
      <UButton
        to="/login"
        color="primary"
        variant="solid"
        size="sm"
        icon="i-lucide-log-in"
        label="Masuk sebagai Admin"
        class="font-bold rounded-xl"
      />
    </div>

    <!-- State 3: Konten Utama Admin -->
    <div v-else class="space-y-8">
      <!-- Header Section -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
            <UIcon name="i-lucide-database" class="w-3.5 h-3.5" />
            Appwrite Database (orders)
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Riwayat Pembayaran
          </h1>
          <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Pantau dan kelola seluruh transaksi paket langganan Member Premium serta konfirmasi status pembayaran.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <UButton
            color="neutral"
            variant="outline"
            size="md"
            icon="i-lucide-download"
            label="Ekspor CSV"
            :disabled="filteredOrders.length === 0"
            class="font-bold rounded-xl cursor-pointer"
            @click="exportToCSV"
          />
          <UButton
            color="primary"
            variant="solid"
            size="md"
            :icon="isOrdersLoading ? 'i-lucide-loader-2' : 'i-lucide-refresh-cw'"
            :loading="isOrdersLoading"
            label="Muat Ulang"
            class="font-bold rounded-xl cursor-pointer shadow-sm shadow-primary/20"
            @click="fetchOrders()"
          />
        </div>
      </div>

      <!-- Feedback Alert Notice -->
      <div
        v-if="ordersNotice"
        class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs"
      >
        <div class="flex items-center gap-2.5">
          <UIcon name="i-lucide-check-circle-2" class="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{{ ordersNotice }}</span>
        </div>
        <button
          type="button"
          class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
          @click="ordersNotice = null"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>
      </div>

      <!-- Top Financial & Transaction Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <!-- Card 1: Pendapatan Selesai -->
        <div class="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Total Pendapatan</span>
            <div class="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UIcon name="i-lucide-wallet" class="w-5 h-5" />
            </div>
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {{ formatRupiah(stats.totalRevenue) }}
            </div>
            <div class="text-[11px] text-neutral-400 mt-0.5">Dari transaksi berhasil</div>
          </div>
        </div>

        <!-- Card 2: Total Pesanan -->
        <div class="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Total Transaksi</span>
            <div class="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <UIcon name="i-lucide-receipt" class="w-5 h-5" />
            </div>
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
              {{ stats.totalOrders }}
            </div>
            <div class="text-[11px] text-neutral-400 mt-0.5">Semua riwayat transaksi</div>
          </div>
        </div>

        <!-- Card 3: Transaksi Selesai -->
        <div class="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Pembayaran Sukses</span>
            <div class="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <UIcon name="i-lucide-check-circle-2" class="w-5 h-5" />
            </div>
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {{ stats.completedCount }}
            </div>
            <div class="text-[11px] text-neutral-400 mt-0.5">Member premium aktif</div>
          </div>
        </div>

        <!-- Card 4: Menunggu Pembayaran -->
        <div class="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Menunggu Bayar</span>
            <div class="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <UIcon name="i-lucide-clock" class="w-5 h-5" />
            </div>
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              {{ stats.pendingCount }}
            </div>
            <div class="text-[11px] text-neutral-400 mt-0.5">Transaksi pending QRIS</div>
          </div>
        </div>
      </div>

      <!-- Filter, Search & Toolbar Card -->
      <div class="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div class="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <!-- Search Bar -->
          <div class="relative flex-1">
            <UIcon name="i-lucide-search" class="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari ID Order, nama pengguna, email, atau paket..."
              class="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 focus:outline-none focus:ring-2 focus:ring-primary/30 text-neutral-900 dark:text-white placeholder:text-neutral-400"
            />
          </div>

          <!-- Filters Row -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- Filter Status -->
            <select
              v-model="selectedStatus"
              class="px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 text-neutral-700 dark:text-neutral-300 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Selesai (Completed)</option>
              <option value="pending">Menunggu (Pending)</option>
              <option value="failed">Gagal (Failed)</option>
              <option value="expired">Kedaluwarsa (Expired)</option>
            </select>

            <!-- Filter Paket -->
            <select
              v-model="selectedPlan"
              class="px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 text-neutral-700 dark:text-neutral-300 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">Semua Paket</option>
              <option value="plan_7d">Paket 7 Hari</option>
              <option value="plan_14d">Paket 14 Hari</option>
              <option value="plan_30d">Paket 30 Hari</option>
            </select>

            <!-- Sort By -->
            <select
              v-model="sortBy"
              class="px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 text-neutral-700 dark:text-neutral-300 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="highest">Nominal Tertinggi</option>
              <option value="lowest">Nominal Terendah</option>
            </select>
          </div>
        </div>

        <!-- Status Summary Badges Bar -->
        <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <span class="text-neutral-400 font-medium mr-1">Filter Cepat:</span>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            :class="selectedStatus === 'all' ? 'bg-primary text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'"
            @click="selectedStatus = 'all'"
          >
            Semua ({{ stats.totalOrders }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            :class="selectedStatus === 'completed' ? 'bg-emerald-600 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'"
            @click="selectedStatus = 'completed'"
          >
            Selesai ({{ stats.completedCount }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            :class="selectedStatus === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'"
            @click="selectedStatus = 'pending'"
          >
            Menunggu ({{ stats.pendingCount }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            :class="selectedStatus === 'failed' ? 'bg-rose-600 text-white' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'"
            @click="selectedStatus = 'failed'"
          >
            Gagal ({{ stats.failedCount }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            :class="selectedStatus === 'expired' ? 'bg-neutral-600 text-white' : 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-500/20'"
            @click="selectedStatus = 'expired'"
          >
            Kedaluwarsa ({{ stats.expiredCount }})
          </button>
        </div>
      </div>

      <!-- Orders Table Container -->
      <div class="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        <!-- Table State: Loading -->
        <div v-if="isOrdersLoading && orders.length === 0" class="py-20 text-center space-y-3">
          <div class="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p class="text-xs text-neutral-500">Memuat data transaksi dari Appwrite Database...</p>
        </div>

        <!-- Table State: Empty -->
        <div v-else-if="filteredOrders.length === 0" class="py-20 text-center space-y-4 max-w-sm mx-auto p-4">
          <div class="w-16 h-16 rounded-3xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
            <UIcon name="i-lucide-receipt" class="w-8 h-8" />
          </div>
          <div class="space-y-1">
            <h3 class="text-base font-bold text-neutral-900 dark:text-white">Tidak Ada Transaksi Ditemukan</h3>
            <p class="text-xs text-neutral-500 leading-relaxed">
              {{ searchQuery || selectedStatus !== 'all' ? 'Tidak ada transaksi yang cocok dengan filter atau kata kunci pencarian.' : 'Belum ada data pesanan yang tercatat di database.' }}
            </p>
          </div>
          <UButton
            v-if="searchQuery || selectedStatus !== 'all' || selectedPlan !== 'all'"
            color="neutral"
            variant="outline"
            size="xs"
            label="Reset Filter"
            class="font-semibold rounded-xl"
            @click="searchQuery = ''; selectedStatus = 'all'; selectedPlan = 'all'"
          />
        </div>

        <!-- Table State: Data Exists -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                <th class="py-3.5 px-4">ID Transaksi</th>
                <th class="py-3.5 px-4">Pengguna</th>
                <th class="py-3.5 px-4">Paket & Durasi</th>
                <th class="py-3.5 px-4">Nominal</th>
                <th class="py-3.5 px-4">Status</th>
                <th class="py-3.5 px-4">Waktu Dibuat</th>
                <th class="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium">
              <tr
                v-for="order in paginatedOrders"
                :key="order.id"
                class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
              >
                <!-- ID Transaksi -->
                <td class="py-4 px-4 whitespace-nowrap">
                  <div class="flex items-center gap-1.5">
                    <span class="font-mono font-bold text-neutral-900 dark:text-white text-xs">
                      {{ order.id }}
                    </span>
                    <button
                      type="button"
                      class="text-neutral-400 hover:text-primary transition-colors cursor-pointer"
                      title="Salin ID Order"
                      @click="copyToClipboard(order.id, order.id)"
                    >
                      <UIcon
                        :name="copiedId === order.id ? 'i-lucide-check' : 'i-lucide-copy'"
                        class="w-3.5 h-3.5"
                        :class="copiedId === order.id ? 'text-emerald-500' : ''"
                      />
                    </button>
                  </div>
                  <div class="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1">
                    <span>Metode:</span>
                    <span class="font-semibold text-neutral-600 dark:text-neutral-300">{{ order.method || 'QRIS' }}</span>
                  </div>
                </td>

                <!-- Pengguna -->
                <td class="py-4 px-4 whitespace-nowrap">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-xs shrink-0">
                      {{ (order.userName || order.userEmail || 'U').slice(0, 1).toUpperCase() }}
                    </div>
                    <div>
                      <div class="font-bold text-neutral-900 dark:text-white text-xs">
                        {{ order.userName || 'Tanpa Nama' }}
                      </div>
                      <div class="text-[11px] text-neutral-400 truncate max-w-[170px]" :title="order.userEmail">
                        {{ order.userEmail || '-' }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Paket & Durasi -->
                <td class="py-4 px-4 whitespace-nowrap">
                  <div class="font-bold text-neutral-900 dark:text-white text-xs">
                    {{ order.planName }}
                  </div>
                  <div class="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                    <UIcon name="i-lucide-crown" class="w-3 h-3" />
                    {{ order.durationDays }} Hari Aktif
                  </div>
                </td>

                <!-- Nominal -->
                <td class="py-4 px-4 whitespace-nowrap">
                  <div
                    class="font-black text-sm"
                    :class="order.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-white'"
                  >
                    {{ formatRupiah(order.amount) }}
                  </div>
                </td>

                <!-- Status -->
                <td class="py-4 px-4 whitespace-nowrap">
                  <div
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                    :class="getStatusBadge(order.status).bg"
                  >
                    <UIcon :name="getStatusBadge(order.status).icon" class="w-3.5 h-3.5" />
                    <span>{{ getStatusBadge(order.status).label }}</span>
                  </div>
                  <div v-if="order.paidAt && order.status === 'completed'" class="text-[10px] text-neutral-400 mt-1">
                    Dibayar: {{ formatDateTime(order.paidAt) }}
                  </div>
                </td>

                <!-- Waktu Dibuat -->
                <td class="py-4 px-4 whitespace-nowrap">
                  <div class="text-neutral-700 dark:text-neutral-300 text-xs font-medium">
                    {{ formatDateTime(order.createdAt) }}
                  </div>
                </td>

                <!-- Aksi -->
                <td class="py-4 px-4 whitespace-nowrap text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- Tombol Detail -->
                    <UButton
                      color="neutral"
                      variant="soft"
                      size="xs"
                      icon="i-lucide-eye"
                      label="Detail"
                      class="font-semibold rounded-lg cursor-pointer"
                      @click="openDetailModal(order)"
                    />

                    <!-- Tombol Cepat: Konfirmasi Manual (Jika status pending) -->
                    <UButton
                      v-if="order.status === 'pending'"
                      color="success"
                      variant="subtle"
                      size="xs"
                      icon="i-lucide-check"
                      label="Selesaikan"
                      title="Konfirmasi pembayaran dan aktifkan premium"
                      class="font-bold rounded-lg cursor-pointer"
                      @click="promptUpdateStatus(order, 'completed')"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table Footer / Pagination -->
        <div class="p-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div class="text-neutral-500 dark:text-neutral-400 font-medium">
            Menampilkan <span class="font-bold text-neutral-900 dark:text-white">{{ paginatedOrders.length }}</span> dari <span class="font-bold text-neutral-900 dark:text-white">{{ filteredOrders.length }}</span> pesanan
          </div>

          <div class="flex items-center gap-2">
            <span class="text-neutral-400 font-medium">Hal. {{ currentPage }} / {{ totalPages }}</span>
            <UButton
              color="neutral"
              variant="outline"
              size="xs"
              icon="i-lucide-chevron-left"
              :disabled="currentPage <= 1"
              class="rounded-lg cursor-pointer"
              @click="currentPage--"
            />
            <UButton
              color="neutral"
              variant="outline"
              size="xs"
              icon="i-lucide-chevron-right"
              :disabled="currentPage >= totalPages"
              class="rounded-lg cursor-pointer"
              @click="currentPage++"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- MODAL 1: DETAIL LENGKAP TRANSAKSI              -->
    <!-- ============================================== -->
    <UModal v-model:open="isDetailModalOpen">
      <template #content>
        <div v-if="selectedOrder" class="p-6 space-y-6 max-w-lg w-full">
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <UIcon name="i-lucide-receipt" class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-bold text-base text-neutral-900 dark:text-white">Detail Transaksi</h3>
                <p class="text-[11px] text-neutral-400 font-mono">{{ selectedOrder.id }}</p>
              </div>
            </div>
            <button
              type="button"
              class="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              @click="isDetailModalOpen = false"
            >
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>

          <!-- Status Highlight Card -->
          <div
            class="p-4 rounded-2xl flex items-center justify-between border"
            :class="getStatusBadge(selectedOrder.status).bg"
          >
            <div class="flex items-center gap-2.5">
              <UIcon :name="getStatusBadge(selectedOrder.status).icon" class="w-5 h-5" />
              <div>
                <div class="font-bold text-xs uppercase tracking-wide">Status Pembayaran</div>
                <div class="font-black text-sm">{{ getStatusBadge(selectedOrder.status).label }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-[10px] opacity-80 uppercase tracking-wide">Nominal Tagihan</div>
              <div class="text-base font-black">{{ formatRupiah(selectedOrder.amount) }}</div>
            </div>
          </div>

          <!-- Detail Fields Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <!-- Order ID -->
            <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
              <div class="text-[10px] text-neutral-400 font-medium">Order ID</div>
              <div class="font-mono font-bold text-neutral-800 dark:text-neutral-200 truncate mt-0.5">
                {{ selectedOrder.id }}
              </div>
            </div>

            <!-- Payment Gateway ID -->
            <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
              <div class="text-[10px] text-neutral-400 font-medium">Payment ID</div>
              <div class="font-mono font-bold text-neutral-800 dark:text-neutral-200 truncate mt-0.5">
                {{ selectedOrder.paymentId || '-' }}
              </div>
            </div>

            <!-- Nama Pengguna -->
            <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
              <div class="text-[10px] text-neutral-400 font-medium">Nama Pelanggan</div>
              <div class="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                {{ selectedOrder.userName || '-' }}
              </div>
            </div>

            <!-- Email Pengguna -->
            <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
              <div class="text-[10px] text-neutral-400 font-medium">Email Pelanggan</div>
              <div class="font-bold text-neutral-800 dark:text-neutral-200 truncate mt-0.5">
                {{ selectedOrder.userEmail || '-' }}
              </div>
            </div>

            <!-- Paket Premium -->
            <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
              <div class="text-[10px] text-neutral-400 font-medium">Paket Langganan</div>
              <div class="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                {{ selectedOrder.planName }} ({{ selectedOrder.durationDays }} Hari)
              </div>
            </div>

            <!-- Metode Pembayaran -->
            <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
              <div class="text-[10px] text-neutral-400 font-medium">Metode Transaksi</div>
              <div class="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                {{ selectedOrder.method || 'QRIS' }}
              </div>
            </div>

            <!-- Waktu Dibuat -->
            <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
              <div class="text-[10px] text-neutral-400 font-medium">Waktu Pemesanan</div>
              <div class="font-medium text-neutral-800 dark:text-neutral-200 mt-0.5">
                {{ formatDateTime(selectedOrder.createdAt) }}
              </div>
            </div>

            <!-- Waktu Dibayar -->
            <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
              <div class="text-[10px] text-neutral-400 font-medium">Waktu Pembayaran</div>
              <div class="font-medium text-neutral-800 dark:text-neutral-200 mt-0.5">
                {{ formatDateTime(selectedOrder.paidAt) }}
              </div>
            </div>
          </div>

          <!-- Payment Link URL (if exists) -->
          <div v-if="selectedOrder.paymentLinkUrl" class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-1">
            <div class="text-[10px] text-neutral-400 font-medium">Tautan Invoice Pembayaran</div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-mono text-neutral-600 dark:text-neutral-300 truncate">
                {{ selectedOrder.paymentLinkUrl }}
              </span>
              <a
                :href="selectedOrder.paymentLinkUrl"
                target="_blank"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-bold shrink-0 hover:bg-primary/90"
              >
                <span>Buka</span>
                <UIcon name="i-lucide-external-link" class="w-3 h-3" />
              </a>
            </div>
          </div>

          <!-- Modal Actions Footer -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <!-- Jika Pending: Tombol Konfirmasi Selesai Manual -->
              <UButton
                v-if="selectedOrder.status === 'pending'"
                color="success"
                variant="solid"
                size="sm"
                icon="i-lucide-check-circle-2"
                label="Konfirmasi Selesai"
                class="font-bold rounded-xl w-full sm:w-auto cursor-pointer"
                @click="promptUpdateStatus(selectedOrder, 'completed')"
              />

              <!-- Ubah status ke expired / failed jika perlu -->
              <UButton
                v-if="selectedOrder.status === 'pending'"
                color="neutral"
                variant="outline"
                size="sm"
                label="Tandai Kedaluwarsa"
                class="font-medium rounded-xl w-full sm:w-auto cursor-pointer"
                @click="promptUpdateStatus(selectedOrder, 'expired')"
              />
            </div>

            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              label="Tutup"
              class="font-semibold rounded-xl w-full sm:w-auto cursor-pointer"
              @click="isDetailModalOpen = false"
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- ============================================== -->
    <!-- MODAL 2: KONFIRMASI UBAH STATUS ORDER          -->
    <!-- ============================================== -->
    <UModal v-model:open="isConfirmModalOpen">
      <template #content>
        <div v-if="orderToUpdate" class="p-6 space-y-5 max-w-md w-full">
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <UIcon name="i-lucide-check-circle" class="w-6 h-6" />
          </div>

          <div class="text-center space-y-2">
            <h3 class="text-base font-bold text-neutral-900 dark:text-white">
              Konfirmasi Perubahan Status
            </h3>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Anda akan mengubah status pesanan <span class="font-mono font-bold text-neutral-800 dark:text-neutral-200">{{ orderToUpdate.id }}</span> menjadi
              <span class="font-bold uppercase text-emerald-600 dark:text-emerald-400">{{ targetStatus }}</span>.
            </p>
            <p v-if="targetStatus === 'completed'" class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
              <UIcon name="i-lucide-crown" class="w-3.5 h-3.5 inline mr-1" />
              Member Premium pengguna (<span class="font-bold">{{ orderToUpdate.userName || orderToUpdate.userEmail }}</span>) akan otomatis diperpanjang selama <span class="font-bold">{{ orderToUpdate.durationDays }} hari</span> di Appwrite.
            </p>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              label="Batal"
              class="font-semibold rounded-xl cursor-pointer"
              @click="isConfirmModalOpen = false"
            />
            <UButton
              color="success"
              variant="solid"
              size="sm"
              icon="i-lucide-check"
              label="Ya, Perbarui Status"
              :loading="isActionLoading"
              class="font-bold rounded-xl cursor-pointer"
              @click="handleConfirmUpdateStatus"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
