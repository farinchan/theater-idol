import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from './useAuth'

export interface NavItem {
  id: string
  label: string
  to: string
  icon: string
  badge?: string | null
  description: string
}

export const useNavigation = () => {
  const route = useRoute()
  const { state } = useAuth()

  const isLiveShowActive = ref(false)
  const isStreamEnabled = ref(true)
  const isReplayEnabled = ref(true)

  const isRouteActive = (to: string) => {
    if (to === '/') return route.path === '/'
    return route.path.startsWith(to)
  }

  const mainNavItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [
      {
        id: 'home',
        label: 'Home',
        to: '/',
        icon: 'i-lucide-home',
        badge: null,
        description: 'Beranda & ringkasan teater'
      }
    ]

    if (isStreamEnabled.value) {
      items.push({
        id: 'stream',
        label: 'Stream',
        to: '/stream',
        icon: 'i-lucide-radio',
        badge: isLiveShowActive.value ? 'LIVE' : null,
        description: 'Siaran langsung panggung teater'
      })
    }

    if (isReplayEnabled.value) {
      items.push({
        id: 'replay',
        label: 'Replay',
        to: '/replay',
        icon: 'i-lucide-play-circle',
        badge: null,
        description: 'Arsip rekaman pertunjukan'
      })
    }

    items.push({
      id: 'jadwal',
      label: 'Jadwal Show',
      to: '/jadwal',
      icon: 'i-lucide-calendar-days',
      badge: null,
      description: 'Jadwal panggung mendatang'
    })

    return items
  })

  const otherNavItems = computed<NavItem[]>(() => [
    {
      id: 'pembayaran',
      label: 'Pembayaran',
      to: '/pembayaran',
      icon: 'i-lucide-credit-card',
      badge: null,
      description: 'Metode & status transaksi'
    }
  ])

  const adminNavItems = computed<NavItem[]>(() => {
    if (!state.isAdmin) return []
    return [
      {
        id: 'admin-shows',
        label: 'Management Show',
        to: '/admin/shows',
        icon: 'i-lucide-calendar-cog',
        badge: null,
        description: 'Kelola jadwal & data pertunjukan'
      },
      {
        id: 'admin-users',
        label: 'Management Pengguna',
        to: '/admin/users',
        icon: 'i-lucide-users',
        badge: null,
        description: 'Kelola akun, hak akses & member premium'
      },
      {
        id: 'admin-orders',
        label: 'Riwayat Pembayaran',
        to: '/admin/orders',
        icon: 'i-lucide-receipt',
        badge: null,
        description: 'Kelola & pantau status transaksi pembayaran'
      },
      {
        id: 'admin-settings',
        label: 'Pengaturan Website',
        to: '/admin/settings',
        icon: 'i-lucide-settings',
        badge: null,
        description: 'Konfigurasi stream & show'
      }
    ]
  })

  const setLiveStatus = (active: boolean) => {
    isLiveShowActive.value = active
  }

  const setToggles = (stream: boolean, replay: boolean) => {
    isStreamEnabled.value = stream
    isReplayEnabled.value = replay
  }

  return {
    mainNavItems,
    otherNavItems,
    adminNavItems,
    isRouteActive,
    isLiveShowActive,
    setLiveStatus,
    setToggles
  }
}
