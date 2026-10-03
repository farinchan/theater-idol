<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppwriteAdminUsers, type AdminUserItem } from '~/composables/useAppwriteAdminUsers'

const { user, isAdmin, isLoading: isAuthLoading } = useAppwriteAuth()
const {
  users,
  total,
  isLoading,
  isActionLoading,
  error,
  notice,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  stats
} = useAppwriteAdminUsers()

useHead({
  title: 'Management Pengguna - Admin'
})

onMounted(async () => {
  await fetchUsers()
})

// Search & Filter States
const searchQuery = ref('')
const selectedRole = ref<'all' | 'admin' | 'user'>('all')
const selectedStatus = ref<'all' | 'active' | 'blocked'>('all')
const selectedMembership = ref<'all' | 'premium' | 'expired' | 'free'>('all')
const sortBy = ref<'newest' | 'oldest' | 'name_asc' | 'name_desc'>('newest')

// Pagination States
const currentPage = ref(1)
const itemsPerPage = ref(15)

// Modal States
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isPremiumModalOpen = ref(false)
const isDeleteModalOpen = ref(false)

// Selected user for action
const selectedUser = ref<AdminUserItem | null>(null)

// Form State: Tambah User
const createForm = ref({
  name: '',
  email: '',
  password: '',
  role: 'user' as 'admin' | 'user',
  status: true,
  premiumDurationDays: 0,
  isLifetime: false
})

// Form State: Edit User
const editForm = ref({
  name: '',
  email: '',
  password: '',
  role: 'user' as 'admin' | 'user',
  status: true
})

// Form State: Atur Premium
const premiumForm = ref({
  action: 'addDays' as 'addDays' | 'lifetime' | 'remove' | 'setExpiry',
  days: 30,
  customExpiryDate: ''
})

// Helper Tanggal Indonesia
const formatIndoDate = (dateVal?: string) => {
  if (!dateVal) return '-'
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return dateVal
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d)
  } catch {
    return dateVal
  }
}

// Helper Format Waktu Tanggal Lengkap
const formatIndoDateTime = (dateVal?: string) => {
  if (!dateVal) return '-'
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return dateVal
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d) + ' WIB'
  } catch {
    return dateVal
  }
}

// Helper Sisa Hari Premium
const getDaysRemaining = (expDate: Date | null) => {
  if (!expDate) return ''
  const diff = expDate.getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Berakhir hari ini'
  return `${days} hari lagi`
}

// Filtered & Sorted Users List
const filteredUsers = computed(() => {
  let list = [...users.value]

  // Filter Role
  if (selectedRole.value === 'admin') {
    list = list.filter(u => u.isAdmin)
  } else if (selectedRole.value === 'user') {
    list = list.filter(u => !u.isAdmin)
  }

  // Filter Status
  if (selectedStatus.value === 'active') {
    list = list.filter(u => u.status)
  } else if (selectedStatus.value === 'blocked') {
    list = list.filter(u => !u.status)
  }

  // Filter Membership
  if (selectedMembership.value === 'premium') {
    list = list.filter(u => u.premium.isActive)
  } else if (selectedMembership.value === 'expired') {
    list = list.filter(u => !u.premium.isActive && u.premium.expDate !== null)
  } else if (selectedMembership.value === 'free') {
    list = list.filter(u => !u.premium.isActive && u.premium.expDate === null)
  }

  // Filter Search
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(u => {
      const matchName = (u.name || '').toLowerCase().includes(q)
      const matchEmail = (u.email || '').toLowerCase().includes(q)
      const matchId = (u.$id || '').toLowerCase().includes(q)
      return matchName || matchEmail || matchId
    })
  }

  // Sort
  if (sortBy.value === 'newest') {
    list.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
  } else if (sortBy.value === 'oldest') {
    list.sort((a, b) => new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime())
  } else if (sortBy.value === 'name_asc') {
    list.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy.value === 'name_desc') {
    list.sort((a, b) => b.name.localeCompare(a.name))
  }

  return list
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage.value) || 1)
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredUsers.value.slice(start, start + itemsPerPage.value)
})

// Reset Form Tambah
const resetCreateForm = () => {
  createForm.value = {
    name: '',
    email: '',
    password: '',
    role: 'user',
    status: true,
    premiumDurationDays: 0,
    isLifetime: false
  }
}

// Buka Modal Tambah
const openCreateModal = () => {
  resetCreateForm()
  isCreateModalOpen.value = true
}

// Submit Tambah User
const handleCreateUser = async () => {
  if (!createForm.value.name.trim() || !createForm.value.email.trim() || !createForm.value.password.trim()) {
    return
  }

  const payload: any = {
    name: createForm.value.name.trim(),
    email: createForm.value.email.trim(),
    password: createForm.value.password.trim(),
    role: createForm.value.role,
    status: createForm.value.status
  }

  if (createForm.value.isLifetime) {
    payload.premiumExpiry = 'lifetime'
  } else if (createForm.value.premiumDurationDays > 0) {
    payload.premiumDurationDays = createForm.value.premiumDurationDays
  }

  const res = await createUser(payload)
  if (res.success) {
    isCreateModalOpen.value = false
    resetCreateForm()
  }
}

// Buka Modal Edit
const openEditModal = (u: AdminUserItem) => {
  selectedUser.value = u
  editForm.value = {
    name: u.name,
    email: u.email,
    password: '',
    role: u.isAdmin ? 'admin' : 'user',
    status: u.status
  }
  isEditModalOpen.value = true
}

// Submit Edit User
const handleUpdateUser = async () => {
  if (!selectedUser.value) return

  const payload: any = {
    name: editForm.value.name.trim(),
    email: editForm.value.email.trim(),
    role: editForm.value.role,
    status: editForm.value.status
  }

  if (editForm.value.password && editForm.value.password.trim()) {
    payload.password = editForm.value.password.trim()
  }

  const res = await updateUser(selectedUser.value.$id, payload)
  if (res.success) {
    isEditModalOpen.value = false
  }
}

// Buka Modal Atur Premium
const openPremiumModal = (u: AdminUserItem) => {
  selectedUser.value = u
  premiumForm.value = {
    action: 'addDays',
    days: 30,
    customExpiryDate: ''
  }
  isPremiumModalOpen.value = true
}

// Submit Atur Premium
const handleUpdatePremium = async () => {
  if (!selectedUser.value) return

  const payload: any = {
    premiumAction: premiumForm.value.action
  }

  if (premiumForm.value.action === 'addDays') {
    payload.days = Number(premiumForm.value.days)
  } else if (premiumForm.value.action === 'setExpiry' && premiumForm.value.customExpiryDate) {
    payload.expiryDate = premiumForm.value.customExpiryDate
  }

  const res = await updateUser(selectedUser.value.$id, payload)
  if (res.success) {
    isPremiumModalOpen.value = false
    selectedUser.value = null
  }
}

// Toggle Blokir / Aktifkan User
const handleToggleStatus = async (u: AdminUserItem) => {
  const newStatus = !u.status
  await updateUser(u.$id, { status: newStatus })
}

// Buka Modal Konfirmasi Hapus
const openDeleteModal = (u: AdminUserItem) => {
  selectedUser.value = u
  isDeleteModalOpen.value = true
}

// Konfirmasi Hapus User
const handleDeleteUser = async () => {
  if (!selectedUser.value) return
  const res = await deleteUser(selectedUser.value.$id)
  if (res.success) {
    isDeleteModalOpen.value = false
    selectedUser.value = null
  }
}

// Ekspor ke CSV
const exportToCSV = () => {
  if (filteredUsers.value.length === 0) return

  const headers = ['ID', 'Nama', 'Email', 'Role', 'Status', 'Status Premium', 'Kadaluarsa Premium', 'Tanggal Dibuat']
  const rows = filteredUsers.value.map(u => [
    `"${u.$id}"`,
    `"${u.name.replace(/"/g, '""')}"`,
    `"${u.email}"`,
    `"${u.isAdmin ? 'Admin' : 'User'}"`,
    `"${u.status ? 'Aktif' : 'Diblokir'}"`,
    `"${u.premium.isActive ? (u.premium.isLifetime ? 'Lifetime' : 'Aktif') : 'Non-Premium'}"`,
    `"${u.premium.expDate ? u.premium.expDate.toISOString() : (u.premium.isLifetime ? 'Permanen' : '-')}"`,
    `"${u.$createdAt}"`
  ])

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `users-export-${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
    <!-- State 1: Loading Auth -->
    <div v-if="isAuthLoading" class="py-24 text-center space-y-4">
      <div class="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p class="text-xs text-neutral-400 font-medium">Memverifikasi hak akses administrator...</p>
    </div>

    <!-- State 2: Akses Ditolak -->
    <div
      v-else-if="!isAdmin"
      class="p-8 sm:p-12 text-center rounded-3xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 max-w-xl mx-auto space-y-4"
    >
      <div class="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-shield-alert" class="w-7 h-7" />
      </div>
      <div class="space-y-1">
        <h2 class="text-xl font-bold text-neutral-900 dark:text-white">Akses Terbatas</h2>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Halaman ini khusus untuk Administrator. Pastikan akun Anda memiliki label <code class="font-mono text-primary font-bold">admin</code> di Appwrite Console.
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

    <!-- State 3: Konten Utama Admin Management Pengguna -->
    <div v-else class="space-y-8">
      <!-- Header Section -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-2">
            <UIcon name="i-lucide-users" class="w-3.5 h-3.5" />
            Appwrite Users Management
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Management Pengguna
          </h1>
          <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Kelola seluruh akun pengguna, hak akses administrator, dan masa aktif langganan Member Premium.
          </p>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <UButton
            color="neutral"
            variant="outline"
            size="md"
            icon="i-lucide-download"
            label="Ekspor CSV"
            :disabled="filteredUsers.length === 0"
            class="font-bold rounded-xl cursor-pointer"
            @click="exportToCSV"
          />
          <UButton
            color="neutral"
            variant="soft"
            size="md"
            :icon="isLoading ? 'i-lucide-loader-2' : 'i-lucide-refresh-cw'"
            :loading="isLoading"
            label="Segarkan"
            class="font-bold rounded-xl cursor-pointer"
            @click="fetchUsers()"
          />
          <UButton
            color="primary"
            variant="solid"
            size="md"
            icon="i-lucide-user-plus"
            label="Tambah Pengguna"
            class="font-bold rounded-xl cursor-pointer shadow-sm shadow-primary/20"
            @click="openCreateModal"
          />
        </div>
      </div>

      <!-- Feedback Alert Notice -->
      <div
        v-if="notice"
        class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs"
      >
        <div class="flex items-center gap-2.5">
          <UIcon name="i-lucide-check-circle-2" class="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{{ notice }}</span>
        </div>
        <button
          type="button"
          class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
          @click="notice = null"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>
      </div>

      <!-- Error Alert -->
      <div
        v-if="error"
        class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs"
      >
        <div class="flex items-center gap-2.5">
          <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-500 shrink-0" />
          <span>{{ error }}</span>
        </div>
        <button
          type="button"
          class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
          @click="error = null"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>
      </div>

      <!-- Top Metric Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <!-- Card 1: Total Pengguna -->
        <div class="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Pengguna</span>
            <div class="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <UIcon name="i-lucide-users" class="w-4 h-4" />
            </div>
          </div>
          <div>
            <div class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
              {{ stats.total }}
            </div>
            <p class="text-[11px] text-neutral-500 mt-0.5">Semua akun terdaftar</p>
          </div>
        </div>

        <!-- Card 2: Member Premium Aktif -->
        <div class="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-neutral-400 uppercase tracking-wider">Member Premium</span>
            <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <UIcon name="i-lucide-crown" class="w-4 h-4" />
            </div>
          </div>
          <div>
            <div class="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {{ stats.premium }}
            </div>
            <p class="text-[11px] text-neutral-500 mt-0.5">
              {{ stats.total > 0 ? Math.round((stats.premium / stats.total) * 100) : 0 }}% dari total akun
            </p>
          </div>
        </div>

        <!-- Card 3: Administrator -->
        <div class="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-neutral-400 uppercase tracking-wider">Administrator</span>
            <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <UIcon name="i-lucide-shield-check" class="w-4 h-4" />
            </div>
          </div>
          <div>
            <div class="text-2xl sm:text-3xl font-black text-primary">
              {{ stats.admin }}
            </div>
            <p class="text-[11px] text-neutral-500 mt-0.5">Hak akses kelola sistem</p>
          </div>
        </div>

        <!-- Card 4: Pengguna Diblokir -->
        <div class="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-neutral-400 uppercase tracking-wider">Akun Diblokir</span>
            <div class="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <UIcon name="i-lucide-user-x" class="w-4 h-4" />
            </div>
          </div>
          <div>
            <div class="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">
              {{ stats.blocked }}
            </div>
            <p class="text-[11px] text-neutral-500 mt-0.5">Akses masuk dinonaktifkan</p>
          </div>
        </div>
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <!-- Search Input -->
          <div class="lg:col-span-2">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Cari nama, email, atau User ID..."
              size="sm"
              class="w-full"
            />
          </div>

          <!-- Filter Role -->
          <div>
            <select
              v-model="selectedRole"
              class="w-full h-9 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            >
              <option value="all">Semua Role</option>
              <option value="admin">Administrator</option>
              <option value="user">User Biasa</option>
            </select>
          </div>

          <!-- Filter Status -->
          <div>
            <select
              v-model="selectedStatus"
              class="w-full h-9 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="blocked">Diblokir</option>
            </select>
          </div>

          <!-- Filter Membership -->
          <div>
            <select
              v-model="selectedMembership"
              class="w-full h-9 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            >
              <option value="all">Semua Member</option>
              <option value="premium">Premium Aktif</option>
              <option value="expired">Kedaluwarsa</option>
              <option value="free">Reguler / Gratis</option>
            </select>
          </div>
        </div>

        <!-- Sub toolbar: Urutkan & Total Hasil -->
        <div class="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-500">
          <div>
            Menampilkan <strong class="text-neutral-800 dark:text-neutral-200">{{ filteredUsers.length }}</strong> dari {{ total }} pengguna
          </div>

          <div class="flex items-center gap-2">
            <span class="text-neutral-400">Urutkan:</span>
            <select
              v-model="sortBy"
              class="h-8 px-2.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="newest">Terbaru Terdaftar</option>
              <option value="oldest">Terlama Terdaftar</option>
              <option value="name_asc">Nama (A - Z)</option>
              <option value="name_desc">Nama (Z - A)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Users Table Container -->
      <div class="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-neutral-50/80 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">
              <tr>
                <th class="py-3.5 px-4">Pengguna</th>
                <th class="py-3.5 px-4">Role</th>
                <th class="py-3.5 px-4">Status Akun</th>
                <th class="py-3.5 px-4">Member Premium</th>
                <th class="py-3.5 px-4">Terdaftar</th>
                <th class="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800/80">
              <tr
                v-for="u in paginatedUsers"
                :key="u.$id"
                class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
              >
                <!-- Pengguna Column (Avatar, Nama, Email) -->
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-3">
                    <img
                      :src="u.avatarUrl"
                      :alt="u.name"
                      class="w-10 h-10 rounded-2xl object-cover bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 shadow-xs"
                    />
                    <div class="space-y-0.5">
                      <div class="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <span>{{ u.name }}</span>
                        <UIcon
                          v-if="u.emailVerification"
                          name="i-lucide-check-circle"
                          class="w-3.5 h-3.5 text-blue-500"
                          title="Email terverifikasi"
                        />
                      </div>
                      <div class="text-[11px] text-neutral-500 font-mono flex items-center gap-2">
                        <span>{{ u.email }}</span>
                        <span>&bull;</span>
                        <span class="text-neutral-400" :title="u.$id">ID: {{ u.$id.slice(0, 8) }}...</span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Role Column -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <UBadge
                    v-if="u.isAdmin"
                    color="primary"
                    variant="solid"
                    size="xs"
                    class="font-bold gap-1"
                  >
                    <UIcon name="i-lucide-shield-check" class="w-3 h-3" />
                    <span>Administrator</span>
                  </UBadge>
                  <UBadge
                    v-else
                    color="neutral"
                    variant="subtle"
                    size="xs"
                    class="font-medium"
                  >
                    User
                  </UBadge>
                </td>

                <!-- Status Akun Column -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <UBadge
                    :color="u.status ? 'success' : 'error'"
                    variant="subtle"
                    size="xs"
                    class="font-bold gap-1"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="u.status ? 'bg-emerald-500' : 'bg-red-500'" />
                    <span>{{ u.status ? 'Aktif' : 'Diblokir' }}</span>
                  </UBadge>
                </td>

                <!-- Member Premium Column -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <div v-if="u.premium.isActive" class="space-y-0.5">
                    <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                      <UIcon name="i-lucide-crown" class="w-3.5 h-3.5" />
                      <span>{{ u.premium.isLifetime ? 'Lifetime' : 'Premium' }}</span>
                    </div>
                    <div class="text-[10px] text-neutral-400">
                      <template v-if="u.premium.isLifetime">
                        Akses Selamanya
                      </template>
                      <template v-else-if="u.premium.expDate">
                        Hingga {{ formatIndoDate(u.premium.expDate.toISOString()) }} ({{ getDaysRemaining(u.premium.expDate) }})
                      </template>
                    </div>
                  </div>
                  <div v-else-if="u.premium.expDate" class="space-y-0.5">
                    <UBadge color="neutral" variant="outline" size="xs" class="text-[10px] font-medium opacity-70">
                      Kedaluwarsa
                    </UBadge>
                    <div class="text-[10px] text-neutral-400">
                      Habis pada {{ formatIndoDate(u.premium.expDate.toISOString()) }}
                    </div>
                  </div>
                  <div v-else>
                    <span class="text-neutral-400 text-[11px]">Reguler / Gratis</span>
                  </div>
                </td>

                <!-- Terdaftar Column -->
                <td class="py-3.5 px-4 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                  <div>{{ formatIndoDate(u.$createdAt) }}</div>
                  <div v-if="u.accessedAt" class="text-[10px] text-neutral-400">
                    Aktif: {{ formatIndoDate(u.accessedAt) }}
                  </div>
                </td>

                <!-- Aksi Column -->
                <td class="py-3.5 px-4 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- Atur Membership -->
                    <UButton
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      icon="i-lucide-crown"
                      title="Atur Member Premium"
                      class="text-amber-600 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg cursor-pointer"
                      @click="openPremiumModal(u)"
                    />

                    <!-- Edit Data Profil -->
                    <UButton
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      icon="i-lucide-pencil"
                      title="Edit Akun"
                      class="text-neutral-600 dark:text-neutral-300 hover:text-primary rounded-lg cursor-pointer"
                      @click="openEditModal(u)"
                    />

                    <!-- Blokir / Aktifkan -->
                    <UButton
                      :color="u.status ? 'neutral' : 'success'"
                      variant="ghost"
                      size="xs"
                      :icon="u.status ? 'i-lucide-ban' : 'i-lucide-check'"
                      :title="u.status ? 'Blokir Pengguna' : 'Aktifkan Pengguna'"
                      class="rounded-lg cursor-pointer"
                      :class="u.status ? 'text-red-500 hover:bg-red-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'"
                      @click="handleToggleStatus(u)"
                    />

                    <!-- Hapus Akun -->
                    <UButton
                      color="error"
                      variant="ghost"
                      size="xs"
                      icon="i-lucide-trash-2"
                      title="Hapus Akun Permanen"
                      class="text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                      @click="openDeleteModal(u)"
                    />
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-if="paginatedUsers.length === 0">
                <td colspan="6" class="py-16 text-center space-y-2">
                  <div class="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
                    <UIcon name="i-lucide-user-x" class="w-6 h-6" />
                  </div>
                  <p class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Tidak ada pengguna yang sesuai</p>
                  <p class="text-xs text-neutral-400">Coba ubah kata kunci pencarian atau sesuaikan filter Anda.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div
          v-if="totalPages > 1"
          class="flex items-center justify-between p-4 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500"
        >
          <div>
            Halaman {{ currentPage }} dari {{ totalPages }}
          </div>
          <div class="flex items-center gap-1.5">
            <UButton
              color="neutral"
              variant="outline"
              size="xs"
              icon="i-lucide-chevron-left"
              :disabled="currentPage <= 1"
              @click="currentPage--"
            />
            <span class="px-2 font-mono font-bold text-neutral-700 dark:text-neutral-300">{{ currentPage }}</span>
            <UButton
              color="neutral"
              variant="outline"
              size="xs"
              icon="i-lucide-chevron-right"
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- MODAL 1: TAMBAH PENGGUNA BARU                             -->
    <!-- ========================================================= -->
    <UModal
      v-model:open="isCreateModalOpen"
      :ui="{ content: 'sm:max-w-lg' }"
      class="sm:max-w-lg"
    >
      <template #content>
        <div class="p-6 space-y-6">
          <!-- Modal Header -->
          <div class="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <UIcon name="i-lucide-user-plus" class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-bold text-base text-neutral-900 dark:text-white">Tambah Pengguna Baru</h3>
                <p class="text-xs text-neutral-400">Buat akun pengguna baru langsung ke Appwrite Auth.</p>
              </div>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-x"
              @click="isCreateModalOpen = false"
            />
          </div>

          <!-- Form Fields -->
          <form class="space-y-4" @submit.prevent="handleCreateUser">
            <div
              v-if="error"
              class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
            >
              <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 shrink-0" />
              <span>{{ error }}</span>
            </div>
            <div>
              <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Nama Lengkap <span class="text-primary">*</span>
              </label>
              <UInput
                v-model="createForm.name"
                placeholder="Contoh: Budi Santoso"
                size="sm"
                class="w-full"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Alamat Email <span class="text-primary">*</span>
              </label>
              <UInput
                v-model="createForm.email"
                type="email"
                placeholder="nama@email.com"
                size="sm"
                class="w-full"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Kata Sandi Awal <span class="text-primary">*</span>
              </label>
              <UInput
                v-model="createForm.password"
                type="password"
                placeholder="Minimal 8 karakter"
                size="sm"
                class="w-full"
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Peran / Role
                </label>
                <select
                  v-model="createForm.role"
                  class="w-full h-9 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="user">User Biasa</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Status Akun
                </label>
                <select
                  v-model="createForm.status"
                  class="w-full h-9 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option :value="true">Aktif</option>
                  <option :value="false">Diblokir</option>
                </select>
              </div>
            </div>

            <!-- Paket Langganan Awal -->
            <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <UIcon name="i-lucide-crown" class="w-4 h-4 text-amber-500" />
                <span>Paket Member Premium Awal</span>
              </label>

              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  class="px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center"
                  :class="createForm.premiumDurationDays === 0 && !createForm.isLifetime ? 'border-primary bg-primary/10 text-primary' : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'"
                  @click="() => { createForm.premiumDurationDays = 0; createForm.isLifetime = false }"
                >
                  Gratis
                </button>
                <button
                  type="button"
                  class="px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center"
                  :class="createForm.premiumDurationDays === 30 && !createForm.isLifetime ? 'border-amber-500 bg-amber-500/10 text-amber-600' : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'"
                  @click="() => { createForm.premiumDurationDays = 30; createForm.isLifetime = false }"
                >
                  +30 Hari
                </button>
                <button
                  type="button"
                  class="px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center"
                  :class="createForm.isLifetime ? 'border-amber-500 bg-amber-500/10 text-amber-600' : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'"
                  @click="() => { createForm.premiumDurationDays = 0; createForm.isLifetime = true }"
                >
                  Lifetime
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <UButton
                type="button"
                color="neutral"
                variant="ghost"
                label="Batal"
                class="cursor-pointer"
                @click="isCreateModalOpen = false"
              />
              <UButton
                type="submit"
                color="primary"
                variant="solid"
                icon="i-lucide-check"
                label="Simpan Pengguna"
                :loading="isActionLoading"
                class="font-bold rounded-xl cursor-pointer"
              />
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- ========================================================= -->
    <!-- MODAL 2: EDIT DATA PENGGUNA                               -->
    <!-- ========================================================= -->
    <UModal
      v-model:open="isEditModalOpen"
      :ui="{ content: 'sm:max-w-lg' }"
      class="sm:max-w-lg"
    >
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 flex items-center justify-center">
                <UIcon name="i-lucide-user-pen" class="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 class="font-bold text-base text-neutral-900 dark:text-white">Edit Data Pengguna</h3>
                <p class="text-xs text-neutral-400">ID: {{ selectedUser?.$id }}</p>
              </div>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-x"
              @click="isEditModalOpen = false"
            />
          </div>

          <form class="space-y-4" @submit.prevent="handleUpdateUser">
            <div
              v-if="error"
              class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
            >
              <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 shrink-0" />
              <span>{{ error }}</span>
            </div>
            <div>
              <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Nama Lengkap
              </label>
              <UInput
                v-model="editForm.name"
                size="sm"
                class="w-full"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Alamat Email
              </label>
              <UInput
                v-model="editForm.email"
                type="email"
                size="sm"
                class="w-full"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Kata Sandi Baru (Kosongkan jika tidak ingin mengubah)
              </label>
              <UInput
                v-model="editForm.password"
                type="password"
                placeholder="Biarkan kosong jika tidak diganti"
                size="sm"
                class="w-full"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Peran Akun
                </label>
                <select
                  v-model="editForm.role"
                  class="w-full h-9 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="user">User Biasa</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Status Akun
                </label>
                <select
                  v-model="editForm.status"
                  class="w-full h-9 px-3 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option :value="true">Aktif</option>
                  <option :value="false">Diblokir</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <UButton
                type="button"
                color="neutral"
                variant="ghost"
                label="Batal"
                class="cursor-pointer"
                @click="isEditModalOpen = false"
              />
              <UButton
                type="submit"
                color="primary"
                variant="solid"
                icon="i-lucide-check"
                label="Simpan Perubahan"
                :loading="isActionLoading"
                class="font-bold rounded-xl cursor-pointer"
              />
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- ========================================================= -->
    <!-- MODAL 3: ATUR MEMBERSHIP PREMIUM                          -->
    <!-- ========================================================= -->
    <UModal
      v-model:open="isPremiumModalOpen"
      :ui="{ content: 'sm:max-w-md' }"
      class="sm:max-w-md"
    >
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <UIcon name="i-lucide-crown" class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-bold text-base text-neutral-900 dark:text-white">Atur Member Premium</h3>
                <p class="text-xs text-neutral-400">{{ selectedUser?.name }} ({{ selectedUser?.email }})</p>
              </div>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-x"
              @click="isPremiumModalOpen = false"
            />
          </div>

          <!-- Status Saat Ini -->
          <div class="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 text-xs space-y-1">
            <div class="text-neutral-400 font-medium">Status Langganan Saat Ini:</div>
            <div class="font-bold text-sm flex items-center gap-1.5" :class="selectedUser?.premium?.isActive ? 'text-amber-500' : 'text-neutral-500'">
              <UIcon :name="selectedUser?.premium?.isActive ? 'i-lucide-crown' : 'i-lucide-user'" class="w-4 h-4" />
              <span>
                {{ selectedUser?.premium?.isActive ? (selectedUser.premium.isLifetime ? 'Member Lifetime' : 'Aktif hingga ' + (selectedUser.premium.expDate ? formatIndoDateTime(selectedUser.premium.expDate.toISOString()) : '-')) : 'Bukan Member Premium' }}
              </span>
            </div>
          </div>

          <!-- Error Alert Inside Modal -->
          <div
            v-if="error"
            class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2"
          >
            <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 shrink-0" />
            <span>{{ error }}</span>
          </div>

          <!-- Pilihan Aksi Cepat -->
          <div class="space-y-3">
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Pilih Aksi Perubahan Masa Aktif:
            </label>

            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-colors cursor-pointer"
                :class="premiumForm.action === 'addDays' && premiumForm.days === 7 ? 'border-amber-500 bg-amber-500/10 text-amber-600' : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-amber-500/40'"
                @click="() => { premiumForm.action = 'addDays'; premiumForm.days = 7 }"
              >
                + 7 Hari
              </button>
              <button
                type="button"
                class="px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-colors cursor-pointer"
                :class="premiumForm.action === 'addDays' && premiumForm.days === 14 ? 'border-amber-500 bg-amber-500/10 text-amber-600' : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-amber-500/40'"
                @click="() => { premiumForm.action = 'addDays'; premiumForm.days = 14 }"
              >
                + 14 Hari
              </button>
              <button
                type="button"
                class="px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-colors cursor-pointer"
                :class="premiumForm.action === 'addDays' && premiumForm.days === 30 ? 'border-amber-500 bg-amber-500/10 text-amber-600' : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-amber-500/40'"
                @click="() => { premiumForm.action = 'addDays'; premiumForm.days = 30 }"
              >
                + 30 Hari (1 Bulan)
              </button>
              <button
                type="button"
                class="px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-colors cursor-pointer"
                :class="premiumForm.action === 'addDays' && premiumForm.days === 90 ? 'border-amber-500 bg-amber-500/10 text-amber-600' : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-amber-500/40'"
                @click="() => { premiumForm.action = 'addDays'; premiumForm.days = 90 }"
              >
                + 90 Hari (3 Bulan)
              </button>
              <button
                type="button"
                class="px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-colors cursor-pointer"
                :class="premiumForm.action === 'addDays' && premiumForm.days === 365 ? 'border-amber-500 bg-amber-500/10 text-amber-600' : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-amber-500/40'"
                @click="() => { premiumForm.action = 'addDays'; premiumForm.days = 365 }"
              >
                + 365 Hari (1 Tahun)
              </button>
              <button
                type="button"
                class="px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-colors cursor-pointer"
                :class="premiumForm.action === 'lifetime' ? 'border-amber-500 bg-amber-500/10 text-amber-600' : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-amber-500/40'"
                @click="() => { premiumForm.action = 'lifetime' }"
              >
                Permanen / Lifetime
              </button>
            </div>

            <!-- Nonaktifkan Premium Option -->
            <button
              type="button"
              class="w-full px-3 py-2 rounded-xl border text-xs font-semibold text-center transition-colors cursor-pointer mt-1"
              :class="premiumForm.action === 'remove' ? 'border-red-500 bg-red-500/10 text-red-600' : 'border-neutral-200 dark:border-neutral-800 text-red-500 hover:border-red-500/40'"
              @click="() => { premiumForm.action = 'remove' }"
            >
              Nonaktifkan / Hapus Status Premium
            </button>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <UButton
              color="neutral"
              variant="ghost"
              label="Batal"
              class="cursor-pointer"
              @click="isPremiumModalOpen = false"
            />
            <UButton
              color="warning"
              variant="solid"
              icon="i-lucide-check"
              label="Terapkan Membership"
              :loading="isActionLoading"
              class="font-bold rounded-xl cursor-pointer"
              @click="handleUpdatePremium"
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- ========================================================= -->
    <!-- MODAL 4: KONFIRMASI HAPUS PENGGUNA                        -->
    <!-- ========================================================= -->
    <UModal
      v-model:open="isDeleteModalOpen"
      :ui="{ content: 'sm:max-w-md' }"
      class="sm:max-w-md"
    >
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-alert-triangle" class="w-6 h-6" />
            </div>
            <div class="space-y-1">
              <h3 class="font-bold text-base text-neutral-900 dark:text-white">Hapus Akun Pengguna?</h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun <strong>{{ selectedUser?.name }}</strong> ({{ selectedUser?.email }})?
                Tindakan ini permanen dan tidak dapat dibatalkan di Appwrite.
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <UButton
              color="neutral"
              variant="ghost"
              label="Batal"
              class="cursor-pointer"
              @click="isDeleteModalOpen = false"
            />
            <UButton
              color="error"
              variant="solid"
              icon="i-lucide-trash-2"
              label="Ya, Hapus Permanen"
              :loading="isActionLoading"
              class="font-bold rounded-xl cursor-pointer"
              @click="handleDeleteUser"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
