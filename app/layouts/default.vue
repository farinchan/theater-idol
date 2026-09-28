<script setup lang="ts">
const colorMode = useColorMode()
const isMobileOpen = ref(false)
const route = useRoute()
const searchQuery = ref('')

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (val: boolean) => {
    colorMode.preference = val ? 'dark' : 'light'
  }
})

interface NavItem {
  label: string
  to: string
  icon: string
  badge?: string | null
  description: string
}

const navItems: NavItem[] = [
  {
    label: 'Home',
    to: '/',
    icon: 'i-lucide-home',
    badge: null,
    description: 'Beranda & ringkasan teater'
  },
  {
    label: 'Stream',
    to: '/stream',
    icon: 'i-lucide-radio',
    badge: 'LIVE',
    description: 'Siaran langsung panggung teater'
  },
  {
    label: 'Replay',
    to: '/replay',
    icon: 'i-lucide-play-circle',
    badge: 'VOD',
    description: 'Arsip rekaman pertunjukan'
  },
  {
    label: 'Jadwal Show',
    to: '/jadwal',
    icon: 'i-lucide-calendar-days',
    badge: null,
    description: 'Jadwal panggung mendatang'
  }
]

const otherNavItems: NavItem[] = [
  {
    label: 'Pembayaran',
    to: '/pembayaran',
    icon: 'i-lucide-credit-card',
    badge: null,
    description: 'Metode & status transaksi'
  }
]

const isRouteActive = (to: string) => {
  return route.path === to
}

const { appName } = useAppName()
const { user, logout, isAdmin } = useAppwriteAuth()

const adminNavItems: NavItem[] = [
  {
    label: 'Management Show',
    to: '/admin/shows',
    icon: 'i-lucide-calendar-cog',
    badge: null,
    description: 'Kelola jadwal & data pertunjukan'
  }
]

const userAvatar = computed(() => user.value?.prefs?.avatar || '')

const userInitials = computed(() => {
  if (!user.value) return 'U'
  const name = user.value.name || user.value.email || 'User'
  return name.slice(0, 2).toUpperCase()
})

const handleLogout = async () => {
  await logout()
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col md:flex-row transition-colors">
    <!-- Mobile Topbar -->
    <header class="md:hidden sticky top-0 z-40 h-16 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-2">
        <span class="font-extrabold text-base tracking-tight uppercase">{{ appName }}</span>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <UButton
          :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Toggle Dark Mode"
          @click="isDark = !isDark"
        />
        <UButton
          :icon="isMobileOpen ? 'i-lucide-x' : 'i-lucide-menu'"
          color="neutral"
          variant="subtle"
          size="sm"
          aria-label="Toggle Sidebar"
          @click="isMobileOpen = !isMobileOpen"
        />
      </div>
    </header>

    <!-- Mobile Sidebar Backdrop Overlay -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isMobileOpen"
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        @click="isMobileOpen = false"
      />
    </Transition>

    <!-- Sidebar (Desktop Fixed & Mobile Slideover) -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:h-screen md:sticky md:top-0',
        isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      ]"
    >
      <!-- Sidebar Header -->
      <div class="p-6 border-b border-neutral-100 dark:border-neutral-800/80">
        <div class="flex items-center justify-between">
          <NuxtLink to="/" class="flex items-center" @click="isMobileOpen = false">
            <div class="font-extrabold text-lg tracking-tight leading-tight uppercase">{{ appName }}</div>
          </NuxtLink>

          <!-- Close button on mobile -->
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="xs"
            class="md:hidden"
            @click="isMobileOpen = false"
          />
        </div>

        <!-- Live Show Status Card -->
        <NuxtLink
          to="/stream"
          class="mt-5 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 flex items-center gap-3 transition-colors block"
          @click="isMobileOpen = false"
        >
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <div class="text-xs flex-1">
            <div class="font-bold text-neutral-900 dark:text-white leading-none">Live Show Sekarang</div>
            <div class="text-neutral-500 dark:text-neutral-400 text-[11px] mt-0.5">Aturan Anti Cinta &bull; 19:00 WIB</div>
          </div>
          <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-primary" />
        </NuxtLink>
      </div>

      <!-- Navigation Links (Home, Stream, Replay, Jadwal Show) -->
      <div class="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <!-- Main Pages Navigation -->
        <div>
          <div class="px-3 mb-2 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Menu Utama
          </div>
          <nav class="space-y-1.5">
            <NuxtLink
              v-for="item in navItems"
              :key="item.label"
              :to="item.to"
              :class="[
                'flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group',
                isRouteActive(item.to)
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary'
              ]"
              @click="isMobileOpen = false"
            >
              <div class="flex items-center gap-3">
                <UIcon
                  :name="item.icon"
                  :class="[
                    'w-5 h-5 transition-transform group-hover:scale-110',
                    isRouteActive(item.to) ? 'text-white' : 'text-primary'
                  ]"
                />
                <div>
                  <div class="leading-none">{{ item.label }}</div>
                  <div
                    :class="[
                      'text-[10px] mt-1 font-normal',
                      isRouteActive(item.to) ? 'text-white/80' : 'text-neutral-400'
                    ]"
                  >
                    {{ item.description }}
                  </div>
                </div>
              </div>
              <UBadge
                v-if="item.badge"
                :color="isRouteActive(item.to) ? 'neutral' : 'primary'"
                :variant="isRouteActive(item.to) ? 'subtle' : 'solid'"
                size="xs"
                class="text-[10px] font-bold"
              >
                {{ item.badge }}
              </UBadge>
            </NuxtLink>
          </nav>
        </div>

        <!-- Other Menu (Menu Lainnya) -->
        <div>
          <div class="px-3 mb-2 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Menu Lainnya
          </div>
          <nav class="space-y-1.5">
            <NuxtLink
              v-for="item in otherNavItems"
              :key="item.label"
              :to="item.to"
              :class="[
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group',
                isRouteActive(item.to)
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary'
              ]"
              @click="isMobileOpen = false"
            >
              <div class="flex items-center gap-3">
                <UIcon
                  :name="item.icon"
                  :class="[
                    'w-5 h-5 transition-colors',
                    isRouteActive(item.to) ? 'text-white' : 'text-neutral-400 group-hover:text-primary'
                  ]"
                />
                <div>
                  <div class="leading-none">{{ item.label }}</div>
                  <div
                    :class="[
                      'text-[10px] mt-1 font-normal',
                      isRouteActive(item.to) ? 'text-white/80' : 'text-neutral-400'
                    ]"
                  >
                    {{ item.description }}
                  </div>
                </div>
              </div>
              <UBadge
                v-if="item.badge"
                :color="isRouteActive(item.to) ? 'neutral' : 'primary'"
                :variant="isRouteActive(item.to) ? 'subtle' : 'solid'"
                size="xs"
                class="text-[10px] font-bold"
              >
                {{ item.badge }}
              </UBadge>
            </NuxtLink>
          </nav>
        </div>

        <!-- Admin Menu (Hanya terbuka untuk user yang login dan memiliki label admin) -->
        <div v-if="user && isAdmin">
          <div class="px-3 mb-2 text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
            <UIcon name="i-lucide-shield-check" class="w-3.5 h-3.5 text-amber-500" />
            <span>Menu Admin</span>
          </div>
          <nav class="space-y-1.5">
            <NuxtLink
              v-for="item in adminNavItems"
              :key="item.label"
              :to="item.to"
              :class="[
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group',
                isRouteActive(item.to)
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary'
              ]"
              @click="isMobileOpen = false"
            >
              <div class="flex items-center gap-3">
                <UIcon
                  :name="item.icon"
                  :class="[
                    'w-5 h-5 transition-colors',
                    isRouteActive(item.to) ? 'text-white' : 'text-amber-500 group-hover:text-primary'
                  ]"
                />
                <div>
                  <div class="leading-none">{{ item.label }}</div>
                  <div
                    :class="[
                      'text-[10px] mt-1 font-normal',
                      isRouteActive(item.to) ? 'text-white/80' : 'text-neutral-400'
                    ]"
                  >
                    {{ item.description }}
                  </div>
                </div>
              </div>
              <UBadge
                v-if="item.badge"
                color="warning"
                variant="subtle"
                size="xs"
                class="text-[10px] font-bold"
              >
                {{ item.badge }}
              </UBadge>
            </NuxtLink>
          </nav>
        </div>
      </div>

      <!-- Sidebar Bottom Navigation (Profile / Auth Section) -->
      <div class="p-4 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-900/70">
        <!-- Logged In: User Profile Card -->
        <div v-if="user" class="flex items-center gap-2">
          <NuxtLink
            to="/profile"
            :class="[
              'flex items-center gap-3 p-2.5 rounded-2xl transition-all border group flex-1 min-w-0',
              isRouteActive('/profile')
                ? 'bg-primary/10 border-primary/40 text-primary shadow-xs'
                : 'bg-white dark:bg-neutral-800/90 border-neutral-200 dark:border-neutral-700/60 hover:border-primary/40 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            ]"
            @click="isMobileOpen = false"
          >
            <!-- User Avatar with Status Indicator -->
            <div class="relative flex-shrink-0">
              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-rose-400 text-white font-extrabold flex items-center justify-center text-sm shadow-sm shadow-primary/20 overflow-hidden">
                <img v-if="userAvatar" :src="userAvatar" alt="Avatar" class="w-full h-full object-cover" />
                <span v-else>{{ userInitials }}</span>
              </div>
              <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900" />
            </div>

            <!-- User Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="font-bold text-xs text-neutral-900 dark:text-white truncate group-hover:text-primary transition-colors">
                  {{ user.name || 'Pengguna' }}
                </span>
              </div>
              <div class="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                {{ user.email }}
              </div>
            </div>
          </NuxtLink>

          <UButton
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Logout"
            title="Keluar"
            class="text-neutral-400 hover:text-red-500 flex-shrink-0"
            @click="handleLogout"
          />
        </div>

        <!-- Logged Out: Guest Card -->
        <div v-else class="p-3 rounded-2xl bg-white dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
          <div class="text-xs text-neutral-600 dark:text-neutral-400 leading-snug">
            Masuk ke akun Anda untuk menikmati fitur lengkap portal.
          </div>
          <NuxtLink
            to="/login"
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs transition-colors w-full text-center"
            @click="isMobileOpen = false"
          >
            <UIcon name="i-lucide-log-in" class="w-4 h-4" />
            <span>Masuk / Daftar</span>
          </NuxtLink>
        </div>
      </div>
    </aside>

    <!-- Main Page Content Area with Unified Header for Every Page -->
    <div class="flex-1 min-w-0 flex flex-col">
      <!-- Top Action Bar for Desktop -->
      <header class="hidden md:flex h-16 items-center justify-between px-8 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-30">
        <div class="w-80">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Cari show, setlist, atau member..."
            size="sm"
            class="w-full"
          />
        </div>

        <div class="flex items-center gap-3">
          <UButton
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            color="neutral"
            variant="ghost"
            size="md"
            aria-label="Toggle Dark Mode"
            class="cursor-pointer"
            @click="isDark = !isDark"
          />
        </div>
      </header>

      <!-- Slot for Each Page Content -->
      <div class="flex-1">
        <slot />
      </div>

      <!-- Global Footer with Unofficial Fan Project Disclaimer -->
      <footer class="mt-auto border-t border-neutral-200 dark:border-neutral-800 py-6 px-4 sm:px-8 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xs">
        <div class="max-w-7xl mx-auto space-y-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span class="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-tight">{{ appName }}</span>
            </div>
            <div class="flex items-center gap-4 flex-wrap text-xs">
              <NuxtLink to="/" class="hover:text-primary transition-colors">Home</NuxtLink>
              <NuxtLink to="/stream" class="hover:text-primary transition-colors">Stream</NuxtLink>
              <NuxtLink to="/replay" class="hover:text-primary transition-colors">Replay</NuxtLink>
              <NuxtLink to="/jadwal" class="hover:text-primary transition-colors">Jadwal Show</NuxtLink>
              <NuxtLink to="/pembayaran" class="hover:text-primary transition-colors">Pembayaran</NuxtLink>
              <NuxtLink to="/profile" class="hover:text-primary transition-colors">Profil</NuxtLink>
              <a href="https://jkt48.com" target="_blank" rel="noopener noreferrer" class="hover:text-primary transition-colors font-medium flex items-center gap-1 text-primary">
                <span>Website Resmi JKT48</span>
                <UIcon name="i-lucide-external-link" class="w-3 h-3" />
              </a>
            </div>
          </div>
          <p class="text-[11px] text-neutral-400 dark:text-neutral-500 text-center sm:text-left leading-relaxed">
            <strong>Disclaimer:</strong> {{ appName }} merupakan proyek komunitas penggemar dan <u>bukan website resmi</u> dari manajemen JKT48 (JOT). Seluruh hak cipta nama, lagu, setlist, dan materi pertunjukan tetap merupakan hak milik JKT48.
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>
